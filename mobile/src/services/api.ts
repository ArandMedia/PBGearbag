import axios, { AxiosInstance, AxiosError } from 'axios';
import { tokenStorage } from './token-storage';

// Get API URL from environment or use default
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      // The backend runs on Render's free tier, which spins the service
      // down after ~15 minutes idle — the next request triggers a cold
      // boot that (per the timing already documented in AuthContext's
      // checkAuth) can take 20+ seconds. A 10s timeout meant the very
      // first request after any idle period failed client-side before the
      // server ever got a chance to respond, surfacing as "Invalid
      // credentials" or a bare "Something went wrong" even though nothing
      // was actually wrong with the credentials or the request.
      timeout: 30000,
      // No default Content-Type here — axios already sets
      // application/json automatically for plain-object bodies. Forcing it
      // as an instance default broke file uploads: when a 401 triggers the
      // retry-after-refresh path below, axios re-merges instance defaults
      // onto the reused request config, which brought this header back
      // even for FormData bodies and made axios JSON.stringify the
      // FormData into a plain string instead of sending it as multipart.
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await tokenStorage.get('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        // Handle 401 Unauthorized
        // Auth endpoints that don't take a bearer token return 401 for
        // reasons that have nothing to do with an expired access token
        // (wrong password, reused/invalid refresh token, etc). Treating
        // those as "access token expired" used to send this request
        // through the refresh-and-retry path below anyway: refresh would
        // succeed off a stale-but-still-valid refresh token left over in
        // localStorage from a previous session, then the ORIGINAL
        // request — e.g. a mistyped login — would be retried and 401
        // again, re-entering this same interceptor and refreshing again.
        // That loop fired dozens of requests in under a second, which was
        // enough on its own to exhaust the auth rate limiter — so a single
        // typo produced a 429 that the UI showed as "check your
        // credentials" on every attempt, correct password included, until
        // the 15-minute window reset (which a password-reset detour is
        // just slow enough to outlast, making the reset look like the fix).
        const isAuthEndpoint = /\/auth\/(login|register|refresh)(\?|$)/.test(
          error.config?.url || '',
        );
        if (error.response?.status === 401 && !isAuthEndpoint) {
          // Token expired, try to refresh
          const refreshToken = await tokenStorage.get('refreshToken');
          if (refreshToken) {
            try {
              const { data } = await this.client.post('/auth/refresh', {
                refreshToken,
              });

              // Save new tokens
              await tokenStorage.set('accessToken', data.accessToken);
              await tokenStorage.set('refreshToken', data.refreshToken);

              // Retry the original request
              if (error.config) {
                error.config.headers.Authorization = `Bearer ${data.accessToken}`;
                // Belt-and-suspenders: for FormData bodies, make sure no
                // stale Content-Type survived onto the retried config —
                // axios needs to detect the FormData itself and set its
                // own boundary, not reuse a leftover header.
                if (typeof FormData !== 'undefined' && error.config.data instanceof FormData) {
                  delete error.config.headers['Content-Type'];
                }
                return this.client.request(error.config);
              }
            } catch (refreshError) {
              // Refresh failed, logout user
              await this.clearTokens();
              throw refreshError;
            }
          }
        }

        // A timeout or dropped connection leaves error.response undefined —
        // every call site in the app reads its error message from
        // err.response?.data?.message, so without this they either fell
        // through to a hardcoded default ("Invalid credentials" on login,
        // "Something went wrong" on password reset) that has nothing to do
        // with what actually happened, or showed nothing at all. Attaching
        // a synthetic response here means the existing call sites pick up
        // an accurate message for free.
        if (!error.response) {
          (error as any).response = {
            data: {
              message:
                error.code === 'ECONNABORTED'
                  ? "This is taking longer than usual — our server may be waking up. Please try again in a moment."
                  : "Couldn't reach PBGearbag. Check your connection and try again.",
            },
          };
        }

        return Promise.reject(error);
      },
    );
  }

  private async clearTokens() {
    await tokenStorage.remove('accessToken');
    await tokenStorage.remove('refreshToken');
    await tokenStorage.remove('userId');
  }

  get axios() {
    return this.client;
  }
}

export const apiClient = new ApiClient().axios;

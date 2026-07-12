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
      timeout: 10000,
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
        if (error.response?.status === 401) {
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

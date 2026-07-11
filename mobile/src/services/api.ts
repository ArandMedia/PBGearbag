import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from './tokenStorage';

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
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('accessToken');
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
          const refreshToken = await SecureStore.getItemAsync('refreshToken');
          if (refreshToken) {
            try {
              const userId = await SecureStore.getItemAsync('userId');
              const { data } = await this.client.post('/auth/refresh', {
                refreshToken,
                userId,
              });

              // Save new tokens
              await SecureStore.setItemAsync('accessToken', data.accessToken);
              await SecureStore.setItemAsync('refreshToken', data.refreshToken);

              // Retry the original request
              if (error.config) {
                error.config.headers.Authorization = `Bearer ${data.accessToken}`;
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
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('userId');
  }

  get axios() {
    return this.client;
  }
}

export const apiClient = new ApiClient().axios;

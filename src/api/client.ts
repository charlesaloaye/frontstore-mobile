import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getToken, removeToken } from './authStore';
import { router } from 'expo-router';

// API base URL: EXPO_PUBLIC_API_BASE_URL / EXPO_PUBLIC_API_URL when set; otherwise the
// local Laravel server in development and the live API in store builds. (Falling back
// to localhost in a release build left the shipped app unable to reach the server.)
export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? 'http://localhost:8000/api/v1' : 'https://frontstore.app/api/v1')
).replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Attach Bearer token to outgoing requests
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for 401 Unauthenticated handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isPublicOrVerification =
        url.includes('/payments/resolve-account') ||
        url.includes('/auth/complete-setup') ||
        url.includes('/auth/login') ||
        url.includes('/auth/signup') ||
        url.includes('/auth/verify') ||
        url.includes('/meta/') ||
        url.includes('/public/');

      const shouldSkip = (error.config as any)?.skipAuthRedirect || isPublicOrVerification;

      if (!shouldSkip) {
        await removeToken();
        // Navigate to login if unauthenticated
        try {
          router.replace('/login');
        } catch (navErr) {
          console.warn('Redirect to login failed', navErr);
        }
      }
    }
    return Promise.reject(error);
  }
);

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/** Wrapper helper methods matching expected API call patterns */
export async function apiGet<T = any>(url: string, params?: Record<string, any>): Promise<T> {
  try {
    const res = await apiClient.get(url, { params });
    const json = res.data;
    if (json?.status === 'error') {
      throw new ApiError(json.message || 'Request failed', res.status, json);
    }
    return json?.data !== undefined ? json.data : json;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    const message = err.response?.data?.message || err.message || 'Network request failed';
    throw new ApiError(message, err.response?.status || 500, err.response?.data);
  }
}

export async function apiPost<T = any>(url: string, body?: any, config?: any): Promise<T> {
  try {
    const res = await apiClient.post(url, body, config);
    const json = res.data;
    if (json?.status === 'error') {
      throw new ApiError(json.message || 'Request failed', res.status, json);
    }
    return json?.data !== undefined ? json.data : json;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    const message = err.response?.data?.message || err.message || 'Network request failed';
    throw new ApiError(message, err.response?.status || 500, err.response?.data);
  }
}

export async function apiPut<T = any>(url: string, body?: any): Promise<T> {
  try {
    const res = await apiClient.put(url, body);
    const json = res.data;
    if (json?.status === 'error') {
      throw new ApiError(json.message || 'Request failed', res.status, json);
    }
    return json?.data !== undefined ? json.data : json;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    const message = err.response?.data?.message || err.message || 'Network request failed';
    throw new ApiError(message, err.response?.status || 500, err.response?.data);
  }
}

export async function apiPatch<T = any>(url: string, body?: any): Promise<T> {
  try {
    const res = await apiClient.patch(url, body);
    const json = res.data;
    if (json?.status === 'error') {
      throw new ApiError(json.message || 'Request failed', res.status, json);
    }
    return json?.data !== undefined ? json.data : json;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    const message = err.response?.data?.message || err.message || 'Network request failed';
    throw new ApiError(message, err.response?.status || 500, err.response?.data);
  }
}

export async function apiDelete<T = any>(url: string): Promise<T> {
  try {
    const res = await apiClient.delete(url);
    const json = res.data;
    if (json?.status === 'error') {
      throw new ApiError(json.message || 'Request failed', res.status, json);
    }
    return json?.data !== undefined ? json.data : json;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    const message = err.response?.data?.message || err.message || 'Network request failed';
    throw new ApiError(message, err.response?.status || 500, err.response?.data);
  }
}

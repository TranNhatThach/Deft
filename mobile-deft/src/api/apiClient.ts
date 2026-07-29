import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_PATHS } from '../../../shared/types';
import { MockServer } from './mockServer';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:3000';
export const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach Access Token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: Token Refresh Rotation on 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const res = await axios.post(`${API_BASE_URL}${API_PATHS.AUTH.REFRESH}`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } = res.data;

        await AsyncStorage.setItem('access_token', access_token);
        if (newRefreshToken) {
          await AsyncStorage.setItem('refresh_token', newRefreshToken);
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        processQueue(null, access_token);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

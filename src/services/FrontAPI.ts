// services/frontend/FrontAPI.ts
import axios, { AxiosError, AxiosInstance, AxiosHeaders } from 'axios';
import { removeAllState, saveState } from '@/utils/Localstorage';
import { getRefreshToken, getTokenType } from './AuthService';
import { useAuthStore } from '@/stores';

export const api: AxiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_BASE_API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 避免同時多個 401 觸發多次 refresh
let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

const resolveQueue = (token: string | null) => {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
};

api.interceptors.request.use(
  (config) => {
    // 從 Pinia store 讀取 accessToken（記憶體），而非 localStorage
    const authStore = useAuthStore();
    const token = authStore.token;
    if (!token) return config;

    const tokenType = getTokenType() || 'Bearer';

    const headers = AxiosHeaders.from(config.headers || {});
    headers.set('Authorization', `${tokenType} ${token}`);
    config.headers = headers;

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest: any = error.config;

    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    const url = originalRequest?.url || '';
    if (url.includes('/admin/auth/refresh')) {
      removeAllState();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (originalRequest?._retry) {
      removeAllState();
      window.location.href = '/login';
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    const rt = getRefreshToken();
    if (!rt) {
      removeAllState();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // 若正在 refresh，排隊等待 token
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((newToken) => {
          if (!newToken) {
            reject(error);
            return;
          }

          const hdrs = AxiosHeaders.from(originalRequest.headers || {});
          hdrs.set('Authorization', `Bearer ${newToken}`);
          originalRequest.headers = hdrs;

          resolve(api(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshRes = await axios.post(
        `${import.meta.env.VITE_BASE_API_URL}/api/admin/auth/refresh`,
        { refreshToken: rt },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const payload = refreshRes.data; // ApiResponse
      if (!payload?.success) {
        throw new Error(payload?.error?.message || 'refresh failed');
      }

      const newAccessToken = payload?.data?.token ?? payload?.data?.accessToken;
      const newRefreshToken = payload?.data?.refreshToken;
      const newTokenType = payload?.data?.tokenType || 'Bearer';
      const newExpiresIn = payload?.data?.expiresIn ?? 0;

      if (!newAccessToken) throw new Error('no accessToken');

      // 更新 Pinia store（accessToken 存記憶體）+ localStorage（其他 token 資訊）
      const authStore = useAuthStore();
      authStore.setToken(newAccessToken);
      if (newRefreshToken) saveState('refreshToken', newRefreshToken);
      saveState('tokenType', newTokenType);
      saveState('expiresIn', newExpiresIn);

      resolveQueue(newAccessToken);

      // 重送原請求
      const hdrs = AxiosHeaders.from(originalRequest.headers || {});
      hdrs.set('Authorization', `${newTokenType} ${newAccessToken}`);
      originalRequest.headers = hdrs;

      return api(originalRequest);
    } catch (err) {
      resolveQueue(null);
      removeAllState();
      window.location.href = '/login';
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

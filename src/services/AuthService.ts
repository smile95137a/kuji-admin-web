// services/AuthService.ts
import { loadState } from '@/utils/Localstorage';
import { loadSession } from '@/utils/SessionStorage';

export const getAuthToken = () => loadState<any>('token');
// refreshToken 改存 sessionStorage（F5 保留 / 關閉瀏覽器清除）
export const getRefreshToken = () => loadSession<any>('refreshToken');
export const getTokenType = () => loadState<any>('tokenType') || 'Bearer';

// services/AuthService.ts
import { loadState } from '@/utils/Localstorage';

export const getAuthToken = () => loadState<any>('token');
export const getRefreshToken = () => loadState<any>('refreshToken');
export const getTokenType = () => loadState<any>('tokenType') || 'Bearer';

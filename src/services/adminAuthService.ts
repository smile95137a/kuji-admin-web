// services/frontend/adminAuthService.ts
import { api } from './FrontAPI';

const basePath = '/admin/auth';

interface RequestData {
  [key: string]: any;
}

/** 後台登入 */
export const adminLogin = async (
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}/login`, req);
    return res.data;
  } catch (e) {
    console.error('AdminAuth - adminLogin error:', e);
    throw e;
  }
};

/** 首次登入修改密碼 */
export const firstLoginChangePassword = async (
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}/first-login/change-password`, req);
    return res.data;
  } catch (e) {
    console.error('AdminAuth - firstLoginChangePassword error:', e);
    throw e;
  }
};

/** 修改密碼（已登入） */
export const changePassword = async (
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}/change-password`, req);
    return res.data;
  } catch (e) {
    console.error('AdminAuth - changePassword error:', e);
    throw e;
  }
};

/** 忘記密碼（寄送臨時密碼） */
export const forgotPassword = async (
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}/forgot-password`, req);
    return res.data;
  } catch (e) {
    console.error('AdminAuth - forgotPassword error:', e);
    throw e;
  }
};

/** 刷新 Token */
export const refreshToken = async (
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}/refresh`, req);
    return res.data;
  } catch (e) {
    console.error('AdminAuth - refreshToken error:', e);
    throw e;
  }
};

/** 登出 */
export const adminLogout = async (): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}/logout`);
    return res.data;
  } catch (e) {
    console.error('AdminAuth - adminLogout error:', e);
    throw e;
  }
};

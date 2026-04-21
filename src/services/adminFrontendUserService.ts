// src/services/adminFrontendUserService.ts
import { api } from './FrontAPI';

const basePath = '/admin/frontend-users';

interface RequestData {
  [key: string]: any;
}

/** 查詢前台會員列表（支援動態條件） */
export const queryFrontendUsers = async (
  req?: RequestData
): Promise<ApiResponse<any>> => {
  try {
    // 後端：POST /admin/frontend-users/list (body 可為空)
    const res = await api.post(`${basePath}/list`, req ?? null);
    return res.data;
  } catch (e) {
    console.error('AdminFrontendUser - queryFrontendUsers error:', e);
    throw e;
  }
};

/** 取得會員詳情 */
export const getFrontendUserById = async (
  id: string
): Promise<ApiResponse<any>> => {
  try {
    // 後端：GET /admin/frontend-users/{id}
    const res = await api.get(`${basePath}/${id}`);
    return res.data;
  } catch (e) {
    console.error('AdminFrontendUser - getFrontendUserById error:', e);
    throw e;
  }
};

/** 更新會員資訊 */
export const updateFrontendUser = async (
  id: string,
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    // 後端：PUT /admin/frontend-users/{id}
    const res = await api.put(`${basePath}/${id}`, req);
    return res.data;
  } catch (e) {
    console.error('AdminFrontendUser - updateFrontendUser error:', e);
    throw e;
  }
};

/** 軟刪除會員 */
export const deleteFrontendUser = async (
  id: string
): Promise<ApiResponse<any>> => {
  try {
    // 後端：DELETE /admin/frontend-users/{id}
    const res = await api.delete(`${basePath}/${id}`);
    return res.data;
  } catch (e) {
    console.error('AdminFrontendUser - deleteFrontendUser error:', e);
    throw e;
  }
};

/** 啟用會員 */
export const activateFrontendUser = async (
  id: string
): Promise<ApiResponse<any>> => {
  try {
    // 後端：POST /admin/frontend-users/{id}/activate
    const res = await api.post(`${basePath}/${id}/activate`);
    return res.data;
  } catch (e) {
    console.error('AdminFrontendUser - activateFrontendUser error:', e);
    throw e;
  }
};

/** 停用會員 */
export const deactivateFrontendUser = async (
  id: string
): Promise<ApiResponse<any>> => {
  try {
    // 後端：POST /admin/frontend-users/{id}/deactivate
    const res = await api.post(`${basePath}/${id}/deactivate`);
    return res.data;
  } catch (e) {
    console.error('AdminFrontendUser - deactivateFrontendUser error:', e);
    throw e;
  }
};

/** 暫停會員 */
export const suspendFrontendUser = async (
  id: string
): Promise<ApiResponse<any>> => {
  try {
    // 後端：POST /admin/frontend-users/{id}/suspend
    const res = await api.post(`${basePath}/${id}/suspend`);
    return res.data;
  } catch (e) {
    console.error('AdminFrontendUser - suspendFrontendUser error:', e);
    throw e;
  }
};

/** 解鎖帳號（因登入失敗被系統鎖定） */
export const unlockFrontendUser = async (
  id: string
): Promise<ApiResponse<any>> => {
  try {
    // 後端：POST /admin/frontend-users/{id}/unlock
    const res = await api.post(`${basePath}/${id}/unlock`);
    return res.data;
  } catch (e) {
    console.error('AdminFrontendUser - unlockFrontendUser error:', e);
    throw e;
  }
};

/** 查看登入歷史（最多 50 筆，倒序） */
export const getLoginHistory = async (
  id: string
): Promise<ApiResponse<any>> => {
  try {
    // 後端：GET /admin/frontend-users/{id}/login-history
    const res = await api.get(`${basePath}/${id}/login-history`);
    return res.data;
  } catch (e) {
    console.error('AdminFrontendUser - getLoginHistory error:', e);
    throw e;
  }
};

/** 手動調整點數（CoinAdjustReq: coinType / direction / amount / remark） */
export const coinAdjust = async (
  id: string,
  req: { coinType: 'GOLD' | 'BONUS'; direction: 'ADD' | 'DEDUCT'; amount: number; remark: string }
): Promise<ApiResponse<any>> => {
  try {
    // 後端：POST /admin/frontend-users/{id}/coin-adjust
    const res = await api.post(`${basePath}/${id}/coin-adjust`, req);
    return res.data;
  } catch (e) {
    console.error('AdminFrontendUser - coinAdjust error:', e);
    throw e;
  }
};

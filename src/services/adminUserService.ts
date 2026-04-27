// services/frontend/adminUserService.ts
import { api } from './FrontAPI';

const basePath = '/admin/users';

interface RequestData {
  [key: string]: any;
}

/** 建立店家負責人帳號 */
export const createStoreOwner = async (
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    // 後端：POST /admin/users/store-owner
    const res = await api.post(`${basePath}/store-owner`, req);
    return res.data;
  } catch (e) {
    console.error('AdminUser - createStoreOwner error:', e);
    throw e;
  }
};

/** 建立店家編輯人員帳號 */
export const createStoreEditor = async (
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    // 後端：POST /admin/users/store-editor
    const res = await api.post(`${basePath}/store-editor`, req);
    return res.data;
  } catch (e) {
    console.error('AdminUser - createStoreEditor error:', e);
    throw e;
  }
};

/** 取得帳號詳情 */
export const getAdminUserById = async (
  id: string
): Promise<ApiResponse<any>> => {
  try {
    // 後端：GET /admin/users/{id}
    const res = await api.get(`${basePath}/${id}`);
    return res.data;
  } catch (e) {
    console.error('AdminUser - getAdminUserById error:', e);
    throw e;
  }
};

/** 取得所有帳號列表（條件查詢，後端：POST /admin/users/list） */
export const queryAdminUsers = async (req: {
  condition?: {
    keyword?: string;
    status?: string;
    storeId?: string;
    roleCode?: string;
  };
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}/list`, req);
    return res.data;
  } catch (e) {
    console.error('AdminUser - queryAdminUsers error:', e);
    throw e;
  }
};

/** 取得所有帳號列表 */
export const getAllAdminUsers = async (): Promise<ApiResponse<any>> => {
  try {
    // 後端：GET /admin/users
    const res = await api.get(`${basePath}`);
    return res.data;
  } catch (e) {
    console.error('AdminUser - getAllAdminUsers error:', e);
    throw e;
  }
};

/** 取得指定店家的所有帳號 */
export const getAdminUsersByStore = async (
  storeId: string
): Promise<ApiResponse<any>> => {
  try {
    // 後端：GET /admin/users/by-store/{storeId}
    const res = await api.get(`${basePath}/by-store/${storeId}`);
    return res.data;
  } catch (e) {
    console.error('AdminUser - getAdminUsersByStore error:', e);
    throw e;
  }
};

/** 啟用帳號 */
export const activateAdminUser = async (
  id: string
): Promise<ApiResponse<any>> => {
  try {
    // 後端：POST /admin/users/{id}/activate
    const res = await api.post(`${basePath}/${id}/activate`);
    return res.data;
  } catch (e) {
    console.error('AdminUser - activateAdminUser error:', e);
    throw e;
  }
};

/** 停用帳號 */
export const deactivateAdminUser = async (
  id: string
): Promise<ApiResponse<any>> => {
  try {
    // 後端：POST /admin/users/{id}/deactivate
    const res = await api.post(`${basePath}/${id}/deactivate`);
    return res.data;
  } catch (e) {
    console.error('AdminUser - deactivateAdminUser error:', e);
    throw e;
  }
};

/** 重設密碼（回傳 { newPassword: string }） */
export const resetAdminUserPassword = async (
  id: string
): Promise<ApiResponse<{ newPassword: string }>> => {
  try {
    // 後端：POST /admin/users/{id}/reset-password
    const res = await api.post(`${basePath}/${id}/reset-password`);
    return res.data;
  } catch (e) {
    console.error('AdminUser - resetAdminUserPassword error:', e);
    throw e;
  }
};

/** 刪除帳號（後端描述：軟刪除=停用） */
export const deleteAdminUser = async (
  id: string
): Promise<ApiResponse<any>> => {
  try {
    // 後端：DELETE /admin/users/{id}
    const res = await api.delete(`${basePath}/${id}`);
    return res.data;
  } catch (e) {
    console.error('AdminUser - deleteAdminUser error:', e);
    throw e;
  }
};

/** 取得使用者下拉選單（GET /admin/users/all-options） */
export const getAllAdminUserOptions = async (): Promise<ApiResponse<any>> => {
  try {
    const res = await api.get(`${basePath}/all-options`);
    return res.data;
  } catch (e) {
    console.error('AdminUser - getAllAdminUserOptions error:', e);
    throw e;
  }
};

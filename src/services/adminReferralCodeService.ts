// src/services/adminReferralCodeService.ts
import { api } from './FrontAPI';

const basePath = '/admin/referral-codes';

interface RequestData {
  [key: string]: any;
}

/** 建立推薦碼 */
export const createReferralCode = async (
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}`, req);
    return res.data;
  } catch (e) {
    console.error('AdminReferralCode - createReferralCode error:', e);
    throw e;
  }
};

/** 更新推薦碼 */
export const updateReferralCode = async (
  id: string,
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.put(`${basePath}/${id}`, req);
    return res.data;
  } catch (e) {
    console.error('AdminReferralCode - updateReferralCode error:', e);
    throw e;
  }
};

/** 刪除推薦碼 */
export const deleteReferralCode = async (
  id: string
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.delete(`${basePath}/${id}`);
    return res.data;
  } catch (e) {
    console.error('AdminReferralCode - deleteReferralCode error:', e);
    throw e;
  }
};

/** 取得推薦碼詳情 */
export const getReferralCodeById = async (
  id: string
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.get(`${basePath}/${id}`);
    return res.data;
  } catch (e) {
    console.error('AdminReferralCode - getReferralCodeById error:', e);
    throw e;
  }
};

/** 取得所有推薦碼（ADMIN） */
export const getAllReferralCodes = async (): Promise<ApiResponse<any>> => {
  try {
    const res = await api.get(`${basePath}`);
    return res.data;
  } catch (e) {
    console.error('AdminReferralCode - getAllReferralCodes error:', e);
    throw e;
  }
};

/** 取得指定店家推薦碼 */
export const getReferralCodesByStoreId = async (
  storeId: string
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.get(`${basePath}/store/${storeId}`);
    return res.data;
  } catch (e) {
    console.error('AdminReferralCode - getReferralCodesByStoreId error:', e);
    throw e;
  }
};

/** 取得我的店家推薦碼（STORE_OWNER / STORE_EDITOR） */
export const getMyStoreReferralCodes = async (): Promise<ApiResponse<any>> => {
  try {
    const res = await api.get(`${basePath}/my-store`);
    return res.data;
  } catch (e) {
    console.error('AdminReferralCode - getMyStoreReferralCodes error:', e);
    throw e;
  }
};

/** 取得推薦碼使用記錄 */
export const getReferralCodeRecords = async (
  id: string
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.get(`${basePath}/${id}/records`);
    return res.data;
  } catch (e) {
    console.error('AdminReferralCode - getReferralCodeRecords error:', e);
    throw e;
  }
};

/** 取得店家的所有推薦記錄 */
export const getStoreReferralRecords = async (
  storeId: string
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.get(`${basePath}/store/${storeId}/records`);
    return res.data;
  } catch (e) {
    console.error('AdminReferralCode - getStoreReferralRecords error:', e);
    throw e;
  }
};

/** 驗證推薦碼是否有效（前台可用） */
export const validateReferralCode = async (
  code: string
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.get(
      `${basePath}/validate/${encodeURIComponent(code)}`
    );
    return res.data;
  } catch (e) {
    console.error('AdminReferralCode - validateReferralCode error:', e);
    throw e;
  }
};

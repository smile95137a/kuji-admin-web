// src/services/adminFrontendUserService.ts
import { api } from './FrontAPI';

const basePath = '/admin/frontend-users';

interface RequestData {
  [key: string]: any;
}

export interface FrontendUserListRes {
  id: string;
  email?: string;
  nickname?: string;
  avatar?: string;
  provider?: string;
  goldCoins?: number;
  bonusCoins?: number;
  status?: string;
  statusName?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FrontendUserDetailRes {
  id: string;
  email?: string;
  nickname?: string;
  avatar?: string;
  provider?: string;
  providerId?: string;
  goldCoins?: number;
  bonusCoins?: number;
  status?: string;
  statusName?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  lineId?: string;
  recipientName?: string;
  recipientPhone?: string;
  city?: string;
  district?: string;
  addressDetail?: string;
  invoiceType?: string;
  invoiceEmail?: string;
  carrierCode?: string;
  taxId?: string;
  companyName?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  failedLoginAttempts?: number;
  lockedUntil?: string;
}

export interface FrontendUserQueryReq {
  condition?: {
    email?: string | null;
    nickname?: string | null;
    phone?: string | null;
    status?: string | null;
    provider?: string | null;
    keyword?: string | null;
    goldCoinsMin?: number | null;
    goldCoinsMax?: number | null;
    createdAtStart?: string | null;
    createdAtEnd?: string | null;
  };
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC' | string;
}

/** 查詢前台會員列表（支援動態條件） */
export const queryFrontendUsers = async (
  req?: FrontendUserQueryReq | RequestData
): Promise<ApiResponse<FrontendUserListRes[]>> => {
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
): Promise<ApiResponse<FrontendUserDetailRes>> => {
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
): Promise<ApiResponse<FrontendUserDetailRes>> => {
  try {
    // 後端：PUT /admin/frontend-users/{id}
    const res = await api.put(`${basePath}/${id}`, req);
    return res.data;
  } catch (e) {
    console.error('AdminFrontendUser - updateFrontendUser error:', e);
    throw e;
  }
};

/** 軟刪除會員（已收斂為停用） */
export const deleteFrontendUser = async (
  id: string
): Promise<ApiResponse<any>> => {
  try {
    // 後端已移除 delete，改走停用流程
    const res = await api.post(`${basePath}/${id}/deactivate`);
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

/** 手動調整點數（後端採 signed amount：正數增加、負數扣除） */
export const coinAdjust = async (
  id: string,
  req: {
    coinType: 'GOLD' | 'BONUS';
    amount: number;
    remark: string;
    direction?: 'ADD' | 'DEDUCT';
  }
): Promise<ApiResponse<any>> => {
  try {
    let normalizedAmount = req.amount;
    if (req.direction === 'DEDUCT') {
      normalizedAmount = -Math.abs(req.amount);
    } else if (req.direction === 'ADD') {
      normalizedAmount = Math.abs(req.amount);
    }

    const payload = {
      coinType: req.coinType,
      amount: normalizedAmount,
      remark: req.remark,
    };

    // 後端：POST /admin/frontend-users/{id}/coin-adjust
    const res = await api.post(`${basePath}/${id}/coin-adjust`, payload);
    return res.data;
  } catch (e) {
    console.error('AdminFrontendUser - coinAdjust error:', e);
    throw e;
  }
};

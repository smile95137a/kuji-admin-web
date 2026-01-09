// services/adminWalletService.ts
import { api } from './FrontAPI';

const basePath = '/admin/wallet';

interface RequestData {
  [key: string]: any;
}

/** 查詢玩家錢包 */
export const getUserWallet = async (
  userId: string
): Promise<ApiResponse<any>> => {
  try {
    // 後端：GET /admin/wallet/{userId}
    const res = await api.get(`${basePath}/${userId}`);
    return res.data;
  } catch (e) {
    console.error('AdminWallet - getUserWallet error:', e);
    throw e;
  }
};

/** 手動調整玩家點數（Admin） */
export const adjustWalletCoins = async (
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    // 後端：POST /admin/wallet/adjust
    const res = await api.post(`${basePath}/adjust`, req);
    return res.data;
  } catch (e) {
    console.error('AdminWallet - adjustWalletCoins error:', e);
    throw e;
  }
};

/** 查詢交易記錄（支援條件） */
export const queryWalletTransactions = async (
  req?: RequestData
): Promise<ApiResponse<any>> => {
  try {
    // 後端：POST /admin/wallet/transactions/list (body 可為空)
    const res = await api.post(`${basePath}/transactions/list`, req ?? null);
    return res.data;
  } catch (e) {
    console.error('AdminWallet - queryWalletTransactions error:', e);
    throw e;
  }
};

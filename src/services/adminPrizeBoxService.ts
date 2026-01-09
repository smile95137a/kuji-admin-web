// services/adminPrizeBoxService.ts
import { api } from './FrontAPI';

const basePath = '/admin/prize-box';

/** 查詢玩家賞品盒（明細） */
export const getPrizeBoxByUserId = async (
  userId: string
): Promise<ApiResponse<any>> => {
  try {
    // 後端：GET /admin/prize-box/{userId}
    const res = await api.get(`${basePath}/${userId}`);
    return res.data;
  } catch (e) {
    console.error('AdminPrizeBox - getPrizeBoxByUserId error:', e);
    throw e;
  }
};

/** 查詢玩家賞品盒（按店家分組） */
export const getPrizeBoxSummaryByStore = async (
  userId: string
): Promise<ApiResponse<any>> => {
  try {
    // 後端：GET /admin/prize-box/summary/{userId}
    const res = await api.get(`${basePath}/summary/${userId}`);
    return res.data;
  } catch (e) {
    console.error('AdminPrizeBox - getPrizeBoxSummaryByStore error:', e);
    throw e;
  }
};

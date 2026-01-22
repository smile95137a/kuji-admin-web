// services/adminLotteryWithPrizesService.ts
import { api } from './FrontAPI';

const basePath = '/admin/lottery-with-prizes';

interface RequestData {
  [key: string]: any;
}

/** 建立商品與獎品（整合新增） */
export const createLotteryWithPrizes = async (
  req: RequestData,
): Promise<ApiResponse<any>> => {
  try {
    // 後端：POST /admin/lottery-with-prizes
    const res = await api.post(`${basePath}`, req ?? null);
    return res.data;
  } catch (e) {
    console.error('AdminLotteryWithPrizes - createLotteryWithPrizes error:', e);
    throw e;
  }
};

/** 更新商品與獎品（整合更新，支援部分更新） */
export const updateLotteryWithPrizes = async (
  lotteryId: string,
  req: RequestData,
): Promise<ApiResponse<any>> => {
  try {
    // 後端：PUT /admin/lottery-with-prizes/{lotteryId}
    const res = await api.put(`${basePath}/${lotteryId}`, req ?? null);
    return res.data;
  } catch (e) {
    console.error('AdminLotteryWithPrizes - updateLotteryWithPrizes error:', e);
    throw e;
  }
};

/** 查詢商品與獎品（整合查詢） */
export const getLotteryWithPrizes = async (
  lotteryId: string,
): Promise<ApiResponse<any>> => {
  try {
    // 後端：GET /admin/lottery-with-prizes/{lotteryId}
    const res = await api.get(`${basePath}/${lotteryId}`);
    return res.data;
  } catch (e) {
    console.error('AdminLotteryWithPrizes - getLotteryWithPrizes error:', e);
    throw e;
  }
};

/** 查詢所有商品與獎品（整合列表查詢） */
export const getAllLotteriesWithPrizes = async (
  req?: RequestData,
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}/list`, req ?? null);
    return res.data;
  } catch (e) {
    console.error(
      'AdminLotteryWithPrizes - getAllLotteriesWithPrizes error:',
      e,
    );
    throw e;
  }
};

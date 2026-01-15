// src/services/adminLotteryPrizeService.ts
import { api } from './FrontAPI';

const basePath = '/admin/lotteries';

interface RequestData {
  [key: string]: any;
}

/** 建立單筆獎項（POST /admin/lotteries/{lotteryId}/prizes） */
export const createPrize = async (
  lotteryId: string,
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}/${lotteryId}/prizes`, req ?? null);
    return res.data;
  } catch (e) {
    console.error('AdminLotteryPrize - createPrize error:', e);
    throw e;
  }
};

/** 批量建立獎項（POST /admin/lotteries/{lotteryId}/prizes/batch） */
export const createPrizesBatch = async (
  lotteryId: string,
  reqList: RequestData[]
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(
      `${basePath}/${lotteryId}/prizes/batch`,
      reqList ?? []
    );
    return res.data;
  } catch (e) {
    console.error('AdminLotteryPrize - createPrizesBatch error:', e);
    throw e;
  }
};

/** 更新獎項（PUT /admin/lotteries/prizes/{prizeId}） */
export const updatePrize = async (
  prizeId: string,
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    // 你後端是 @PutMapping，所以用 api.put
    const res = await api.put(`${basePath}/prizes/${prizeId}`, req ?? null);
    return res.data;
  } catch (e) {
    console.error('AdminLotteryPrize - updatePrize error:', e);
    throw e;
  }
};

/** 刪除獎項（DELETE /admin/lotteries/prizes/{prizeId}） */
export const deletePrize = async (
  prizeId: string
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.delete(`${basePath}/prizes/${prizeId}`);
    return res.data;
  } catch (e) {
    console.error('AdminLotteryPrize - deletePrize error:', e);
    throw e;
  }
};

/** 查詢單一獎項（GET /admin/lotteries/prizes/{prizeId}） */
export const getPrizeById = async (
  prizeId: string
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.get(`${basePath}/prizes/${prizeId}`);
    return res.data;
  } catch (e) {
    console.error('AdminLotteryPrize - getPrizeById error:', e);
    throw e;
  }
};

/** 查詢某商品全部獎項（GET /admin/lotteries/{lotteryId}/prizes） */
export const getPrizesByLotteryId = async (
  lotteryId: string
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.get(`${basePath}/${lotteryId}/prizes`);
    return res.data;
  } catch (e) {
    console.error('AdminLotteryPrize - getPrizesByLotteryId error:', e);
    throw e;
  }
};

/** 根據等級查詢獎項（GET /admin/lotteries/{lotteryId}/prizes/level/{level}） */
export const getPrizesByLevel = async (
  lotteryId: string,
  level: string
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.get(`${basePath}/${lotteryId}/prizes/level/${level}`);
    return res.data;
  } catch (e) {
    console.error('AdminLotteryPrize - getPrizesByLevel error:', e);
    throw e;
  }
};

/** 重置獎項剩餘數量（POST /admin/lotteries/{lotteryId}/prizes/reset） */
export const resetPrizeRemaining = async (
  lotteryId: string
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}/${lotteryId}/prizes/reset`, null);
    return res.data;
  } catch (e) {
    console.error('AdminLotteryPrize - resetPrizeRemaining error:', e);
    throw e;
  }
};

/** 查詢可選號碼清單（GET /admin/lotteries/{lotteryId}/available-numbers） */
export const getAvailableNumbers = async (
  lotteryId: string
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.get(`${basePath}/${lotteryId}/available-numbers`);
    return res.data;
  } catch (e) {
    console.error('AdminLotteryPrize - getAvailableNumbers error:', e);
    throw e;
  }
};

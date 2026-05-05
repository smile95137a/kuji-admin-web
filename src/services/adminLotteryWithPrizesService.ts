// services/adminLotteryWithPrizesService.ts
import { api } from './FrontAPI';

const basePath = '/admin/lottery/with-prizes';

interface RequestData {
  [key: string]: any;
}

interface PrizeDesignation {
  revealedNumber: number;
  prizeId: string;
}

interface DesignatePrizeRequest {
  designations: PrizeDesignation[];
}

/** 建立商品與獎品（整合新增） */
export const createLotteryWithPrizes = async (
  req: RequestData,
): Promise<ApiResponse<any>> => {
  try {
    // 後端：POST /admin/lottery/with-prizes
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
    // 後端：PUT /admin/lottery/with-prizes/{lotteryId}
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
    // 後端：GET /admin/lottery/with-prizes/{lotteryId}
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

/**
 * 指定大獎號碼
 * 相容端點（all map to same handler）：
 * - POST /admin/lottery/{id}/designate-prize
 * - POST /admin/lottery/{id}/designate-prize-positions
 * - POST /admin/lottery/{id}/designate
 * Body: { designations: [{ revealedNumber, prizeId }] }
 */
export const designatePrize = async (
  lotteryId: string,
  body: DesignatePrizeRequest,
): Promise<ApiResponse<any>> => {
  const endpointCandidates = [
    `/admin/lottery/${lotteryId}/designate-prize`,
    `/admin/lottery/${lotteryId}/designate-prize-positions`,
    `/admin/lottery/${lotteryId}/designate`,
  ];

  try {
    let lastError: any;

    for (const endpoint of endpointCandidates) {
      try {
        const res = await api.post(endpoint, body);
        return res.data;
      } catch (e: any) {
        lastError = e;
        const status = e?.response?.status;

        // 只在路由/方法不匹配時切換下一條相容路由
        if (status === 404 || status === 405) {
          continue;
        }

        throw e;
      }
    }

    throw lastError;
  } catch (e) {
    console.error('AdminLotteryWithPrizes - designatePrize error:', e);
    throw e;
  }
};

/** 變更抽獎商品狀態（PUT /admin/lottery/{id}/status） */
export const changeLotteryWithPrizesStatus = async (
  lotteryId: string,
  targetStatus: 'CONFIGURED' | 'ACTIVE' | 'ENDED' | 'CANCELLED' | 'DELETED',
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.put(`/admin/lottery/${lotteryId}/status`, { targetStatus });
    return res.data;
  } catch (e) {
    console.error('AdminLotteryWithPrizes - changeLotteryWithPrizesStatus error:', e);
    throw e;
  }
};

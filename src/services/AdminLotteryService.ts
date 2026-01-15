// src/services/adminLotteryService.ts
import { api } from './FrontAPI';

const basePath = '/admin/lottery';

interface RequestData {
  [key: string]: any;
}

/** 查詢商品列表（支援動態條件，後端會自動依角色過濾 storeId） */
export const queryLotteries = async (
  req?: RequestData
): Promise<ApiResponse<any>> => {
  try {
    // POST /admin/lottery/list (body 可為空)
    const res = await api.post(`${basePath}/list`, req ?? null);
    return res.data;
  } catch (e) {
    console.error('AdminLottery - queryLotteries error:', e);
    throw e;
  }
};

/** 取得商品詳情 */
export const getLotteryById = async (id: string): Promise<ApiResponse<any>> => {
  try {
    // GET /admin/lottery/{id}
    const res = await api.get(`${basePath}/${id}`);
    return res.data;
  } catch (e) {
    console.error('AdminLottery - getLotteryById error:', e);
    throw e;
  }
};

/** 新增商品 */
export const createLottery = async (
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    // POST /admin/lottery
    const res = await api.post(`${basePath}`, req);
    return res.data;
  } catch (e) {
    console.error('AdminLottery - createLottery error:', e);
    throw e;
  }
};

/** 更新商品 */
export const updateLottery = async (
  id: string,
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    // PUT /admin/lottery/{id}
    const res = await api.put(`${basePath}/${id}`, req);
    return res.data;
  } catch (e) {
    console.error('AdminLottery - updateLottery error:', e);
    throw e;
  }
};

/** 刪除商品 */
export const deleteLottery = async (id: string): Promise<ApiResponse<any>> => {
  try {
    // DELETE /admin/lottery/{id}
    const res = await api.delete(`${basePath}/${id}`);
    return res.data;
  } catch (e) {
    console.error('AdminLottery - deleteLottery error:', e);
    throw e;
  }
};

/** 上架商品 */
export const onShelfLottery = async (id: string): Promise<ApiResponse<any>> => {
  try {
    // POST /admin/lottery/{id}/on-shelf
    const res = await api.post(`${basePath}/${id}/on-shelf`);
    return res.data;
  } catch (e) {
    console.error('AdminLottery - onShelfLottery error:', e);
    throw e;
  }
};

/** 下架商品 */
export const offShelfLottery = async (
  id: string
): Promise<ApiResponse<any>> => {
  try {
    // POST /admin/lottery/{id}/off-shelf
    const res = await api.post(`${basePath}/${id}/off-shelf`);
    return res.data;
  } catch (e) {
    console.error('AdminLottery - offShelfLottery error:', e);
    throw e;
  }
};

// services/adminOrderService.ts
import { api } from './FrontAPI';

const basePath = '/admin/order';

interface RequestData {
  [key: string]: any;
}

/** 查詢訂單列表（支援動態條件） */
export const queryOrders = async (
  req?: RequestData
): Promise<ApiResponse<any>> => {
  try {
    // 後端：POST /admin/order/list (body 可為空)
    const res = await api.post(`${basePath}/list`, req ?? null);
    return res.data;
  } catch (e) {
    console.error('AdminOrder - queryOrders error:', e);
    throw e;
  }
};

/** 取得訂單詳情 */
export const getOrderById = async (
  orderId: string
): Promise<ApiResponse<any>> => {
  try {
    // 後端：GET /admin/order/{orderId}
    const res = await api.get(`${basePath}/${orderId}`);
    return res.data;
  } catch (e) {
    console.error('AdminOrder - getOrderById error:', e);
    throw e;
  }
};

/** 準備出貨（店家確認備貨完成） */
export const prepareShipping = async (
  orderId: string
): Promise<ApiResponse<any>> => {
  try {
    // 後端：PUT /admin/order/{orderId}/prepare
    const res = await api.put(`${basePath}/${orderId}/prepare`, null);
    return res.data;
  } catch (e) {
    console.error('AdminOrder - prepareShipping error:', e);
    throw e;
  }
};

/** 訂單出貨（填寫物流單號） */
export const shipOrder = async (
  orderId: string,
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    // 後端：PUT /admin/order/{orderId}/ship
    const res = await api.put(`${basePath}/${orderId}/ship`, req);
    return res.data;
  } catch (e) {
    console.error('AdminOrder - shipOrder error:', e);
    throw e;
  }
};

/** 完成訂單 */
export const completeOrder = async (
  orderId: string
): Promise<ApiResponse<any>> => {
  try {
    // 後端：PUT /admin/order/{orderId}/complete
    const res = await api.put(`${basePath}/${orderId}/complete`, null);
    return res.data;
  } catch (e) {
    console.error('AdminOrder - completeOrder error:', e);
    throw e;
  }
};

/** 取消訂單（僅 ADMIN、通常限 PENDING） */
export const cancelOrder = async (
  orderId: string,
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    // 後端：PUT /admin/order/{orderId}/cancel
    const res = await api.put(`${basePath}/${orderId}/cancel`, req);
    return res.data;
  } catch (e) {
    console.error('AdminOrder - cancelOrder error:', e);
    throw e;
  }
};

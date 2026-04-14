// services/adminOrderService.ts
import { api } from './FrontAPI';

const basePath = '/admin/orders';

interface RequestData {
  [key: string]: any;
}

/** 查詢訂單列表（POST /admin/orders/list，body 可為空） */
export const queryOrders = async (req?: RequestData): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}/list`, req ?? null);
    return res.data;
  } catch (e) {
    console.error('AdminOrder - queryOrders error:', e);
    throw e;
  }
};

/** 查詢訂單詳情（GET /admin/orders/{orderId}） */
export const getOrderDetail = async (orderId: string): Promise<ApiResponse<any>> => {
  try {
    const res = await api.get(`${basePath}/${orderId}`);
    return res.data;
  } catch (e) {
    console.error('AdminOrder - getOrderDetail error:', e);
    throw e;
  }
};

/** 準備出貨（PUT /admin/orders/{orderId}/prepare） */
export const prepareShipping = async (orderId: string): Promise<ApiResponse<any>> => {
  try {
    const res = await api.put(`${basePath}/${orderId}/prepare`);
    return res.data;
  } catch (e) {
    console.error('AdminOrder - prepareShipping error:', e);
    throw e;
  }
};

/**
 * 訂單出貨（PUT /admin/orders/{orderId}/ship）
 * body: OrderShipReq（例如 { trackingNo: 'xxx', ... }）
 */
export const shipOrder = async (
  orderId: string,
  req: RequestData,
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.put(`${basePath}/${orderId}/ship`, req);
    return res.data;
  } catch (e) {
    console.error('AdminOrder - shipOrder error:', e);
    throw e;
  }
};

/** 完成訂單（PUT /admin/orders/{orderId}/complete） */
export const completeOrder = async (orderId: string): Promise<ApiResponse<any>> => {
  try {
    const res = await api.put(`${basePath}/${orderId}/complete`);
    return res.data;
  } catch (e) {
    console.error('AdminOrder - completeOrder error:', e);
    throw e;
  }
};

/**
 * 更新訂單狀態（PUT /admin/orders/{orderId}/status）
 * status: "PREPARING" | "SHIPPED" | "COMPLETED"
 * 422 + errorCode: "INVALID_STATUS_TRANSITION" → 非法狀態轉換
 */
export const updateOrderStatus = async (
  orderId: string,
  status: 'PREPARING' | 'SHIPPED' | 'COMPLETED',
): Promise<ApiResponse<any>> => {
  const res = await api.put(`${basePath}/${orderId}/status`, { status });
  return res.data;
};

/**
 * 取消訂單（DELETE /admin/orders/{orderId}）
 * body: { cancelReason: string }（必填，最多 200 字）
 * 422 + errorCode: "INVALID_STATUS_TRANSITION" → 狀態不允許取消
 */
export const cancelOrderWithReason = async (
  orderId: string,
  reason: string,
): Promise<ApiResponse<any>> => {
  const res = await api.delete(`${basePath}/${orderId}`, { data: { cancelReason: reason } });
  return res.data;
};

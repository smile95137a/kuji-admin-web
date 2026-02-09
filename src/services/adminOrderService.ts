// services/adminOrderService.ts
import { api } from './FrontAPI';

const basePath = '/admin/order';

interface RequestData {
  [key: string]: any;
}

/** 查詢訂單列表（POST /admin/order/list，body 可為空） */
export const queryOrders = async (req?: RequestData): Promise<any> => {
  try {
    const res = await api.post(`${basePath}/list`, req ?? null);
    return res.data;
  } catch (e) {
    console.error('AdminOrder - queryOrders error:', e);
    throw e;
  }
};

/** 查詢訂單詳情（GET /admin/order/{orderId}） */
export const getOrderDetail = async (orderId: string): Promise<any> => {
  try {
    const res = await api.get(`${basePath}/${orderId}`);
    return res.data;
  } catch (e) {
    console.error('AdminOrder - getOrderDetail error:', e);
    throw e;
  }
};

/** 準備出貨（PUT /admin/order/{orderId}/prepare） */
export const prepareShipping = async (orderId: string): Promise<any> => {
  try {
    const res = await api.put(`${basePath}/${orderId}/prepare`);
    return res.data;
  } catch (e) {
    console.error('AdminOrder - prepareShipping error:', e);
    throw e;
  }
};

/**
 * 訂單出貨（PUT /admin/order/{orderId}/ship）
 * body: OrderShipReq（例如 { trackingNo: 'xxx', ... }）
 */
export const shipOrder = async (
  orderId: string,
  req: RequestData,
): Promise<any> => {
  try {
    const res = await api.put(`${basePath}/${orderId}/ship`, req);
    return res.data;
  } catch (e) {
    console.error('AdminOrder - shipOrder error:', e);
    throw e;
  }
};

/** 完成訂單（PUT /admin/order/{orderId}/complete） */
export const completeOrder = async (orderId: string): Promise<any> => {
  try {
    const res = await api.put(`${basePath}/${orderId}/complete`);
    return res.data;
  } catch (e) {
    console.error('AdminOrder - completeOrder error:', e);
    throw e;
  }
};

/**
 * 取消訂單（PUT /admin/order/{orderId}/cancel）
 * body: OrderCancelReq（例如 { reason: 'xxx' }）
 */
export const cancelOrder = async (
  orderId: string,
  req: RequestData,
): Promise<any> => {
  try {
    const res = await api.put(`${basePath}/${orderId}/cancel`, req);
    return res.data;
  } catch (e) {
    console.error('AdminOrder - cancelOrder error:', e);
    throw e;
  }
};

// services/adminNewsService.ts
import { api } from './FrontAPI';

const basePath = '/admin/news';

interface RequestData {
  [key: string]: any;
}

/** 查詢 News 列表（支援動態條件） */
export const queryNews = async (
  req?: RequestData
): Promise<ApiResponse<any>> => {
  try {
    // 後端：POST /admin/news/list (body 可為空)
    const res = await api.post(`${basePath}/list`, req ?? null);
    return res.data;
  } catch (e) {
    console.error('AdminNews - queryNews error:', e);
    throw e;
  }
};

/** 取得 News 詳情 */
export const getNewsById = async (id: string): Promise<ApiResponse<any>> => {
  try {
    // 後端：GET /admin/news/{id}
    const res = await api.get(`${basePath}/${id}`);
    return res.data;
  } catch (e) {
    console.error('AdminNews - getNewsById error:', e);
    throw e;
  }
};

/** 新增 News */
export const createNews = async (
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    // 後端：POST /admin/news
    const res = await api.post(`${basePath}`, req);
    return res.data;
  } catch (e) {
    console.error('AdminNews - createNews error:', e);
    throw e;
  }
};

/** 更新 News */
export const updateNews = async (
  id: string,
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    // 後端：PUT /admin/news/{id}
    const res = await api.put(`${basePath}/${id}`, req);
    return res.data;
  } catch (e) {
    console.error('AdminNews - updateNews error:', e);
    throw e;
  }
};

/** 刪除 News（永久刪除） */
export const deleteNews = async (id: string): Promise<ApiResponse<any>> => {
  try {
    // 後端：DELETE /admin/news/{id}
    const res = await api.delete(`${basePath}/${id}`);
    return res.data;
  } catch (e) {
    console.error('AdminNews - deleteNews error:', e);
    throw e;
  }
};

/** 上架 News */
export const publishNews = async (id: string): Promise<ApiResponse<any>> => {
  try {
    // 後端：POST /admin/news/{id}/publish
    const res = await api.post(`${basePath}/${id}/publish`);
    return res.data;
  } catch (e) {
    console.error('AdminNews - publishNews error:', e);
    throw e;
  }
};

/** 下架 News */
export const unpublishNews = async (id: string): Promise<ApiResponse<any>> => {
  try {
    // 後端：POST /admin/news/{id}/unpublish
    const res = await api.post(`${basePath}/${id}/unpublish`);
    return res.data;
  } catch (e) {
    console.error('AdminNews - unpublishNews error:', e);
    throw e;
  }
};

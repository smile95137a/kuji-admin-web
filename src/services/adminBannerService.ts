// services/adminBannerService.ts
import { api } from './FrontAPI';

const basePath = '/admin/banner';

interface RequestData {
  [key: string]: any;
}

/** 查詢 Banner 列表（支援動態條件） */
export const queryBanners = async (
  req?: RequestData
): Promise<ApiResponse<any>> => {
  try {
    // 後端：POST /admin/banner/list (body 可為空)
    const res = await api.post(`${basePath}/list`, req ?? null);
    return res.data;
  } catch (e) {
    console.error('AdminBanner - queryBanners error:', e);
    throw e;
  }
};

/** 取得 Banner 詳情 */
export const getBannerById = async (id: string): Promise<ApiResponse<any>> => {
  try {
    // 後端：GET /admin/banner/{id}
    const res = await api.get(`${basePath}/${id}`);
    return res.data;
  } catch (e) {
    console.error('AdminBanner - getBannerById error:', e);
    throw e;
  }
};

/** 新增 Banner */
export const createBanner = async (
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    // 後端：POST /admin/banner
    const res = await api.post(`${basePath}`, req);
    return res.data;
  } catch (e) {
    console.error('AdminBanner - createBanner error:', e);
    throw e;
  }
};

/** 更新 Banner */
export const updateBanner = async (
  id: string,
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    // 後端：PUT /admin/banner/{id}
    const res = await api.put(`${basePath}/${id}`, req);
    return res.data;
  } catch (e) {
    console.error('AdminBanner - updateBanner error:', e);
    throw e;
  }
};

/** 刪除 Banner（永久刪除） */
export const deleteBanner = async (id: string): Promise<ApiResponse<any>> => {
  try {
    // 後端：DELETE /admin/banner/{id}
    const res = await api.delete(`${basePath}/${id}`);
    return res.data;
  } catch (e) {
    console.error('AdminBanner - deleteBanner error:', e);
    throw e;
  }
};

/** 上架 Banner */
export const publishBanner = async (id: string): Promise<ApiResponse<any>> => {
  try {
    // 後端：POST /admin/banner/{id}/publish
    const res = await api.post(`${basePath}/${id}/publish`);
    return res.data;
  } catch (e) {
    console.error('AdminBanner - publishBanner error:', e);
    throw e;
  }
};

/** 下架 Banner */
export const unpublishBanner = async (
  id: string
): Promise<ApiResponse<any>> => {
  try {
    // 後端：POST /admin/banner/{id}/unpublish
    const res = await api.post(`${basePath}/${id}/unpublish`);
    return res.data;
  } catch (e) {
    console.error('AdminBanner - unpublishBanner error:', e);
    throw e;
  }
};

/** 更新 Banner 排序（orderNum 走 query param） */
export const updateBannerOrder = async (
  id: string,
  orderNum: number
): Promise<ApiResponse<any>> => {
  try {
    // 後端：PUT /admin/banner/{id}/order?orderNum=1
    const res = await api.put(`${basePath}/${id}/order`, null, {
      params: { orderNum },
    });
    return res.data;
  } catch (e) {
    console.error('AdminBanner - updateBannerOrder error:', e);
    throw e;
  }
};

/** 批次更新 Banner 排序（拖曳排序用） */
export const reorderBanners = async (
  ids: string[]
): Promise<ApiResponse<any>> => {
  try {
    // 後端：PUT /admin/banner/reorder  body: { ids: string[] }
    const res = await api.put(`${basePath}/reorder`, { ids });
    return res.data;
  } catch (e) {
    console.error('AdminBanner - reorderBanners error:', e);
    throw e;
  }
};

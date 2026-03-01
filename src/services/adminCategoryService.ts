// src/services/adminCategoryService.ts
import { api } from './FrontAPI';

const basePath = '/admin/category';

interface RequestData {
  [key: string]: any;
}

/** 查詢商品分類（POST /admin/category/categories） */
export const queryCategories = async (
  req?: RequestData
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}/categories`, req ?? null);
    return res.data;
  } catch (e) {
    console.error('AdminCategory - queryCategories error:', e);
    throw e;
  }
};

/** 查詢主題（POST /admin/category/themes） */
export const queryThemes = async (
  req?: RequestData
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}/themes`, req ?? null);
    return res.data;
  } catch (e) {
    console.error('AdminCategory - queryThemes error:', e);
    throw e;
  }
};

/** 查詢標籤（POST /admin/category/tags） */
export const queryTags = async (
  req?: RequestData
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}/tags`, req ?? null);
    return res.data;
  } catch (e) {
    console.error('AdminCategory - queryTags error:', e);
    throw e;
  }
};

/** 分類統計（GET /admin/category/statistics）（ADMIN, STORE_OWNER） */
export const getCategoryStatistics = async (): Promise<ApiResponse<any>> => {
  try {
    const res = await api.get(`${basePath}/statistics`);
    return res.data;
  } catch (e) {
    console.error('AdminCategory - getCategoryStatistics error:', e);
    throw e;
  }
};

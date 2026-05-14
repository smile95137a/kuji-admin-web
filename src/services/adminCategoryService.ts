// src/services/adminCategoryService.ts
import { api } from './FrontAPI';

const basePath = '/admin/category';

interface RequestData {
  [key: string]: any;
}

export interface ThemeAliasRes {
  id: string;
  aliasName: string;
  status?: string;
}

export interface CategoryRes {
  id?: string;
  name: string;
  type?: string;
  productCount?: number;
  imageUrl?: string;
  displayOrder?: number;
  hotCount?: number;
  status?: string;
  aliases?: ThemeAliasRes[];
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
): Promise<ApiResponse<CategoryRes[]> | CategoryRes[]> => {
  try {
    const res = await api.post(`${basePath}/themes`, req ?? null);
    return res.data;
  } catch (e) {
    console.error('AdminCategory - queryThemes error:', e);
    throw e;
  }
};

/** 新增或還原主題（POST /admin/category/theme） */
export const upsertTheme = async (
  req: RequestData
): Promise<ApiResponse<CategoryRes> | CategoryRes> => {
  try {
    const res = await api.post(`${basePath}/theme`, req);
    return res.data;
  } catch (e) {
    console.error('AdminCategory - upsertTheme error:', e);
    throw e;
  }
};

/** 更新主題（PUT /admin/category/theme/{id}） */
export const updateTheme = async (
  id: string,
  req: RequestData
): Promise<ApiResponse<CategoryRes> | CategoryRes> => {
  try {
    const res = await api.put(`${basePath}/theme/${id}`, req);
    return res.data;
  } catch (e) {
    console.error('AdminCategory - updateTheme error:', e);
    throw e;
  }
};

/** 停用主題（DELETE /admin/category/theme/{id}） */
export const deleteTheme = async (
  id: string
): Promise<ApiResponse<void> | void> => {
  try {
    const res = await api.delete(`${basePath}/theme/${id}`);
    return res.data;
  } catch (e) {
    console.error('AdminCategory - deleteTheme error:', e);
    throw e;
  }
};

/** 新增主題同義詞（POST /admin/category/theme/{id}/alias） */
export const createThemeAlias = async (
  themeId: string,
  aliasName: string
): Promise<ApiResponse<CategoryRes> | CategoryRes> => {
  try {
    const res = await api.post(`${basePath}/theme/${themeId}/alias`, {
      aliasName,
    });
    return res.data;
  } catch (e) {
    console.error('AdminCategory - createThemeAlias error:', e);
    throw e;
  }
};

/** 刪除主題同義詞（DELETE /admin/category/theme/alias/{aliasId}） */
export const deleteThemeAlias = async (
  aliasId: string
): Promise<ApiResponse<void> | void> => {
  try {
    const res = await api.delete(`${basePath}/theme/alias/${aliasId}`);
    return res.data;
  } catch (e) {
    console.error('AdminCategory - deleteThemeAlias error:', e);
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

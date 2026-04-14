// src/services/frontend/adminStoreService.ts
import { api } from './FrontAPI';

const basePath = '/admin/stores';

interface RequestData {
  [key: string]: any;
}

/**
 * 取得店家選項列表（後台）
 * 後端：GET /admin/stores/options?activeOnly=true|false
 */
export const getStoreOptions = async (params?: {
  activeOnly?: boolean;
}): Promise<ApiResponse<any>> => {
  try {
    const res = await api.get(`${basePath}/options`, {
      params: {
        activeOnly: params?.activeOnly ?? true,
      },
    });
    return res.data;
  } catch (e) {
    console.error('AdminStore - getStoreOptions error:', e);
    throw e;
  }
};

/**
 * 搜尋店家（後台）
 * 後端：GET /admin/stores/search?keyword=xxx&activeOnly=true|false
 */
export const searchStores = async (params: {
  keyword: string;
  activeOnly?: boolean;
}): Promise<ApiResponse<any>> => {
  try {
    const res = await api.get(`${basePath}/search`, {
      params: {
        keyword: params.keyword,
        activeOnly: params.activeOnly ?? true,
      },
    });
    return res.data;
  } catch (e) {
    console.error('AdminStore - searchStores error:', e);
    throw e;
  }
};

/** 取得所有店家選單（ADMIN ONLY，含非活躍）（GET /admin/stores/all-options） */
export const getAllStoreOptions = async (): Promise<ApiResponse<any>> => {
  try {
    const res = await api.get(`${basePath}/all-options`);
    return res.data;
  } catch (e) {
    console.error('AdminStore - getAllStoreOptions error:', e);
    throw e;
  }
};

/** 查詢店家列表（POST /admin/stores/list） */
export const queryStores = async (
  req?: RequestData
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}/list`, req ?? null);
    return res.data;
  } catch (e) {
    console.error('AdminStore - queryStores error:', e);
    throw e;
  }
};

/** 取得店家詳情（GET /admin/stores/{storeId}） */
export const getStoreById = async (
  storeId: string
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.get(`${basePath}/${storeId}`);
    return res.data;
  } catch (e) {
    console.error('AdminStore - getStoreById error:', e);
    throw e;
  }
};

/** 更新店家資訊（PUT /admin/stores/{storeId}） */
export const updateStore = async (
  storeId: string,
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.put(`${basePath}/${storeId}`, req);
    return res.data;
  } catch (e) {
    console.error('AdminStore - updateStore error:', e);
    throw e;
  }
};

/** 新增店家（POST /admin/stores） */
export const createStore = async (
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}`, req);
    return res.data;
  } catch (e) {
    console.error('AdminStore - createStore error:', e);
    throw e;
  }
};

/** 啟用店家（POST /admin/stores/{storeId}/activate）（ADMIN ONLY） */
export const activateStore = async (
  storeId: string
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}/${storeId}/activate`);
    return res.data;
  } catch (e) {
    console.error('AdminStore - activateStore error:', e);
    throw e;
  }
};

/** 停用店家（POST /admin/stores/{storeId}/deactivate）（ADMIN ONLY） */
export const deactivateStore = async (
  storeId: string
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}/${storeId}/deactivate`);
    return res.data;
  } catch (e) {
    console.error('AdminStore - deactivateStore error:', e);
    throw e;
  }
};

/**
 * （可選）給 BannerForm 用的 helper：把 options 統一成 SelectOption[]
 * 你專案若已經有 SelectOption 型別可直接拿掉 any
 */
export const toSelectOptions = (list: any[] = []) => {
  return list.map((x) => ({
    label: x.label ?? x.storeName ?? '',
    value: x.value ?? x.id ?? '',
    description: x.description ?? '',
  }));
};

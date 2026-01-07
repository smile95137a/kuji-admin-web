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

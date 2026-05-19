// services/frontend/adminUploadService.ts
import { api } from './FrontAPI';

const basePath = '/admin/upload';

type UploadImageType =
  | 'news'
  | 'banner'
  | 'lottery'
  | 'prize'
  | 'store'
  | 'store-logo'
  | 'store-cover';

/**
 * 通用：上傳圖片（news/banner/lottery/prize/store）
 *
 * @param type 上傳類型
 * @param file 檔案
 * @returns { imageUrl: string }
 */
export const uploadImage = async (
  type: UploadImageType,
  file: File,
): Promise<ApiResponse<{ imageUrl: string }>> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await api.post(`${basePath}/${type}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return res.data;
  } catch (e) {
    console.error(`AdminUpload - uploadImage(${type}) error:`, e);
    throw e;
  }
};

/** 上傳 News 圖片 */
export const uploadNewsImage = async (
  file: File,
): Promise<ApiResponse<{ imageUrl: string }>> => {
  return uploadImage('news', file);
};

/** 上傳 Banner 圖片 */
export const uploadBannerImage = async (
  file: File,
): Promise<ApiResponse<{ imageUrl: string }>> => {
  return uploadImage('banner', file);
};

/** 上傳 Lottery 商品圖片 */
export const uploadLotteryImage = async (
  file: File,
): Promise<ApiResponse<{ imageUrl: string }>> => {
  return uploadImage('lottery', file);
};

/** 上傳 Prize 獎品圖片 */
export const uploadPrizeImage = async (
  file: File,
): Promise<ApiResponse<{ imageUrl: string }>> => {
  return uploadImage('prize', file);
};

/** 上傳 Store 店家圖片 */
export const uploadStoreImage = async (
  file: File,
): Promise<ApiResponse<{ imageUrl: string }>> => {
  return uploadImage('store', file);
};

export const uploadStoreLogoImage = async (
  file: File,
): Promise<ApiResponse<{ imageUrl: string }>> => {
  return uploadImage('store-logo', file);
};

export const uploadStoreCoverImage = async (
  file: File,
): Promise<ApiResponse<{ imageUrl: string }>> => {
  return uploadImage('store-cover', file);
};

/**
 * 刪除圖片
 *
 * 後端：@DeleteMapping + @RequestParam("imageUrl")
 */
export const deleteImage = async (
  imageUrl: string,
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.delete(`${basePath}`, {
      params: { imageUrl },
    });

    return res.data;
  } catch (e) {
    console.error('AdminUpload - deleteImage error:', e);
    throw e;
  }
};

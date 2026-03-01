import { api } from './FrontAPI';

const basePath = '/admin/marquee';

interface RequestData {
  [key: string]: any;
}

/** 取得所有跑馬燈（GET /admin/marquee） */
export const getAllMarquees = async (): Promise<ApiResponse<any>> => {
  try {
    const res = await api.get(`${basePath}`);
    return res.data;
  } catch (e) {
    console.error('AdminMarquee - getAllMarquees error:', e);
    throw e;
  }
};

/** 取得單一跑馬燈（GET /admin/marquee/{id}） */
export const getMarquee = async (id: string): Promise<ApiResponse<any>> => {
  try {
    const res = await api.get(`${basePath}/${id}`);
    return res.data;
  } catch (e) {
    console.error('AdminMarquee - getMarquee error:', e);
    throw e;
  }
};

/** 新增跑馬燈（POST /admin/marquee） */
export const createMarquee = async (data: RequestData): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}`, data);
    return res.data;
  } catch (e) {
    console.error('AdminMarquee - createMarquee error:', e);
    throw e;
  }
};

/** 更新跑馬燈（PUT /admin/marquee/{id}） */
export const updateMarquee = async (
  id: string,
  data: RequestData,
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.put(`${basePath}/${id}`, data);
    return res.data;
  } catch (e) {
    console.error('AdminMarquee - updateMarquee error:', e);
    throw e;
  }
};

/** 刪除跑馬燈（DELETE /admin/marquee/{id}） */
export const deleteMarquee = async (id: string): Promise<ApiResponse<any>> => {
  try {
    const res = await api.delete(`${basePath}/${id}`);
    return res.data;
  } catch (e) {
    console.error('AdminMarquee - deleteMarquee error:', e);
    throw e;
  }
};

/**
 * 更新跑馬燈狀態（PATCH /admin/marquee/{id}/status?status=xxx）
 * 後端是用 @RequestParam String status，所以用 params 傳
 */
export const updateMarqueeStatus = async (
  id: string,
  status: string,
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.patch(`${basePath}/${id}/status`, null, {
      params: { status },
    });
    return res.data;
  } catch (e) {
    console.error('AdminMarquee - updateMarqueeStatus error:', e);
    throw e;
  }
};

/** 手動廣播所有啟用中的跑馬燈（POST /admin/marquee/broadcast） */
export const broadcastMarquees = async (): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}/broadcast`);
    return res.data;
  } catch (e) {
    console.error('AdminMarquee - broadcastMarquees error:', e);
    throw e;
  }
};

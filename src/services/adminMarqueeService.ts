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

/** 取得單筆（GET /admin/marquee/{id}） */
export const getMarqueeById = async (id: string): Promise<ApiResponse<any>> => {
  try {
    const res = await api.get(`${basePath}/${id}`);
    return res.data;
  } catch (e) {
    console.error('AdminMarquee - getMarqueeById error:', e);
    throw e;
  }
};

/** 新增（POST /admin/marquee） */
export const createMarquee = async (
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}`, req ?? null);
    return res.data;
  } catch (e) {
    console.error('AdminMarquee - createMarquee error:', e);
    throw e;
  }
};

/** 更新（PUT /admin/marquee/{id}） */
export const updateMarquee = async (
  id: string,
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.put(`${basePath}/${id}`, req ?? null);
    return res.data;
  } catch (e) {
    console.error('AdminMarquee - updateMarquee error:', e);
    throw e;
  }
};

/** 刪除（DELETE /admin/marquee/{id}） */
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
 * ✅ 更新狀態（PATCH /admin/marquee/{id}/status?status=1|0）
 * 後端 status 是 requestParam string，所以這邊我用 1/0 最保險
 */
export const updateMarqueeStatus = async (
  id: string,
  active: boolean
): Promise<ApiResponse<any>> => {
  try {
    const status = active ? '1' : '0';
    const res = await api.patch(`${basePath}/${id}/status`, null, {
      params: { status },
    });
    return res.data;
  } catch (e) {
    console.error('AdminMarquee - updateMarqueeStatus error:', e);
    throw e;
  }
};

/** 手動廣播（POST /admin/marquee/broadcast） */
export const broadcastMarquees = async (): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}/broadcast`, null);
    return res.data;
  } catch (e) {
    console.error('AdminMarquee - broadcastMarquees error:', e);
    throw e;
  }
};

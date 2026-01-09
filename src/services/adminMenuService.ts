// services/adminMenuService.ts
import { api } from './FrontAPI';

const basePath = '/admin/menus';

interface RequestData {
  [key: string]: any;
}

/** 建立選單 */
export const createMenu = async (
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    // 後端：POST /admin/menus
    const res = await api.post(`${basePath}`, req);
    return res.data;
  } catch (e) {
    console.error('AdminMenu - createMenu error:', e);
    throw e;
  }
};

/** 更新選單 */
export const updateMenu = async (
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    // 後端：PUT /admin/menus
    const res = await api.put(`${basePath}`, req);
    return res.data;
  } catch (e) {
    console.error('AdminMenu - updateMenu error:', e);
    throw e;
  }
};

/** 刪除選單 */
export const deleteMenu = async (id: string): Promise<ApiResponse<any>> => {
  try {
    // 後端：DELETE /admin/menus/{id}
    const res = await api.delete(`${basePath}/${id}`);
    return res.data;
  } catch (e) {
    console.error('AdminMenu - deleteMenu error:', e);
    throw e;
  }
};

/** 依 ID 查詢選單 */
export const getMenuById = async (id: string): Promise<ApiResponse<any>> => {
  try {
    // 後端：GET /admin/menus/{id}
    const res = await api.get(`${basePath}/${id}`);
    return res.data;
  } catch (e) {
    console.error('AdminMenu - getMenuById error:', e);
    throw e;
  }
};

/** 查詢全部選單（平面） */
export const getAllMenus = async (): Promise<ApiResponse<any>> => {
  try {
    // 後端：GET /admin/menus
    const res = await api.get(`${basePath}`);
    return res.data;
  } catch (e) {
    console.error('AdminMenu - getAllMenus error:', e);
    throw e;
  }
};

/** 查詢選單樹 */
export const getMenuTree = async (): Promise<ApiResponse<any>> => {
  try {
    // 後端：GET /admin/menus/tree
    const res = await api.get(`${basePath}/tree`);
    return res.data;
  } catch (e) {
    console.error('AdminMenu - getMenuTree error:', e);
    throw e;
  }
};

/** 查詢目前使用者可訪問選單樹（給前端動態渲染用） */
export const getAccessibleMenuTree = async (): Promise<ApiResponse<any>> => {
  try {
    // 後端：GET /admin/menus/accessible
    const res = await api.get(`${basePath}/accessible`);
    return res.data;
  } catch (e) {
    console.error('AdminMenu - getAccessibleMenuTree error:', e);
    throw e;
  }
};

/** 依 code 查詢 */
export const getMenuByCode = async (
  code: string
): Promise<ApiResponse<any>> => {
  try {
    // 後端：GET /admin/menus/code/{code}
    const res = await api.get(`${basePath}/code/${code}`);
    return res.data;
  } catch (e) {
    console.error('AdminMenu - getMenuByCode error:', e);
    throw e;
  }
};

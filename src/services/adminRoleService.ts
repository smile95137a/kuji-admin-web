// services/adminRoleService.ts
import { api } from './FrontAPI';

const basePath = '/admin/roles';

interface RequestData {
  [key: string]: any;
}

/** 建立角色 */
export const createRole = async (
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    // 後端：POST /admin/roles
    const res = await api.post(`${basePath}`, req);
    return res.data;
  } catch (e) {
    console.error('AdminRole - createRole error:', e);
    throw e;
  }
};

/** 更新角色 */
export const updateRole = async (
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    // 後端：PUT /admin/roles
    const res = await api.put(`${basePath}`, req);
    return res.data;
  } catch (e) {
    console.error('AdminRole - updateRole error:', e);
    throw e;
  }
};

/** 刪除角色 */
export const deleteRole = async (id: string): Promise<ApiResponse<any>> => {
  try {
    // 後端：DELETE /admin/roles/{id}
    const res = await api.delete(`${basePath}/${id}`);
    return res.data;
  } catch (e) {
    console.error('AdminRole - deleteRole error:', e);
    throw e;
  }
};

/** 依 ID 查詢角色 */
export const getRoleById = async (id: string): Promise<ApiResponse<any>> => {
  try {
    // 後端：GET /admin/roles/{id}
    const res = await api.get(`${basePath}/${id}`);
    return res.data;
  } catch (e) {
    console.error('AdminRole - getRoleById error:', e);
    throw e;
  }
};

/** 查詢角色詳情（含權限） */
export const getRoleDetailById = async (
  id: string
): Promise<ApiResponse<any>> => {
  try {
    // 後端：GET /admin/roles/{id}/detail
    const res = await api.get(`${basePath}/${id}/detail`);
    return res.data;
  } catch (e) {
    console.error('AdminRole - getRoleDetailById error:', e);
    throw e;
  }
};

/** 查詢全部角色 */
export const getAllRoles = async (): Promise<ApiResponse<any>> => {
  try {
    // 後端：GET /admin/roles
    const res = await api.get(`${basePath}`);
    return res.data;
  } catch (e) {
    console.error('AdminRole - getAllRoles error:', e);
    throw e;
  }
};

/** 設定角色選單權限 */
export const setRoleMenuPermissions = async (
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    // 後端：POST /admin/roles/permissions
    const res = await api.post(`${basePath}/permissions`, req);
    return res.data;
  } catch (e) {
    console.error('AdminRole - setRoleMenuPermissions error:', e);
    throw e;
  }
};

/** 依 code 查詢角色 */
export const getRoleByCode = async (
  code: string
): Promise<ApiResponse<any>> => {
  try {
    // 後端：GET /admin/roles/code/{code}
    const res = await api.get(`${basePath}/code/${code}`);
    return res.data;
  } catch (e) {
    console.error('AdminRole - getRoleByCode error:', e);
    throw e;
  }
};

// services/adminSystemConfigService.ts
import { api } from './FrontAPI';

const basePath = '/admin/system-config';

export interface SystemConfigRes {
  id: string;
  configKey: string;
  configValue: string;
  configType: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON';
  configGroup: string;
  description?: string;
  version: number;
  updatedAt?: string;
  isEditable?: boolean;
}

export interface SystemConfigCreateReq {
  configKey: string;
  configValue: string;
  configType: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON';
  configGroup: string;
  description?: string;
}

export interface SystemConfigUpdateReq {
  configValue: string;
  description?: string;
  version: number;
}

/** 查詢系統設定（可依 group 過濾） */
export const getSystemConfigs = async (
  group?: string
): Promise<ApiResponse<SystemConfigRes[]>> => {
  const res = await api.get(`${basePath}`, {
    params: group ? { group } : {},
  });
  return res.data;
};

/** 新增系統設定 */
export const createSystemConfig = async (
  req: SystemConfigCreateReq
): Promise<ApiResponse<SystemConfigRes>> => {
  const res = await api.post(`${basePath}`, req);
  return res.data;
};

/** 更新系統設定 */
export const updateSystemConfig = async (
  id: string,
  req: SystemConfigUpdateReq
): Promise<ApiResponse<SystemConfigRes>> => {
  const res = await api.put(`${basePath}/${id}`, req);
  return res.data;
};

/** 刪除系統設定 */
export const deleteSystemConfig = async (
  id: string
): Promise<ApiResponse<void>> => {
  const res = await api.delete(`${basePath}/${id}`);
  return res.data;
};

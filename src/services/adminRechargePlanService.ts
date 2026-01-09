// services/adminRechargePlanService.ts
import { api } from './FrontAPI';

const basePath = '/admin/recharge-plan';

interface RequestData {
  [key: string]: any;
}

/** 查詢所有儲值方案（後台） */
export const queryRechargePlans = async (): Promise<ApiResponse<any>> => {
  try {
    // 後端：GET /admin/recharge-plan/list
    const res = await api.get(`${basePath}/list`);
    return res.data;
  } catch (e) {
    console.error('AdminRechargePlan - queryRechargePlans error:', e);
    throw e;
  }
};

/** 取得儲值方案詳情 */
export const getRechargePlanById = async (
  id: string
): Promise<ApiResponse<any>> => {
  try {
    // 後端：GET /admin/recharge-plan/{id}
    const res = await api.get(`${basePath}/${id}`);
    return res.data;
  } catch (e) {
    console.error('AdminRechargePlan - getRechargePlanById error:', e);
    throw e;
  }
};

/** 新增儲值方案 */
export const createRechargePlan = async (
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    // 後端：POST /admin/recharge-plan
    const res = await api.post(`${basePath}`, req);
    return res.data;
  } catch (e) {
    console.error('AdminRechargePlan - createRechargePlan error:', e);
    throw e;
  }
};

/** 更新儲值方案 */
export const updateRechargePlan = async (
  id: string,
  req: RequestData
): Promise<ApiResponse<any>> => {
  try {
    // 後端：PUT /admin/recharge-plan/{id}
    const res = await api.put(`${basePath}/${id}`, req);
    return res.data;
  } catch (e) {
    console.error('AdminRechargePlan - updateRechargePlan error:', e);
    throw e;
  }
};

/** 刪除儲值方案（軟刪除） */
export const deleteRechargePlan = async (
  id: string
): Promise<ApiResponse<any>> => {
  try {
    // 後端：DELETE /admin/recharge-plan/{id}
    const res = await api.delete(`${basePath}/${id}`);
    return res.data;
  } catch (e) {
    console.error('AdminRechargePlan - deleteRechargePlan error:', e);
    throw e;
  }
};

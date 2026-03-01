// src/services/adminConsumptionRecordService.ts
import { api } from './FrontAPI';

const basePath = '/admin/consumption-records';

interface RequestData {
  [key: string]: any;
}

/**
 * 查詢消費紀錄（POST /admin/consumption-records/list）
 * condition 可用欄位：userId, type（DRAW_GOLD | DRAW_BONUS | SHIPPING）, orderNo, keyword, createdAtStart, createdAtEnd
 * ADMIN ONLY
 */
export const queryConsumptionRecords = async (
  req?: RequestData
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}/list`, req ?? null);
    return res.data;
  } catch (e) {
    console.error('AdminConsumptionRecord - queryConsumptionRecords error:', e);
    throw e;
  }
};

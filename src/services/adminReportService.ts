// src/services/adminReportService.ts
import { api } from './FrontAPI';

const basePath = '/admin/report';

interface RequestData {
  [key: string]: any;
}

/** 營收報表（POST /admin/report/revenue） */
export const getRevenueReport = async (
  req?: RequestData
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}/revenue`, req ?? null);
    return res.data;
  } catch (e) {
    console.error('AdminReport - getRevenueReport error:', e);
    throw e;
  }
};

/** 推薦碼報表（POST /admin/report/referral） */
export const getReferralReport = async (
  req?: RequestData
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}/referral`, req ?? null);
    return res.data;
  } catch (e) {
    console.error('AdminReport - getReferralReport error:', e);
    throw e;
  }
};

/** 抽獎結果報表（POST /admin/report/lottery-result） */
export const getLotteryResultReport = async (
  req?: RequestData
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}/lottery-result`, req ?? null);
    return res.data;
  } catch (e) {
    console.error('AdminReport - getLotteryResultReport error:', e);
    throw e;
  }
};

/** 儲值報表（POST /admin/report/recharge） */
export const getRechargeReport = async (
  req?: RequestData
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}/recharge`, req ?? null);
    return res.data;
  } catch (e) {
    console.error('AdminReport - getRechargeReport error:', e);
    throw e;
  }
};

/** 紅利報表（POST /admin/report/bonus） */
export const getBonusReport = async (
  req?: RequestData
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}/bonus`, req ?? null);
    return res.data;
  } catch (e) {
    console.error('AdminReport - getBonusReport error:', e);
    throw e;
  }
};

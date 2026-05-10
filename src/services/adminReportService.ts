// src/services/adminReportService.ts
import { api } from './FrontAPI';

const basePath = '/admin/report';

export interface QueryReq<TCondition = Record<string, any>> {
  condition?: TCondition;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

interface RequestData {
  [key: string]: any;
}

const reportHeaders = {
  'X-Skip-Global-403': 'true',
};

export interface MemberGrowthReportRes {
  startDate?: string;
  endDate?: string;
  totalNewMembers?: number;
  activeMembers?: number;
  growthRate?: number;
  retention7Days?: number;
  retention30Days?: number;
  arpuGold?: number;
  arpuBonus?: number;
  dailyNewMembers?: Array<{ date: string; count: number }>;
  consumptionPatterns?: Array<{
    patternName: string;
    userCount: number;
    percentage?: number;
  }>;
  productConcentrations?: Array<{
    lotteryTitle: string;
    category?: string;
    drawCount: number;
    drawPercentage?: number;
  }>;
  coinUsageDistribution?: {
    goldSpend?: number;
    bonusSpend?: number;
  };
  paymentMethodDistributions?: Array<{
    paymentMethod: string;
    transactionCount: number;
    totalAmount?: number;
    percentage?: number;
  }>;
}

export interface LotteryResultReportRes {
  startDate?: string;
  endDate?: string;
  totalDraws?: number;
  totalWinningCount?: number;
  hotLotteries?: Array<{
    lotteryId: string;
    lotteryTitle: string;
    drawCount?: number;
    winningCount: number;
  }>;
  winningDetails?: Array<{
    ticketId: string;
    drawDate?: string;
    drawTime?: string;
    drawCount?: number;
    userId?: string;
    userDisplayName?: string;
    lotteryId?: string;
    lotteryTitle?: string;
    lotteryImageUrl?: string;
    prizeId?: string;
    prizeName?: string;
    prizeLevel?: string;
    prizeImageUrl?: string;
    storeId?: string;
    storeName?: string;
    ticketNumber?: number;
    revealedNumber?: number;
  }>;
}

const postReport = async <TRes = any>(
  path: string,
  req?: QueryReq<RequestData>
): Promise<ApiResponse<TRes>> => {
  try {
    const res = await api.post(`${basePath}/${path}`, req ?? {}, {
      headers: reportHeaders,
    });
    return res.data;
  } catch (e) {
    console.error(`AdminReport - ${path} error:`, e);
    throw e;
  }
};

/** 獎品出貨報表（POST /admin/report/prize-shipment） */
export const getPrizeShipmentReport = (req?: QueryReq<RequestData>) =>
  postReport('prize-shipment', req);

export const getPlatformRevenueReport = (req?: QueryReq<RequestData>) =>
  postReport('platform-revenue', req);

/** 會員成長報表（POST /admin/report/member-growth） */
export const getMemberGrowthReport = (req?: QueryReq<RequestData>) =>
  postReport<MemberGrowthReportRes>('member-growth', req);

/** 抽獎銷售報表（POST /admin/report/lottery-sales） */
export const getLotterySalesReport = (req?: QueryReq<RequestData>) =>
  postReport('lottery-sales', req);

/** 店家績效報表（POST /admin/report/store-performance） */
export const getStorePerformanceReport = (req?: QueryReq<RequestData>) =>
  postReport('store-performance', req);

/**
 * Deprecated reports (kept for compatibility with old views)
 * 2026-04-30 scope: replaced by new four reports.
 */
export const getRevenueReport = (req?: QueryReq<RequestData>) =>
  postReport('revenue', req);
export const getReferralReport = (req?: QueryReq<RequestData>) =>
  postReport('referral', req);
export const getLotteryResultReport = (req?: QueryReq<RequestData>) =>
  postReport<LotteryResultReportRes>('lottery-result', req);
export const getRechargeReport = (req?: QueryReq<RequestData>) =>
  postReport('recharge', req);
export const getBonusReport = (req?: QueryReq<RequestData>) =>
  postReport('bonus', req);

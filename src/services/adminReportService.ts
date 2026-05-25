// src/services/adminReportService.ts
import { api } from './FrontAPI';

const basePath = '/admin/report';

export interface QueryReq<TCondition = Record<string, unknown>> {
  condition?: TCondition;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

type RequestData = Record<string, unknown>;

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

export interface RevenueReportRes {
  startDate?: string;
  endDate?: string;
  totalRevenue?: number;
  totalOrders?: number;
  totalDraws?: number;
  avgOrderAmount?: number;
  growthRate?: number;
  dailyDetails?: Array<{
    date: string;
    revenue?: number;
    orders?: number;
    draws?: number;
  }>;
  storeDetails?: Array<{
    storeId?: string;
    storeName?: string;
    revenue?: number;
    orders?: number;
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

export interface RechargeReportRes {
  startDate?: string;
  endDate?: string;
  totalAmount?: number;
  totalCount?: number;
  avgAmount?: number;
  growthRate?: number;
  dailyDetails?: Array<{
    date: string;
    amount?: number;
    count?: number;
    newUsers?: number;
  }>;
  planStats?: Array<{
    planId?: string;
    planName?: string;
    planPrice?: number;
    bonusPoints?: number;
    purchaseCount?: number;
    totalAmount?: number;
    percentage?: number;
  }>;
}

export interface BonusReportRes {
  startDate?: string;
  endDate?: string;
  totalBonusPoints?: number;
  totalCount?: number;
  benefitUsers?: number;
  growthRate?: number;
  dailyDetails?: Array<{
    date: string;
    points?: number;
    count?: number;
  }>;
  typeStats?: Array<{
    bonusType?: string;
    typeName?: string;
    totalPoints?: number;
    count?: number;
    percentage?: number;
  }>;
}

export interface ReferralReportRes {
  startDate?: string;
  endDate?: string;
  totalReferralCodeCount?: number;
  activeReferralCodeCount?: number;
  successfulReferralStoreCount?: number;
  totalUserReferralCount?: number;
  currentPeriodUserReferralCount?: number;
  currentPeriodActivatedStoreCount?: number;
  previousPeriodActivatedStoreCount?: number;
  growthRate?: number;
  dailyActivations?: Array<{
    date: string;
    activatedStoreCount?: number;
  }>;
  storePerformances?: Array<{
    referrerStoreId?: string;
    referrerStoreName?: string;
    referralCodeCount?: number;
    totalReferralCount?: number;
    currentPeriodReferralCount?: number;
    weeklyReferralCount?: number;
    previousWeeklyReferralCount?: number;
    weeklyReferralGrowthCount?: number;
    weeklyGrowthRate?: number;
    monthlyReferralCount?: number;
    previousMonthlyReferralCount?: number;
    monthlyReferralGrowthCount?: number;
    monthlyGrowthRate?: number;
    activatedStoreCount?: number;
    lastActivatedDate?: string;
    rank?: number;
  }>;
}

export interface PlatformRevenueReportRes {
  startDate?: string;
  endDate?: string;
  totalRecharge?: number;
  totalSpend?: number;
  netRevenue?: number;
  drawCount?: number;
  spendByType?: {
    gold?: number;
    bonus?: number;
  };
  rechargeGrowthRate?: number | null;
  spendGrowthRate?: number | null;
  dailyRevenue?: Array<{
    date: string;
    recharge?: number;
    spend?: number;
    net?: number;
  }>;
  storeBreakdown?: Array<{
    storeId?: string;
    storeName?: string;
    totalSpend?: number;
    drawCount?: number;
  }>;
}

export interface LotterySalesRankingRes {
  totalRecords?: number;
  items?: Array<{
    lotteryId?: string;
    lotteryTitle?: string;
    storeName?: string;
    drawCount?: number;
    revenue?: number;
    rank?: number;
  }>;
}

export interface StorePerformanceReportRes {
  startDate?: string;
  endDate?: string;
  stores?: Array<{
    storeId?: string;
    storeName?: string;
    totalRevenue?: number;
    drawCount?: number;
    activeUsers?: number;
    shipRate?: number | null;
    overdueRate?: number | null;
    avgShipDays?: number | null;
  }>;
  dailyStats?: Array<{
    date: string;
    drawCount?: number;
    revenue?: number;
    newUsers?: number;
  }> | null;
}

export interface PrizeShipmentReportRes {
  startDate?: string;
  endDate?: string;
  pendingCount?: number;
  preparingCount?: number;
  shippedCount?: number;
  completedCount?: number;
  avgShipDays?: number | null;
  overdueCount?: number;
  dailyDetails?: Array<{
    date: string;
    shippedCount?: number;
  }>;
  storeDetails?: Array<{
    storeId?: string;
    storeName?: string;
    pendingCount?: number;
    preparingCount?: number;
    shippedCount?: number;
    completedCount?: number;
    avgShipDays?: number | null;
    overdueCount?: number;
  }> | null;
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
  postReport<PrizeShipmentReportRes>('prize-shipment', req);

export const getPlatformRevenueReport = (req?: QueryReq<RequestData>) =>
  postReport<PlatformRevenueReportRes>('platform-revenue', req);

/** 會員成長報表（POST /admin/report/member-growth） */
export const getMemberGrowthReport = (req?: QueryReq<RequestData>) =>
  postReport<MemberGrowthReportRes>('member-growth', req);

/** 抽獎銷售報表（POST /admin/report/lottery-sales） */
export const getLotterySalesReport = (req?: QueryReq<RequestData>) =>
  postReport<LotterySalesRankingRes>('lottery-sales', req);

/** 店家績效報表（POST /admin/report/store-performance） */
export const getStorePerformanceReport = (req?: QueryReq<RequestData>) =>
  postReport<StorePerformanceReportRes>('store-performance', req);

/**
 * Deprecated reports (kept for compatibility with old views)
 * 2026-04-30 scope: replaced by new four reports.
 */
export const getRevenueReport = (req?: QueryReq<RequestData>) =>
  postReport<RevenueReportRes>('revenue', req);
export const getReferralReport = (req?: QueryReq<RequestData>) =>
  postReport<ReferralReportRes>('referral', req);
export const getLotteryResultReport = (req?: QueryReq<RequestData>) =>
  postReport<LotteryResultReportRes>('lottery-result', req);
export const getRechargeReport = (req?: QueryReq<RequestData>) =>
  postReport<RechargeReportRes>('recharge', req);
export const getBonusReport = (req?: QueryReq<RequestData>) =>
  postReport<BonusReportRes>('bonus', req);

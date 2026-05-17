const REPORT_LABELS: Record<string, string> = {
  startDate: '開始日期',
  endDate: '結束日期',
  date: '日期',
  items: '明細列表',
  stores: '店家績效明細',
  dailyStats: '每日統計',
  dailyRevenue: '每日營收明細',
  dailyNewMembers: '每日新增會員',
  storeBreakdown: '店家消耗明細',
  storeDetails: '店家明細',
  storePerformances: '店家表現明細',
  paymentMethodDistributions: '支付方式分布',
  typeStats: '類型統計',
  consumptionPatterns: '消費樣態分布',
  productConcentrations: '商品集中度',
  storeId: '店家 ID',
  storeName: '店家名稱',
  lotteryId: '商品 ID',
  lotteryTitle: '商品名稱',
  title: '標題',
  category: '分類',
  status: '狀態',
  totalRecords: '總筆數',
  totalCount: '總筆數',
  count: '筆數',
  total: '總計',
  totalRevenue: '總營收',
  revenue: '營收',
  totalSales: '總銷售額',
  totalRecharge: '總儲值',
  totalSpend: '總消耗',
  netRevenue: '儲值減消耗',
  recharge: '儲值',
  spend: '消耗',
  net: '儲值減消耗',
  drawCount: '抽數',
  totalDraws: '總抽數',
  draws: '抽數',
  totalOrders: '總訂單數',
  orders: '訂單數',
  avgOrderAmount: '平均客單價',
  percentage: '占比 (%)',
  growthRate: '成長率 (%)',
  rechargeGrowthRate: '儲值成長率 (%)',
  spendGrowthRate: '消耗成長率 (%)',
  retentionRate: '留存率 (%)',
  conversionRate: '轉換率 (%)',
  activeUsers: '活躍用戶數',
  activeMembers: '活躍會員數',
  totalMembers: '會員總數',
  totalNewMembers: '新增會員數',
  newMembers: '新增會員數',
  retention7Days: '7 日留存率 (%)',
  retention30Days: '30 日留存率 (%)',
  soldTickets: '已售籤數',
  remainTickets: '剩餘籤數',
  totalTickets: '總籤數',
  soldPercentage: '售出占比 (%)',
  pendingCount: '待出貨數',
  preparingCount: '備貨中數',
  shippedCount: '已出貨數',
  completedCount: '已完成數',
  overdueCount: '逾期數',
  totalBonusPoints: '紅利總點數',
  benefitUsers: '受益會員數',
  points: '紅利點數',
  bonusType: '紅利類型',
  typeName: '類型名稱',
  totalPoints: '總點數',
  paymentMethod: '支付方式',
  transactionCount: '交易筆數',
  totalAmount: '總金額',
  shipRate: '出貨率 (%)',
  overdueRate: '逾期率 (%)',
  avgShipDays: '平均出貨天數',
  gold: '金幣消耗',
  bonus: '紅利消耗',
  goldSpend: '金幣消耗',
  bonusSpend: '紅利消耗',
  result: '結果',
  name: '名稱',
  id: 'ID',
  createdAt: '建立時間',
  updatedAt: '更新時間',
};

const HIDDEN_SECTION_KEYS = new Set([
  'dailyDetails',
  'ranking',
  'rankings',
]);

const HIDDEN_FIELD_KEYS = new Set([
  '__rowKey',
  'rank',
  'arpuGold',
  'arpuBonus',
]);

const CURRENCY_KEYS = new Set([
  'amount',
  'avgOrderAmount',
  'net',
  'netRevenue',
  'planPrice',
  'price',
  'recharge',
  'revenue',
  'spend',
  'totalAmount',
  'totalRecharge',
  'totalRevenue',
  'totalSales',
  'totalSpend',
]);

const PERCENT_KEYS = new Set([
  'conversionRate',
  'drawPercentage',
  'growthRate',
  'overdueRate',
  'percentage',
  'rechargeGrowthRate',
  'retention30Days',
  'retention7Days',
  'shipRate',
  'soldPercentage',
  'spendGrowthRate',
]);

export function toReportLabel(key: string): string {
  if (REPORT_LABELS[key]) return REPORT_LABELS[key];

  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function shouldHideReportSection(key: string): boolean {
  return HIDDEN_SECTION_KEYS.has(key);
}

export function shouldHideReportField(key: string): boolean {
  return HIDDEN_FIELD_KEYS.has(key);
}

export function formatReportValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';

  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }

  if (PERCENT_KEYS.has(key)) {
    const num = Number(value);
    return Number.isFinite(num) ? `${num.toFixed(1)}%` : String(value);
  }

  if (CURRENCY_KEYS.has(key)) {
    const num = Number(value);
    return Number.isFinite(num)
      ? `NT$ ${num.toLocaleString('zh-TW')}`
      : String(value);
  }

  if (typeof value === 'number') {
    return value.toLocaleString('zh-TW');
  }

  return String(value);
}

export function buildDisplayRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((row) => {
    const displayRow: Record<string, unknown> = {
      __rowKey: row.__rowKey,
    };

    Object.entries(row).forEach(([key, value]) => {
      if (key === '__rowKey') return;
      if (shouldHideReportField(key)) return;
      displayRow[key] = formatReportValue(key, value);
    });

    return displayRow;
  });
}

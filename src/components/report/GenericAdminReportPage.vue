<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { isAxiosError } from 'axios';

import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import VChart from 'vue-echarts';

import MCard from '@/components/common/MCard.vue';
import ReportFilterBar from '@/components/report/ReportFilterBar.vue';
import ReportTable from '@/components/common/ReportTable.vue';

import { useAuthStore } from '@/stores';
import { useDialogStore } from '@/stores/dialogStore';
import { useReportFilter } from '@/composables/useReportFilter';
import { getStoreOptions, toSelectOptions } from '@/services/adminStoreService';
import type { QueryReq } from '@/services/adminReportService';
import { getErrorMessage } from '@/utils/ErrorUtils';
import { openInfoDialog } from '@/utils/dialog/infoDialog';
import { exportToCsv } from '@/utils/csvExport';

use([CanvasRenderer, BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent]);

type StoreOption = { label: string; value: string };

type TableColumn = {
  field: string;
  label: string;
  width?: number;
};

type TableSection = {
  key: string;
  title: string;
  rows: any[];
  columns: TableColumn[];
};

const props = defineProps<{
  title: string;
  fetchReportApi: (
    req: QueryReq<Record<string, any>>,
  ) => Promise<ApiResponse<any>>;
}>();

// ── 中文欄位名稱對照表 ───────────────────────────────────────────────────────
const FIELD_ZH: Record<string, string> = {
  date: '日期',
  storeName: '店家名稱',
  storeId: '店家 ID',
  totalRevenue: '總營收',
  revenue: '營收 (NT$)',
  totalOrders: '總訂單數',
  orders: '訂單數',
  totalDraws: '總抽獎次數',
  draws: '抽獎次數',
  avgOrderAmount: '平均訂單金額',
  growthRate: '成長率 (%)',
  percentage: '占比 (%)',
  dailyDetails: '每日明細',
  storeDetails: '各店家營收',
  totalNewMembers: '新增會員數',
  totalActiveMembers: '活躍會員數',
  totalMembers: '總會員數',
  newMembers: '新增',
  activeMembers: '活躍',
  retentionRate: '留存率 (%)',
  conversionRate: '轉換率 (%)',
  memberStats: '會員統計',
  totalSales: '總銷售額',
  totalTickets: '總票數',
  soldTickets: '已售票數',
  remainTickets: '剩餘票數',
  soldPercentage: '售出率 (%)',
  lotteryTitle: '商品名稱',
  lotteryStats: '商品統計',
  salesByStore: '各店家銷售',
  totalShipped: '已出貨數',
  shippedCount: '已出貨',
  totalPending: '待出貨數',
  pendingCount: '待出貨',
  preparingCount: '備貨中',
  completedCount: '已完成',
  overdueCount: '逾期件數',
  startDate: '開始日期',
  endDate: '結束日期',
  totalPrizes: '總獎品數',
  prizeStats: '獎品統計',
  prizeName: '獎品名稱',
  prizeLevel: '獎品等級',
  shipmentDetails: '出貨明細',
  count: '數量',
  totalStores: '店家總數',
  activeStores: '上架中',
  topStores: '績效排行',
  storePerformance: '店家績效',
  rank: '排名',
  performanceScore: '績效分數',
  id: 'ID',
  name: '名稱',
  status: '狀態',
  createdAt: '建立時間',
  updatedAt: '更新時間',
  amount: '金額 (NT$)',
  total: '合計',
  index: '項次',
  value: '數值',
  result: '資料列表',
  wonCount: '已抽數',
  remainCount: '剩餘數',
  wonPercentage: '抽出率 (%)',
  totalSlots: '總簽數',
  soldSlots: '已售',
  remainSlots: '剩餘',
  planName: '方案名稱',
  planPrice: '方案金額 (NT$)',
  bonusPoints: '贈送點數',
  purchaseCount: '購買次數',
  totalAmount: '總金額 (NT$)',
  referralCount: '推薦人數',
  referralCode: '推薦碼',
  ownerName: '持有人',
  rewardGiven: '已發獎勵',
  totalReferrals: '總推薦人數',
  activeReferralCodes: '活躍推薦碼',
  totalRewardGiven: '已發放獎勵',
  typeStats: '類型統計',
  ranking: '排行榜',
  planStats: '方案統計',
  totalBonusPoints: '總贈點數',
  totalCount: '總筆數',
  benefitUsers: '受益人數',
  points: '贈點數',
  bonusType: '代碼',
  typeName: '類型',
  totalPoints: '總點數',
};

const authStore = useAuthStore();
const dialogStore = useDialogStore();
const { dateRange } = useReportFilter();

const reportData = ref<Record<string, any> | null>(null);
const tableSections = ref<TableSection[]>([]);
const storeOptions = ref<StoreOption[]>([]);
const selectedStoreId = ref('');
const forbiddenMessage = ref('');
const loading = ref(false);

const roleSet = computed(() => {
  const raw = [
    ...(Array.isArray((authStore.user as any)?.roles)
      ? (authStore.user as any).roles
      : []),
    (authStore.user as any)?.role,
    (authStore.user as any)?.roleCode,
  ]
    .filter(Boolean)
    .map((x) => String(x).toUpperCase());
  return new Set(raw);
});

const isAdmin = computed(
  () => roleSet.value.has('ROLE_ADMIN') || roleSet.value.has('ADMIN'),
);

const summaryEntries = computed(() => {
  if (!reportData.value) return [];
  return Object.entries(reportData.value)
    .filter(([, value]) => {
      const t = typeof value;
      return (
        value !== null &&
        !Array.isArray(value) &&
        t !== 'object' &&
        (t === 'string' || t === 'number' || t === 'boolean')
      );
    })
    .map(([key, value]) => ({
      key,
      label: toLabel(key),
      value,
    }));
});

const resolveUserStoreOptions = (): StoreOption[] => {
  const user = (authStore.user as any) ?? {};
  const ids = Array.isArray(user.storeIds)
    ? user.storeIds
    : user.storeId
      ? [user.storeId]
      : user.store?.id
        ? [user.store.id]
        : [];
  return ids
    .filter(Boolean)
    .map((id: any) => ({ label: `店家 ${id}`, value: String(id) }));
};

const loadStoreOptions = async () => {
  try {
    const res = await getStoreOptions({ activeOnly: false });
    const list = (res as any)?.data ?? [];
    storeOptions.value = toSelectOptions(Array.isArray(list) ? list : []);
  } catch {
    storeOptions.value = [];
  }

  if (!storeOptions.value.length && !isAdmin.value) {
    storeOptions.value = resolveUserStoreOptions();
  }

  if (!isAdmin.value) {
    selectedStoreId.value = storeOptions.value[0]?.value ?? '';
  }
};

function toLabel(key: string): string {
  if (FIELD_ZH[key]) return FIELD_ZH[key];
  // fallback：camelCase → 英文空格分詞
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

// ── 圖表 ────────────────────────────────────────────────────────────────────
const chartOption = computed(() => {
  // 找第一個含 date 欄位的表格 section
  const series = tableSections.value.find((s) =>
    s.rows.length > 0 && 'date' in s.rows[0],
  );
  if (!series) return null;

  const rows = series.rows;
  const numericFields = Object.keys(rows[0]).filter(
    (k) => k !== 'date' && k !== '__rowKey' && typeof rows[0][k] === 'number',
  );
  if (!numericFields.length) return null;

  return {
    tooltip: { trigger: 'axis' },
    legend: numericFields.length > 1 ? { data: numericFields.map(toLabel) } : undefined,
    xAxis: { type: 'category', data: rows.map((r: any) => r.date) },
    yAxis: { type: 'value' },
    series: numericFields.map((f) => ({
      name: toLabel(f),
      type: 'bar',
      data: rows.map((r: any) => r[f] ?? 0),
      barMaxWidth: 40,
    })),
  };
});

// ── 匯出 ────────────────────────────────────────────────────────────────────
function handleExport() {
  const sections = tableSections.value;
  if (!sections.length) return;
  // 每個 section 各匯出一個 CSV
  sections.forEach((s) => {
    exportToCsv(s.rows, s.columns, `${props.title}_${s.title}`);
  });
  // 若只有 summary cards、無表格，把 summary 也匯出
  if (!sections.length && summaryEntries.value.length) {
    exportToCsv(
      summaryEntries.value.map((e) => ({ 欄位: e.label, 數值: e.value })),
      [{ field: '欄位', label: '欄位' }, { field: '數值', label: '數值' }],
      props.title,
    );
  }
}

function normalizeRows(input: any): any[] {
  if (!Array.isArray(input)) return [];
  if (!input.length) return [];
  if (typeof input[0] === 'object' && input[0] !== null) {
    return input.map((row, index) => ({
      __rowKey: String(row?.id ?? row?.uuid ?? row?.key ?? index),
      ...row,
    }));
  }
  return input.map((value, index) => ({
    __rowKey: String(index),
    index: index + 1,
    value,
  }));
}

function buildColumns(rows: any[]): TableColumn[] {
  if (!rows.length) return [];
  return Object.keys(rows[0])
    .filter((field) => field !== '__rowKey')
    .map((field) => ({
      field,
      label: toLabel(field),
      width: 160,
    }));
}

function buildTableSections(data: any): TableSection[] {
  if (!data) return [];

  if (Array.isArray(data)) {
    const rows = normalizeRows(data);
    return [
      {
        key: 'result',
        title: '資料列表',
        rows,
        columns: buildColumns(rows),
      },
    ];
  }

  const entries = Object.entries(data).filter(([, value]) =>
    Array.isArray(value),
  );

  return entries.map(([key, value]) => {
    const rows = normalizeRows(value);
    return {
      key,
      title: toLabel(key),
      rows,
      columns: buildColumns(rows),
    };
  });
}

async function fetchReport(filter: {
  startDate: string;
  endDate: string;
  storeId?: string;
}) {
  forbiddenMessage.value = '';
  loading.value = true;
  try {
    const req: QueryReq<Record<string, any>> = {
      sortBy: 'createdAt',
      sortOrder: 'DESC',
      condition: {
        startDate: filter.startDate,
        endDate: filter.endDate,
        ...(filter.storeId ? { storeId: filter.storeId } : {}),
      },
    };
    const res = await props.fetchReportApi(req);
    const data = (res as any)?.data ?? res;
    reportData.value = data as Record<string, any>;
    tableSections.value = buildTableSections(data);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403) {
      forbiddenMessage.value = '無權查詢其他店家報表，請使用可存取的店家條件。';
      return;
    }
    await openInfoDialog({
      title: '查詢失敗',
      message: getErrorMessage(error),
      iconType: 'warning',
    });
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadStoreOptions();
  await fetchReport({
    startDate: dateRange.value.startDate,
    endDate: dateRange.value.endDate,
    storeId: selectedStoreId.value || undefined,
  });
});
</script>

<template>
  <MCard>
    <div class="rp__header">
      <p class="form__text form__text--title">{{ title }}</p>
      <button
        v-if="reportData && (tableSections.length || summaryEntries.length)"
        class="rp__export-btn"
        @click="handleExport"
      >
        ↓ 匯出 CSV
      </button>
    </div>

    <ReportFilterBar
      :show-store-filter="true"
      :store-options="storeOptions"
      :selected-store-id="selectedStoreId"
      :store-filter-disabled="!isAdmin"
      @update:filter="fetchReport"
    />

    <div v-if="forbiddenMessage" class="rp__forbidden m-t-16">
      {{ forbiddenMessage }}
    </div>

    <div v-if="loading" class="rp__state m-t-16">查詢中...</div>
    <div v-else-if="reportData" class="m-t-16">
      <div v-if="summaryEntries.length" class="rp__cards">
        <div v-for="entry in summaryEntries" :key="entry.key" class="rp__card">
          <p class="rp__card-label">{{ entry.label }}</p>
          <p class="rp__card-value">{{ entry.value }}</p>
        </div>
      </div>

      <!-- 自動圖表 -->
      <div v-if="chartOption" class="rp__chart m-t-20">
        <v-chart :option="chartOption" style="height: 280px" autoresize />
      </div>

      <div v-for="section in tableSections" :key="section.key" class="m-t-20">
        <p class="form__text form__text--red m-b-8">{{ section.title }}</p>
        <ReportTable
          :columns="section.columns"
          :items="section.rows"
          row-key="__rowKey"
          :useWidthClass="true"
        />
      </div>

      <div
        v-if="!summaryEntries.length && !tableSections.length"
        class="rp__state m-t-16"
      >
        無資料
      </div>
    </div>
  </MCard>
</template>

<style scoped lang="scss">
.rp {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  &__export-btn {
    padding: 6px 16px;
    font-size: 13px;
    border-radius: 6px;
    border: 1px solid #6366f1;
    background: #fff;
    color: #6366f1;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;

    &:hover {
      background: #6366f1;
      color: #fff;
    }
  }

  &__chart {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    padding: 8px;
    background: #fafafa;
  }

  &__state {
    color: #6b7280;
    font-size: 14px;
  }

  &__forbidden {
    color: #b45309;
    background: #fffbeb;
    border: 1px solid #fcd34d;
    border-radius: 6px;
    padding: 10px 12px;
    font-size: 13px;
  }

  &__cards {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  &__card {
    min-width: 180px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px;
    background: #f9fafb;
  }

  &__card-label {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 4px;
  }

  &__card-value {
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
  }
}
</style>

<!-- src/views/admin/report/LotterySalesReport.vue -->
<template>
  <div class="lottery-sales-page">
    <!-- Header + Summary -->
    <MCard>
      <div class="ls-page-head">
        <div class="ls-page-head__main">
          <p class="ls-page-head__eyebrow">報表管理</p>
          <h2 class="ls-page-head__title">抽獎銷售報表</h2>
          <p class="ls-page-head__sub">
            查看指定期間內的抽獎銷售額、售出票數、剩餘票數與商品銷售統計資料。
          </p>
        </div>

        <div class="ls-page-head__actions">
          <span class="ls-current-type">
            {{ isAdmin ? '管理員查詢' : '店家查詢' }}
          </span>

          <span v-if="hasReportData" class="ls-total-count">
            共 {{ totalRowCount }} 筆資料
          </span>
        </div>
      </div>

      <div class="ls-summary-row">
        <div class="ls-summary-card">
          <span class="ls-summary-card__label">查詢店家</span>
          <strong class="ls-summary-card__value">
            {{ selectedStoreText }}
          </strong>
        </div>

        <div class="ls-summary-card">
          <span class="ls-summary-card__label">查詢期間</span>
          <strong class="ls-summary-card__value">
            {{ queryDateText }}
          </strong>
        </div>

        <div class="ls-summary-card">
          <span class="ls-summary-card__label">資料區塊</span>
          <strong class="ls-summary-card__value">
            {{ tableSections.length }} 個
          </strong>
        </div>
      </div>
    </MCard>

    <!-- 查詢條件 -->
    <div class="m-t-12">
      <MCard>
        <div class="ls-card-head">
          <div>
            <p class="ls-card-head__title">查詢條件</p>
            <p class="ls-card-head__sub">
              可依店家與日期區間查詢抽獎銷售統計資料。
            </p>
          </div>
        </div>

        <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
          <div class="ls-filter-grid">
            <FormSelect
              v-if="isAdmin"
              label="店家"
              name="storeId"
              v-model="storeId"
              :options="storeOptions"
              :showAll="true"
              allLabel="全部"
              :allValue="''"
            />

            <FormInput
              v-else
              label="店家"
              :modelValue="currentStoreLabel"
              disabled
            />

            <FormInput
              label="開始日期"
              type="date"
              name="startDate"
              v-model="startDate"
            />

            <FormInput
              label="結束日期"
              type="date"
              name="endDate"
              v-model="endDate"
            />
          </div>

          <div class="ls-filter-actions">
            <MButton type="submit">
              <font-awesome-icon icon="fa-magnifying-glass" class="m-r-4" />
              查詢
            </MButton>

            <MButton type="button" class="mbtn--gray" @click="resetFilters">
              <font-awesome-icon icon="fa-rotate-left" class="m-r-4" />
              清除
            </MButton>
          </div>
        </Form>
      </MCard>
    </div>

    <!-- 查詢結果 -->
    <div class="m-t-12">
      <MCard>
        <div class="ls-card-head ls-card-head--result">
          <div>
            <p class="ls-card-head__title">查詢結果</p>
            <p class="ls-card-head__sub">
              依目前查詢條件顯示抽獎銷售統計、趨勢圖與明細資料。
            </p>
          </div>

          <div class="ls-result-actions">
            <span v-if="hasReportData" class="ls-card-head__count">
              共 {{ totalRowCount }} 筆資料
            </span>

            <MButton
              v-if="hasReportData"
              type="button"
              variant="secondary"
              @click="handleExport"
            >
              <font-awesome-icon icon="fa-download" class="m-r-4" />
              匯出 CSV
            </MButton>
          </div>
        </div>

        <div v-if="forbiddenMessage" class="ls-forbidden m-t-16">
          {{ forbiddenMessage }}
        </div>

        <div v-if="loading" class="ls-state m-t-16">查詢中...</div>

        <template v-else>
          <NoData v-if="!reportData" message="請輸入查詢條件後查詢" />

          <div v-else class="m-t-16">
            <!-- 統計卡片 -->
            <div v-if="summaryEntries.length" class="ls-stat-row">
              <div
                v-for="entry in summaryEntries"
                :key="entry.key"
                class="ls-stat-card"
              >
                <span class="ls-stat-card__label">{{ entry.label }}</span>
                <strong class="ls-stat-card__value">
                  {{ formatSummaryValue(entry.value) }}
                </strong>
              </div>
            </div>

            <!-- 趨勢圖 -->
            <div v-if="chartOption" class="ls-chart m-t-20">
              <div class="ls-chart__head">
                <div>
                  <p class="ls-chart__title">銷售趨勢圖</p>
                  <p class="ls-chart__sub">
                    依日期呈現銷售額、訂單數、抽獎次數等欄位變化。
                  </p>
                </div>
              </div>

              <VChart :option="chartOption" class="ls-chart__main" autoresize />
            </div>

            <!-- 表格 -->
            <div
              v-for="section in pagedTableSections"
              :key="section.key"
              class="m-t-20"
            >
              <div class="ls-section-head">
                <p class="ls-section-head__title">
                  {{ section.title }}
                </p>

                <span class="ls-section-head__count">
                  共 {{ section.totalItems }} 筆
                </span>
              </div>

              <ReportTable
                class="ls-report-table"
                :columns="section.columns"
                :items="section.currentPageItems"
                row-key="__rowKey"
                :use-width-class="true"
              />

              <div
                v-if="section.totalItems > 0"
                class="flex justify-center m-t-12"
              >
                <Pagination
                  :totalPages="section.pagination.totalPages.value"
                  :renderPaginationNums="
                    section.pagination.renderPaginationNums.value
                  "
                  :currentPage="section.pagination.currentPage.value"
                  :nextPage="section.pagination.nextPage"
                  :previousPage="section.pagination.previousPage"
                  :goToPage="section.pagination.goToPage"
                  :pageLimitSize="section.pageLimitSize.value"
                  :totalItems="section.totalItems"
                  @update:pageLimitSize="section.handlePageLimitSizeChange"
                />
              </div>
            </div>

            <NoData
              v-if="!summaryEntries.length && !tableSections.length"
              message="無資料"
            />
          </div>
        </template>
      </MCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { Form, type FormContext } from 'vee-validate';
import { isAxiosError } from 'axios';

import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import VChart from 'vue-echarts';

import { usePagination } from '@/hook/usePagination';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import NoData from '@/components/common/NoData.vue';
import Pagination from '@/components/common/Pagination.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import ReportTable from '@/components/common/ReportTable.vue';

import { useAuthStore } from '@/stores';
import { useReportFilter } from '@/composables/useReportFilter';
import { executeApi } from '@/utils/executeApiUtils';
import { exportToCsv } from '@/utils/csvExport';

import {
  getLotterySalesReport,
  type LotterySalesRankingRes,
  type QueryReq,
} from '@/services/adminReportService';
import { getStoreOptions, toSelectOptions } from '@/services/adminStoreService';

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
]);

type StoreOption = {
  label: string;
  value: string;
};

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

const REPORT_TITLE = '抽獎銷售報表';

const FIELD_ZH: Record<string, string> = {
  date: '日期',
  storeName: '店家名稱',
  storeId: '店家 ID',

  totalRevenue: '總營收',
  revenue: '營收 (NT$)',
  totalSales: '總銷售額',
  totalOrders: '總訂單數',
  orders: '訂單數',
  totalDraws: '總抽獎次數',
  draws: '抽獎次數',
  avgOrderAmount: '平均訂單金額',

  totalTickets: '總票數',
  soldTickets: '已售票數',
  remainTickets: '剩餘票數',
  soldPercentage: '售出率 (%)',

  lotteryTitle: '商品名稱',
  lotteryStats: '商品統計',
  salesByStore: '各店家銷售',
  dailyDetails: '每日明細',
  storeDetails: '各店家營收',

  growthRate: '成長率 (%)',
  percentage: '占比 (%)',

  startDate: '開始日期',
  endDate: '結束日期',
  totalCount: '總筆數',
  count: '數量',
  amount: '金額 (NT$)',
  total: '合計',

  wonCount: '已抽數',
  remainCount: '剩餘數',
  wonPercentage: '抽出率 (%)',
  totalSlots: '總簽數',
  soldSlots: '已售',
  remainSlots: '剩餘',

  id: 'ID',
  name: '名稱',
  status: '狀態',
  createdAt: '建立時間',
  updatedAt: '更新時間',
  result: '資料列表',
  index: '項次',
  value: '數值',
};

const authStore = useAuthStore();
const { dateRange } = useReportFilter();

const formRef = ref<FormContext | null>(null);

const initValues = ref({
  storeId: '',
  startDate: dateRange.value.startDate,
  endDate: dateRange.value.endDate,
});

const storeId = ref('');
const startDate = ref(dateRange.value.startDate);
const endDate = ref(dateRange.value.endDate);

const reportData = ref<LotterySalesRankingRes | null>(null);
const tableSections = ref<TableSection[]>([]);
const storeOptions = ref<StoreOption[]>([]);
const forbiddenMessage = ref('');
const loading = ref(false);

const lastQuery = ref({
  storeId: '',
  startDate: dateRange.value.startDate,
  endDate: dateRange.value.endDate,
});

/* ==============================
 * 權限
 * ============================== */
const roleSet = computed(() => {
  const raw = [
    ...(Array.isArray((authStore.user as any)?.roles)
      ? (authStore.user as any).roles
      : []),
    (authStore.user as any)?.role,
    (authStore.user as any)?.roleCode,
  ]
    .filter(Boolean)
    .map((item) => String(item).toUpperCase());

  return new Set(raw);
});

const isAdmin = computed(() => {
  return roleSet.value.has('ROLE_ADMIN') || roleSet.value.has('ADMIN');
});

/* ==============================
 * 顯示文字
 * ============================== */
const currentStoreLabel = computed(() => {
  if (!storeId.value) return '-';

  return (
    storeOptions.value.find((item) => item.value === storeId.value)?.label ??
    `店家 ${storeId.value}`
  );
});

const selectedStoreText = computed(() => {
  if (!lastQuery.value.storeId) {
    return isAdmin.value ? '全部店家' : currentStoreLabel.value;
  }

  return (
    storeOptions.value.find((item) => item.value === lastQuery.value.storeId)
      ?.label ?? `店家 ${lastQuery.value.storeId}`
  );
});

const queryDateText = computed(() => {
  const start = lastQuery.value.startDate || '-';
  const end = lastQuery.value.endDate || '-';

  return `${start} ~ ${end}`;
});

const totalRowCount = computed(() => {
  return tableSections.value.reduce((sum, section) => {
    return sum + section.rows.length;
  }, 0);
});

const hasReportData = computed(() => {
  return Boolean(
    reportData.value &&
    (summaryEntries.value.length || tableSections.value.length),
  );
});

const summaryEntries = computed(() => {
  if (!reportData.value) return [];

  return Object.entries(reportData.value)
    .filter(([, value]) => {
      const type = typeof value;

      return (
        value !== null &&
        !Array.isArray(value) &&
        type !== 'object' &&
        (type === 'string' || type === 'number' || type === 'boolean')
      );
    })
    .map(([key, value]) => ({
      key,
      label: toLabel(key),
      value,
    }));
});

/* ==============================
 * 分頁
 * ============================== */
const sectionPageLimitMap = ref<Record<string, number>>({});

function getSectionPageLimitRef(key: string) {
  return computed<number>({
    get() {
      return sectionPageLimitMap.value[key] ?? 10;
    },
    set(value: number) {
      sectionPageLimitMap.value = {
        ...sectionPageLimitMap.value,
        [key]: value,
      };
    },
  });
}

const pagedTableSections = computed(() => {
  return tableSections.value.map((section) => {
    const pageLimitSize = getSectionPageLimitRef(section.key);
    const rowsRef = computed(() => section.rows);
    const pagination = usePagination(rowsRef, pageLimitSize);

    const handlePageLimitSizeChange = (value: number) => {
      pageLimitSize.value = value;
      pagination.goToPage(1);
    };

    return {
      ...section,
      totalItems: section.rows.length,
      currentPageItems: pagination.currentPageItems.value,
      pageLimitSize,
      pagination,
      handlePageLimitSizeChange,
    };
  });
});

/* ==============================
 * 圖表
 * ============================== */
const chartOption = computed(() => {
  const section = tableSections.value.find((item) => {
    return item.rows.length > 0 && 'date' in item.rows[0];
  });

  if (!section) return null;

  const rows = section.rows;

  const numericFields = Object.keys(rows[0]).filter((key) => {
    return (
      key !== 'date' && key !== '__rowKey' && typeof rows[0][key] === 'number'
    );
  });

  if (!numericFields.length) return null;

  return {
    tooltip: {
      trigger: 'axis',
    },
    legend:
      numericFields.length > 1
        ? {
            data: numericFields.map(toLabel),
          }
        : undefined,
    grid: {
      top: 48,
      left: 42,
      right: 20,
      bottom: 36,
    },
    xAxis: {
      type: 'category',
      data: rows.map((row: any) => row.date),
    },
    yAxis: {
      type: 'value',
    },
    series: numericFields.map((field) => ({
      name: toLabel(field),
      type: 'bar',
      data: rows.map((row: any) => row[field] ?? 0),
      barMaxWidth: 40,
    })),
  };
});

/* ==============================
 * 工具
 * ============================== */
function toLabel(key: string): string {
  if (FIELD_ZH[key]) return FIELD_ZH[key];

  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function formatSummaryValue(value: any) {
  if (value === null || value === undefined || value === '') return '-';

  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }

  return value;
}

function resolveUserStoreOptions(): StoreOption[] {
  const user = (authStore.user as any) ?? {};

  const ids = Array.isArray(user.storeIds)
    ? user.storeIds
    : user.storeId
      ? [user.storeId]
      : user.store?.id
        ? [user.store.id]
        : [];

  return ids.filter(Boolean).map((id: any) => ({
    label: `店家 ${id}`,
    value: String(id),
  }));
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

  const entries = Object.entries(data).filter(([, value]) => {
    return Array.isArray(value);
  });

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

/* ==============================
 * 下拉選單
 * ============================== */
async function loadStoreOptions() {
  await executeApi<any[]>({
    fn: () => getStoreOptions({ activeOnly: false }),
    onSuccess: (data: any) => {
      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];

      storeOptions.value = toSelectOptions(list);
    },
    onFail: () => {
      storeOptions.value = [];
    },
    showSuccessDialog: false,
    showFailDialog: false,
    showCatchDialog: false,
  });

  if (!storeOptions.value.length && !isAdmin.value) {
    storeOptions.value = resolveUserStoreOptions();
  }

  if (!isAdmin.value) {
    storeId.value = storeOptions.value[0]?.value ?? '';
    initValues.value.storeId = storeId.value;
  }
}

/* ==============================
 * 查詢
 * ============================== */
async function onSubmit(values: any) {
  forbiddenMessage.value = '';

  const condition = {
    startDate: values.startDate || undefined,
    endDate: values.endDate || undefined,
    ...(values.storeId ? { storeId: values.storeId } : {}),
  };

  lastQuery.value = {
    storeId: values.storeId ?? '',
    startDate: values.startDate ?? '',
    endDate: values.endDate ?? '',
  };

  const req: QueryReq<Record<string, any>> = {
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    condition,
  };

  loading.value = true;

  try {
    await executeApi<any>({
      fn: () => getLotterySalesReport(req),
      onSuccess: (data: any, full: any) => {
        const result = data ?? full?.data ?? null;

        reportData.value = result;
        tableSections.value = buildTableSections(result);

        sectionPageLimitMap.value = {};
      },
      onFail: () => {
        reportData.value = null;
        tableSections.value = [];
        sectionPageLimitMap.value = {};
      },
      showSuccessDialog: false,
      showFailDialog: true,
      showCatchDialog: false,
      onFinally: () => {
        loading.value = false;
      },
    });
  } catch (error) {
    loading.value = false;

    if (isAxiosError(error) && error.response?.status === 403) {
      forbiddenMessage.value = '無權查詢其他店家報表，請使用可存取的店家條件。';
      return;
    }

    reportData.value = null;
    tableSections.value = [];
    sectionPageLimitMap.value = {};
  }
}

function resetFilters() {
  const values = {
    storeId: isAdmin.value ? '' : storeId.value,
    startDate: dateRange.value.startDate,
    endDate: dateRange.value.endDate,
  };

  storeId.value = values.storeId;
  startDate.value = values.startDate;
  endDate.value = values.endDate;

  formRef.value?.setValues(values);
}

function handleExport() {
  if (tableSections.value.length) {
    tableSections.value.forEach((section) => {
      exportToCsv(
        section.rows,
        section.columns,
        `${REPORT_TITLE}_${section.title}`,
      );
    });

    return;
  }

  if (summaryEntries.value.length) {
    exportToCsv(
      summaryEntries.value.map((entry) => ({
        欄位: entry.label,
        數值: entry.value,
      })),
      [
        {
          field: '欄位',
          label: '欄位',
        },
        {
          field: '數值',
          label: '數值',
        },
      ],
      REPORT_TITLE,
    );
  }
}

/* ==============================
 * Lifecycle
 * ============================== */
onMounted(async () => {
  await loadStoreOptions();

  await nextTick();

  const values = {
    ...initValues.value,
    storeId: storeId.value,
  };

  formRef.value?.setValues(values);

  await onSubmit(values);
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as tokens;

.lottery-sales-page {
  width: 100%;
  max-width: 100%;
}

/* ==============================
 * Page Head
 * ============================== */
.ls-page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
  margin-bottom: 14px;

  &__main {
    min-width: 0;
  }

  &__eyebrow {
    margin: 0 0 4px;
    color: tokens.$brand;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.04em;
  }

  &__title {
    margin: 0;
    color: tokens.$form-text;
    font-size: 22px;
    font-weight: 800;
    line-height: 1.35;
  }

  &__sub {
    margin: 4px 0 0;
    color: tokens.$form-muted;
    font-size: 13px;
    line-height: 1.5;
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;
  }
}

.ls-current-type,
.ls-total-count {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.ls-current-type {
  background: color.mix(tokens.$brand-light, #fff, 18%);
  color: tokens.$brand-dark;
}

.ls-total-count {
  background: color.mix(tokens.$form-border, #fff, 42%);
  color: tokens.$form-muted;
}

/* ==============================
 * Summary
 * ============================== */
.ls-summary-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.ls-summary-card {
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
  border-radius: 14px;
  background: color.mix(tokens.$brand-light, #fff, 8%);

  &__label {
    display: block;
    margin-bottom: 4px;
    color: tokens.$form-muted;
    font-size: 12px;
    line-height: 1.4;
  }

  &__value {
    display: block;
    color: tokens.$form-text;
    font-size: 15px;
    font-weight: 800;
    line-height: 1.5;
    word-break: break-word;
  }
}

/* ==============================
 * Card Head
 * ============================== */
.ls-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;

  &--result {
    margin-bottom: 12px;
  }

  &__title {
    margin: 0;
    padding-left: 10px;
    border-left: 4px solid tokens.$brand;
    color: tokens.$form-text;
    font-size: 15px;
    font-weight: 800;
    line-height: 1.4;
  }

  &__sub {
    margin: 4px 0 0;
    color: tokens.$form-muted;
    font-size: 13px;
    line-height: 1.5;
  }

  &__count {
    flex: 0 0 auto;
    padding: 4px 10px;
    border-radius: 999px;
    background: color.mix(tokens.$brand-light, #fff, 18%);
    color: tokens.$brand;
    font-size: 12px;
    font-weight: 800;
    white-space: nowrap;
  }
}

.ls-result-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

/* ==============================
 * Filter
 * ============================== */
.ls-filter-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
  padding: 14px;
  border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
  border-radius: 16px;
  background: color.mix(tokens.$brand-light, #fff, 7%);
}

.ls-filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

/* ==============================
 * State
 * ============================== */
.ls-state {
  color: tokens.$form-muted;
  font-size: 14px;
}

.ls-forbidden {
  color: #b45309;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 700;
}

/* ==============================
 * Stat Cards
 * ============================== */
.ls-stat-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.ls-stat-card {
  min-width: 0;
  padding: 14px;
  border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
  border-radius: 14px;
  background: tokens.$form-bg;

  &__label {
    display: block;
    margin-bottom: 4px;
    color: tokens.$form-muted;
    font-size: 12px;
    line-height: 1.4;
  }

  &__value {
    display: block;
    color: tokens.$form-text;
    font-size: 20px;
    font-weight: 800;
    line-height: 1.4;
    word-break: break-word;
  }
}

/* ==============================
 * Chart
 * ============================== */
.ls-chart {
  padding: 14px;
  border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
  border-radius: 16px;
  background: color.mix(tokens.$brand-light, #fff, 7%);

  &__head {
    margin-bottom: 8px;
  }

  &__title {
    margin: 0;
    color: tokens.$form-text;
    font-size: 15px;
    font-weight: 800;
  }

  &__sub {
    margin: 4px 0 0;
    color: tokens.$form-muted;
    font-size: 13px;
  }

  &__main {
    width: 100%;
    height: 280px;
  }
}

/* ==============================
 * Section / Table
 * ============================== */
.ls-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;

  &__title {
    margin: 0;
    padding-left: 10px;
    border-left: 4px solid tokens.$brand;
    color: tokens.$form-text;
    font-size: 15px;
    font-weight: 800;
  }

  &__count {
    flex: 0 0 auto;
    padding: 4px 10px;
    border-radius: 999px;
    background: color.mix(tokens.$brand-light, #fff, 18%);
    color: tokens.$brand;
    font-size: 12px;
    font-weight: 800;
  }
}

.ls-report-table {
  margin-top: 0;
}

/* ==============================
 * RWD
 * ============================== */
@media (max-width: 1180px) {
  .ls-stat-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .ls-page-head {
    flex-direction: column;

    &__actions {
      justify-content: flex-start;
    }
  }

  .ls-summary-row,
  .ls-filter-grid {
    grid-template-columns: 1fr;
  }

  .ls-card-head {
    flex-direction: column;
  }

  .ls-result-actions,
  .ls-filter-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .ls-stat-row {
    grid-template-columns: 1fr;
  }
}
</style>

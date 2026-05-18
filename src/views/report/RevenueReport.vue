<!-- src/views/report/RevenueReport.vue -->
<template>
  <div class="revenue-report-page">
    <!-- Header + Summary -->
    <MCard>
      <div class="rv-page-head">
        <div class="rv-page-head__main">
          <p class="rv-page-head__eyebrow">報表管理</p>
          <h2 class="rv-page-head__title">營收報表</h2>
          <p class="rv-page-head__sub">
            查看指定期間內的總營收、訂單數、抽獎次數、平均訂單金額與各店家營收。
          </p>
        </div>

        <div class="rv-page-head__actions">
          <span class="rv-current-type">
            {{ isAdmin ? '管理員查詢' : '店家查詢' }}
          </span>

          <span v-if="hasReportData" class="rv-total-count">
            共 {{ totalRowCount }} 筆資料
          </span>
        </div>
      </div>

      <div class="rv-summary-row">
        <div class="rv-summary-card">
          <span class="rv-summary-card__label">查詢店家</span>
          <strong class="rv-summary-card__value">
            {{ selectedStoreText }}
          </strong>
        </div>

        <div class="rv-summary-card">
          <span class="rv-summary-card__label">查詢期間</span>
          <strong class="rv-summary-card__value">
            {{ queryDateText }}
          </strong>
        </div>

        <div class="rv-summary-card">
          <span class="rv-summary-card__label">資料筆數</span>
          <strong class="rv-summary-card__value">
            {{ totalRowCount }} 筆
          </strong>
        </div>
      </div>
    </MCard>

    <!-- 查詢條件 -->
    <div class="m-t-12">
      <MCard>
        <div class="rv-card-head">
          <div>
            <p class="rv-card-head__title">查詢條件</p>
            <p class="rv-card-head__sub">
              可依店家與日期區間查詢營收統計資料。
            </p>
          </div>
        </div>

        <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
          <div class="rv-filter-grid">
            <div class="rv-filter-grid__store">
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
            </div>

            <div class="rv-filter-grid__date">
              <FormDateRangeField
                label="查詢日期"
                type="date"
                v-model:start="startDate"
                v-model:end="endDate"
                separator="~"
                :auto-apply-default="true"
                :default-start="dateRange.startDate"
                :default-end="dateRange.endDate"
              />
            </div>
          </div>

          <div class="rv-filter-actions">
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
        <div class="rv-card-head rv-card-head--result">
          <div>
            <p class="rv-card-head__title">查詢結果</p>
            <p class="rv-card-head__sub">
              依目前查詢條件顯示營收統計、趨勢圖與明細資料。
            </p>
          </div>

          <div class="rv-result-actions">
            <span v-if="hasReportData" class="rv-card-head__count">
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

        <div v-if="forbiddenMessage" class="rv-forbidden m-t-16">
          {{ forbiddenMessage }}
        </div>

        <div v-if="loading" class="rv-state m-t-16">查詢中...</div>

        <template v-else>
          <NoData v-if="!reportData" message="請輸入查詢條件後查詢" />

          <div v-else class="m-t-16">
            <!-- 統計卡片 -->
            <div class="rv-stat-row">
              <div class="rv-stat-card">
                <span class="rv-stat-card__label">總營收</span>
                <strong class="rv-stat-card__value">
                  NT$ {{ formatNumber(reportData.totalRevenue) }}
                </strong>
              </div>

              <div class="rv-stat-card">
                <span class="rv-stat-card__label">總訂單數</span>
                <strong class="rv-stat-card__value">
                  {{ formatNumber(reportData.totalOrders) }}
                </strong>
              </div>

              <div class="rv-stat-card">
                <span class="rv-stat-card__label">總抽獎次數</span>
                <strong class="rv-stat-card__value">
                  {{ formatNumber(reportData.totalDraws) }}
                </strong>
              </div>

              <div class="rv-stat-card">
                <span class="rv-stat-card__label">平均訂單金額</span>
                <strong class="rv-stat-card__value">
                  NT$ {{ formatNumber(reportData.avgOrderAmount) }}
                </strong>
              </div>

              <div class="rv-stat-card">
                <span class="rv-stat-card__label">成長率</span>
                <strong class="rv-stat-card__value">
                  {{ formatPercent(reportData.growthRate) }}
                </strong>
              </div>
            </div>

            <!-- 營收趨勢圖 -->
            <div v-if="dailyDetails.length" class="rv-chart m-t-20">
              <div class="rv-chart__head">
                <div>
                  <p class="rv-chart__title">每日營收趨勢圖</p>
                  <p class="rv-chart__sub">依日期呈現每日營收變化。</p>
                </div>
              </div>

              <VChart :option="chartOption" class="rv-chart__main" autoresize />
            </div>

            <!-- 每日明細 -->
            <div class="m-t-20">
              <div class="rv-section-head">
                <p class="rv-section-head__title">每日明細</p>

                <span class="rv-section-head__count">
                  共 {{ dailyDetails.length }} 筆
                </span>
              </div>

              <NoData v-if="!dailyDetails.length" message="查無資料" />

              <template v-else>
                <ReportTable
                  class="rv-report-table"
                  :columns="dailyColumns"
                  :items="getCurrentPageItems('dailyDetails', dailyDetails)"
                  row-key="date"
                  :use-width-class="true"
                />

                <div class="flex justify-center m-t-12">
                  <Pagination
                    :totalPages="getTotalPages('dailyDetails', dailyDetails)"
                    :renderPaginationNums="
                      getRenderPaginationNums('dailyDetails', dailyDetails)
                    "
                    :currentPage="getCurrentPage('dailyDetails')"
                    :nextPage="() => nextPage('dailyDetails', dailyDetails)"
                    :previousPage="
                      () => previousPage('dailyDetails', dailyDetails)
                    "
                    :goToPage="
                      (page: number) =>
                        goToPage('dailyDetails', dailyDetails, page)
                    "
                    :pageLimitSize="getPageLimitSize('dailyDetails')"
                    :totalItems="dailyDetails.length"
                    @update:pageLimitSize="
                      (value: number) =>
                        handlePageLimitSizeChange('dailyDetails', value)
                    "
                  />
                </div>
              </template>
            </div>

            <!-- 各店家營收 -->
            <div v-if="isAdmin" class="m-t-20">
              <div class="rv-section-head">
                <p class="rv-section-head__title">各店家營收</p>

                <span class="rv-section-head__count">
                  共 {{ storeDetails.length }} 筆
                </span>
              </div>

              <NoData v-if="!storeDetails.length" message="查無資料" />

              <template v-else>
                <ReportTable
                  class="rv-report-table"
                  :columns="storeColumns"
                  :items="getCurrentPageItems('storeDetails', storeDetails)"
                  row-key="storeName"
                  :use-width-class="true"
                />

                <div class="flex justify-center m-t-12">
                  <Pagination
                    :totalPages="getTotalPages('storeDetails', storeDetails)"
                    :renderPaginationNums="
                      getRenderPaginationNums('storeDetails', storeDetails)
                    "
                    :currentPage="getCurrentPage('storeDetails')"
                    :nextPage="() => nextPage('storeDetails', storeDetails)"
                    :previousPage="
                      () => previousPage('storeDetails', storeDetails)
                    "
                    :goToPage="
                      (page: number) =>
                        goToPage('storeDetails', storeDetails, page)
                    "
                    :pageLimitSize="getPageLimitSize('storeDetails')"
                    :totalItems="storeDetails.length"
                    @update:pageLimitSize="
                      (value: number) =>
                        handlePageLimitSizeChange('storeDetails', value)
                    "
                  />
                </div>
              </template>
            </div>

            <NoData
              v-if="!dailyDetails.length && (!isAdmin || !storeDetails.length)"
              message="無資料"
            />
          </div>
        </template>
      </MCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { Form, type FormContext } from 'vee-validate';
import { isAxiosError } from 'axios';

import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import NoData from '@/components/common/NoData.vue';
import Pagination from '@/components/common/Pagination.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import ReportTable from '@/components/common/ReportTable.vue';
import FormDateRangeField from '@/components/common/FormDateRangeField.vue';

import { useAuthStore } from '@/stores';
import {
  getRevenueReport,
  type RevenueReportRes,
} from '@/services/adminReportService';
import { getStoreOptions, toSelectOptions } from '@/services/adminStoreService';
import { useReportFilter } from '@/composables/useReportFilter';
import { executeApi } from '@/utils/executeApiUtils';
import { exportToCsv } from '@/utils/csvExport';

use([
  CanvasRenderer,
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

const REPORT_TITLE = '營收報表';

const dailyColumns: TableColumn[] = [
  { field: 'date', label: '日期', width: 120 },
  { field: 'revenue', label: '營收 (NT$)', width: 130 },
  { field: 'orders', label: '訂單數', width: 100 },
  { field: 'draws', label: '抽獎次數', width: 110 },
];

const storeColumns: TableColumn[] = [
  { field: 'storeName', label: '店家', width: 180 },
  { field: 'revenue', label: '營收 (NT$)', width: 130 },
  { field: 'orders', label: '訂單數', width: 100 },
  { field: 'percentage', label: '占比 (%)', width: 100 },
];

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

const reportData = ref<RevenueReportRes | null>(null);
const storeOptions = ref<StoreOption[]>([]);
const forbiddenMessage = ref('');
const loading = ref(false);

const lastQuery = ref({
  storeId: '',
  startDate: dateRange.value.startDate,
  endDate: dateRange.value.endDate,
});

/**
 * FormDateRangeField 會輸出 yyyy/MM/dd
 * 後端通常吃 yyyy-MM-dd，這裡統一轉回去
 */
function normalizeDateForApi(value?: string | null) {
  const text = String(value ?? '').trim();

  if (!text) return undefined;

  return text.replace(/\//g, '-').slice(0, 10);
}

function normalizeDateForDisplay(value?: string | null) {
  const text = String(value ?? '').trim();

  if (!text) return '';

  return text.replace(/-/g, '/').slice(0, 10);
}

watch(
  [startDate, endDate],
  ([newStartDate, newEndDate]) => {
    formRef.value?.setValues({
      startDate: newStartDate,
      endDate: newEndDate,
    });
  },
  { flush: 'post' },
);

/* ==============================
 * 分頁
 * ============================== */
const pageLimitMap = ref<Record<string, number>>({});
const currentPageMap = ref<Record<string, number>>({});

function getPageLimitSize(key: string) {
  return pageLimitMap.value[key] ?? 10;
}

function getCurrentPage(key: string) {
  return currentPageMap.value[key] ?? 1;
}

function setPageLimitSize(key: string, size: number) {
  pageLimitMap.value = {
    ...pageLimitMap.value,
    [key]: size,
  };
}

function setCurrentPage(key: string, page: number) {
  currentPageMap.value = {
    ...currentPageMap.value,
    [key]: page,
  };
}

function getTotalPages(key: string, rows: any[]) {
  const pageLimitSize = getPageLimitSize(key);

  return Math.max(1, Math.ceil(rows.length / pageLimitSize));
}

function getCurrentPageItems(key: string, rows: any[]) {
  const currentPage = getCurrentPage(key);
  const pageLimitSize = getPageLimitSize(key);
  const start = (currentPage - 1) * pageLimitSize;
  const end = start + pageLimitSize;

  return rows.slice(start, end);
}

function getRenderPaginationNums(key: string, rows: any[]) {
  const totalPages = getTotalPages(key, rows);
  const currentPage = getCurrentPage(key);
  const delta = 2;

  const start = Math.max(1, currentPage - delta);
  const end = Math.min(totalPages, currentPage + delta);

  const pages: number[] = [];

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
}

function goToPage(key: string, rows: any[], page: number) {
  const totalPages = getTotalPages(key, rows);
  const nextPageValue = Math.min(Math.max(page, 1), totalPages);

  setCurrentPage(key, nextPageValue);
}

function nextPage(key: string, rows: any[]) {
  goToPage(key, rows, getCurrentPage(key) + 1);
}

function previousPage(key: string, rows: any[]) {
  goToPage(key, rows, getCurrentPage(key) - 1);
}

function handlePageLimitSizeChange(key: string, value: number) {
  setPageLimitSize(key, value);
  setCurrentPage(key, 1);
}

function resetPagination() {
  pageLimitMap.value = {};
  currentPageMap.value = {};
}

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
 * Data
 * ============================== */
const dailyDetails = computed(() => {
  return Array.isArray(reportData.value?.dailyDetails)
    ? reportData.value.dailyDetails
    : [];
});

const storeDetails = computed(() => {
  return Array.isArray(reportData.value?.storeDetails)
    ? reportData.value.storeDetails
    : [];
});

const totalRowCount = computed(() => {
  return (
    dailyDetails.value.length + (isAdmin.value ? storeDetails.value.length : 0)
  );
});

const hasReportData = computed(() => {
  return Boolean(reportData.value && totalRowCount.value > 0);
});

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

const chartOption = computed(() => {
  const daily = dailyDetails.value;

  return {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['日營收'],
    },
    grid: {
      top: 48,
      left: 42,
      right: 20,
      bottom: 36,
    },
    xAxis: {
      type: 'category',
      data: daily.map((item: any) => item.date),
    },
    yAxis: {
      type: 'value',
      name: 'NT$',
    },
    series: [
      {
        name: '日營收',
        type: 'line',
        data: daily.map((item: any) => item.revenue ?? 0),
        smooth: true,
      },
    ],
  };
});

/* ==============================
 * Utils
 * ============================== */
function formatNumber(value: any) {
  if (value === null || value === undefined || value === '') return '-';

  const num = Number(value);

  if (Number.isNaN(num)) return value;

  return num.toLocaleString();
}

function formatPercent(value: any) {
  if (value === null || value === undefined || value === '') return '-';

  return `${value}%`;
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
 * Query
 * ============================== */
async function onSubmit(values: any) {
  forbiddenMessage.value = '';

  const currentStartDate = startDate.value || values.startDate;
  const currentEndDate = endDate.value || values.endDate;

  const currentStoreId = isAdmin.value
    ? storeId.value || values.storeId || ''
    : storeId.value || values.storeId || '';

  const condition = {
    startDate: normalizeDateForApi(currentStartDate),
    endDate: normalizeDateForApi(currentEndDate),
    ...(currentStoreId ? { storeId: currentStoreId } : {}),
  };

  lastQuery.value = {
    storeId: currentStoreId,
    startDate: normalizeDateForDisplay(currentStartDate),
    endDate: normalizeDateForDisplay(currentEndDate),
  };

  loading.value = true;

  try {
    await executeApi({
      fn: () => getRevenueReport({ condition }),
      onSuccess: (data) => {
        reportData.value = data ?? null;
        resetPagination();
      },
      onFail: () => {
        reportData.value = null;
        resetPagination();
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
    resetPagination();
  }
}

function resetFilters() {
  const values = {
    storeId: isAdmin.value ? '' : storeId.value,
    startDate: normalizeDateForDisplay(dateRange.value.startDate),
    endDate: normalizeDateForDisplay(dateRange.value.endDate),
  };

  storeId.value = values.storeId;
  startDate.value = values.startDate;
  endDate.value = values.endDate;

  formRef.value?.setValues(values);
}

function handleExport() {
  if (dailyDetails.value.length) {
    exportToCsv(dailyDetails.value, dailyColumns, `${REPORT_TITLE}_每日明細`);
  }

  if (isAdmin.value && storeDetails.value.length) {
    exportToCsv(storeDetails.value, storeColumns, `${REPORT_TITLE}_各店家`);
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
    startDate: normalizeDateForDisplay(initValues.value.startDate),
    endDate: normalizeDateForDisplay(initValues.value.endDate),
  };

  storeId.value = values.storeId;
  startDate.value = values.startDate;
  endDate.value = values.endDate;

  formRef.value?.setValues(values);

  await onSubmit(values);
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as tokens;

.revenue-report-page {
  width: 100%;
  max-width: 100%;
}

/* ==============================
 * Page Head
 * ============================== */
.rv-page-head {
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

.rv-current-type,
.rv-total-count {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.rv-current-type {
  background: color.mix(tokens.$brand-light, #fff, 18%);
  color: tokens.$brand-dark;
}

.rv-total-count {
  background: color.mix(tokens.$form-border, #fff, 42%);
  color: tokens.$form-muted;
}

/* ==============================
 * Summary
 * ============================== */
.rv-summary-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.rv-summary-card {
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
.rv-card-head {
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

.rv-result-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

/* ==============================
 * Filter
 * ============================== */
.rv-filter-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
  padding: 14px;
  border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
  border-radius: 16px;
  background: color.mix(tokens.$brand-light, #fff, 7%);

  &__store {
    min-width: 0;
  }

  &__date {
    grid-column: span 2;
    min-width: 0;
  }
}

.rv-filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

/* ==============================
 * State
 * ============================== */
.rv-state {
  color: tokens.$form-muted;
  font-size: 14px;
}

.rv-forbidden {
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
.rv-stat-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.rv-stat-card {
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
.rv-chart {
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
.rv-section-head {
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

.rv-report-table {
  margin-top: 0;
}

/* ==============================
 * RWD
 * ============================== */
@media (max-width: 1280px) {
  .rv-stat-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .rv-page-head {
    flex-direction: column;

    &__actions {
      justify-content: flex-start;
    }
  }

  .rv-summary-row,
  .rv-filter-grid {
    grid-template-columns: 1fr;
  }

  .rv-filter-grid {
    &__date {
      grid-column: span 1;
    }
  }

  .rv-card-head {
    flex-direction: column;
  }

  .rv-result-actions,
  .rv-filter-actions {
    justify-content: flex-start;
  }

  .rv-stat-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .rv-stat-row {
    grid-template-columns: 1fr;
  }
}
</style>

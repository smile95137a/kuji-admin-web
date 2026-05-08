<!-- src/views/report/BonusReport.vue -->
<template>
  <div class="bonus-report-page">
    <!-- Header + Summary -->
    <MCard>
      <div class="br-page-head">
        <div class="br-page-head__main">
          <p class="br-page-head__eyebrow">報表管理</p>
          <h2 class="br-page-head__title">紅利報表</h2>
          <p class="br-page-head__sub">
            查看指定期間內的贈點總數、受益人數、成長率與每日贈點趨勢。
          </p>
        </div>

        <div class="br-page-head__actions">
          <span class="br-current-type">紅利統計</span>

          <span v-if="hasReportData" class="br-total-count">
            共 {{ totalRowCount }} 筆資料
          </span>
        </div>
      </div>

      <div class="br-summary-row">
        <div class="br-summary-card">
          <span class="br-summary-card__label">查詢期間</span>
          <strong class="br-summary-card__value">
            {{ queryDateText }}
          </strong>
        </div>

        <div class="br-summary-card">
          <span class="br-summary-card__label">類型統計</span>
          <strong class="br-summary-card__value">
            {{ reportData?.typeStats?.length ?? 0 }} 筆
          </strong>
        </div>

        <div class="br-summary-card">
          <span class="br-summary-card__label">每日明細</span>
          <strong class="br-summary-card__value">
            {{ reportData?.dailyDetails?.length ?? 0 }} 筆
          </strong>
        </div>
      </div>
    </MCard>

    <!-- 查詢條件 -->
    <div class="m-t-12">
      <MCard>
        <div class="br-card-head">
          <div>
            <p class="br-card-head__title">查詢條件</p>
            <p class="br-card-head__sub">可依日期區間查詢紅利贈點統計資料。</p>
          </div>
        </div>

        <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
          <div class="br-filter-grid">
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

          <div class="br-filter-actions">
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
        <div class="br-card-head br-card-head--result">
          <div>
            <p class="br-card-head__title">查詢結果</p>
            <p class="br-card-head__sub">
              依目前查詢條件顯示紅利統計、趨勢圖與明細資料。
            </p>
          </div>

          <div class="br-result-actions">
            <span v-if="hasReportData" class="br-card-head__count">
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

        <div v-if="loading" class="br-state m-t-16">查詢中...</div>

        <template v-else>
          <NoData v-if="!reportData" message="請輸入查詢條件後查詢" />

          <div v-else class="m-t-16">
            <!-- Summary Cards -->
            <div class="br-stat-row">
              <div class="br-stat-card">
                <span class="br-stat-card__label">總贈點數</span>
                <strong class="br-stat-card__value">
                  {{ formatNumber(reportData.totalBonusPoints) }}
                </strong>
              </div>

              <div class="br-stat-card">
                <span class="br-stat-card__label">總贈點筆數</span>
                <strong class="br-stat-card__value">
                  {{ formatNumber(reportData.totalCount) }}
                </strong>
              </div>

              <div class="br-stat-card">
                <span class="br-stat-card__label">受益人數</span>
                <strong class="br-stat-card__value">
                  {{ formatNumber(reportData.benefitUsers) }}
                </strong>
              </div>

              <div class="br-stat-card">
                <span class="br-stat-card__label">成長率</span>
                <strong class="br-stat-card__value">
                  {{ formatPercent(reportData.growthRate) }}
                </strong>
              </div>
            </div>

            <!-- 每日贈點趨勢圖 -->
            <div v-if="dailyDetails.length" class="br-chart m-t-20">
              <div class="br-chart__head">
                <div>
                  <p class="br-chart__title">每日贈點趨勢圖</p>
                  <p class="br-chart__sub">依日期呈現每日贈點數變化。</p>
                </div>
              </div>

              <VChart :option="chartOption" class="br-chart__main" autoresize />
            </div>

            <!-- 類型統計 -->
            <div class="m-t-20">
              <div class="br-section-head">
                <p class="br-section-head__title">贈點類型統計</p>

                <span class="br-section-head__count">
                  共 {{ typeStats.length }} 筆
                </span>
              </div>

              <NoData v-if="!typeStats.length" message="查無資料" />

              <template v-else>
                <ReportTable
                  class="br-report-table"
                  :columns="typeStatsColumns"
                  :items="getCurrentPageItems('typeStats', typeStats)"
                  row-key="bonusType"
                  :use-width-class="true"
                />

                <div class="flex justify-center m-t-12">
                  <Pagination
                    :totalPages="getTotalPages('typeStats', typeStats)"
                    :renderPaginationNums="
                      getRenderPaginationNums('typeStats', typeStats)
                    "
                    :currentPage="getCurrentPage('typeStats')"
                    :nextPage="() => nextPage('typeStats', typeStats)"
                    :previousPage="() => previousPage('typeStats', typeStats)"
                    :goToPage="
                      (page: number) => goToPage('typeStats', typeStats, page)
                    "
                    :pageLimitSize="getPageLimitSize('typeStats')"
                    :totalItems="typeStats.length"
                    @update:pageLimitSize="
                      (value: number) =>
                        handlePageLimitSizeChange('typeStats', value)
                    "
                  />
                </div>
              </template>
            </div>

            <!-- 每日明細 -->
            <div class="m-t-20">
              <div class="br-section-head">
                <p class="br-section-head__title">每日明細</p>

                <span class="br-section-head__count">
                  共 {{ dailyDetails.length }} 筆
                </span>
              </div>

              <NoData v-if="!dailyDetails.length" message="查無資料" />

              <template v-else>
                <ReportTable
                  class="br-report-table"
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

            <NoData
              v-if="!typeStats.length && !dailyDetails.length"
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
import ReportTable from '@/components/common/ReportTable.vue';

import { getBonusReport } from '@/services/adminReportService';
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

type TableColumn = {
  field: string;
  label: string;
  width?: number;
};

const REPORT_TITLE = '紅利報表';

const BONUS_TYPE_LABEL: Record<string, string> = {
  REFERRAL: '推薦好友',
  PROMOTION: '活動贈點',
  ADJUSTMENT: '手動調整',
  REGISTRATION: '註冊贈點',
};

const dailyColumns: TableColumn[] = [
  { field: 'date', label: '日期', width: 120 },
  { field: 'points', label: '贈點數', width: 120 },
  { field: 'count', label: '筆數', width: 90 },
];

const typeStatsColumns: TableColumn[] = [
  { field: 'typeName', label: '類型', width: 140 },
  { field: 'bonusType', label: '代碼', width: 130 },
  { field: 'totalPoints', label: '總點數', width: 120 },
  { field: 'count', label: '筆數', width: 90 },
  { field: 'percentage', label: '占比 (%)', width: 100 },
];

const { dateRange } = useReportFilter();

const formRef = ref<FormContext | null>(null);

const initValues = ref({
  startDate: dateRange.value.startDate,
  endDate: dateRange.value.endDate,
});

const startDate = ref(dateRange.value.startDate);
const endDate = ref(dateRange.value.endDate);

const reportData = ref<any | null>(null);
const loading = ref(false);

const lastQuery = ref({
  startDate: dateRange.value.startDate,
  endDate: dateRange.value.endDate,
});

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
 * Data
 * ============================== */
const typeStats = computed(() => {
  const rows = Array.isArray(reportData.value?.typeStats)
    ? reportData.value.typeStats
    : [];

  return rows.map((item: any) => ({
    ...item,
    typeName:
      item.typeName ??
      BONUS_TYPE_LABEL[item.bonusType] ??
      item.bonusType ??
      '-',
  }));
});

const dailyDetails = computed(() => {
  return Array.isArray(reportData.value?.dailyDetails)
    ? reportData.value.dailyDetails
    : [];
});

const totalRowCount = computed(() => {
  return typeStats.value.length + dailyDetails.value.length;
});

const hasReportData = computed(() => {
  return Boolean(reportData.value && totalRowCount.value > 0);
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
      data: ['每日贈點數'],
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
    },
    series: [
      {
        name: '每日贈點數',
        type: 'line',
        data: daily.map((item: any) => item.points ?? 0),
        smooth: true,
        areaStyle: {},
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

/* ==============================
 * Query
 * ============================== */
async function onSubmit(values: any) {
  const condition = {
    startDate: values.startDate ?? '',
    endDate: values.endDate ?? '',
  };

  lastQuery.value = {
    startDate: values.startDate ?? '',
    endDate: values.endDate ?? '',
  };

  loading.value = true;

  await executeApi({
    fn: () => getBonusReport({ condition }),
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
    showCatchDialog: true,
    onFinally: () => {
      loading.value = false;
    },
  });
}

function resetFilters() {
  const values = {
    startDate: dateRange.value.startDate,
    endDate: dateRange.value.endDate,
  };

  startDate.value = values.startDate;
  endDate.value = values.endDate;

  formRef.value?.setValues(values);
}

function handleExport() {
  if (dailyDetails.value.length) {
    exportToCsv(dailyDetails.value, dailyColumns, `${REPORT_TITLE}_每日明細`);
  }

  if (typeStats.value.length) {
    exportToCsv(typeStats.value, typeStatsColumns, `${REPORT_TITLE}_類型統計`);
  }
}

/* ==============================
 * Lifecycle
 * ============================== */
onMounted(async () => {
  await nextTick();

  const values = {
    ...initValues.value,
  };

  formRef.value?.setValues(values);

  await onSubmit(values);
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as tokens;

.bonus-report-page {
  width: 100%;
  max-width: 100%;
}

/* ==============================
 * Page Head
 * ============================== */
.br-page-head {
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

.br-current-type,
.br-total-count {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.br-current-type {
  background: color.mix(tokens.$brand-light, #fff, 18%);
  color: tokens.$brand-dark;
}

.br-total-count {
  background: color.mix(tokens.$form-border, #fff, 42%);
  color: tokens.$form-muted;
}

/* ==============================
 * Summary
 * ============================== */
.br-summary-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.br-summary-card {
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
.br-card-head {
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

.br-result-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

/* ==============================
 * Filter
 * ============================== */
.br-filter-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
  padding: 14px;
  border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
  border-radius: 16px;
  background: color.mix(tokens.$brand-light, #fff, 7%);
}

.br-filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

/* ==============================
 * State
 * ============================== */
.br-state {
  color: tokens.$form-muted;
  font-size: 14px;
}

/* ==============================
 * Stat Cards
 * ============================== */
.br-stat-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.br-stat-card {
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
.br-chart {
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
.br-section-head {
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

.br-report-table {
  margin-top: 0;
}

/* ==============================
 * RWD
 * ============================== */
@media (max-width: 1180px) {
  .br-stat-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .br-page-head {
    flex-direction: column;

    &__actions {
      justify-content: flex-start;
    }
  }

  .br-summary-row,
  .br-filter-grid {
    grid-template-columns: 1fr;
  }

  .br-card-head {
    flex-direction: column;
  }

  .br-result-actions,
  .br-filter-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .br-stat-row {
    grid-template-columns: 1fr;
  }
}
</style>

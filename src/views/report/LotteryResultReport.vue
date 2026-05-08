<!-- src/views/report/LotteryResultReport.vue -->
<template>
  <div class="lottery-result-page">
    <!-- Header + Summary -->
    <MCard>
      <div class="lr-page-head">
        <div class="lr-page-head__main">
          <p class="lr-page-head__eyebrow">報表管理</p>
          <h2 class="lr-page-head__title">抽獎結果報表</h2>
          <p class="lr-page-head__sub">
            查看指定期間內的抽獎次數、獎品抽出狀況、商品售出率與營收統計。
          </p>
        </div>

        <div class="lr-page-head__actions">
          <span class="lr-current-type">抽獎結果統計</span>

          <span v-if="hasReportData" class="lr-total-count">
            共 {{ totalRowCount }} 筆資料
          </span>
        </div>
      </div>

      <div class="lr-summary-row">
        <div class="lr-summary-card">
          <span class="lr-summary-card__label">查詢期間</span>
          <strong class="lr-summary-card__value">
            {{ queryDateText }}
          </strong>
        </div>

        <div class="lr-summary-card">
          <span class="lr-summary-card__label">獎品統計</span>
          <strong class="lr-summary-card__value">
            {{ prizeStats.length }} 筆
          </strong>
        </div>

        <div class="lr-summary-card">
          <span class="lr-summary-card__label">商品統計</span>
          <strong class="lr-summary-card__value">
            {{ lotteryStats.length }} 筆
          </strong>
        </div>
      </div>
    </MCard>

    <!-- 查詢條件 -->
    <div class="m-t-12">
      <MCard>
        <div class="lr-card-head">
          <div>
            <p class="lr-card-head__title">查詢條件</p>
            <p class="lr-card-head__sub">可依日期區間查詢抽獎結果統計資料。</p>
          </div>
        </div>

        <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
          <div class="lr-filter-grid">
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

          <div class="lr-filter-actions">
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
        <div class="lr-card-head lr-card-head--result">
          <div>
            <p class="lr-card-head__title">查詢結果</p>
            <p class="lr-card-head__sub">
              依目前查詢條件顯示抽獎結果統計、獎品抽出圖與明細資料。
            </p>
          </div>

          <div class="lr-result-actions">
            <span v-if="hasReportData" class="lr-card-head__count">
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

        <div v-if="loading" class="lr-state m-t-16">查詢中...</div>

        <template v-else>
          <NoData v-if="!reportData" message="請輸入查詢條件後查詢" />

          <div v-else class="m-t-16">
            <!-- 統計卡片 -->
            <div class="lr-stat-row">
              <div class="lr-stat-card">
                <span class="lr-stat-card__label">總抽獎次數</span>
                <strong class="lr-stat-card__value">
                  {{ formatNumber(reportData.totalDraws) }}
                </strong>
              </div>

              <div class="lr-stat-card">
                <span class="lr-stat-card__label">總獎品數</span>
                <strong class="lr-stat-card__value">
                  {{ formatNumber(reportData.totalPrizes) }}
                </strong>
              </div>

              <div class="lr-stat-card">
                <span class="lr-stat-card__label">大獎數</span>
                <strong class="lr-stat-card__value">
                  {{ formatNumber(reportData.bigPrizes) }}
                </strong>
              </div>

              <div class="lr-stat-card">
                <span class="lr-stat-card__label">總營收 (NT$)</span>
                <strong class="lr-stat-card__value">
                  NT$ {{ formatNumber(reportData.totalAmount) }}
                </strong>
              </div>
            </div>

            <!-- 獎品抽出橫條圖 -->
            <div v-if="prizeStats.length" class="lr-chart m-t-20">
              <div class="lr-chart__head">
                <div>
                  <p class="lr-chart__title">獎品抽出統計圖</p>
                  <p class="lr-chart__sub">依獎品等級呈現已抽數與剩餘數。</p>
                </div>
              </div>

              <VChart
                :option="prizeChartOption"
                class="lr-chart__main"
                autoresize
              />
            </div>

            <!-- 獎品統計 -->
            <div class="m-t-20">
              <div class="lr-section-head">
                <p class="lr-section-head__title">獎品統計</p>

                <span class="lr-section-head__count">
                  共 {{ prizeStats.length }} 筆
                </span>
              </div>

              <NoData v-if="!prizeStats.length" message="查無資料" />

              <template v-else>
                <ReportTable
                  class="lr-report-table"
                  :columns="prizeStatsColumns"
                  :items="getCurrentPageItems('prizeStats', prizeStats)"
                  row-key="prizeLevel"
                  :use-width-class="true"
                />

                <div class="flex justify-center m-t-12">
                  <Pagination
                    :totalPages="getTotalPages('prizeStats', prizeStats)"
                    :renderPaginationNums="
                      getRenderPaginationNums('prizeStats', prizeStats)
                    "
                    :currentPage="getCurrentPage('prizeStats')"
                    :nextPage="() => nextPage('prizeStats', prizeStats)"
                    :previousPage="() => previousPage('prizeStats', prizeStats)"
                    :goToPage="
                      (page: number) => goToPage('prizeStats', prizeStats, page)
                    "
                    :pageLimitSize="getPageLimitSize('prizeStats')"
                    :totalItems="prizeStats.length"
                    @update:pageLimitSize="
                      (value: number) =>
                        handlePageLimitSizeChange('prizeStats', value)
                    "
                  />
                </div>
              </template>
            </div>

            <!-- 商品統計 -->
            <div class="m-t-20">
              <div class="lr-section-head">
                <p class="lr-section-head__title">商品統計</p>

                <span class="lr-section-head__count">
                  共 {{ lotteryStats.length }} 筆
                </span>
              </div>

              <NoData v-if="!lotteryStats.length" message="查無資料" />

              <template v-else>
                <ReportTable
                  class="lr-report-table"
                  :columns="lotteryStatsColumns"
                  :items="getCurrentPageItems('lotteryStats', lotteryStats)"
                  row-key="lotteryTitle"
                  :use-width-class="true"
                />

                <div class="flex justify-center m-t-12">
                  <Pagination
                    :totalPages="getTotalPages('lotteryStats', lotteryStats)"
                    :renderPaginationNums="
                      getRenderPaginationNums('lotteryStats', lotteryStats)
                    "
                    :currentPage="getCurrentPage('lotteryStats')"
                    :nextPage="() => nextPage('lotteryStats', lotteryStats)"
                    :previousPage="
                      () => previousPage('lotteryStats', lotteryStats)
                    "
                    :goToPage="
                      (page: number) =>
                        goToPage('lotteryStats', lotteryStats, page)
                    "
                    :pageLimitSize="getPageLimitSize('lotteryStats')"
                    :totalItems="lotteryStats.length"
                    @update:pageLimitSize="
                      (value: number) =>
                        handlePageLimitSizeChange('lotteryStats', value)
                    "
                  />
                </div>
              </template>
            </div>

            <NoData
              v-if="!prizeStats.length && !lotteryStats.length"
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
import { BarChart } from 'echarts/charts';
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

import { getLotteryResultReport } from '@/services/adminReportService';
import { useReportFilter } from '@/composables/useReportFilter';
import { executeApi } from '@/utils/executeApiUtils';
import { exportToCsv } from '@/utils/csvExport';

use([
  CanvasRenderer,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
]);

type TableColumn = {
  field: string;
  label: string;
  width?: number;
};

const REPORT_TITLE = '抽獎結果報表';

const prizeStatsColumns: TableColumn[] = [
  { field: 'prizeLevel', label: '獎品等級', width: 100 },
  { field: 'totalCount', label: '總數量', width: 100 },
  { field: 'wonCount', label: '已抽數', width: 100 },
  { field: 'remainCount', label: '剩餘數', width: 100 },
  { field: 'wonPercentage', label: '抽出率 (%)', width: 100 },
];

const lotteryStatsColumns: TableColumn[] = [
  { field: 'lotteryTitle', label: '商品名稱', width: 200 },
  { field: 'storeName', label: '店家', width: 140 },
  { field: 'totalSlots', label: '總簽數', width: 90 },
  { field: 'soldSlots', label: '已售', width: 80 },
  { field: 'remainSlots', label: '剩餘', width: 80 },
  { field: 'soldPercentage', label: '售出率 (%)', width: 100 },
  { field: 'revenue', label: '營收 (NT$)', width: 120 },
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
const prizeStats = computed(() => {
  return Array.isArray(reportData.value?.prizeStats)
    ? reportData.value.prizeStats
    : [];
});

const lotteryStats = computed(() => {
  return Array.isArray(reportData.value?.lotteryStats)
    ? reportData.value.lotteryStats
    : [];
});

const totalRowCount = computed(() => {
  return prizeStats.value.length + lotteryStats.value.length;
});

const hasReportData = computed(() => {
  return Boolean(reportData.value && totalRowCount.value > 0);
});

const queryDateText = computed(() => {
  const start = lastQuery.value.startDate || '-';
  const end = lastQuery.value.endDate || '-';

  return `${start} ~ ${end}`;
});

const prizeChartOption = computed(() => {
  const rows = prizeStats.value;

  return {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['已抽', '剩餘'],
    },
    grid: {
      top: 48,
      left: 58,
      right: 20,
      bottom: 36,
    },
    xAxis: {
      type: 'value',
    },
    yAxis: {
      type: 'category',
      data: rows.map((item: any) => item.prizeLevel ?? ''),
    },
    series: [
      {
        name: '已抽',
        type: 'bar',
        data: rows.map((item: any) => item.wonCount ?? 0),
        stack: 'total',
        barMaxWidth: 30,
      },
      {
        name: '剩餘',
        type: 'bar',
        data: rows.map((item: any) => item.remainCount ?? 0),
        stack: 'total',
        barMaxWidth: 30,
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
    fn: () => getLotteryResultReport({ condition }),
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
  if (prizeStats.value.length) {
    exportToCsv(
      prizeStats.value,
      prizeStatsColumns,
      `${REPORT_TITLE}_獎品統計`,
    );
  }

  if (lotteryStats.value.length) {
    exportToCsv(
      lotteryStats.value,
      lotteryStatsColumns,
      `${REPORT_TITLE}_商品統計`,
    );
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

.lottery-result-page {
  width: 100%;
  max-width: 100%;
}

/* ==============================
 * Page Head
 * ============================== */
.lr-page-head {
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

.lr-current-type,
.lr-total-count {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.lr-current-type {
  background: color.mix(tokens.$brand-light, #fff, 18%);
  color: tokens.$brand-dark;
}

.lr-total-count {
  background: color.mix(tokens.$form-border, #fff, 42%);
  color: tokens.$form-muted;
}

/* ==============================
 * Summary
 * ============================== */
.lr-summary-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.lr-summary-card {
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
.lr-card-head {
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

.lr-result-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

/* ==============================
 * Filter
 * ============================== */
.lr-filter-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
  padding: 14px;
  border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
  border-radius: 16px;
  background: color.mix(tokens.$brand-light, #fff, 7%);
}

.lr-filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

/* ==============================
 * State
 * ============================== */
.lr-state {
  color: tokens.$form-muted;
  font-size: 14px;
}

/* ==============================
 * Stat Cards
 * ============================== */
.lr-stat-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.lr-stat-card {
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
.lr-chart {
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
.lr-section-head {
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

.lr-report-table {
  margin-top: 0;
}

/* ==============================
 * RWD
 * ============================== */
@media (max-width: 1180px) {
  .lr-stat-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .lr-page-head {
    flex-direction: column;

    &__actions {
      justify-content: flex-start;
    }
  }

  .lr-summary-row,
  .lr-filter-grid {
    grid-template-columns: 1fr;
  }

  .lr-card-head {
    flex-direction: column;
  }

  .lr-result-actions,
  .lr-filter-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .lr-stat-row {
    grid-template-columns: 1fr;
  }
}
</style>

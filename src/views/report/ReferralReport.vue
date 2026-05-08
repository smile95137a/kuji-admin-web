<!-- src/views/report/ReferralReport.vue -->
<template>
  <div class="referral-report-page">
    <!-- Header + Summary -->
    <MCard>
      <div class="rf-page-head">
        <div class="rf-page-head__main">
          <p class="rf-page-head__eyebrow">報表管理</p>
          <h2 class="rf-page-head__title">推薦碼報表</h2>
          <p class="rf-page-head__sub">
            查看指定期間內的推薦人數、活躍推薦碼、已發放獎勵與推薦排行。
          </p>
        </div>

        <div class="rf-page-head__actions">
          <span class="rf-current-type">推薦碼統計</span>

          <span v-if="hasReportData" class="rf-total-count">
            共 {{ totalRowCount }} 筆資料
          </span>
        </div>
      </div>

      <div class="rf-summary-row">
        <div class="rf-summary-card">
          <span class="rf-summary-card__label">查詢期間</span>
          <strong class="rf-summary-card__value">
            {{ queryDateText }}
          </strong>
        </div>

        <div class="rf-summary-card">
          <span class="rf-summary-card__label">推薦碼排行</span>
          <strong class="rf-summary-card__value">
            {{ rankingRows.length }} 筆
          </strong>
        </div>

        <div class="rf-summary-card">
          <span class="rf-summary-card__label">每日明細</span>
          <strong class="rf-summary-card__value">
            {{ dailyRows.length }} 筆
          </strong>
        </div>
      </div>
    </MCard>

    <!-- 查詢條件 -->
    <div class="m-t-12">
      <MCard>
        <div class="rf-card-head">
          <div>
            <p class="rf-card-head__title">查詢條件</p>
            <p class="rf-card-head__sub">可依日期區間查詢推薦碼統計資料。</p>
          </div>
        </div>

        <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
          <div class="rf-filter-grid">
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

          <div class="rf-filter-actions">
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
        <div class="rf-card-head rf-card-head--result">
          <div>
            <p class="rf-card-head__title">查詢結果</p>
            <p class="rf-card-head__sub">
              依目前查詢條件顯示推薦碼統計、趨勢圖與明細資料。
            </p>
          </div>

          <div class="rf-result-actions">
            <span v-if="hasReportData" class="rf-card-head__count">
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

        <div v-if="loading" class="rf-state m-t-16">查詢中...</div>

        <template v-else>
          <NoData v-if="!reportData" message="請輸入查詢條件後查詢" />

          <div v-else class="m-t-16">
            <!-- 統計卡片 -->
            <div class="rf-stat-row">
              <div class="rf-stat-card">
                <span class="rf-stat-card__label">總推薦人數</span>
                <strong class="rf-stat-card__value">
                  {{ formatNumber(reportData.totalReferrals) }}
                </strong>
              </div>

              <div class="rf-stat-card">
                <span class="rf-stat-card__label">活躍推薦碼</span>
                <strong class="rf-stat-card__value">
                  {{ formatNumber(reportData.activeReferralCodes) }}
                </strong>
              </div>

              <div class="rf-stat-card">
                <span class="rf-stat-card__label">已發放獎勵</span>
                <strong class="rf-stat-card__value">
                  {{ formatNumber(reportData.totalRewardGiven) }}
                </strong>
              </div>
            </div>

            <!-- 每日推薦趨勢圖 -->
            <div v-if="dailyRows.length" class="rf-chart m-t-20">
              <div class="rf-chart__head">
                <div>
                  <p class="rf-chart__title">每日推薦趨勢圖</p>
                  <p class="rf-chart__sub">依日期呈現每日推薦人數變化。</p>
                </div>
              </div>

              <VChart :option="chartOption" class="rf-chart__main" autoresize />
            </div>

            <!-- 推薦碼排行 -->
            <div class="m-t-20">
              <div class="rf-section-head">
                <p class="rf-section-head__title">推薦碼排行（前 10）</p>

                <span class="rf-section-head__count">
                  共 {{ rankingRows.length }} 筆
                </span>
              </div>

              <NoData v-if="!rankingRows.length" message="查無資料" />

              <template v-else>
                <ReportTable
                  class="rf-report-table"
                  :columns="rankingColumns"
                  :items="getCurrentPageItems('ranking', rankingRows)"
                  row-key="referralCode"
                  :use-width-class="true"
                />

                <div class="flex justify-center m-t-12">
                  <Pagination
                    :totalPages="getTotalPages('ranking', rankingRows)"
                    :renderPaginationNums="
                      getRenderPaginationNums('ranking', rankingRows)
                    "
                    :currentPage="getCurrentPage('ranking')"
                    :nextPage="() => nextPage('ranking', rankingRows)"
                    :previousPage="() => previousPage('ranking', rankingRows)"
                    :goToPage="
                      (page: number) => goToPage('ranking', rankingRows, page)
                    "
                    :pageLimitSize="getPageLimitSize('ranking')"
                    :totalItems="rankingRows.length"
                    @update:pageLimitSize="
                      (value: number) =>
                        handlePageLimitSizeChange('ranking', value)
                    "
                  />
                </div>
              </template>
            </div>

            <!-- 每日明細 -->
            <div class="m-t-20">
              <div class="rf-section-head">
                <p class="rf-section-head__title">每日明細</p>

                <span class="rf-section-head__count">
                  共 {{ dailyRows.length }} 筆
                </span>
              </div>

              <NoData v-if="!dailyRows.length" message="查無資料" />

              <template v-else>
                <ReportTable
                  class="rf-report-table"
                  :columns="dailyColumns"
                  :items="getCurrentPageItems('daily', dailyRows)"
                  row-key="date"
                  :use-width-class="true"
                />

                <div class="flex justify-center m-t-12">
                  <Pagination
                    :totalPages="getTotalPages('daily', dailyRows)"
                    :renderPaginationNums="
                      getRenderPaginationNums('daily', dailyRows)
                    "
                    :currentPage="getCurrentPage('daily')"
                    :nextPage="() => nextPage('daily', dailyRows)"
                    :previousPage="() => previousPage('daily', dailyRows)"
                    :goToPage="
                      (page: number) => goToPage('daily', dailyRows, page)
                    "
                    :pageLimitSize="getPageLimitSize('daily')"
                    :totalItems="dailyRows.length"
                    @update:pageLimitSize="
                      (value: number) =>
                        handlePageLimitSizeChange('daily', value)
                    "
                  />
                </div>
              </template>
            </div>

            <NoData
              v-if="!rankingRows.length && !dailyRows.length"
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

import { getReferralReport } from '@/services/adminReportService';
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

const REPORT_TITLE = '推薦碼報表';

const rankingColumns: TableColumn[] = [
  { field: 'rank', label: '排名', width: 70 },
  { field: 'referralCode', label: '推薦碼', width: 140 },
  { field: 'ownerName', label: '持有人', width: 160 },
  { field: 'referralCount', label: '推薦人數', width: 100 },
  { field: 'rewardGiven', label: '已發獎勵', width: 100 },
];

const dailyColumns: TableColumn[] = [
  { field: 'date', label: '日期', width: 120 },
  { field: 'referralCount', label: '推薦人數', width: 100 },
  { field: 'rewardGiven', label: '已發獎勵', width: 100 },
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
const rankingRows = computed(() => {
  const list = Array.isArray(reportData.value?.ranking)
    ? reportData.value.ranking
    : [];

  return rankingWithIndex(list);
});

const dailyRows = computed(() => {
  return Array.isArray(reportData.value?.daily) ? reportData.value.daily : [];
});

const totalRowCount = computed(() => {
  return rankingRows.value.length + dailyRows.value.length;
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
  const daily = dailyRows.value;

  return {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['每日推薦人數'],
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
        name: '每日推薦人數',
        type: 'bar',
        data: daily.map((item: any) => item.referralCount ?? 0),
        barMaxWidth: 40,
      },
    ],
  };
});

/* ==============================
 * Utils
 * ============================== */
function rankingWithIndex(list: any[]) {
  return [...list]
    .sort((a, b) => (b.referralCount ?? 0) - (a.referralCount ?? 0))
    .slice(0, 10)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
}

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
    fn: () => getReferralReport({ condition }),
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
  if (rankingRows.value.length) {
    exportToCsv(rankingRows.value, rankingColumns, `${REPORT_TITLE}_排行`);
  }

  if (dailyRows.value.length) {
    exportToCsv(dailyRows.value, dailyColumns, `${REPORT_TITLE}_每日明細`);
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

.referral-report-page {
  width: 100%;
  max-width: 100%;
}

/* ==============================
 * Page Head
 * ============================== */
.rf-page-head {
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

.rf-current-type,
.rf-total-count {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.rf-current-type {
  background: color.mix(tokens.$brand-light, #fff, 18%);
  color: tokens.$brand-dark;
}

.rf-total-count {
  background: color.mix(tokens.$form-border, #fff, 42%);
  color: tokens.$form-muted;
}

/* ==============================
 * Summary
 * ============================== */
.rf-summary-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.rf-summary-card {
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
.rf-card-head {
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

.rf-result-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

/* ==============================
 * Filter
 * ============================== */
.rf-filter-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
  padding: 14px;
  border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
  border-radius: 16px;
  background: color.mix(tokens.$brand-light, #fff, 7%);
}

.rf-filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

/* ==============================
 * State
 * ============================== */
.rf-state {
  color: tokens.$form-muted;
  font-size: 14px;
}

/* ==============================
 * Stat Cards
 * ============================== */
.rf-stat-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.rf-stat-card {
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
.rf-chart {
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
.rf-section-head {
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

.rf-report-table {
  margin-top: 0;
}

/* ==============================
 * RWD
 * ============================== */
@media (max-width: 1180px) {
  .rf-stat-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .rf-page-head {
    flex-direction: column;

    &__actions {
      justify-content: flex-start;
    }
  }

  .rf-summary-row,
  .rf-filter-grid {
    grid-template-columns: 1fr;
  }

  .rf-card-head {
    flex-direction: column;
  }

  .rf-result-actions,
  .rf-filter-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .rf-stat-row {
    grid-template-columns: 1fr;
  }
}
</style>

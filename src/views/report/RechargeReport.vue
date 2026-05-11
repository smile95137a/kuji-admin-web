<!-- src/views/report/RechargeReport.vue -->
<template>
  <div class="recharge-report-page">
    <MCard>
      <div class="rr-page-head">
        <div class="rr-page-head__main">
          <p class="rr-page-head__eyebrow">報表管理</p>
          <h2 class="rr-page-head__title">儲值報表</h2>
          <p class="rr-page-head__sub">平台儲值統計：總額、趨勢與方案分布。</p>
        </div>

        <div class="rr-page-head__actions">
          <span class="rr-current-type">ADMIN 平台視圖</span>

          <span v-if="hasReportData" class="rr-total-count">
            共 {{ totalRowCount }} 筆資料
          </span>
        </div>
      </div>

      <div class="rr-summary-row">
        <div class="rr-summary-card">
          <span class="rr-summary-card__label">查詢範圍</span>
          <strong class="rr-summary-card__value">平台全站</strong>
        </div>

        <div class="rr-summary-card">
          <span class="rr-summary-card__label">查詢期間</span>
          <strong class="rr-summary-card__value">
            {{ queryDateText }}
          </strong>
        </div>

        <div class="rr-summary-card">
          <span class="rr-summary-card__label">方案分布</span>
          <strong class="rr-summary-card__value">
            {{ planStats.length }} 筆
          </strong>
        </div>
      </div>
    </MCard>

    <!-- 查詢條件 -->
    <div class="m-t-12">
      <MCard>
        <div class="rr-card-head">
          <div>
            <p class="rr-card-head__title">查詢條件</p>
            <p class="rr-card-head__sub">可依日期區間查詢平台儲值統計資料。</p>
          </div>
        </div>

        <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
          <div class="rr-filter-grid">
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

          <div class="rr-filter-actions">
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
        <div class="rr-card-head rr-card-head--result">
          <div>
            <p class="rr-card-head__title">查詢結果</p>
            <p class="rr-card-head__sub">
              依目前查詢條件顯示儲值統計、趨勢圖與明細資料。
            </p>
          </div>

          <div class="rr-result-actions">
            <span v-if="hasReportData" class="rr-card-head__count">
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

        <div v-if="forbiddenMessage" class="rr-forbidden m-t-16">
          {{ forbiddenMessage }}
        </div>

        <div v-else-if="loading" class="rr-state m-t-16">查詢中...</div>

        <template v-else>
          <NoData v-if="!reportData" message="請輸入查詢條件後查詢" />

          <div v-else class="m-t-16">
            <!-- 統計卡片 -->
            <div class="rr-stat-row">
              <div class="rr-stat-card">
                <span class="rr-stat-card__label">總儲值金額 (NT$)</span>
                <strong class="rr-stat-card__value">
                  NT$ {{ formatNumber(reportData.totalAmount) }}
                </strong>
              </div>

              <div class="rr-stat-card">
                <span class="rr-stat-card__label">儲值筆數</span>
                <strong class="rr-stat-card__value">
                  {{ formatNumber(reportData.totalCount) }}
                </strong>
              </div>

              <div class="rr-stat-card">
                <span class="rr-stat-card__label">平均儲值金額</span>
                <strong class="rr-stat-card__value">
                  NT$ {{ formatNumber(reportData.avgAmount) }}
                </strong>
              </div>

              <div class="rr-stat-card">
                <span class="rr-stat-card__label">成長率</span>
                <strong class="rr-stat-card__value">
                  {{ formatPercent(reportData.growthRate) }}
                </strong>
              </div>
            </div>

            <!-- 儲值趨勢圖 -->
            <div v-if="dailyDetails.length" class="rr-chart m-t-20">
              <div class="rr-chart__head">
                <div>
                  <p class="rr-chart__title">每日儲值趨勢圖</p>
                  <p class="rr-chart__sub">依日期呈現每日儲值金額變化。</p>
                </div>
              </div>

              <VChart :option="chartOption" class="rr-chart__main" autoresize />
            </div>

            <div v-if="planStats.length" class="rr-chart m-t-20">
              <div class="rr-chart__head">
                <div>
                  <p class="rr-chart__title">方案分布圖</p>
                  <p class="rr-chart__sub">依方案呈現購買次數分布。</p>
                </div>
              </div>

              <VChart
                :option="planDistributionOption"
                class="rr-chart__main"
                autoresize
              />
            </div>

            <!-- 方案統計 -->
            <div class="m-t-20">
              <div class="rr-section-head">
                <p class="rr-section-head__title">方案統計</p>

                <span class="rr-section-head__count">
                  共 {{ planStats.length }} 筆
                </span>
              </div>

              <NoData v-if="!planStats.length" message="查無資料" />

              <template v-else>
                <ReportTable
                  class="rr-report-table"
                  :columns="planColumns"
                  :items="getCurrentPageItems('planStats', planStats)"
                  row-key="planName"
                  :use-width-class="true"
                />

                <div class="flex justify-center m-t-12">
                  <Pagination
                    :totalPages="getTotalPages('planStats', planStats)"
                    :renderPaginationNums="
                      getRenderPaginationNums('planStats', planStats)
                    "
                    :currentPage="getCurrentPage('planStats')"
                    :nextPage="() => nextPage('planStats', planStats)"
                    :previousPage="() => previousPage('planStats', planStats)"
                    :goToPage="
                      (page: number) => goToPage('planStats', planStats, page)
                    "
                    :pageLimitSize="getPageLimitSize('planStats')"
                    :totalItems="planStats.length"
                    @update:pageLimitSize="
                      (value: number) =>
                        handlePageLimitSizeChange('planStats', value)
                    "
                  />
                </div>
              </template>
            </div>

            <!-- 每日明細 -->
            <div class="m-t-20">
              <div class="rr-section-head">
                <p class="rr-section-head__title">每日明細</p>

                <span class="rr-section-head__count">
                  共 {{ dailyDetails.length }} 筆
                </span>
              </div>

              <NoData v-if="!dailyDetails.length" message="查無資料" />

              <template v-else>
                <ReportTable
                  class="rr-report-table"
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
              v-if="!planStats.length && !dailyDetails.length"
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
import { BarChart, LineChart } from 'echarts/charts';
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

import { useAuthStore } from '@/stores';
import { getRechargeReport, type RechargeReportRes } from '@/services/adminReportService';
import { useReportFilter } from '@/composables/useReportFilter';
import { executeApi } from '@/utils/executeApiUtils';
import { exportToCsv } from '@/utils/csvExport';

use([
  CanvasRenderer,
  BarChart,
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

const REPORT_TITLE = '儲值報表';

const dailyColumns: TableColumn[] = [
  { field: 'date', label: '日期', width: 120 },
  { field: 'amount', label: '金額 (NT$)', width: 120 },
  { field: 'count', label: '筆數', width: 90 },
];

const planColumns: TableColumn[] = [
  { field: 'planName', label: '方案名稱', width: 200 },
  { field: 'planPrice', label: '方案金額 (NT$)', width: 130 },
  { field: 'bonusPoints', label: '贈送點數', width: 110 },
  { field: 'purchaseCount', label: '購買次數', width: 100 },
  { field: 'totalAmount', label: '總金額 (NT$)', width: 130 },
  { field: 'percentage', label: '占比 (%)', width: 90 },
];

const authStore = useAuthStore();
const { dateRange } = useReportFilter();

const formRef = ref<FormContext | null>(null);

const initValues = ref({
  startDate: dateRange.value.startDate,
  endDate: dateRange.value.endDate,
});

const startDate = ref(dateRange.value.startDate);
const endDate = ref(dateRange.value.endDate);

const reportData = ref<RechargeReportRes | null>(null);
const forbiddenMessage = ref('');
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
const planStats = computed(() => {
  return Array.isArray(reportData.value?.planStats)
    ? reportData.value.planStats
    : [];
});

const dailyDetails = computed(() => {
  return Array.isArray(reportData.value?.dailyDetails)
    ? reportData.value.dailyDetails
    : [];
});

const totalRowCount = computed(() => {
  return planStats.value.length + dailyDetails.value.length;
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
      data: ['日儲值金額'],
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
        name: '日儲值金額',
        type: 'line',
        data: daily.map((item: any) => item.amount ?? 0),
        smooth: true,
        areaStyle: {},
      },
    ],
  };
});

const planDistributionOption = computed(() => {
  return {
    tooltip: {
      trigger: 'axis',
    },
    grid: {
      top: 30,
      left: 42,
      right: 20,
      bottom: 48,
    },
    xAxis: {
      type: 'category',
      axisLabel: {
        interval: 0,
        rotate: 20,
      },
      data: planStats.value.map((item: any) => item.planName ?? '-'),
    },
    yAxis: {
      type: 'value',
      name: '次數',
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 44,
        data: planStats.value.map((item: any) => item.purchaseCount ?? 0),
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
  if (!isAdmin.value) {
    forbiddenMessage.value = '此報表僅限平台管理員查看。';
    reportData.value = null;
    return;
  }

  forbiddenMessage.value = '';

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
    fn: () => getRechargeReport({ condition }),
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
  if (reportData.value) {
    exportToCsv(
      [
        {
          startDate: reportData.value.startDate,
          endDate: reportData.value.endDate,
          totalAmount: reportData.value.totalAmount,
          totalCount: reportData.value.totalCount,
          avgAmount: reportData.value.avgAmount,
          growthRate: reportData.value.growthRate,
        },
      ],
      [
        { field: 'startDate', label: '開始日期' },
        { field: 'endDate', label: '結束日期' },
        { field: 'totalAmount', label: '總儲值金額' },
        { field: 'totalCount', label: '儲值筆數' },
        { field: 'avgAmount', label: '平均儲值金額' },
        { field: 'growthRate', label: '成長率(%)' },
      ],
      `${REPORT_TITLE}_摘要`,
    );
  }

  if (dailyDetails.value.length) {
    exportToCsv(dailyDetails.value, dailyColumns, `${REPORT_TITLE}_每日明細`);
  }

  if (planStats.value.length) {
    exportToCsv(planStats.value, planColumns, `${REPORT_TITLE}_方案統計`);
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

.recharge-report-page {
  width: 100%;
  max-width: 100%;
}

/* ==============================
 * Page Head
 * ============================== */
.rr-page-head {
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

.rr-current-type,
.rr-total-count {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.rr-current-type {
  background: color.mix(tokens.$brand-light, #fff, 18%);
  color: tokens.$brand-dark;
}

.rr-total-count {
  background: color.mix(tokens.$form-border, #fff, 42%);
  color: tokens.$form-muted;
}

/* ==============================
 * Summary
 * ============================== */
.rr-summary-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.rr-summary-card {
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
.rr-card-head {
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

.rr-result-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

/* ==============================
 * Filter
 * ============================== */
.rr-filter-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
  padding: 14px;
  border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
  border-radius: 16px;
  background: color.mix(tokens.$brand-light, #fff, 7%);
}

.rr-filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

/* ==============================
 * State
 * ============================== */
.rr-state {
  color: tokens.$form-muted;
  font-size: 14px;
}

.rr-forbidden {
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
.rr-stat-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.rr-stat-card {
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
.rr-chart {
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
.rr-section-head {
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

.rr-report-table {
  margin-top: 0;
}

/* ==============================
 * RWD
 * ============================== */
@media (max-width: 1180px) {
  .rr-stat-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .rr-page-head {
    flex-direction: column;

    &__actions {
      justify-content: flex-start;
    }
  }

  .rr-summary-row,
  .rr-filter-grid {
    grid-template-columns: 1fr;
  }

  .rr-card-head {
    flex-direction: column;
  }

  .rr-result-actions,
  .rr-filter-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .rr-stat-row {
    grid-template-columns: 1fr;
  }
}
</style>

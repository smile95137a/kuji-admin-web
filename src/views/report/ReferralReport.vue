<!-- src/views/report/ReferralReport.vue -->
<template>
  <div class="referral-report-page">
    <!-- Header + Summary -->
    <MCard>
      <div class="rf-page-head">
        <div class="rf-page-head__main">
          <p class="rf-page-head__eyebrow">報表管理</p>
          <h2 class="rf-page-head__title">店薦店招商報表</h2>
          <p class="rf-page-head__sub">
            查看指定期間內的推薦碼投放、店家啟用成功數與推薦店家成效排行。
          </p>
        </div>

        <div class="rf-page-head__actions">
          <span class="rf-current-type">ADMIN 招商視圖</span>

          <span v-if="hasReportData" class="rf-total-count">
            共 {{ totalRowCount }} 筆資料
          </span>
        </div>
      </div>

      <div class="rf-summary-row">
        <div class="rf-summary-card">
          <span class="rf-summary-card__label">查詢推薦店家</span>
          <strong class="rf-summary-card__value">
            {{ selectedStoreText }}
          </strong>
        </div>

        <div class="rf-summary-card">
          <span class="rf-summary-card__label">查詢期間</span>
          <strong class="rf-summary-card__value">
            {{ queryDateText }}
          </strong>
        </div>

        <div class="rf-summary-card">
          <span class="rf-summary-card__label">推薦店家排行</span>
          <strong class="rf-summary-card__value">
            {{ performanceRows.length }} 筆
          </strong>
        </div>

        <div class="rf-summary-card">
          <span class="rf-summary-card__label">每日啟用明細</span>
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
            <p class="rf-card-head__sub">可依推薦店家與日期區間查詢招商成效資料。</p>
          </div>
        </div>

        <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
          <div class="rf-filter-grid">
            <FormSelect
              label="推薦店家"
              name="storeId"
              v-model="storeId"
              :options="storeOptions"
              :showAll="true"
              allLabel="全部"
              :allValue="''"
              :disabled="!isAdmin"
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
              依目前查詢條件顯示招商摘要、啟用趨勢與推薦店家排行。
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

        <div v-if="forbiddenMessage" class="rf-state m-t-16">
          {{ forbiddenMessage }}
        </div>

        <div v-else-if="loading" class="rf-state m-t-16">查詢中...</div>

        <template v-else>
          <NoData v-if="!reportData" message="請輸入查詢條件後查詢" />

          <div v-else class="m-t-16">
            <!-- 統計卡片 -->
            <div class="rf-stat-row">
              <div class="rf-stat-card">
                <span class="rf-stat-card__label">推薦碼總數</span>
                <strong class="rf-stat-card__value">
                  {{ formatNumber(reportData.totalReferralCodeCount) }}
                </strong>
              </div>

              <div class="rf-stat-card">
                <span class="rf-stat-card__label">活躍推薦碼</span>
                <strong class="rf-stat-card__value">
                  {{ formatNumber(reportData.activeReferralCodeCount) }}
                </strong>
              </div>

              <div class="rf-stat-card">
                <span class="rf-stat-card__label">成功招商店數</span>
                <strong class="rf-stat-card__value">
                  {{ formatNumber(reportData.successfulReferralStoreCount) }}
                </strong>
              </div>

              <div class="rf-stat-card">
                <span class="rf-stat-card__label">本期啟用店數</span>
                <strong class="rf-stat-card__value">
                  {{ formatNumber(reportData.currentPeriodActivatedStoreCount) }}
                </strong>
              </div>

              <div class="rf-stat-card">
                <span class="rf-stat-card__label">成長率</span>
                <strong class="rf-stat-card__value">
                  {{ formatPercent(reportData.growthRate) }}
                </strong>
              </div>
            </div>

            <!-- 每日推薦趨勢圖 -->
            <div v-if="dailyRows.length" class="rf-chart m-t-20">
              <div class="rf-chart__head">
                <div>
                  <p class="rf-chart__title">每日啟用趨勢圖</p>
                  <p class="rf-chart__sub">依日期呈現每日啟用成功店數變化。</p>
                </div>
              </div>

              <VChart :option="chartOption" class="rf-chart__main" autoresize />
            </div>

            <!-- 推薦碼排行 -->
            <div class="m-t-20">
              <div class="rf-section-head">
                <p class="rf-section-head__title">推薦店家招商排行（前 10）</p>

                <span class="rf-section-head__count">
                  共 {{ performanceRows.length }} 筆
                </span>
              </div>

              <NoData v-if="!performanceRows.length" message="查無資料" />

              <template v-else>
                <ReportTable
                  class="rf-report-table"
                  :columns="performanceColumns"
                  :items="getCurrentPageItems('performance', performanceRows)"
                  row-key="__rowKey"
                  :use-width-class="true"
                />

                <div class="flex justify-center m-t-12">
                  <Pagination
                    :totalPages="getTotalPages('performance', performanceRows)"
                    :renderPaginationNums="
                      getRenderPaginationNums('performance', performanceRows)
                    "
                    :currentPage="getCurrentPage('performance')"
                    :nextPage="() => nextPage('performance', performanceRows)"
                    :previousPage="() => previousPage('performance', performanceRows)"
                    :goToPage="
                      (page: number) => goToPage('performance', performanceRows, page)
                    "
                    :pageLimitSize="getPageLimitSize('performance')"
                    :totalItems="performanceRows.length"
                    @update:pageLimitSize="
                      (value: number) =>
                        handlePageLimitSizeChange('performance', value)
                    "
                  />
                </div>
              </template>
            </div>

            <!-- 每日明細 -->
            <div class="m-t-20">
              <div class="rf-section-head">
                <p class="rf-section-head__title">每日啟用明細</p>

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

            <NoData v-if="!performanceRows.length && !dailyRows.length" message="無資料" />
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
import FormSelect from '@/components/common/FormSelect.vue';
import ReportTable from '@/components/common/ReportTable.vue';

import { getReferralReport, type ReferralReportRes } from '@/services/adminReportService';
import { getAllStoreOptions, toSelectOptions } from '@/services/adminStoreService';
import { useAuthStore } from '@/stores';
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

const REPORT_TITLE = '店薦店招商報表';

const performanceColumns: TableColumn[] = [
  { field: 'rank', label: '排名', width: 70 },
  { field: 'storeName', label: '推薦店家', width: 180 },
  { field: 'referralCodeCount', label: '推薦碼數', width: 110 },
  { field: 'activatedStoreCount', label: '成功招商店數', width: 130 },
  { field: 'activationRateText', label: '轉換率', width: 100 },
];

const dailyColumns: TableColumn[] = [
  { field: 'date', label: '日期', width: 120 },
  { field: 'activatedStoreCount', label: '啟用成功店數', width: 130 },
];

const { dateRange } = useReportFilter();
const authStore = useAuthStore();
const isAdmin = computed(() =>
  (authStore.user?.roles ?? []).includes('ROLE_ADMIN'),
);

const formRef = ref<FormContext | null>(null);

const initValues = ref({
  storeId: '',
  startDate: dateRange.value.startDate,
  endDate: dateRange.value.endDate,
});

const storeId = ref('');
const startDate = ref(dateRange.value.startDate);
const endDate = ref(dateRange.value.endDate);
const storeOptions = ref<any[]>([]);

const reportData = ref<ReferralReportRes | null>(null);
const loading = ref(false);
const forbiddenMessage = computed(() =>
  isAdmin.value ? '' : '此報表僅限平台管理員查看。',
);

const lastQuery = ref({
  storeId: '',
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
const performanceRows = computed(() => {
  const list = Array.isArray(reportData.value?.storePerformances)
    ? reportData.value.storePerformances
    : [];

  return rankingWithIndex(list);
});

const dailyRows = computed(() => {
  const list = Array.isArray(reportData.value?.dailyActivations)
    ? reportData.value.dailyActivations
    : [];

  return list.map((item: any, index: number) => ({
    ...item,
    __rowKey: `${item.date ?? 'date'}-${index}`,
  }));
});

const totalRowCount = computed(() => {
  return performanceRows.value.length + dailyRows.value.length;
});

const hasReportData = computed(() => {
  return Boolean(reportData.value && totalRowCount.value > 0);
});

const queryDateText = computed(() => {
  const start = lastQuery.value.startDate || '-';
  const end = lastQuery.value.endDate || '-';

  return `${start} ~ ${end}`;
});

const selectedStoreText = computed(() => {
  if (!lastQuery.value.storeId) return '全部推薦店家';

  return (
    storeOptions.value.find((item) => String(item.value) === String(lastQuery.value.storeId))
      ?.label ?? '指定推薦店家'
  );
});

const chartOption = computed(() => {
  const daily = dailyRows.value;

  return {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['每日啟用成功店數'],
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
        name: '每日啟用成功店數',
        type: 'bar',
        data: daily.map((item: any) => item.activatedStoreCount ?? 0),
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
    .sort((a, b) => {
      const activatedDiff =
        (b.activatedStoreCount ?? 0) - (a.activatedStoreCount ?? 0);
      if (activatedDiff !== 0) return activatedDiff;
      return (b.referralCodeCount ?? 0) - (a.referralCodeCount ?? 0);
    })
    .slice(0, 10)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      storeName: item.storeName ?? item.referrerStoreName ?? '-',
      activationRateText: formatPercent(item.activationRate),
      __rowKey: `${item.storeId ?? item.storeName ?? 'store'}-${index}`,
    }));
}

function formatNumber(value: any) {
  if (value === null || value === undefined || value === '') return '-';

  const num = Number(value);

  if (Number.isNaN(num)) return value;

  return num.toLocaleString();
}

function formatPercent(value: any) {
  if (value === null || value === undefined || value === '') return '-';

  const num = Number(value);
  if (Number.isNaN(num)) return String(value);

  return `${num.toFixed(2)}%`;
}

/* ==============================
 * Query
 * ============================== */
async function onSubmit(values: any) {
  if (!isAdmin.value) {
    reportData.value = null;
    resetPagination();
    return;
  }

  const condition = {
    ...(values.storeId ? { storeId: values.storeId } : {}),
    startDate: values.startDate ?? '',
    endDate: values.endDate ?? '',
  };

  lastQuery.value = {
    storeId: values.storeId ?? '',
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
    storeId: '',
    startDate: dateRange.value.startDate,
    endDate: dateRange.value.endDate,
  };

  storeId.value = values.storeId;
  startDate.value = values.startDate;
  endDate.value = values.endDate;

  formRef.value?.setValues(values);
}

function handleExport() {
  if (performanceRows.value.length) {
    exportToCsv(performanceRows.value, performanceColumns, `${REPORT_TITLE}_推薦店家排行`);
  }

  if (dailyRows.value.length) {
    exportToCsv(dailyRows.value, dailyColumns, `${REPORT_TITLE}_每日啟用明細`);
  }
}

async function loadStoreOptions() {
  if (!isAdmin.value) return;

  try {
    const res = await getAllStoreOptions();
    storeOptions.value = toSelectOptions((res as any)?.data ?? []);
  } catch {
    storeOptions.value = [];
  }
}

/* ==============================
 * Lifecycle
 * ============================== */
onMounted(async () => {
  await nextTick();
  await loadStoreOptions();

  const values = {
    ...initValues.value,
  };

  formRef.value?.setValues(values);

  if (isAdmin.value) {
    await onSubmit(values);
  }
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

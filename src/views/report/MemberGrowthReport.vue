<!-- src/views/report/MemberGrowthReport.vue -->
<template>
  <div class="member-growth-page">
    <!-- Header + Summary -->
    <MCard>
      <div class="mg-page-head">
        <div class="mg-page-head__main">
          <p class="mg-page-head__eyebrow">報表管理</p>
          <h2 class="mg-page-head__title">會員成長報表</h2>
          <p class="mg-page-head__sub">
            查看指定期間內的會員成長趨勢、註冊數與會員統計資料。
          </p>
        </div>

        <div class="mg-page-head__actions">
          <span class="mg-current-type">會員成長統計</span>

          <span v-if="hasReportData" class="mg-total-count">
            共 {{ totalRowCount }} 筆資料
          </span>
        </div>
      </div>

      <div class="mg-summary-row">
        <div class="mg-summary-card">
          <span class="mg-summary-card__label">查詢期間</span>
          <strong class="mg-summary-card__value">
            {{ queryDateText }}
          </strong>
        </div>

        <div class="mg-summary-card">
          <span class="mg-summary-card__label">摘要欄位</span>
          <strong class="mg-summary-card__value">
            {{ summaryEntries.length }} 筆
          </strong>
        </div>

        <div class="mg-summary-card">
          <span class="mg-summary-card__label">明細資料</span>
          <strong class="mg-summary-card__value">
            {{ totalRowCount }} 筆
          </strong>
        </div>
      </div>
    </MCard>

    <!-- 查詢條件 -->
    <div class="m-t-12">
      <MCard>
        <div class="mg-card-head">
          <div>
            <p class="mg-card-head__title">查詢條件</p>
            <p class="mg-card-head__sub">可依日期區間查詢會員成長統計資料。</p>
          </div>
        </div>

        <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
          <div class="mg-filter-grid">
            <div class="mg-filter-grid__date">
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

          <div class="mg-filter-actions">
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
        <div class="mg-card-head mg-card-head--result">
          <div>
            <p class="mg-card-head__title">查詢結果</p>
            <p class="mg-card-head__sub">
              依目前查詢條件顯示會員成長摘要、趨勢圖與明細資料。
            </p>
          </div>

          <div class="mg-result-actions">
            <span v-if="hasReportData" class="mg-card-head__count">
              共 {{ totalRowCount }} 筆資料
            </span>

            <MButton
              v-if="hasReportData || summaryEntries.length"
              type="button"
              variant="secondary"
              @click="handleExport"
            >
              <font-awesome-icon icon="fa-download" class="m-r-4" />
              匯出 CSV
            </MButton>
          </div>
        </div>

        <div v-if="forbiddenMessage" class="mg-forbidden m-t-16">
          {{ forbiddenMessage }}
        </div>

        <div v-else-if="loading" class="mg-state m-t-16">查詢中...</div>

        <template v-else>
          <NoData v-if="!reportData" message="請輸入查詢條件後查詢" />

          <div v-else class="m-t-16">
            <!-- 統計卡片 -->
            <div v-if="summaryEntries.length" class="mg-stat-row">
              <div
                v-for="entry in summaryEntries"
                :key="entry.key"
                class="mg-stat-card"
              >
                <span class="mg-stat-card__label">{{ entry.label }}</span>
                <strong class="mg-stat-card__value">
                  {{ entry.value }}
                </strong>
              </div>
            </div>

            <!-- 圖表 -->
            <div v-if="chartOption" class="mg-chart m-t-20">
              <div class="mg-chart__head">
                <div>
                  <p class="mg-chart__title">會員成長趨勢圖</p>
                  <p class="mg-chart__sub">依日期呈現會員成長數據變化。</p>
                </div>
              </div>

              <VChart :option="chartOption" class="mg-chart__main" autoresize />
            </div>

            <!-- 明細區塊 -->
            <div
              v-for="section in tableSections"
              :key="section.key"
              class="m-t-20"
            >
              <div class="mg-section-head">
                <p class="mg-section-head__title">{{ section.title }}</p>

                <span class="mg-section-head__count">
                  共 {{ section.displayRows.length }} 筆
                </span>
              </div>

              <NoData v-if="!section.displayRows.length" message="查無資料" />

              <template v-else>
                <ReportTable
                  class="mg-report-table"
                  :columns="section.columns"
                  :items="getCurrentPageItems(section.key, section.displayRows)"
                  row-key="__rowKey"
                  :use-width-class="true"
                />

                <div class="flex justify-center m-t-12">
                  <Pagination
                    :totalPages="
                      getTotalPages(section.key, section.displayRows)
                    "
                    :renderPaginationNums="
                      getRenderPaginationNums(section.key, section.displayRows)
                    "
                    :currentPage="getCurrentPage(section.key)"
                    :nextPage="() => nextPage(section.key, section.displayRows)"
                    :previousPage="
                      () => previousPage(section.key, section.displayRows)
                    "
                    :goToPage="
                      (page: number) =>
                        goToPage(section.key, section.displayRows, page)
                    "
                    :pageLimitSize="getPageLimitSize(section.key)"
                    :totalItems="section.displayRows.length"
                    @update:pageLimitSize="
                      (value: number) =>
                        handlePageLimitSizeChange(section.key, value)
                    "
                  />
                </div>
              </template>
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
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { Form, type FormContext } from 'vee-validate';
import { isAxiosError } from 'axios';

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
import ReportTable from '@/components/common/ReportTable.vue';
import FormDateRangeField from '@/components/common/FormDateRangeField.vue';

import { useAuthStore } from '@/stores';
import {
  getMemberGrowthReport,
  type QueryReq,
} from '@/services/adminReportService';
import { useReportFilter } from '@/composables/useReportFilter';
import { executeApi } from '@/utils/executeApiUtils';
import { exportToCsv } from '@/utils/csvExport';
import {
  buildDisplayRows,
  formatReportValue,
  shouldHideReportField,
  shouldHideReportSection,
  toReportLabel,
} from '@/utils/reportDisplay';

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

type TableSection = {
  key: string;
  title: string;
  rows: Record<string, unknown>[];
  displayRows: Record<string, unknown>[];
  columns: TableColumn[];
};

const REPORT_TITLE = '會員成長報表';

const HIDDEN_SUMMARY_KEYS = ['arpuGold', 'arpuBonus'];

const authStore = useAuthStore();
const { dateRange } = useReportFilter();

const formRef = ref<FormContext | null>(null);

const initValues = ref({
  startDate: dateRange.value.startDate,
  endDate: dateRange.value.endDate,
});

const startDate = ref(dateRange.value.startDate);
const endDate = ref(dateRange.value.endDate);

const reportData = ref<Record<string, any> | null>(null);
const tableSections = ref<TableSection[]>([]);
const forbiddenMessage = ref('');
const loading = ref(false);

const lastQuery = ref({
  startDate: dateRange.value.startDate,
  endDate: dateRange.value.endDate,
});

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
 * Summary / Sections
 * ============================== */
const hiddenSummaryKeySet = computed(() => new Set(HIDDEN_SUMMARY_KEYS));

const summaryEntries = computed(() => {
  if (!reportData.value) return [];

  return Object.entries(reportData.value)
    .filter(([key, value]) => {
      const type = typeof value;

      return (
        !hiddenSummaryKeySet.value.has(key) &&
        !shouldHideReportField(key) &&
        value !== null &&
        !Array.isArray(value) &&
        type !== 'object' &&
        (type === 'string' || type === 'number' || type === 'boolean')
      );
    })
    .map(([key, value]) => ({
      key,
      label: toReportLabel(key),
      value: formatReportValue(key, value),
    }));
});

const totalRowCount = computed(() => {
  return tableSections.value.reduce(
    (sum, section) => sum + section.displayRows.length,
    0,
  );
});

const hasReportData = computed(() => {
  return Boolean(
    reportData.value &&
    (summaryEntries.value.length || totalRowCount.value > 0),
  );
});

const queryDateText = computed(() => {
  const start = lastQuery.value.startDate || '-';
  const end = lastQuery.value.endDate || '-';

  return `${start} ~ ${end}`;
});

function normalizeRows(input: any): Record<string, unknown>[] {
  if (!Array.isArray(input) || !input.length) return [];

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

function buildColumns(rows: Record<string, unknown>[]): TableColumn[] {
  if (!rows.length) return [];

  return Object.keys(rows[0])
    .filter((field) => !shouldHideReportField(field))
    .map((field) => ({
      field,
      label: toReportLabel(field),
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
        title: '查詢結果',
        rows,
        displayRows: buildDisplayRows(rows),
        columns: buildColumns(rows),
      },
    ];
  }

  return Object.entries(data)
    .filter(([key, value]) => {
      return Array.isArray(value) && !shouldHideReportSection(key);
    })
    .map(([key, value]) => {
      const rows = normalizeRows(value);

      return {
        key,
        title: toReportLabel(key),
        rows,
        displayRows: buildDisplayRows(rows),
        columns: buildColumns(rows),
      };
    });
}

/* ==============================
 * Chart
 * ============================== */
const chartOption = computed(() => {
  const section = tableSections.value.find(
    (item) => item.rows.length > 0 && 'date' in item.rows[0],
  );

  if (!section) return null;

  const rows = section.rows;
  const firstRow = rows[0];

  const numericFields = Object.keys(firstRow).filter((key) => {
    return (
      key !== 'date' &&
      key !== '__rowKey' &&
      !shouldHideReportField(key) &&
      typeof firstRow[key] === 'number'
    );
  });

  if (!numericFields.length) return null;

  return {
    tooltip: {
      trigger: 'axis',
    },
    legend:
      numericFields.length > 1
        ? { data: numericFields.map((field) => toReportLabel(field)) }
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
      name: toReportLabel(field),
      type: numericFields.length === 1 ? 'line' : 'bar',
      data: rows.map((row: any) => row[field] ?? 0),
      smooth: true,
      barMaxWidth: 40,
    })),
  };
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
 * Query
 * ============================== */
async function onSubmit(values: any) {
  if (!isAdmin.value) {
    forbiddenMessage.value = '此報表僅限平台管理員查看。';
    reportData.value = null;
    tableSections.value = [];
    return;
  }

  forbiddenMessage.value = '';

  const currentStartDate = startDate.value || values.startDate;
  const currentEndDate = endDate.value || values.endDate;

  const condition = {
    startDate: normalizeDateForApi(currentStartDate),
    endDate: normalizeDateForApi(currentEndDate),
  };

  lastQuery.value = {
    startDate: normalizeDateForDisplay(currentStartDate),
    endDate: normalizeDateForDisplay(currentEndDate),
  };

  loading.value = true;

  await executeApi({
    fn: async () => {
      const req: QueryReq<Record<string, any>> = {
        sortBy: 'createdAt',
        sortOrder: 'DESC',
        condition,
      };

      return getMemberGrowthReport(req);
    },
    onSuccess: (res: any) => {
      const data = res?.data ?? res;

      reportData.value = data ?? null;
      tableSections.value = buildTableSections(data);
      resetPagination();
    },
    onFail: () => {
      reportData.value = null;
      tableSections.value = [];
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
    startDate: normalizeDateForDisplay(dateRange.value.startDate),
    endDate: normalizeDateForDisplay(dateRange.value.endDate),
  };

  startDate.value = values.startDate;
  endDate.value = values.endDate;

  formRef.value?.setValues(values);
}

function handleExport() {
  tableSections.value.forEach((section) => {
    exportToCsv(
      section.displayRows,
      section.columns,
      `${REPORT_TITLE}_${section.title}`,
    );
  });

  if (!tableSections.value.length && summaryEntries.value.length) {
    exportToCsv(
      summaryEntries.value.map((entry) => ({
        欄位: entry.label,
        數值: entry.value,
      })),
      [
        { field: '欄位', label: '欄位' },
        { field: '數值', label: '數值' },
      ],
      REPORT_TITLE,
    );
  }
}

/* ==============================
 * Lifecycle
 * ============================== */
onMounted(async () => {
  await nextTick();

  const values = {
    startDate: normalizeDateForDisplay(initValues.value.startDate),
    endDate: normalizeDateForDisplay(initValues.value.endDate),
  };

  startDate.value = values.startDate;
  endDate.value = values.endDate;

  formRef.value?.setValues(values);

  try {
    await onSubmit(values);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403) {
      forbiddenMessage.value = '你目前沒有權限查看這份報表。';
    }
  }
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as tokens;

.member-growth-page {
  width: 100%;
  max-width: 100%;
}

/* ==============================
 * Page Head
 * ============================== */
.mg-page-head {
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

.mg-current-type,
.mg-total-count {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.mg-current-type {
  background: color.mix(tokens.$brand-light, #fff, 18%);
  color: tokens.$brand-dark;
}

.mg-total-count {
  background: color.mix(tokens.$form-border, #fff, 42%);
  color: tokens.$form-muted;
}

/* ==============================
 * Summary
 * ============================== */
.mg-summary-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.mg-summary-card {
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
.mg-card-head {
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

.mg-result-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

/* ==============================
 * Filter
 * ============================== */
.mg-filter-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
  padding: 14px;
  border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
  border-radius: 16px;
  background: color.mix(tokens.$brand-light, #fff, 7%);

  &__date {
    grid-column: span 2;
    min-width: 0;
  }
}

.mg-filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

/* ==============================
 * State
 * ============================== */
.mg-state {
  color: tokens.$form-muted;
  font-size: 14px;
}

.mg-forbidden {
  padding: 10px 12px;
  border: 1px solid color.mix(#ef4444, #fff, 60%);
  border-radius: 10px;
  background: color.mix(#ef4444, #fff, 92%);
  color: #b91c1c;
  font-size: 13px;
  font-weight: 700;
}

/* ==============================
 * Stat Cards
 * ============================== */
.mg-stat-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.mg-stat-card {
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
.mg-chart {
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
.mg-section-head {
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

.mg-report-table {
  margin-top: 0;
}

/* ==============================
 * RWD
 * ============================== */
@media (max-width: 1180px) {
  .mg-stat-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .mg-page-head {
    flex-direction: column;

    &__actions {
      justify-content: flex-start;
    }
  }

  .mg-summary-row,
  .mg-filter-grid {
    grid-template-columns: 1fr;
  }

  .mg-filter-grid {
    &__date {
      grid-column: span 1;
    }
  }

  .mg-card-head {
    flex-direction: column;
  }

  .mg-result-actions,
  .mg-filter-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .mg-stat-row {
    grid-template-columns: 1fr;
  }
}
</style>

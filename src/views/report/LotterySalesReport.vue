<!-- src/views/report/LotterySalesReport.vue -->
<template>
  <div class="lottery-sales-page">
    <!-- Header + Summary -->
    <MCard>
      <div class="ls-page-head">
        <div class="ls-page-head__main">
          <p class="ls-page-head__eyebrow">報表管理</p>
          <h2 class="ls-page-head__title">抽獎銷售報表</h2>
          <p class="ls-page-head__sub">
            查看指定期間內的抽獎銷售統計、營收分布與明細資料。
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
          <span class="ls-summary-card__label">明細資料</span>
          <strong class="ls-summary-card__value">
            {{ totalRowCount }} 筆
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
            <div class="ls-filter-grid__store">
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

            <div class="ls-filter-grid__date">
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
              依目前查詢條件顯示抽獎銷售摘要、圖表與明細資料。
            </p>
          </div>

          <div class="ls-result-actions">
            <span v-if="hasReportData" class="ls-card-head__count">
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

        <div v-if="forbiddenMessage" class="ls-forbidden m-t-16">
          {{ forbiddenMessage }}
        </div>

        <div v-else-if="loading" class="ls-state m-t-16">查詢中...</div>

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
                  {{ entry.value }}
                </strong>
              </div>
            </div>

            <!-- 圖表 -->
            <div v-if="chartOption" class="ls-chart m-t-20">
              <div class="ls-chart__head">
                <div>
                  <p class="ls-chart__title">抽獎銷售趨勢圖</p>
                  <p class="ls-chart__sub">依目前資料呈現銷售數據變化。</p>
                </div>
              </div>

              <VChart :option="chartOption" class="ls-chart__main" autoresize />
            </div>

            <!-- 明細區塊 -->
            <div
              v-for="section in tableSections"
              :key="section.key"
              class="m-t-20"
            >
              <div class="ls-section-head">
                <p class="ls-section-head__title">{{ section.title }}</p>

                <span class="ls-section-head__count">
                  共 {{ section.displayRows.length }} 筆
                </span>
              </div>

              <NoData v-if="!section.displayRows.length" message="查無資料" />

              <template v-else>
                <ReportTable
                  class="ls-report-table"
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
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import ReportTable from '@/components/common/ReportTable.vue';
import FormDateRangeField from '@/components/common/FormDateRangeField.vue';

import { useAuthStore } from '@/stores';
import {
  getLotterySalesReport,
  type QueryReq,
} from '@/services/adminReportService';
import { getStoreOptions, toSelectOptions } from '@/services/adminStoreService';
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
  rows: Record<string, unknown>[];
  displayRows: Record<string, unknown>[];
  columns: TableColumn[];
};

const REPORT_TITLE = '抽獎銷售報表';

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

const reportData = ref<Record<string, any> | null>(null);
const tableSections = ref<TableSection[]>([]);
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
 * Store options
 * ============================== */
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
 * Summary / Sections
 * ============================== */
const summaryEntries = computed(() => {
  if (!reportData.value) return [];

  return Object.entries(reportData.value)
    .filter(([key, value]) => {
      const type = typeof value;

      return (
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
  const dateSection = tableSections.value.find(
    (item) => item.rows.length > 0 && 'date' in item.rows[0],
  );

  const section =
    dateSection ||
    tableSections.value.find((item) => {
      if (!item.rows.length) return false;

      const firstRow = item.rows[0];

      return Object.keys(firstRow).some(
        (key) =>
          key !== '__rowKey' &&
          !shouldHideReportField(key) &&
          typeof firstRow[key] === 'number',
      );
    });

  if (!section) return null;

  const rows = section.rows.slice(0, 12);
  const firstRow = rows[0];

  const categoryField =
    'date' in firstRow
      ? 'date'
      : (['lotteryTitle', 'storeName', 'name', 'title'].find(
          (key) => key in firstRow,
        ) ?? Object.keys(firstRow).find((key) => key !== '__rowKey'));

  if (!categoryField) return null;

  const numericFields = Object.keys(firstRow).filter((key) => {
    return (
      key !== '__rowKey' &&
      key !== categoryField &&
      !shouldHideReportField(key) &&
      typeof firstRow[key] === 'number'
    );
  });

  if (!numericFields.length) return null;

  const useLineChart = categoryField === 'date';

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
      left: 52,
      right: 20,
      bottom: 48,
    },
    xAxis: {
      type: 'category',
      axisLabel: {
        interval: 0,
        rotate: useLineChart ? 0 : 20,
      },
      data: rows.map((row: any) => String(row[categoryField] ?? '-')),
    },
    yAxis: {
      type: 'value',
    },
    series: numericFields.map((field) => ({
      name: toReportLabel(field),
      type: useLineChart ? 'line' : 'bar',
      data: rows.map((row: any) => row[field] ?? 0),
      smooth: true,
      barMaxWidth: 44,
    })),
  };
});

/* ==============================
 * Pagination
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
  forbiddenMessage.value = '';

  const currentStartDate = startDate.value || values.startDate;
  const currentEndDate = endDate.value || values.endDate;
  const currentStoreId = storeId.value || values.storeId || '';

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

  await executeApi({
    fn: async () => {
      const req: QueryReq<Record<string, any>> = {
        sortBy: 'createdAt',
        sortOrder: 'DESC',
        condition,
      };

      return getLotterySalesReport(req);
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

  &__store {
    min-width: 0;
  }

  &__date {
    grid-column: span 2;
    min-width: 0;
  }
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

  .ls-filter-grid {
    &__date {
      grid-column: span 1;
    }
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

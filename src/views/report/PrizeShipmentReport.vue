<!-- src/views/admin/report/PrizeShipmentReport.vue -->
<template>
  <div class="prize-shipment-page">
    <!-- Header + Summary -->
    <MCard>
      <div class="ps-page-head">
        <div class="ps-page-head__main">
          <p class="ps-page-head__eyebrow">報表管理</p>
          <h2 class="ps-page-head__title">獎品出貨報表</h2>
          <p class="ps-page-head__sub">
            查看指定期間內的獎品出貨、待出貨、備貨中、完成與逾期統計資料。
          </p>
        </div>

        <div class="ps-page-head__actions">
          <span class="ps-current-type">
            {{ isAdmin ? '管理員查詢' : '店家查詢' }}
          </span>

          <span v-if="hasReportData" class="ps-total-count">
            共 {{ totalRowCount }} 筆資料
          </span>
        </div>
      </div>

      <div class="ps-summary-row">
        <div class="ps-summary-card">
          <span class="ps-summary-card__label">查詢店家</span>
          <strong class="ps-summary-card__value">
            {{ selectedStoreText }}
          </strong>
        </div>

        <div class="ps-summary-card">
          <span class="ps-summary-card__label">查詢期間</span>
          <strong class="ps-summary-card__value">
            {{ queryDateText }}
          </strong>
        </div>

        <div class="ps-summary-card">
          <span class="ps-summary-card__label">資料區塊</span>
          <strong class="ps-summary-card__value">
            {{ tableSections.length }} 個
          </strong>
        </div>
      </div>
    </MCard>

    <!-- 查詢條件 -->
    <div class="m-t-12">
      <MCard>
        <div class="ps-card-head">
          <div>
            <p class="ps-card-head__title">查詢條件</p>
            <p class="ps-card-head__sub">
              可依店家與日期區間查詢獎品出貨統計資料。
            </p>
          </div>
        </div>

        <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
          <div class="ps-filter-grid">
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

          <div class="ps-filter-actions">
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
        <div class="ps-card-head ps-card-head--result">
          <div>
            <p class="ps-card-head__title">查詢結果</p>
            <p class="ps-card-head__sub">
              依目前查詢條件顯示獎品出貨統計、趨勢圖與明細資料。
            </p>
          </div>

          <div class="ps-result-actions">
            <span v-if="hasReportData" class="ps-card-head__count">
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

        <div v-if="forbiddenMessage" class="ps-forbidden m-t-16">
          {{ forbiddenMessage }}
        </div>

        <div v-if="loading" class="ps-state m-t-16">查詢中...</div>

        <template v-else>
          <NoData v-if="!reportData" message="請輸入查詢條件後查詢" />

          <div v-else class="m-t-16">
            <!-- 統計卡片 -->
            <div v-if="summaryEntries.length" class="ps-stat-row">
              <div
                v-for="entry in summaryEntries"
                :key="entry.key"
                class="ps-stat-card"
              >
                <span class="ps-stat-card__label">{{ entry.label }}</span>
                <strong class="ps-stat-card__value">
                  {{ formatSummaryValue(entry.value) }}
                </strong>
              </div>
            </div>

            <!-- 趨勢圖 -->
            <div v-if="chartOption" class="ps-chart m-t-20">
              <div class="ps-chart__head">
                <div>
                  <p class="ps-chart__title">出貨趨勢圖</p>
                  <p class="ps-chart__sub">依日期呈現可量化欄位的變化趨勢。</p>
                </div>
              </div>

              <VChart :option="chartOption" class="ps-chart__main" autoresize />
            </div>

            <!-- 表格 -->
            <div
              v-for="section in tableSections"
              :key="section.key"
              class="m-t-20"
            >
              <div class="ps-section-head">
                <p class="ps-section-head__title">
                  {{ section.title }}
                </p>

                <span class="ps-section-head__count">
                  共 {{ section.rows.length }} 筆
                </span>
              </div>

              <NoData v-if="!section.rows.length" message="查無資料" />

              <template v-else>
                <ReportTable
                  class="ps-report-table"
                  :columns="section.columns"
                  :items="getCurrentPageItems(section)"
                  row-key="__rowKey"
                  :use-width-class="true"
                />

                <div class="flex justify-center m-t-12">
                  <Pagination
                    :totalPages="getTotalPages(section)"
                    :renderPaginationNums="getRenderPaginationNums(section)"
                    :currentPage="getCurrentPage(section.key)"
                    :nextPage="() => nextPage(section)"
                    :previousPage="() => previousPage(section)"
                    :goToPage="(page: number) => goToPage(section, page)"
                    :pageLimitSize="getPageLimitSize(section.key)"
                    :totalItems="section.rows.length"
                    @update:pageLimitSize="
                      (value: number) =>
                        handlePageLimitSizeChange(section, value)
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
  getPrizeShipmentReport,
  type PrizeShipmentReportRes,
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

const REPORT_TITLE = '獎品出貨報表';

const FIELD_ZH: Record<string, string> = {
  date: '日期',
  storeName: '店家名稱',
  storeId: '店家 ID',

  totalShipped: '已出貨數',
  shippedCount: '已出貨',
  totalPending: '待出貨數',
  pendingCount: '待出貨',
  preparingCount: '備貨中',
  completedCount: '已完成',
  overdueCount: '逾期件數',

  shipmentDetails: '出貨明細',
  prizeStats: '獎品統計',
  prizeName: '獎品名稱',
  prizeLevel: '獎品等級',
  totalPrizes: '總獎品數',

  lotteryTitle: '商品名稱',
  lotteryStats: '商品統計',

  startDate: '開始日期',
  endDate: '結束日期',
  totalCount: '總筆數',
  count: '數量',
  amount: '金額 (NT$)',
  total: '合計',

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

const reportData = ref<PrizeShipmentReportRes | null>(null);
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

function getTotalPages(section: TableSection) {
  const pageLimitSize = getPageLimitSize(section.key);
  return Math.max(1, Math.ceil(section.rows.length / pageLimitSize));
}

function getCurrentPageItems(section: TableSection) {
  const currentPage = getCurrentPage(section.key);
  const pageLimitSize = getPageLimitSize(section.key);
  const start = (currentPage - 1) * pageLimitSize;
  const end = start + pageLimitSize;

  return section.rows.slice(start, end);
}

function getRenderPaginationNums(section: TableSection) {
  const totalPages = getTotalPages(section);
  const currentPage = getCurrentPage(section.key);
  const delta = 2;

  const start = Math.max(1, currentPage - delta);
  const end = Math.min(totalPages, currentPage + delta);

  const pages: number[] = [];

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
}

function goToPage(section: TableSection, page: number) {
  const totalPages = getTotalPages(section);
  const nextPage = Math.min(Math.max(page, 1), totalPages);

  setCurrentPage(section.key, nextPage);
}

function nextPage(section: TableSection) {
  goToPage(section, getCurrentPage(section.key) + 1);
}

function previousPage(section: TableSection) {
  goToPage(section, getCurrentPage(section.key) - 1);
}

function handlePageLimitSizeChange(section: TableSection, value: number) {
  setPageLimitSize(section.key, value);
  setCurrentPage(section.key, 1);
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
    startDate: values.startDate ?? '',
    endDate: values.endDate ?? '',
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
      fn: () => getPrizeShipmentReport(req),
      onSuccess: (data: any, full: any) => {
        const result = data ?? full?.data ?? null;

        reportData.value = result;
        tableSections.value = buildTableSections(result);
        resetPagination();
      },
      onFail: () => {
        reportData.value = null;
        tableSections.value = [];
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
    tableSections.value = [];
    resetPagination();
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

.prize-shipment-page {
  width: 100%;
  max-width: 100%;
}

/* ==============================
 * Page Head
 * ============================== */
.ps-page-head {
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

.ps-current-type,
.ps-total-count {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.ps-current-type {
  background: color.mix(tokens.$brand-light, #fff, 18%);
  color: tokens.$brand-dark;
}

.ps-total-count {
  background: color.mix(tokens.$form-border, #fff, 42%);
  color: tokens.$form-muted;
}

/* ==============================
 * Summary
 * ============================== */
.ps-summary-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.ps-summary-card {
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
.ps-card-head {
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

.ps-result-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

/* ==============================
 * Filter
 * ============================== */
.ps-filter-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
  padding: 14px;
  border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
  border-radius: 16px;
  background: color.mix(tokens.$brand-light, #fff, 7%);
}

.ps-filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

/* ==============================
 * State
 * ============================== */
.ps-state {
  color: tokens.$form-muted;
  font-size: 14px;
}

.ps-forbidden {
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
.ps-stat-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.ps-stat-card {
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
.ps-chart {
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
.ps-section-head {
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

.ps-report-table {
  margin-top: 0;
}

/* ==============================
 * RWD
 * ============================== */
@media (max-width: 1180px) {
  .ps-stat-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .ps-page-head {
    flex-direction: column;

    &__actions {
      justify-content: flex-start;
    }
  }

  .ps-summary-row,
  .ps-filter-grid {
    grid-template-columns: 1fr;
  }

  .ps-card-head {
    flex-direction: column;
  }

  .ps-result-actions,
  .ps-filter-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .ps-stat-row {
    grid-template-columns: 1fr;
  }
}
</style>

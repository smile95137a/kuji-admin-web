<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { isAxiosError } from 'axios';

import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import VChart from 'vue-echarts';

import MCard from '@/components/common/MCard.vue';
import ReportFilterBar from '@/components/report/ReportFilterBar.vue';
import ReportTable from '@/components/common/ReportTable.vue';

import { useAuthStore } from '@/stores';
import { useReportFilter } from '@/composables/useReportFilter';
import { getStoreOptions, toSelectOptions } from '@/services/adminStoreService';
import type { QueryReq } from '@/services/adminReportService';
import { getErrorMessage } from '@/utils/ErrorUtils';
import { openInfoDialog } from '@/utils/dialog/infoDialog';
import { exportToCsv } from '@/utils/csvExport';
import {
  buildDisplayRows,
  formatReportValue,
  shouldHideReportField,
  shouldHideReportSection,
  toReportLabel,
} from '@/utils/reportDisplay';

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent, LegendComponent]);

type StoreOption = { label: string; value: string };

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

const props = withDefaults(
  defineProps<{
    title: string;
    fetchReportApi: (
      req: QueryReq<Record<string, any>>,
    ) => Promise<ApiResponse<any>>;
    showStoreFilter?: boolean;
    hiddenSummaryKeys?: string[];
    hiddenSectionKeys?: string[];
  }>(),
  {
    showStoreFilter: true,
    hiddenSummaryKeys: () => [],
    hiddenSectionKeys: () => [],
  },
);

const authStore = useAuthStore();
const { dateRange } = useReportFilter();

const reportData = ref<Record<string, any> | null>(null);
const tableSections = ref<TableSection[]>([]);
const storeOptions = ref<StoreOption[]>([]);
const selectedStoreId = ref('');
const forbiddenMessage = ref('');
const loading = ref(false);

const hiddenSummaryKeySet = computed(() => new Set(props.hiddenSummaryKeys));
const hiddenSectionKeySet = computed(() => new Set(props.hiddenSectionKeys));

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

const isAdmin = computed(
  () => roleSet.value.has('ROLE_ADMIN') || roleSet.value.has('ADMIN'),
);

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

const resolveUserStoreOptions = (): StoreOption[] => {
  const user = (authStore.user as any) ?? {};
  const ids = Array.isArray(user.storeIds)
    ? user.storeIds
    : user.storeId
      ? [user.storeId]
      : user.store?.id
        ? [user.store.id]
        : [];

  return ids
    .filter(Boolean)
    .map((id: any) => ({ label: `店家 ${id}`, value: String(id) }));
};

const loadStoreOptions = async () => {
  if (!props.showStoreFilter) return;

  try {
    const res = await getStoreOptions({ activeOnly: false });
    const list = (res as any)?.data ?? [];
    storeOptions.value = toSelectOptions(Array.isArray(list) ? list : []);
  } catch {
    storeOptions.value = [];
  }

  if (!storeOptions.value.length && !isAdmin.value) {
    storeOptions.value = resolveUserStoreOptions();
  }

  if (!isAdmin.value) {
    selectedStoreId.value = storeOptions.value[0]?.value ?? '';
  }
};

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
      return (
        Array.isArray(value) &&
        !shouldHideReportSection(key) &&
        !hiddenSectionKeySet.value.has(key)
      );
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

const chartOption = computed(() => {
  const section = tableSections.value.find(
    (item) => item.rows.length > 0 && 'date' in item.rows[0],
  );
  if (!section) return null;

  const rows = section.rows;
  const numericFields = Object.keys(rows[0]).filter((key) => {
    return (
      key !== 'date' &&
      key !== '__rowKey' &&
      !shouldHideReportField(key) &&
      typeof rows[0][key] === 'number'
    );
  });
  if (!numericFields.length) return null;

  return {
    tooltip: { trigger: 'axis' },
    legend:
      numericFields.length > 1
        ? { data: numericFields.map((field) => toReportLabel(field)) }
        : undefined,
    xAxis: {
      type: 'category',
      data: rows.map((row: any) => row.date),
    },
    yAxis: { type: 'value' },
    series: numericFields.map((field) => ({
      name: toReportLabel(field),
      type: 'bar',
      data: rows.map((row: any) => row[field] ?? 0),
      barMaxWidth: 40,
    })),
  };
});

function handleExport() {
  tableSections.value.forEach((section) => {
    exportToCsv(section.displayRows, section.columns, `${props.title}_${section.title}`);
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
      props.title,
    );
  }
}

async function fetchReport(filter: {
  startDate: string;
  endDate: string;
  storeId?: string;
}) {
  forbiddenMessage.value = '';
  loading.value = true;

  try {
    const req: QueryReq<Record<string, any>> = {
      sortBy: 'createdAt',
      sortOrder: 'DESC',
      condition: {
        startDate: filter.startDate,
        endDate: filter.endDate,
        ...(props.showStoreFilter && filter.storeId
          ? { storeId: filter.storeId }
          : {}),
      },
    };

    const res = await props.fetchReportApi(req);
    const data = (res as any)?.data ?? res;
    reportData.value = data as Record<string, any>;
    tableSections.value = buildTableSections(data);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403) {
      forbiddenMessage.value = '你目前沒有權限查看這份報表。';
      return;
    }

    await openInfoDialog({
      title: '查詢失敗',
      message: getErrorMessage(error),
      iconType: 'warning',
    });
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadStoreOptions();
  await fetchReport({
    startDate: dateRange.value.startDate,
    endDate: dateRange.value.endDate,
    storeId: selectedStoreId.value || undefined,
  });
});
</script>

<template>
  <MCard>
    <div class="rp__header">
      <p class="form__text form__text--title">{{ title }}</p>
      <button
        v-if="reportData && (tableSections.length || summaryEntries.length)"
        type="button"
        class="rp__export-btn"
        @click="handleExport"
      >
        匯出 CSV
      </button>
    </div>

    <ReportFilterBar
      :show-store-filter="showStoreFilter"
      :store-options="storeOptions"
      :selected-store-id="selectedStoreId"
      :store-filter-disabled="!isAdmin"
      @update:filter="fetchReport"
    />

    <div v-if="forbiddenMessage" class="rp__forbidden m-t-16">
      {{ forbiddenMessage }}
    </div>

    <div v-if="loading" class="rp__state m-t-16">查詢中...</div>

    <div v-else-if="reportData" class="m-t-16">
      <div v-if="summaryEntries.length" class="rp__cards">
        <div
          v-for="entry in summaryEntries"
          :key="entry.key"
          class="rp__card"
        >
          <p class="rp__card-label">{{ entry.label }}</p>
          <p class="rp__card-value">{{ entry.value }}</p>
        </div>
      </div>

      <div v-if="chartOption" class="rp__chart m-t-20">
        <v-chart :option="chartOption" style="height: 280px" autoresize />
      </div>

      <div
        v-for="section in tableSections"
        :key="section.key"
        class="m-t-20"
      >
        <p class="form__text form__text--red m-b-8">{{ section.title }}</p>
        <ReportTable
          :columns="section.columns"
          :items="section.displayRows"
          row-key="__rowKey"
          :useWidthClass="true"
        />
      </div>

      <div
        v-if="!summaryEntries.length && !tableSections.length"
        class="rp__state m-t-16"
      >
        沒有資料
      </div>
    </div>
  </MCard>
</template>

<style scoped lang="scss">
.rp {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  &__export-btn {
    min-height: 36px;
    padding: 6px 16px;
    font-size: 13px;
    border-radius: 8px;
    border: 1px solid #6366f1;
    background: #fff;
    color: #6366f1;
    cursor: pointer;
  }

  &__chart {
    padding: 8px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #fafafa;
  }

  &__state {
    color: #6b7280;
    font-size: 14px;
  }

  &__forbidden {
    padding: 10px 12px;
    border: 1px solid #fcd34d;
    border-radius: 8px;
    background: #fffbeb;
    color: #b45309;
    font-size: 13px;
    font-weight: 700;
  }

  &__cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
  }

  &__card {
    padding: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #f9fafb;
  }

  &__card-label {
    margin-bottom: 4px;
    color: #6b7280;
    font-size: 12px;
  }

  &__card-value {
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
  }
}
</style>

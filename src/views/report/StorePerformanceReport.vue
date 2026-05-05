<!-- src/views/report/StorePerformanceReport.vue -->
<template>
  <!-- 查詢區 -->
  <MCard>
    <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
      <FormTitle title="店家績效報表" />

      <FormSection title="查詢條件" subtitle="請選擇店家與日期區間後進行查詢">
        <StorePerformanceReportSearchForm
          :store-options="storeOptions"
          :store-filter-disabled="!isAdmin"
        />

        <div class="flex justify-center m-y-8">
          <MButton type="submit">
            <font-awesome-icon icon="fa-magnifying-glass" class="m-r-4" />
            查詢
          </MButton>
        </div>
      </FormSection>
    </Form>
  </MCard>

  <!-- 結果區 -->
  <div class="m-t-12">
    <MCard>
      <FormSection
        title="查詢結果"
        subtitle="查看店家營運績效、統計摘要與明細資料"
      >
        <div class="spr__header-action">
          <span v-if="hasData" class="spr__count">
            共 {{ list.length }} 筆
          </span>
        </div>

        <div v-if="forbiddenMessage" class="spr__forbidden">
          {{ forbiddenMessage }}
        </div>

        <div v-if="loading" class="spr__state">查詢中...</div>

        <template v-else>
          <!-- 摘要卡 -->
          <div v-if="summaryEntries.length" class="spr__cards">
            <div
              v-for="entry in summaryEntries"
              :key="entry.key"
              class="spr__card"
            >
              <p class="spr__card-label">
                {{ entry.label }}
              </p>

              <p class="spr__card-value">
                {{ entry.value }}
              </p>
            </div>
          </div>

          <!-- 多資料區塊切換 -->
          <div v-if="tableSections.length > 1" class="spr__section-tabs">
            <button
              v-for="section in tableSections"
              :key="section.key"
              type="button"
              class="spr__section-tab"
              :class="{
                'spr__section-tab--active': selectedSectionKey === section.key,
              }"
              @click="changeSection(section.key)"
            >
              {{ section.title }}
              <span>{{ section.rows?.length ?? 0 }}</span>
            </button>
          </div>

          <template v-if="!hasData">
            <NoData :message="noDataMessage" />
          </template>

          <template v-else>
            <ReportTable
              class="m-t-12"
              :columns="columns"
              :items="currentPageItems"
              row-key="__rowKey"
              :useWidthClass="true"
              :sort-key="sortKey"
              :sort-order="sortOrder"
              @sort="handleSort"
            />

            <div class="flex justify-center m-t-12">
              <Pagination
                :totalPages="totalPages"
                :renderPaginationNums="renderPaginationNums"
                :currentPage="currentPage"
                :nextPage="nextPage"
                :previousPage="previousPage"
                :goToPage="goToPage"
                :pageLimitSize="pageLimitSize"
                :totalItems="list.length"
                @update:pageLimitSize="handlePageLimitSizeChange"
              />
            </div>
          </template>
        </template>
      </FormSection>
    </MCard>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { Form, type FormContext } from 'vee-validate';
import { isAxiosError } from 'axios';

import { usePagination } from '@/hook/usePagination';
import { useSearchPage } from '@/hook/useSearchPage';
import { compareByKeySmart } from '@/utils/sortUtils';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import NoData from '@/components/common/NoData.vue';
import Pagination from '@/components/common/Pagination.vue';
import ReportTable from '@/components/common/ReportTable.vue';
import FormTitle from '@/components/common/FormTitle.vue';
import FormSection from '@/components/common/FormSection.vue';
import StorePerformanceReportSearchForm from '@/components/report/StorePerformanceReportSearchForm.vue';

import { useAuthStore } from '@/stores';
import { useReportFilter } from '@/composables/useReportFilter';
import { useStorePerformanceReportStore } from '@/stores/report/useStorePerformanceReportStore';

import { getStoreOptions, toSelectOptions } from '@/services/adminStoreService';
import { getStorePerformanceReport } from '@/services/adminReportService';

import { getErrorMessage } from '@/utils/ErrorUtils';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

/* --------------------------------------
 * Store
 * -------------------------------------- */
const authStore = useAuthStore();
const reportStore = useStorePerformanceReportStore();

const { dateRange } = useReportFilter();

/* --------------------------------------
 * Form
 * -------------------------------------- */
const formRef = ref<FormContext | null>(null);

const initValues = ref<any>({
  startDate: dateRange.value.startDate,
  endDate: dateRange.value.endDate,
  storeId: '',
});

/* --------------------------------------
 * Search list
 * -------------------------------------- */
const { list, hasData, isSearch, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

/* --------------------------------------
 * State
 * -------------------------------------- */
const reportData = ref<any>(null);
const summaryEntries = ref<any[]>([]);
const tableSections = ref<any[]>([]);
const selectedSectionKey = ref('');
const storeOptions = ref<any[]>([]);
const forbiddenMessage = ref('');
const loading = ref(false);

/* --------------------------------------
 * Role
 * -------------------------------------- */
const roleSet = computed(() => {
  const raw = [
    ...(Array.isArray((authStore.user as any)?.roles)
      ? (authStore.user as any).roles
      : []),
    (authStore.user as any)?.role,
    (authStore.user as any)?.roleCode,
  ]
    .filter(Boolean)
    .map((x) => String(x).toUpperCase());

  return new Set(raw);
});

const isAdmin = computed(
  () => roleSet.value.has('ROLE_ADMIN') || roleSet.value.has('ADMIN'),
);

/* --------------------------------------
 * Select options
 * -------------------------------------- */
const resolveUserStoreOptions = (): any[] => {
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
};

const loadStoreOptions = async () => {
  try {
    const res = await getStoreOptions({ activeOnly: false });
    const data = (res as any)?.data ?? res;
    const arr = Array.isArray(data) ? data : [];

    storeOptions.value = toSelectOptions(arr).map((item: any) => ({
      label: item.label ?? item.storeName ?? item.name ?? '-',
      value: String(item.value ?? item.id ?? ''),
    }));
  } catch {
    storeOptions.value = [];
  }

  if (!storeOptions.value.length && !isAdmin.value) {
    storeOptions.value = resolveUserStoreOptions();
  }

  if (!isAdmin.value) {
    initValues.value.storeId = storeOptions.value[0]?.value ?? '';
  }
};

/* --------------------------------------
 * Utils
 * -------------------------------------- */
function toLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function normalizeRows(input: any): any[] {
  if (!Array.isArray(input)) return [];
  if (!input.length) return [];

  if (typeof input[0] === 'object' && input[0] !== null) {
    return input.map((row: any, index: number) => ({
      __rowKey: String(row?.id ?? row?.uuid ?? row?.key ?? index),
      ...row,
    }));
  }

  return input.map((value: any, index: number) => ({
    __rowKey: String(index),
    index: index + 1,
    value,
  }));
}

function buildColumns(rows: any[]): any[] {
  if (!rows.length) return [];

  return Object.keys(rows[0])
    .filter((field) => field !== '__rowKey')
    .map((field) => ({
      field,
      label: toLabel(field),
      width: 160,
      sortable: true,
    }));
}

function buildTableSections(data: any): any[] {
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

  const entries = Object.entries(data).filter(([, value]) =>
    Array.isArray(value),
  );

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

function buildSummaryEntries(data: any): any[] {
  if (!data || Array.isArray(data)) return [];

  const hiddenSummaryKeys = [
    'startDate',
    'endDate',
    'createdAtStart',
    'createdAtEnd',
  ];

  return Object.entries(data)
    .filter(([key, value]) => {
      if (hiddenSummaryKeys.includes(key)) return false;

      const t = typeof value;

      return (
        value !== null &&
        !Array.isArray(value) &&
        t !== 'object' &&
        (t === 'string' || t === 'number' || t === 'boolean')
      );
    })
    .map(([key, value]) => ({
      key,
      label: toLabel(key),
      value,
    }));
}

/* --------------------------------------
 * Section
 * -------------------------------------- */
const activeSection = computed<any>(() => {
  if (!tableSections.value.length) return null;

  return (
    tableSections.value.find(
      (item: any) => item.key === selectedSectionKey.value,
    ) ?? tableSections.value[0]
  );
});

const columns = computed<any[]>(() => activeSection.value?.columns ?? []);

const syncActiveSectionRows = () => {
  const rows = activeSection.value?.rows ?? [];
  list.value = [...rows];
};

const changeSection = async (key: string) => {
  selectedSectionKey.value = key;
  reportStore.setSelectedSectionKey(key);

  sortKey.value = '';
  sortOrder.value = 'asc';

  syncActiveSectionRows();

  await nextTick();
  goToPage(1);
};

/* --------------------------------------
 * Sorting
 * -------------------------------------- */
const sortKey = ref('');
const sortOrder = ref<'asc' | 'desc' | ''>('asc');

const handleSort = ({
  key,
  order,
}: {
  key: string;
  order: 'asc' | 'desc' | '';
}) => {
  sortKey.value = key;
  sortOrder.value = order;
  reportStore.setSort(key, order);
  goToPage(1);
};

const sortedList = computed(() => {
  if (!sortKey.value || !sortOrder.value) return list.value;

  const arr = [...list.value];

  arr.sort((a: any, b: any) =>
    compareByKeySmart(a, b, sortKey.value, sortOrder.value as 'asc' | 'desc', {
      type: 'auto',
      mode: 'big5',
      locale: 'zh-TW',
    }),
  );

  return arr;
});

/* --------------------------------------
 * Pagination
 * -------------------------------------- */
const pageLimitSize = ref(10);

const {
  totalPages,
  currentPageItems,
  renderPaginationNums,
  currentPage,
  nextPage,
  previousPage,
  goToPage,
} = usePagination(sortedList, pageLimitSize);

const handlePageLimitSizeChange = (value: number) => {
  pageLimitSize.value = value;
  reportStore.setPageLimitSize(value);
  goToPage(1);
};

/* --------------------------------------
 * Save state
 * -------------------------------------- */
const saveReportState = () => {
  reportStore.setReportData(reportData.value);
  reportStore.setSummaryEntries([...summaryEntries.value]);
  reportStore.setTableSections([...tableSections.value]);
  reportStore.setSelectedSectionKey(selectedSectionKey.value);
  reportStore.setList([...list.value]);
  reportStore.setCurrentPage(currentPage.value);
  reportStore.setPageLimitSize(pageLimitSize.value);
  reportStore.setSort(sortKey.value, sortOrder.value);
};

/* --------------------------------------
 * Query
 * -------------------------------------- */
const onSubmit = async (values: any) => {
  const condition: any = {
    startDate: values.startDate ?? '',
    endDate: values.endDate ?? '',
    storeId: values.storeId ?? '',
  };

  forbiddenMessage.value = '';
  loading.value = true;

  try {
    const req: any = {
      sortBy: 'createdAt',
      sortOrder: 'DESC',
      condition: {
        startDate: condition.startDate,
        endDate: condition.endDate,
        ...(condition.storeId ? { storeId: condition.storeId } : {}),
      },
    };

    await query(async () => {
      const res = await getStorePerformanceReport(req);
      const data = (res as any)?.data ?? res;

      reportData.value = data;
      summaryEntries.value = buildSummaryEntries(data);
      tableSections.value = buildTableSections(data);

      const exists = tableSections.value.some(
        (item: any) => item.key === selectedSectionKey.value,
      );

      selectedSectionKey.value = exists
        ? selectedSectionKey.value
        : tableSections.value[0]?.key || '';

      const rows =
        tableSections.value.find(
          (item: any) => item.key === selectedSectionKey.value,
        )?.rows ?? [];

      return rows;
    });

    reportStore.setSearchCondition(condition);
    saveReportState();

    await nextTick();
    goToPage(1);
    isSearch.value = true;
  } catch (error: any) {
    if (isAxiosError(error) && error.response?.status === 403) {
      forbiddenMessage.value = '無權查詢其他店家報表，請使用可存取的店家條件。';
      list.value = [];
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
};

/* --------------------------------------
 * Lifecycle
 * -------------------------------------- */
onMounted(async () => {
  await loadStoreOptions();

  if (reportStore.list.length > 0 && !reportStore.shouldRefresh) {
    reportData.value = reportStore.reportData;
    summaryEntries.value = [...reportStore.summaryEntries];
    tableSections.value = [...reportStore.tableSections];
    selectedSectionKey.value = reportStore.selectedSectionKey;
    list.value = [...reportStore.list];

    initValues.value = {
      ...initValues.value,
      ...reportStore.searchCondition,
    };

    await nextTick();
    formRef.value?.setValues(initValues.value);

    sortKey.value = reportStore.sortKey || '';
    sortOrder.value = reportStore.sortOrder || 'asc';
    pageLimitSize.value = reportStore.pageLimitSize;

    await nextTick();
    goToPage(reportStore.currentPage);

    isSearch.value = true;
    reportStore.resetAll();
    return;
  }

  const condition = reportStore.shouldRefresh
    ? {
        ...initValues.value,
        ...reportStore.searchCondition,
      }
    : {
        ...initValues.value,
      };

  initValues.value = { ...condition };

  await nextTick();
  formRef.value?.setValues(condition);

  await onSubmit(condition);
  reportStore.resetAll();
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as tokens;

.spr {
  &__header-action {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 12px;
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

  &__forbidden {
    margin: 12px 0;
    padding: 10px 12px;
    border: 1px solid color.mix(#f59e0b, #fff, 42%);
    border-radius: tokens.$form-radius;
    background: color.mix(#f59e0b, #fff, 88%);
    color: #92400e;
    font-size: 13px;
    font-weight: 700;
  }

  &__state {
    margin-top: 16px;
    color: tokens.$form-muted;
    font-size: 14px;
  }

  &__cards {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 12px;
  }

  &__card {
    min-width: 180px;
    padding: 12px;
    border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
    border-radius: 14px;
    background: color.mix(tokens.$brand-light, #fff, 8%);
  }

  &__card-label {
    margin: 0 0 4px;
    color: tokens.$form-muted;
    font-size: 12px;
  }

  &__card-value {
    margin: 0;
    color: tokens.$form-text;
    font-size: 18px;
    font-weight: 800;
  }

  &__section-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 12px 0;
  }

  &__section-tab {
    min-height: 32px;
    padding: 0 14px;
    border: 1px solid color.mix(tokens.$form-border, #fff, 52%);
    border-radius: 999px;
    background: tokens.$form-bg;
    color: tokens.$ink-800;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;

    span {
      margin-left: 6px;
      color: tokens.$form-muted;
      font-size: 12px;
    }

    &:hover {
      border-color: tokens.$brand;
      background: tokens.$brand-light;
      color: tokens.$brand-dark;
    }

    &--active {
      border-color: tokens.$brand;
      background: tokens.$brand;
      color: #fff;

      span {
        color: #fff;
      }
    }
  }
}

@media (max-width: 768px) {
  .spr {
    &__header-action {
      justify-content: flex-start;
    }

    &__count {
      align-self: flex-start;
    }
  }
}
</style>

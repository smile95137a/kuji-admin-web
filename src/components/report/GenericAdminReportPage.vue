<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { isAxiosError } from 'axios';

import MCard from '@/components/common/MCard.vue';
import ReportFilterBar from '@/components/report/ReportFilterBar.vue';
import ReportTable from '@/components/common/ReportTable.vue';

import { useAuthStore } from '@/stores';
import { useDialogStore } from '@/stores/dialogStore';
import { useReportFilter } from '@/composables/useReportFilter';
import { getStoreOptions, toSelectOptions } from '@/services/adminStoreService';
import type { QueryReq } from '@/services/adminReportService';
import { getErrorMessage } from '@/utils/ErrorUtils';

type StoreOption = { label: string; value: string };

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

const props = defineProps<{
  title: string;
  fetchReportApi: (req: QueryReq<Record<string, any>>) => Promise<ApiResponse<any>>;
}>();

const authStore = useAuthStore();
const dialogStore = useDialogStore();
const { dateRange } = useReportFilter();

const reportData = ref<Record<string, any> | null>(null);
const tableSections = ref<TableSection[]>([]);
const storeOptions = ref<StoreOption[]>([]);
const selectedStoreId = ref('');
const forbiddenMessage = ref('');
const loading = ref(false);

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
  () => roleSet.value.has('ROLE_ADMIN') || roleSet.value.has('ADMIN')
);

const summaryEntries = computed(() => {
  if (!reportData.value) return [];
  return Object.entries(reportData.value)
    .filter(([, value]) => {
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

  const entries = Object.entries(data).filter(([, value]) =>
    Array.isArray(value)
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
        ...(filter.storeId ? { storeId: filter.storeId } : {}),
      },
    };
    const res = await props.fetchReportApi(req);
    const data = (res as any)?.data ?? res;
    reportData.value = data as Record<string, any>;
    tableSections.value = buildTableSections(data);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403) {
      forbiddenMessage.value = '無權查詢其他店家報表，請使用可存取的店家條件。';
      return;
    }
    await dialogStore.openInfoDialog({
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
    <p class="form__text form__text--title">{{ title }}</p>

    <ReportFilterBar
      :show-store-filter="true"
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

      <div
        v-for="section in tableSections"
        :key="section.key"
        class="m-t-20"
      >
        <p class="form__text form__text--red m-b-8">{{ section.title }}</p>
        <ReportTable
          :columns="section.columns"
          :items="section.rows"
          row-key="__rowKey"
          :useWidthClass="true"
        />
      </div>

      <div
        v-if="!summaryEntries.length && !tableSections.length"
        class="rp__state m-t-16"
      >
        無資料
      </div>
    </div>
  </MCard>
</template>

<style scoped lang="scss">
.rp {
  &__state {
    color: #6b7280;
    font-size: 14px;
  }

  &__forbidden {
    color: #b45309;
    background: #fffbeb;
    border: 1px solid #fcd34d;
    border-radius: 6px;
    padding: 10px 12px;
    font-size: 13px;
  }

  &__cards {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  &__card {
    min-width: 180px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px;
    background: #f9fafb;
  }

  &__card-label {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 4px;
  }

  &__card-value {
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
  }
}
</style>

<!-- src/views/systemLog/SystemLogList.vue -->
<template>
  <MCard>
    <Form
      ref="formRef"
      :initial-values="initValues"
      @submit="onSubmit"
      v-slot="{ values, setFieldValue }"
    >
      <FormTitle title="系統日誌" />

      <div class="flex flex-wrap">
        <!-- 查詢模式 -->
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="查詢模式"
            :modelValue="values.queryMode"
            @update:modelValue="setFieldValue('queryMode', $event)"
            :options="queryModeOptions"
          />
        </div>

        <!-- limit -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="筆數（limit）"
            type="number"
            :modelValue="values.limit"
            @update:modelValue="setFieldValue('limit', $event)"
            placeholder="預設 100"
          />
        </div>

        <!-- logType -->
        <div class="w-50 w-md-100 p-6" v-if="values.queryMode === 'TYPE'">
          <FormInput
            label="Log Type"
            :modelValue="values.logType"
            @update:modelValue="setFieldValue('logType', $event)"
            placeholder="例如：LOGIN / ORDER / ADMIN_ACTION ..."
          />
        </div>

        <!-- userId -->
        <div class="w-50 w-md-100 p-6" v-if="values.queryMode === 'USER'">
          <FormInput
            label="User ID"
            :modelValue="values.userId"
            @update:modelValue="setFieldValue('userId', $event)"
            placeholder="輸入 userId"
          />
        </div>

        <!-- date range -->
        <div class="w-50 w-md-100 p-6" v-if="values.queryMode === 'DATE_RANGE'">
          <FormInput
            label="開始時間"
            type="datetime-local"
            :modelValue="values.start"
            @update:modelValue="setFieldValue('start', $event)"
          />
        </div>

        <div class="w-50 w-md-100 p-6" v-if="values.queryMode === 'DATE_RANGE'">
          <FormInput
            label="結束時間"
            type="datetime-local"
            :modelValue="values.end"
            @update:modelValue="setFieldValue('end', $event)"
          />
        </div>
      </div>

      <div class="flex justify-center m-y-8 gap-x-12 flex-wrap">
        <MButton type="submit">查詢</MButton>

        <!-- 清除過期日誌 -->
        <MButton type="button" class="mbtn--red" @click="cleanupLogs">
          清除過期日誌
        </MButton>
      </div>
    </Form>
  </MCard>

  <div class="m-t-12">
    <MCard>
      <template v-if="!hasData">
        <NoData :message="noDataMessage" />
      </template>

      <template v-else>
        <ReportTable
          class="m-t-12"
          :columns="columns"
          :items="currentPageItems"
          row-key="id"
          :useWidthClass="true"
          :sort-key="sortKey"
          :sort-order="sortOrder"
          @sort="handleSort"
        >
          <!-- createdAt -->
          <template #cell-createdAt="{ item }">
            <DateFormatter
              v-if="item.createdAt"
              :date="item.createdAt"
              format="YYYY-MM-DD HH:mm:ss"
            />
            <span v-else>-</span>
          </template>

          <!-- updatedAt -->
          <template #cell-updatedAt="{ item }">
            <DateFormatter
              v-if="item.updatedAt"
              :date="item.updatedAt"
              format="YYYY-MM-DD HH:mm:ss"
            />
            <span v-else>-</span>
          </template>

          <!-- message（太長就截斷） -->
          <template #cell-message="{ item }">
            <span :title="item.message || ''">
              {{ truncate(item.message) }}
            </span>
          </template>
        </ReportTable>

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
            @update:pageLimitSize="pageLimitSize = $event"
          />
        </div>
      </template>
    </MCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { Form, FormContext } from 'vee-validate';

import { usePagination } from '@/hook/usePagination';
import { useSearchPage } from '@/hook/useSearchPage';
import { compareByKeySmart } from '@/utils/sortUtils';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import NoData from '@/components/common/NoData.vue';
import Pagination from '@/components/common/Pagination.vue';
import ReportTable from '@/components/common/ReportTable.vue';
import FormTitle from '@/components/common/FormTitle.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import DateFormatter from '@/components/common/DateFormatter.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { useDialogStore } from '@/stores';

import {
  getSystemLogsByType,
  getSystemLogsByUserId,
  getSystemLogsByDateRange,
  cleanupOldSystemLogs,
} from '@/services/adminSystemLogService';

/* ==============================
 * Store
 * ============================== */
const dialogStore = useDialogStore();

/* ==============================
 * Form
 * ============================== */
const formRef = ref<FormContext | null>(null);

const initValues = ref<any>({
  queryMode: 'TYPE', // TYPE / USER / DATE_RANGE
  logType: '',
  userId: '',
  start: '',
  end: '',
  limit: 100,
  cleanupDays: 90,
});

const queryModeOptions: SelectOption[] = [
  { label: '依類型（logType）', value: 'TYPE' },
  { label: '依使用者（userId）', value: 'USER' },
  { label: '依時間區間（start/end）', value: 'DATE_RANGE' },
];

/* ==============================
 * Search Hook (local list)
 * ============================== */
const { list, hasData, isSearch, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

/* ==============================
 * Utils
 * ============================== */
const normalizeToBackendLocalDateTime = (v?: string | null) => {
  if (!v) return '';
  // datetime-local: 2026-01-15T10:30 -> 後端 ISO.DATE_TIME 建議補秒
  if (String(v).length === 16) return `${v}:00`;
  return String(v);
};

const unwrapArray = (res: any) => {
  // 可能是：List<SystemLog> 或 ApiResponse{ success,data }
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

const truncate = (s?: string, max = 60) => {
  const t = String(s ?? '');
  if (!t) return '-';
  if (t.length <= max) return t;
  return `${t.slice(0, max)}...`;
};

/* ==============================
 * Sorting
 * ============================== */
const sortKey = ref('');
const sortOrder = ref<'asc' | 'desc' | ''>('asc');

const handleSort = ({ key, order }: any) => {
  sortKey.value = key;
  sortOrder.value = order;
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
    })
  );
  return arr;
});

/* ==============================
 * Pagination
 * ============================== */
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

/* ==============================
 * Columns
 * ============================== */
/**
 * SystemLog 欄位你沒貼 entity，我用最常見欄位先做：
 * id / logType / userId / message / createdAt / updatedAt
 *
 * 如果你 entity 還有 ip、action、payload、path 等，
 * 你只要再補 columns + template 就好
 */
const columns = [
  { field: 'logType', label: '類型', width: 140, sortable: true },
  { field: 'userId', label: '使用者', width: 220, sortable: true },
  { field: 'message', label: '訊息', width: 360, sortable: true },
  { field: 'createdAt', label: '建立時間', width: 160, sortable: true },
  { field: 'updatedAt', label: '更新時間', width: 160, sortable: true },
];

/* ==============================
 * Submit (Query)
 * ============================== */
const onSubmit = async (values: any) => {
  await query(async () => {
    const mode = String(values?.queryMode || 'TYPE');
    const limit = Number(values?.limit || 100);

    if (mode === 'TYPE') {
      const logType = String(values?.logType || '').trim();
      if (!logType) {
        list.value = [];
        return;
      }

      const res = await getSystemLogsByType(logType, limit);
      list.value = unwrapArray(res);
      return;
    }

    if (mode === 'USER') {
      const userId = String(values?.userId || '').trim();
      if (!userId) {
        list.value = [];
        return;
      }

      const res = await getSystemLogsByUserId(userId, limit);
      list.value = unwrapArray(res);
      return;
    }

    // DATE_RANGE
    const start = normalizeToBackendLocalDateTime(values?.start);
    const end = normalizeToBackendLocalDateTime(values?.end);

    if (!start || !end) {
      list.value = [];
      return;
    }

    const res = await getSystemLogsByDateRange(start, end, limit);
    list.value = unwrapArray(res);
  });

  goToPage(1);
};

/* ==============================
 * Cleanup
 * ============================== */
const cleanupLogs = async () => {
  // 你要 days 可改成 input 欄位，這裡先用預設 90
  const days = 90;

  const ok = await dialogStore.openConfirmDialog({
    title: '清除確認',
    message: `確定要清除 ${days} 天前的系統日誌嗎？（不可復原）`,
  });
  if (!ok) return;

  await executeApi({
    fn: async () => cleanupOldSystemLogs(days),
    onSuccess: async (data: any) => {
      // 可能回 int 或 ApiResponse{data:int}
      const deleted = (data as any)?.data ?? data ?? 0;

      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: `清除完成：共刪除 ${deleted} 筆日誌`,
        iconType: 'success',
      });

      // 清除完順便刷新一次
      const values = formRef.value?.values || initValues.value;
      await onSubmit(values);
    },
    showSuccessDialog: false,
  });
};

/* ==============================
 * Lifecycle
 * ============================== */
onMounted(async () => {
  await nextTick();
  isSearch.value = false;
  list.value = [];
});
</script>

<style scoped></style>

<!-- src/views/rechargePlan/RechargePlanList.vue -->
<template>
  <MCard>
    <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
      <FormTitle title="儲值方案管理" />

      <RechargePlanSearchForm />

      <div class="flex justify-center m-y-8">
        <MButton type="submit">查詢</MButton>
      </div>
    </Form>
  </MCard>

  <div class="m-t-12">
    <MCard>
      <div class="flex justify-end gap-x-12 flex-wrap">
        <MButton @click="navigateToAdd">新增</MButton>

        <MButton
          class="mbtn--red"
          :disabled="!canDelete"
          @click="deleteSelected"
        >
          刪除
        </MButton>
      </div>

      <template v-if="!hasData">
        <NoData :message="noDataMessage" />
      </template>

      <template v-else>
        <ReportTable
          class="m-t-12"
          :columns="columns"
          :items="currentPageItems"
          row-key="id"
          selectable
          selection-type="checkbox"
          :show-select-all="true"
          v-model:selected="selectedIds"
          :useWidthClass="true"
          :sort-key="sortKey"
          @sort="handleSort"
        >
          <template #cell-name="{ item }">
            <span class="clickable" @click="navigateToEdit(item)">
              {{ item.name || '-' }}
            </span>
          </template>

          <template #cell-amount="{ item }">
            <span>{{ formatMoney(item.amount) }}</span>
          </template>

          <template #cell-goldCoins="{ item }">
            <span>{{ formatMoney(item.goldCoins) }}</span>
          </template>

          <template #cell-bonusCoins="{ item }">
            <span>{{ formatMoney(item.bonusCoins) }}</span>
          </template>

          <template #cell-bonusPercentage="{ item }">
            <span>{{ item.bonusPercentage || '-' }}</span>
          </template>

          <template #cell-isActive="{ item }">
            <span>{{ statusText(item.isActive) }}</span>
          </template>

          <template #cell-displayOrder="{ item }">
            <span>{{ item.displayOrder ?? '-' }}</span>
          </template>

          <template #cell-startTime="{ item }">
            <DateFormatter
              v-if="item.startTime"
              :date="item.startTime"
              format="YYYY-MM-DD HH:mm:ss"
            />
            <span v-else>-</span>
          </template>

          <template #cell-endTime="{ item }">
            <DateFormatter
              v-if="item.endTime"
              :date="item.endTime"
              format="YYYY-MM-DD HH:mm:ss"
            />
            <span v-else>-</span>
          </template>

          <template #cell-updatedAt="{ item }">
            <DateFormatter
              v-if="item.updatedAt"
              :date="item.updatedAt"
              format="YYYY-MM-DD HH:mm:ss"
            />
            <span v-else>-</span>
          </template>

          <template #cell-actions="{ item }">
            <div class="flex gap-x-8 flex-wrap">
              <MButton size="sm" @click="navigateToEdit(item)">編輯</MButton>
              <MButton size="sm" variant="danger" @click="deleteOne(item)">
                刪除
              </MButton>
            </div>
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
/* ==============================
 * Imports
 * ============================== */
import { ref, computed, onMounted, nextTick } from 'vue';
import { Form, FormContext } from 'vee-validate';
import { useRouter } from 'vue-router';

import { usePagination } from '@/hook/usePagination';
import { useSearchPage } from '@/hook/useSearchPage';
import { compareByKeySmart } from '@/utils/sortUtils';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import NoData from '@/components/common/NoData.vue';
import Pagination from '@/components/common/Pagination.vue';
import ReportTable from '@/components/common/ReportTable.vue';
import FormTitle from '@/components/common/FormTitle.vue';
import DateFormatter from '@/components/common/DateFormatter.vue';

import RechargePlanSearchForm from '@/components/rechargePlan/RechargePlanSearchForm.vue';

import { useDialogStore } from '@/stores';
import { executeApi } from '@/utils/executeApiUtils';

import {
  queryRechargePlans,
  deleteRechargePlan,
} from '@/services/adminRechargePlanService';

/* ==============================
 * Router / Store
 * ============================== */
const router = useRouter();
const dialogStore = useDialogStore();

/* ==============================
 * Form & InitValues
 * ============================== */
const formRef = ref<FormContext | null>(null);

// 後端目前 list 是全查：先保留給 UI（之後你要做前端過濾也可）
const initValues = ref<any>({
  keyword: '',
});

/* ==============================
 * Search Hook (local list)
 * ============================== */
const { list, hasData, isSearch, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

const loadSelectOptions = async () => {
  await nextTick();
};

/* ==============================
 * Utils
 * ============================== */
const formatMoney = (n: any) => {
  const num = Number(n);
  if (Number.isNaN(num)) return n ?? '-';
  return num.toLocaleString('zh-TW');
};

const statusText = (isActive?: boolean) => (isActive ? '啟用' : '停用');

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
 * Table Columns（對齊你回傳的欄位）
 * ============================== */
const columns = [
  { field: 'displayOrder', label: '排序', width: 80, sortable: true },
  { field: 'name', label: '方案名稱', width: 200, sortable: true },
  { field: 'amount', label: '儲值金額', width: 120, sortable: true },
  { field: 'goldCoins', label: '金幣', width: 100, sortable: true },
  { field: 'bonusCoins', label: '贈送', width: 100, sortable: true },
  { field: 'bonusPercentage', label: '加碼%', width: 100, sortable: true },
  { field: 'isActive', label: '狀態', width: 100, sortable: true },
  { field: 'startTime', label: '開始時間', width: 170, sortable: true },
  { field: 'endTime', label: '結束時間', width: 170, sortable: true },
  { field: 'updatedAt', label: '更新時間', width: 170, sortable: true },
  { field: 'actions', label: '操作', width: 200 },
];

/* ==============================
 * Submit (Query)
 * ============================== */
const onSubmit = async (_values: any) => {
  // 後端：GET /admin/recharge-plan/list
  await query(() => queryRechargePlans());
  goToPage(1);
  isSearch.value = true;
};

/* ==============================
 * Selection / Delete
 * ============================== */
const selectedIds = ref<string[]>([]);

const selectedRows = computed(() =>
  list.value.filter((row: any) => selectedIds.value.includes(row.id))
);

const canDelete = computed(() => selectedRows.value.length > 0);

const refresh = async () => {
  const values = formRef.value?.values || initValues.value;
  await onSubmit(values);
  selectedIds.value = [];
};

const deleteOne = async (item: any) => {
  const ok = await dialogStore.openConfirmDialog({
    title: '刪除確認',
    message: `確定要刪除「${item?.name || '-'}」嗎？（刪除後無法復原）`,
  });
  if (!ok) return;

  await executeApi({
    fn: async () => deleteRechargePlan(item.id),
    onSuccess: async () => {
      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '刪除成功',
        iconType: 'success',
      });
      await refresh();
    },
    showSuccessDialog: false,
  });
};

const deleteSelected = async () => {
  if (!canDelete.value) return;

  const ok = await dialogStore.openConfirmDialog({
    title: '刪除確認',
    message: `確定要刪除選中的 ${selectedIds.value.length} 筆儲值方案嗎？（刪除後無法復原）`,
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(selectedIds.value.map((id) => deleteRechargePlan(id))),
    onSuccess: async (results: any[]) => {
      const okCount = results.filter((x) => x.status === 'fulfilled').length;
      const failCount = results.length - okCount;

      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message:
          failCount > 0
            ? `刪除完成：成功 ${okCount}、失敗 ${failCount}`
            : `刪除完成：成功 ${okCount}`,
        iconType: failCount > 0 ? 'warning' : 'success',
      });

      await refresh();
    },
    showSuccessDialog: false,
  });
};

/* ==============================
 * Navigation
 * ============================== */
const navigateToAdd = () => router.push('/home/recharge-plan/add');
const navigateToEdit = (item: any) =>
  router.push(`/home/recharge-plan/edit/${item.id}`);

/* ==============================
 * Lifecycle
 * ============================== */
onMounted(async () => {
  await loadSelectOptions();
  await onSubmit(initValues.value);
});
</script>

<style scoped></style>

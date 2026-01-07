<!-- src/views/lottery/LotteryList.vue -->
<template>
  <MCard>
    <Form
      ref="formRef"
      :initial-values="initValues"
      @submit="onSubmit"
      v-slot="{ values, setFieldValue }"
    >
      <FormTitle title="商品管理" />

      <div class="flex flex-wrap">
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="狀態"
            :modelValue="values.status"
            @update:modelValue="setFieldValue('status', $event)"
            :options="statusOptions"
            :showAll="true"
            allLabel="全部"
            :allValue="''"
          />
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="標題"
            :modelValue="values.title"
            @update:modelValue="setFieldValue('title', $event)"
            placeholder="輸入標題關鍵字"
          />
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="關鍵字"
            :modelValue="values.keyword"
            @update:modelValue="setFieldValue('keyword', $event)"
            placeholder="keyword"
          />
        </div>

        <div class="w-50 w-md-100 p-6" v-if="isAdmin">
          <FormInput
            label="店家 ID（Admin 可選）"
            :modelValue="values.storeId"
            @update:modelValue="setFieldValue('storeId', $event)"
            placeholder="想只看某店家才輸入"
          />
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="建立時間起"
            type="date"
            :modelValue="values.createdAtStart"
            @update:modelValue="setFieldValue('createdAtStart', $event)"
          />
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="建立時間迄"
            type="date"
            :modelValue="values.createdAtEnd"
            @update:modelValue="setFieldValue('createdAtEnd', $event)"
          />
        </div>
      </div>

      <div class="flex justify-center m-y-8">
        <MButton type="submit">查詢</MButton>
      </div>
    </Form>
  </MCard>

  <div class="m-t-12">
    <MCard>
      <div class="flex justify-end gap-x-12 flex-wrap">
        <MButton @click="navigateToAdd">新增</MButton>

        <MButton :disabled="!canOffShelf" @click="offShelfSelected">
          下架
        </MButton>

        <MButton :disabled="!canOnShelf" @click="onShelfSelected">
          上架
        </MButton>

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
          <template #cell-title="{ item }">
            <span class="clickable" @click="navigateToEdit(item)">
              {{ item.title || '-' }}
            </span>
          </template>

          <template #cell-status="{ item }">
            <span>{{ statusText(item.status) }}</span>
          </template>

          <template #cell-updatedAt="{ item }">
            <span>{{ formatDateTime(item.updatedAt) }}</span>
          </template>

          <template #cell-createdAt="{ item }">
            <span>{{ formatDateTime(item.createdAt) }}</span>
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
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';

import { useDialogStore, useAuthStore } from '@/stores';
import { executeApi } from '@/utils/executeApiUtils';
import { useLotteryStore } from '@/stores/lottery/useLotteryStore';

import {
  queryLotteries,
  onShelfLottery,
  offShelfLottery,
  deleteLottery,
} from '@/services/AdminLotteryService';

const router = useRouter();
const dialogStore = useDialogStore();
const authStore = useAuthStore();
const lotteryStore = useLotteryStore();

const isAdmin = computed(() => {
  const roles = authStore.user?.roles || authStore.user?.authorities || [];
  const codes = Array.isArray(roles)
    ? roles.map((r: any) => r?.code || r).filter(Boolean)
    : [roles];
  return codes.some(
    (x: any) => String(x).includes('ROLE_ADMIN') || String(x).includes('ADMIN')
  );
});

const formRef = ref<FormContext | null>(null);

const initValues = ref<any>({
  status: '',
  title: '',
  keyword: '',
  storeId: '',
  createdAtStart: '',
  createdAtEnd: '',
});

const { list, hasData, isSearch, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

const statusOptions = ref<SelectOption[]>([
  { label: '全部', value: '' },
  { label: '上架', value: 'ON_SHELF' },
  { label: '下架', value: 'OFF_SHELF' },
]);

const formatDateTime = (v?: string) => (v ? String(v).replace('T', ' ') : '-');

const statusText = (s?: string) =>
  s === 'ON_SHELF' ? '上架' : s === 'OFF_SHELF' ? '下架' : s ? String(s) : '-';

const loadSelectOptions = async () => {
  await nextTick();
};

const filterRows = (rows: any[], cond: any) => {
  const status = String(cond?.status || '').trim();
  const title = String(cond?.title || '')
    .trim()
    .toLowerCase();
  const keyword = String(cond?.keyword || '')
    .trim()
    .toLowerCase();
  const storeId = String(cond?.storeId || '').trim();

  const start = String(cond?.createdAtStart || '').trim();
  const end = String(cond?.createdAtEnd || '').trim();

  return (rows || []).filter((r) => {
    const hitStatus = !status || String(r?.status || '') === status;

    const hitTitle =
      !title ||
      String(r?.title || '')
        .toLowerCase()
        .includes(title);

    const hitKeyword =
      !keyword ||
      String(r?.title || '')
        .toLowerCase()
        .includes(keyword) ||
      String(r?.description || r?.content || '')
        .toLowerCase()
        .includes(keyword);

    const hitStore = !storeId || String(r?.storeId || '') === storeId;

    const createdAt = String(r?.createdAt || '');
    const hitStart = !start || createdAt >= `${start}T00:00:00`;
    const hitEnd = !end || createdAt <= `${end}T23:59:59`;

    return (
      hitStatus && hitTitle && hitKeyword && hitStore && hitStart && hitEnd
    );
  });
};

const doQuery = async (condition: any) => {
  lotteryStore.setSearchCondition(condition);

  await query(async () => {
    const req = { condition };
    const res = await queryLotteries(req);
  });

  list.value = filterRows(list.value, condition);
};

const onSubmit = async (values: any) => {
  await doQuery(values);
  goToPage(1);
  selectedIds.value = [];
};

/* Sorting */
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

/* Pagination */
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

/* Columns（先用常見欄位；你 LotteryRes 若有 price/orderNum 等再加） */
const columns = [
  { field: 'title', label: '標題', width: 260, sortable: true },
  { field: 'status', label: '狀態', width: 100, sortable: true },
  { field: 'storeId', label: '店家ID', width: 220, sortable: true },
  { field: 'updatedAt', label: '更新時間', width: 160, sortable: true },
  { field: 'createdAt', label: '建立時間', width: 160, sortable: true },
];

/* Selection / Bulk */
const selectedIds = ref<string[]>([]);

const selectedRows = computed(() =>
  list.value.filter((row: any) => selectedIds.value.includes(row.id))
);

const canOnShelf = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every((r: any) => r.status === 'OFF_SHELF')
);

const canOffShelf = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every((r: any) => r.status === 'ON_SHELF')
);

const canDelete = computed(() => selectedRows.value.length > 0);

const refresh = async () => {
  const values = formRef.value?.values || initValues.value;
  await onSubmit(values);
};

const onShelfSelected = async () => {
  if (!canOnShelf.value) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '只有「下架」的商品才能上架。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await dialogStore.openConfirmDialog({
    title: '上架確認',
    message: `確定要上架選中的 ${selectedIds.value.length} 筆商品嗎？`,
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(selectedIds.value.map((id) => onShelfLottery(id))),
    onSuccess: async (results: any[]) => {
      const okCount = results.filter((x) => x.status === 'fulfilled').length;
      const failCount = results.length - okCount;

      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message:
          failCount > 0
            ? `上架完成：成功 ${okCount}、失敗 ${failCount}`
            : `上架完成：成功 ${okCount}`,
        iconType: failCount > 0 ? 'warning' : 'success',
      });

      await refresh();
    },
    showSuccessDialog: false,
  });
};

const offShelfSelected = async () => {
  if (!canOffShelf.value) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '只有「上架」的商品才能下架。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await dialogStore.openConfirmDialog({
    title: '下架確認',
    message: `確定要下架選中的 ${selectedIds.value.length} 筆商品嗎？`,
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(selectedIds.value.map((id) => offShelfLottery(id))),
    onSuccess: async (results: any[]) => {
      const okCount = results.filter((x) => x.status === 'fulfilled').length;
      const failCount = results.length - okCount;

      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message:
          failCount > 0
            ? `下架完成：成功 ${okCount}、失敗 ${failCount}`
            : `下架完成：成功 ${okCount}`,
        iconType: failCount > 0 ? 'warning' : 'success',
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
    message: `確定要刪除選中的 ${selectedIds.value.length} 筆商品嗎？（刪除後無法復原）`,
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(selectedIds.value.map((id) => deleteLottery(id))),
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

/* Navigation（進表單前暫存） */
const stashStateAndGo = (path: string) => {
  lotteryStore.setList([...list.value]);
  lotteryStore.setSearchCondition(formRef.value?.values || {});
  lotteryStore.setSort(sortKey.value, sortOrder.value);
  lotteryStore.setCurrentPage(currentPage.value);
  lotteryStore.setPageLimitSize(pageLimitSize.value);
  router.push(path);
};

const navigateToAdd = () => stashStateAndGo('/home/lottery/add');
const navigateToEdit = (item: any) =>
  stashStateAndGo(`/home/lottery/edit/${item.id}`);

/* Lifecycle（回來 → 還原） */
onMounted(async () => {
  await loadSelectOptions();

  if (lotteryStore.list?.length > 0) {
    list.value = [...lotteryStore.list];

    initValues.value = { ...lotteryStore.searchCondition };
    if (formRef.value) formRef.value.setValues(lotteryStore.searchCondition);

    sortKey.value = lotteryStore.sortKey;
    sortOrder.value = (lotteryStore.sortOrder as any) || 'asc';
    pageLimitSize.value = lotteryStore.pageLimitSize;

    isSearch.value = true;
    await nextTick();
    goToPage(lotteryStore.currentPage);

    lotteryStore.resetAll();
    return;
  }

  await onSubmit(initValues.value);
});
</script>

<style scoped></style>

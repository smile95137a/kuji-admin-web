<!-- src/views/lottery/LotteryList.vue -->
<template>
  <!-- 查詢區 -->
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

      <!-- ✅ 查詢按鈕：比照 B02002，用權限控制 -->
      <div class="flex justify-center m-y-8">
        <MButton type="submit">查詢</MButton>
      </div>
    </Form>
  </MCard>

  <!-- 結果區 -->
  <div class="m-t-12">
    <MCard>
      <!-- ✅ 上方操作區（比照 B02002） -->
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
          :sort-order="sortOrder"
          @sort="handleSort"
        >
          <!-- 標題可點（進編輯） -->
          <template #cell-title="{ item }">
            <span class="clickable" @click="navigateToEdit(item)">
              {{ item.title || '-' }}
            </span>
          </template>

          <!-- 店家 -->
          <template #cell-storeName="{ item }">
            <span>{{ item.storeName || item.storeId || '-' }}</span>
          </template>

          <!-- 圖片 -->
          <template #cell-imageUrl="{ item }">
            <img
              v-if="item.imageUrl"
              :src="resolveImageUrl(item.imageUrl)"
              alt="lottery"
              style="width: 120px; height: auto; border-radius: 4px"
            />
            <span v-else>-</span>
          </template>

          <!-- 類別 -->
          <template #cell-categoryName="{ item }">
            <span>{{ item.categoryName || item.category || '-' }}</span>
          </template>

          <!-- 價格 -->
          <template #cell-pricePerDraw="{ item }">
            <span>{{ formatMoney(item.pricePerDraw) }}</span>
          </template>

          <template #cell-currentPrice="{ item }">
            <span>{{ formatMoney(item.currentPrice) }}</span>
          </template>

          <template #cell-discountedPrice="{ item }">
            <span>{{ formatMoney(item.discountedPrice) }}</span>
          </template>

          <!-- 抽數 -->
          <template #cell-totalDraws="{ item }">
            <span>{{ numberOrDash(item.totalDraws) }}</span>
          </template>

          <template #cell-remainingDraws="{ item }">
            <span>{{ numberOrDash(item.remainingDraws) }}</span>
          </template>

          <!-- 狀態 -->
          <template #cell-statusName="{ item }">
            <span>{{ item.statusName || statusText(item.status) }}</span>
          </template>

          <!-- ✅ 日期用 DateFormatter（統一格式） -->
          <template #cell-updatedAt="{ item }">
            <DateFormatter
              v-if="item.updatedAt"
              :date="item.updatedAt"
              format="YYYY-MM-DD HH:mm:ss"
            />
            <span v-else>-</span>
          </template>

          <template #cell-createdAt="{ item }">
            <DateFormatter
              v-if="item.createdAt"
              :date="item.createdAt"
              format="YYYY-MM-DD HH:mm:ss"
            />
            <span v-else>-</span>
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
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';

import DateFormatter from '@/components/common/DateFormatter.vue';

import { useDialogStore, useAuthStore } from '@/stores';
import { executeApi } from '@/utils/executeApiUtils';
import { useLotteryStore } from '@/stores/lottery/useLotteryStore';

import {
  queryLotteries,
  onShelfLottery,
  offShelfLottery,
  deleteLottery,
} from '@/services/AdminLotteryService';

/* ==============================
 * Permission / Router / Store
 * ============================== */
const router = useRouter();
const dialogStore = useDialogStore();
const authStore = useAuthStore();
const lotteryStore = useLotteryStore();

/* ==============================
 * isAdmin（沿用你原本邏輯）
 * ============================== */
const isAdmin = computed(() => {
  const roles = authStore.user?.roles || authStore.user?.authorities || [];
  const codes = Array.isArray(roles)
    ? roles.map((r: any) => r?.code || r).filter(Boolean)
    : [roles];
  return codes.some(
    (x: any) => String(x).includes('ROLE_ADMIN') || String(x).includes('ADMIN')
  );
});

/* ==============================
 * Form & InitValues
 * ============================== */
const formRef = ref<FormContext | null>(null);

const initValues = ref<any>({
  status: '',
  title: '',
  keyword: '',
  storeId: '',
  createdAtStart: '',
  createdAtEnd: '',
});

/* ==============================
 * Search Hook (local list)
 * ============================== */
const { list, hasData, isSearch, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

/* ==============================
 * Select Options
 * ============================== */
const statusOptions = ref<SelectOption[]>([
  { label: '上架', value: 'ON_SHELF' },
  { label: '下架', value: 'OFF_SHELF' },
]);

const loadSelectOptions = async () => {
  await nextTick();
};

/* ==============================
 * Utils
 * ============================== */
const API_BASE_URL =
  ((import.meta as any)?.env?.VITE_API_BASE_URL as string) || '';

const resolveImageUrl = (url?: string) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;

  if (API_BASE_URL) {
    const base = API_BASE_URL.replace(/\/$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
  }

  return url;
};

const statusText = (s?: string) =>
  s === 'ON_SHELF' ? '上架' : s === 'OFF_SHELF' ? '下架' : s ? String(s) : '-';

const numberOrDash = (v: any) => {
  if (v === 0) return '0';
  return v ? String(v) : '-';
};

const formatMoney = (v: any) => {
  if (v === 0) return '0';
  if (v === null || v === undefined || v === '') return '-';
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString('zh-TW');
};

/* ==============================
 * Sorting（比照 B02002 寫法）
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
 * Pagination（比照 B02002）
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
 * Table Columns（對齊 LotteryRes）
 * ============================== */
const columns = [
  { field: 'storeName', label: '店家', width: 160, sortable: true },
  { field: 'title', label: '標題', width: 260, sortable: true },
  { field: 'imageUrl', label: '圖片', width: 160 },
  { field: 'categoryName', label: '分類', width: 140, sortable: true },
  { field: 'pricePerDraw', label: '單抽價格', width: 110, sortable: true },
  { field: 'currentPrice', label: '目前價格', width: 110, sortable: true },
  { field: 'discountedPrice', label: '折扣價', width: 100, sortable: true },
  { field: 'totalDraws', label: '總抽數', width: 90, sortable: true },
  { field: 'remainingDraws', label: '剩餘抽數', width: 100, sortable: true },
  { field: 'orderNum', label: '排序', width: 80, sortable: true },
  { field: 'statusName', label: '狀態', width: 110, sortable: true },
  { field: 'updatedAt', label: '更新時間', width: 160, sortable: true },
  { field: 'createdAt', label: '建立時間', width: 160, sortable: true },
];

/* ==============================
 * Query（比照 B02002：onSubmit -> query() -> goToPage）
 * ============================== */
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

const onSubmit = async (values: any) => {
  await query(() => queryLotteries(values));
  goToPage(1);
  selectedIds.value = [];
};

/* ==============================
 * Selection / Bulk Actions
 * ============================== */
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

/* ==============================
 * Navigation（編輯 → 暫存）（比照 B02002）
 * ============================== */
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

/* ==============================
 * Lifecycle（回來 → 還原）（比照 B02002）
 * ============================== */
onMounted(async () => {
  await loadSelectOptions();

  if (lotteryStore.list?.length > 0) {
    list.value = [...lotteryStore.list];

    initValues.value = { ...lotteryStore.searchCondition };
    if (formRef.value) {
      formRef.value.setValues(lotteryStore.searchCondition);
    }

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

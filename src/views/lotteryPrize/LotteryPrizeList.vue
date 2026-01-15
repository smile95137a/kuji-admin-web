<!-- src/views/lotteryPrize/LotteryPrizeList.vue -->
<template>
  <MCard>
    <FormTitle title="獎項管理" />

    <div class="flex justify-between items-center flex-wrap gap-x-12 m-t-12">
      <div class="form__text">
        商品 ID：<b>{{ lotteryId }}</b>
      </div>

      <div class="flex justify-end gap-x-12 flex-wrap">
        <MButton @click="navigateToAdd">新增獎項</MButton>

        <MButton
          class="mbtn--red"
          :disabled="!canDelete"
          @click="deleteSelected"
        >
          刪除
        </MButton>

        <MButton class="mbtn--gray" @click="goBack">返回商品列表</MButton>
      </div>
    </div>
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
          selectable
          selection-type="checkbox"
          :show-select-all="true"
          v-model:selected="selectedIds"
          :useWidthClass="true"
          :sort-key="sortKey"
          :sort-order="sortOrder"
          @sort="handleSort"
        >
          <!-- 獎項名稱可點 -->
          <template #cell-name="{ item }">
            <span class="clickable" @click="navigateToEdit(item)">
              {{ item.name || '-' }}
            </span>
          </template>

          <!-- 等級 -->
          <template #cell-level="{ item }">
            <span>{{ item.level || '-' }}</span>
          </template>

          <!-- 圖片 -->
          <template #cell-imageUrl="{ item }">
            <img
              v-if="item.imageUrl"
              :src="resolveImageUrl(item.imageUrl)"
              alt="prize"
              style="width: 120px; height: auto; border-radius: 4px"
            />
            <span v-else>-</span>
          </template>

          <!-- 數量 -->
          <template #cell-totalQuantity="{ item }">
            <span>{{ numberOrDash(item.totalQuantity) }}</span>
          </template>

          <template #cell-remainingQuantity="{ item }">
            <span>{{ numberOrDash(item.remainingQuantity) }}</span>
          </template>

          <!-- 權重 -->
          <template #cell-weight="{ item }">
            <span>{{ numberOrDash(item.weight) }}</span>
          </template>

          <!-- 日期 -->
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
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';

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

import { executeApi } from '@/utils/executeApiUtils';
import { useDialogStore } from '@/stores';

import {
  getPrizesByLotteryId,
  deletePrize,
} from '@/services/adminLotteryPrizeService';

const route = useRoute();
const router = useRouter();
const dialogStore = useDialogStore();

const lotteryId = computed(() => String(route.params.lotteryId || ''));

/* local list hook */
const { list, hasData, isSearch, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

/* sorting */
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
    compareByKeySmart(a, b, sortKey.value, sortOrder.value as any, {
      type: 'auto',
      mode: 'big5',
      locale: 'zh-TW',
    })
  );
  return arr;
});

/* pagination */
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

/* columns（你後端 LotteryPrizeRes 欄位若不同可再改） */
const columns = [
  { field: 'level', label: '等級', width: 80, sortable: true },
  { field: 'name', label: '獎項名稱', width: 240, sortable: true },
  { field: 'imageUrl', label: '圖片', width: 160 },
  { field: 'totalQuantity', label: '總數量', width: 100, sortable: true },
  { field: 'remainingQuantity', label: '剩餘', width: 100, sortable: true },
  { field: 'weight', label: '權重', width: 90, sortable: true },
  { field: 'updatedAt', label: '更新時間', width: 160, sortable: true },
  { field: 'createdAt', label: '建立時間', width: 160, sortable: true },
];

/* selection */
const selectedIds = ref<string[]>([]);
const canDelete = computed(() => selectedIds.value.length > 0);

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

const numberOrDash = (v: any) => {
  if (v === 0) return '0';
  return v ? String(v) : '-';
};

/* load */
const load = async () => {
  if (!lotteryId.value) return;

  await query(async () => {
    const res = await getPrizesByLotteryId(lotteryId.value);
    // 依你 executeApi/ApiResponse 格式可能是 res.data
    return res;
  });

  // 如果你 query() 沒自動塞 list，你可以手動：
  // const data = (res as any)?.data ?? res;
  // list.value = Array.isArray(data) ? data : [];
};

const refresh = async () => {
  selectedIds.value = [];
  await load();
  goToPage(1);
};

/* actions */
const deleteSelected = async () => {
  if (!canDelete.value) return;

  const ok = await dialogStore.openConfirmDialog({
    title: '刪除確認',
    message: `確定要刪除選中的 ${selectedIds.value.length} 筆獎項嗎？（刪除後無法復原）`,
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(selectedIds.value.map((id) => deletePrize(id))),
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

/* navigation */
const navigateToAdd = () => {
  router.push(`/home/lottery/${lotteryId.value}/prizes/add`);
};

const navigateToEdit = (item: any) => {
  router.push(`/home/lottery/${lotteryId.value}/prizes/edit/${item.id}`);
};

const goBack = () => router.push('/home/lottery');

onMounted(async () => {
  await nextTick();
  await load();
});
</script>

<style scoped></style>

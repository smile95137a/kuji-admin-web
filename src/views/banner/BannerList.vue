<!-- src/views/banner/BannerList.vue -->
<template>
  <MCard>
    <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
      <FormTitle title="Banner 管理" />

      <BannerSearchForm :status-options="statusOptions" />

      <div class="flex justify-center m-y-8">
        <MButton type="submit">查詢</MButton>
      </div>
    </Form>
  </MCard>

  <div class="m-t-12">
    <MCard>
      <div class="flex justify-end gap-x-12">
        <MButton @click="navigateToAdd">新增</MButton>

        <MButton
          class="mbtn--red"
          :disabled="!canDelete"
          @click="deleteSelected"
        >
          刪除
        </MButton>

        <MButton :disabled="!canDisable" @click="disableSelected">下架</MButton>
        <MButton :disabled="!canEnable" @click="enableSelected">上架</MButton>
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
          <template #cell-title="{ item }">
            <span class="clickable" @click="navigateToEdit(item)">
              {{ item.title || '-' }}
            </span>
          </template>

          <template #cell-storeName="{ item }">
            <span>{{ item.storeName || item.storeId || '-' }}</span>
          </template>

          <template #cell-imageUrl="{ item }">
            <img
              v-if="item.imageUrl"
              :src="resolveImageUrl(item.imageUrl)"
              alt="banner"
              style="width: 120px; height: auto; border-radius: 4px"
            />
            <span v-else>-</span>
          </template>

          <template #cell-statusName="{ item }">
            <span :class="statusBadgeClass(item.status)">{{ item.statusName || statusText(item.status) }}</span>
          </template>

          <template #cell-startTime="{ item }">
            <span>{{ formatDateTime(item.startTime) }}</span>
          </template>

          <template #cell-endTime="{ item }">
            <span>{{ formatDateTime(item.endTime) }}</span>
          </template>

          <template #cell-updatedAt="{ item }">
            <span>{{ formatDateTime(item.updatedAt) }}</span>
          </template>

          <template #cell-actions="{ item }">
            <div class="flex gap-x-4">
              <MButton
                size="sm"
                :disabled="isFirstInList(item)"
                @click="moveUp(item)"
              >↑</MButton>
              <MButton
                size="sm"
                :disabled="isLastInList(item)"
                @click="moveDown(item)"
              >↓</MButton>
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
import BannerSearchForm from '@/components/banner/BannerSearchForm.vue';

import { useDialogStore } from '@/stores';
import { executeApi } from '@/utils/executeApiUtils';
import { useBannerStore } from '@/stores/banner/useBannerStore';

import {
  queryBanners,
  publishBanner,
  unpublishBanner,
  deleteBanner,
  updateBanner,
} from '@/services/adminBannerService';

/* ==============================
 * Permission / Router / Store
 * ============================== */
const router = useRouter();
const dialogStore = useDialogStore();
const bannerStore = useBannerStore();

/* ==============================
 * Form & InitValues
 * ============================== */
const formRef = ref<FormContext | null>(null);

// 依你的 BannerCondition 自行加欄位；先保持跟 SearchForm 會用到的
const initValues = ref<any>({
  status: '',
  title: '',
  storeId: '',
  keyword: '',
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
  { label: '上架', value: 'PUBLISHED' },
  { label: '下架', value: 'UNPUBLISHED' },
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

  // 若你有反向代理同網域，這樣也能顯示
  return url;
};

const formatDateTime = (v?: string) => {
  if (!v) return '-';
  return v.replace('T', ' ');
};

const statusText = (status?: string) =>
  status === 'PUBLISHED' ? '已上架' : status === 'UNPUBLISHED' ? '已下架' : status === 'SCHEDULED' ? '排程中' : '-';

const statusBadgeClass = (status?: string) => {
  if (status === 'PUBLISHED') return 'badge badge--green';
  if (status === 'SCHEDULED') return 'badge badge--blue';
  return 'badge badge--gray';
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
 * Table Columns（對齊你回傳的欄位）
 * ============================== */
const columns = [
  { field: 'storeName', label: '店家', width: 160, sortable: true },
  { field: 'title', label: '標題', width: 220, sortable: true },
  { field: 'imageUrl', label: '圖片', width: 160 },
  { field: 'orderNum', label: '排序', width: 80, sortable: true },
  { field: 'statusName', label: '狀態', width: 110, sortable: true },
  { field: 'startTime', label: '開始時間', width: 160, sortable: true },
  { field: 'endTime', label: '結束時間', width: 160, sortable: true },
  { field: 'updatedAt', label: '更新時間', width: 160, sortable: true },
  { field: 'actions', label: '排序', width: 110 },
];

/* ==============================
 * Submit (Query)
 * ============================== */
const onSubmit = async (values: any) => {
  // 你的後端是 POST /admin/banner/list，body: { condition: BannerCondition }
  const req = { condition: values };

  await query(() => queryBanners(req));
  goToPage(1);
};

/* ==============================
 * Selection / Bulk Actions
 * ============================== */
const selectedIds = ref<string[]>([]);

const selectedRows = computed(() =>
  list.value.filter((row: any) => selectedIds.value.includes(row.id))
);

const canEnable = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every((r: any) => r.status === 'UNPUBLISHED')
);

const canDisable = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every((r: any) => r.status === 'PUBLISHED')
);

const canDelete = computed(() => selectedRows.value.length > 0);

const isFirstInList = (item: any) => {
  const sorted = [...list.value].sort((a: any, b: any) => (a.orderNum ?? 0) - (b.orderNum ?? 0));
  return sorted[0]?.id === item.id;
};

const isLastInList = (item: any) => {
  const sorted = [...list.value].sort((a: any, b: any) => (a.orderNum ?? 0) - (b.orderNum ?? 0));
  return sorted[sorted.length - 1]?.id === item.id;
};

const moveUp = async (item: any) => {
  const sorted = [...list.value].sort((a: any, b: any) => (a.orderNum ?? 0) - (b.orderNum ?? 0));
  const idx = sorted.findIndex((x: any) => x.id === item.id);
  if (idx <= 0) return;
  const prev = sorted[idx - 1];
  const newOrder = (prev.orderNum ?? idx - 1);
  const prevOrder = (item.orderNum ?? idx);
  await executeApi({
    fn: async () => Promise.all([
      updateBanner(item.id, { orderNum: newOrder }),
      updateBanner(prev.id, { orderNum: prevOrder }),
    ]),
    onSuccess: async () => { await refresh(); },
    showSuccessDialog: false,
  });
};

const moveDown = async (item: any) => {
  const sorted = [...list.value].sort((a: any, b: any) => (a.orderNum ?? 0) - (b.orderNum ?? 0));
  const idx = sorted.findIndex((x: any) => x.id === item.id);
  if (idx < 0 || idx >= sorted.length - 1) return;
  const next = sorted[idx + 1];
  const newOrder = (next.orderNum ?? idx + 1);
  const nextOrder = (item.orderNum ?? idx);
  await executeApi({
    fn: async () => Promise.all([
      updateBanner(item.id, { orderNum: newOrder }),
      updateBanner(next.id, { orderNum: nextOrder }),
    ]),
    onSuccess: async () => { await refresh(); },
    showSuccessDialog: false,
  });
};

const refresh = async () => {
  const values = formRef.value?.values || initValues.value;
  await onSubmit(values);
  selectedIds.value = [];
};

const enableSelected = async () => {
  if (!canEnable.value) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '只有「下架(UNPUBLISHED)」的 Banner 才能上架。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await dialogStore.openConfirmDialog({
    title: '上架確認',
    message: '確定要上架選中的 Banner 嗎？',
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(selectedIds.value.map((id) => publishBanner(id))),
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

const disableSelected = async () => {
  if (!canDisable.value) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '只有「上架(PUBLISHED)」的 Banner 才能下架。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await dialogStore.openConfirmDialog({
    title: '下架確認',
    message: '確定要下架選中的 Banner 嗎？',
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(selectedIds.value.map((id) => unpublishBanner(id))),
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

  const publishedRows = selectedRows.value.filter((r: any) => r.status === 'PUBLISHED');
  if (publishedRows.length > 0) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: `選中的 ${publishedRows.length} 筆 Banner 目前為上架狀態，請先「取消發布」後再刪除。`,
      iconType: 'warning',
    });
    return;
  }

  const ok = await dialogStore.openConfirmDialog({
    title: '刪除確認',
    message: `確定要刪除選中的 ${selectedIds.value.length} 筆 Banner 嗎？（刪除後無法復原）`,
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(selectedIds.value.map((id) => deleteBanner(id))),
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
 * Navigation（編輯 → 暫存）
 * ============================== */
const navigateToEdit = (item: any) => {
  // 暫存：列表 + 搜尋條件 + 排序 + 分頁
  bannerStore.setList([...list.value]);
  bannerStore.setSearchCondition(formRef.value?.values || {});
  bannerStore.setSort(sortKey.value, sortOrder.value);
  bannerStore.setCurrentPage(currentPage.value);
  bannerStore.setPageLimitSize(pageLimitSize.value);

  router.push(`/home/banner/edit/${item.id}`);
};

const navigateToAdd = () => router.push('/home/banner/add');

/* ==============================
 * Lifecycle（回來 → 還原）
 * ============================== */
onMounted(async () => {
  await loadSelectOptions();

  // 若 store 有暫存，就還原
  if (bannerStore.list?.length > 0) {
    list.value = [...bannerStore.list];

    initValues.value = { ...bannerStore.searchCondition };
    if (formRef.value) {
      formRef.value.setValues(bannerStore.searchCondition);
    }

    sortKey.value = bannerStore.sortKey;
    sortOrder.value = (bannerStore.sortOrder as any) || 'asc';

    pageLimitSize.value = bannerStore.pageLimitSize;
    isSearch.value = true;

    await nextTick();
    goToPage(bannerStore.currentPage);

    bannerStore.resetAll();
    return;
  }

  // 沒暫存就查一次
  await onSubmit(initValues.value);
});
</script>

<style scoped></style>

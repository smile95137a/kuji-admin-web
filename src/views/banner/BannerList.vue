<!-- src/views/banner/BannerList.vue -->
<template>
  <MCard>
    <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
      <FormTitle title="Banner 管理" />

      <BannerSearchForm
        :status-options="statusOptions"
        :store-options="storeOptions"
      />

      <div class="flex justify-center m-y-8">
        <MButton type="submit">查詢</MButton>
      </div>
    </Form>
  </MCard>

  <div class="m-t-12">
    <MCard>
      <div class="flex justify-end gap-x-12 flex-wrap">
        <MButton @click="navigateToAdd">
          <font-awesome-icon icon="fa-plus" class="m-r-4" />
          新增
        </MButton>

        <MButton
          class="mbtn--red"
          :disabled="!canDelete"
          @click="deleteSelected"
        >
          <font-awesome-icon icon="fa-trash" class="m-r-4" />
          刪除
        </MButton>

        <MButton :disabled="!canDisable" @click="disableSelected">
          <font-awesome-icon icon="fa-eye-slash" class="m-r-4" />
          下架
        </MButton>

        <MButton :disabled="!canEnable" @click="enableSelected">
          <font-awesome-icon icon="fa-eye" class="m-r-4" />
          上架
        </MButton>

        <MButton variant="secondary" @click="toggleSortMode">
          <font-awesome-icon
            :icon="sortModeActive ? 'fa-xmark' : 'fa-arrow-up-wide-short'"
            class="m-r-4"
          />
          {{ sortModeActive ? '隱藏排序模式' : '拖曳排序' }}
        </MButton>
      </div>

      <BannerDragSort
        v-if="sortModeActive"
        class="m-t-12"
        :items="list"
        :saving="sortSaving"
        :api-base-url="API_BASE_URL"
        @save="submitSort"
        @cancel="exitSortMode"
      />

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
              class="bl__table-img"
            />
            <span v-else>-</span>
          </template>

          <template #cell-statusName="{ item }">
            <span :class="statusBadgeClass(item.status)">
              {{ item.statusName || statusText(item.status) }}
            </span>
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
              >
                <font-awesome-icon icon="fa-arrow-up" />
              </MButton>

              <MButton
                size="sm"
                :disabled="isLastInList(item)"
                @click="moveDown(item)"
              >
                <font-awesome-icon icon="fa-arrow-down" />
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
            @update:pageLimitSize="handlePageLimitSizeChange"
          />
        </div>
      </template>
    </MCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
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
import BannerDragSort from '@/components/banner/BannerDragSort.vue';

import { useDialogStore } from '@/stores';
import { executeApi } from '@/utils/executeApiUtils';
import { useBannerStore } from '@/stores/banner/useBannerStore';

import {
  queryBanners,
  publishBanner,
  unpublishBanner,
  deleteBanner,
  updateBanner,
  reorderBanners,
} from '@/services/adminBannerService';

import { getStoreOptions } from '@/services/adminStoreService';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

const router = useRouter();
const dialogStore = useDialogStore();
const bannerStore = useBannerStore();

/* --------------------------------------
 * Form
 * -------------------------------------- */
const formRef = ref<FormContext | null>(null);

const initValues = ref({
  status: '',
  title: '',
  storeId: '',
  createdAtStart: '',
  createdAtEnd: '',
});

/* --------------------------------------
 * Search list
 * -------------------------------------- */
const { list, hasData, isSearch, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

/* --------------------------------------
 * Select options
 * -------------------------------------- */
const statusOptions = ref<SelectOption[]>([
  { label: '上架', value: 'PUBLISHED' },
  { label: '下架', value: 'UNPUBLISHED' },
]);

const storeOptions = ref<SelectOption[]>([]);

const loadSelectOptions = async () => {
  await executeApi<any[]>({
    fn: () => getStoreOptions({ activeOnly: true }),
    onSuccess: (data: any) => {
      const arr = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];

      storeOptions.value = arr.map((s: any) => ({
        label: s.label ?? s.storeName ?? s.name ?? '-',
        value: s.value ?? s.id ?? '',
      }));
    },
    showSuccessDialog: false,
  });
};

/* --------------------------------------
 * Utils
 * -------------------------------------- */
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

const formatDateTime = (v?: string) => {
  if (!v) return '-';
  return String(v).replace('T', ' ');
};

const statusText = (status?: string) => {
  if (status === 'PUBLISHED') return '已上架';
  if (status === 'UNPUBLISHED') return '已下架';
  if (status === 'SCHEDULED') return '排程中';
  return '-';
};

const statusBadgeClass = (status?: string) => {
  if (status === 'PUBLISHED') return 'badge badge--green';
  if (status === 'SCHEDULED') return 'badge badge--blue';
  return 'badge badge--gray';
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
  goToPage(1);
};

/* --------------------------------------
 * Columns
 * -------------------------------------- */
const columns = [
  { field: 'storeName', label: '店家', width: 160, sortable: true },
  { field: 'title', label: '標題', width: 220, sortable: true },
  { field: 'imageUrl', label: '圖片', width: 160 },
  { field: 'orderNum', label: '排序', width: 80, sortable: true },
  { field: 'statusName', label: '狀態', width: 110, sortable: true },
  { field: 'startTime', label: '開始時間', width: 160, sortable: true },
  { field: 'endTime', label: '結束時間', width: 160, sortable: true },
  { field: 'updatedAt', label: '更新時間', width: 160, sortable: true },
  { field: 'actions', label: '快速排序', width: 120 },
];

/* --------------------------------------
 * Query
 * -------------------------------------- */
const onSubmit = async (values: any) => {
  const condition = {
    status: values.status ?? '',
    title: values.title ?? '',
    storeId: values.storeId ?? '',
    createdAtStart: values.createdAtStart ?? '',
    createdAtEnd: values.createdAtEnd ?? '',
  };

  await query(() => queryBanners({ condition }));

  bannerStore.setSearchCondition(condition);
  selectedIds.value = [];
  goToPage(1);
  isSearch.value = true;
};

const refresh = async () => {
  const values = formRef.value?.values || initValues.value;
  await onSubmit(values);
};

/* --------------------------------------
 * Selection
 * -------------------------------------- */
const selectedIds = ref<string[]>([]);

watch(
  selectedIds,
  (value) => {
    bannerStore.setSelectedIds([...value]);
  },
  { deep: true },
);

const selectedRows = computed(() =>
  list.value.filter((row: any) => selectedIds.value.includes(row.id)),
);

const enableTargetRows = computed(() =>
  selectedRows.value.filter((r: any) => r.status === 'UNPUBLISHED'),
);

const disableTargetRows = computed(() =>
  selectedRows.value.filter((r: any) => r.status === 'PUBLISHED'),
);

const canEnable = computed(
  () => enableTargetRows.value.length > 0,
);

const canDisable = computed(
  () => disableTargetRows.value.length > 0,
);

const canDelete = computed(() => selectedRows.value.length > 0);

/* --------------------------------------
 * Row sort up/down
 * -------------------------------------- */
const getOrderSortedList = () =>
  [...list.value].sort(
    (a: any, b: any) => (a.orderNum ?? 0) - (b.orderNum ?? 0),
  );

const isFirstInList = (item: any) => {
  const sorted = getOrderSortedList();
  return sorted[0]?.id === item.id;
};

const isLastInList = (item: any) => {
  const sorted = getOrderSortedList();
  return sorted[sorted.length - 1]?.id === item.id;
};

const moveUp = async (item: any) => {
  const sorted = getOrderSortedList();
  const idx = sorted.findIndex((x: any) => x.id === item.id);
  if (idx <= 0) return;

  const prev = sorted[idx - 1];
  const newOrder = prev.orderNum ?? idx - 1;
  const prevOrder = item.orderNum ?? idx;

  await executeApi({
    fn: async () =>
      Promise.all([
        updateBanner(item.id, { orderNum: newOrder }),
        updateBanner(prev.id, { orderNum: prevOrder }),
      ]),
    onSuccess: async () => {
      await refresh();
    },
    showSuccessDialog: false,
  });
};

const moveDown = async (item: any) => {
  const sorted = getOrderSortedList();
  const idx = sorted.findIndex((x: any) => x.id === item.id);
  if (idx < 0 || idx >= sorted.length - 1) return;

  const next = sorted[idx + 1];
  const newOrder = next.orderNum ?? idx + 1;
  const nextOrder = item.orderNum ?? idx;

  await executeApi({
    fn: async () =>
      Promise.all([
        updateBanner(item.id, { orderNum: newOrder }),
        updateBanner(next.id, { orderNum: nextOrder }),
      ]),
    onSuccess: async () => {
      await refresh();
    },
    showSuccessDialog: false,
  });
};

/* --------------------------------------
 * Drag sort
 * -------------------------------------- */
const sortModeActive = ref(false);
const sortSaving = ref(false);

const toggleSortMode = () => {
  sortModeActive.value = !sortModeActive.value;
};

const exitSortMode = () => {
  sortModeActive.value = false;
};

const submitSort = async (ids: string[]) => {
  if (ids.length === 0) return;

  sortSaving.value = true;

  try {
    await reorderBanners(ids);

    await openInfoDialog({
      title: '提示訊息',
      message: 'Banner 排序已儲存',
      iconType: 'success',
    });

    exitSortMode();
    await refresh();
  } catch {
    await openInfoDialog({
      title: '提示訊息',
      message: '排序儲存失敗，請重試',
      iconType: 'warning',
    });
  } finally {
    sortSaving.value = false;
  }
};

/* --------------------------------------
 * Bulk actions
 * -------------------------------------- */
const enableSelected = async () => {
  if (!canEnable.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '只有「下架」的 Banner 才能上架。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '上架確認',
    message: '確定要上架選中的 Banner 嗎？',
  });

  if (!ok) return;

  const targetIds = enableTargetRows.value.map((x: any) => x.id);
  const skippedCount = selectedRows.value.length - targetIds.length;

  await executeApi({
    fn: async () =>
      Promise.allSettled(targetIds.map((id) => publishBanner(id))),
    onSuccess: async (results: PromiseSettledResult<any>[]) => {
      const okCount = results.filter((x) => x.status === 'fulfilled').length;
      const failCount = results.length - okCount;
      const skipText = skippedCount > 0 ? `、略過 ${skippedCount}` : '';

      await openInfoDialog({
        title: '提示訊息',
        message:
          failCount > 0
            ? `上架完成：成功 ${okCount}、失敗 ${failCount}${skipText}`
            : `上架完成：成功 ${okCount}${skipText}`,
        iconType: failCount > 0 ? 'warning' : 'success',
      });

      await refresh();
    },
    showSuccessDialog: false,
  });
};

const disableSelected = async () => {
  if (!canDisable.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '只有「上架」的 Banner 才能下架。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '下架確認',
    message: '確定要下架選中的 Banner 嗎？',
  });

  if (!ok) return;

  const targetIds = disableTargetRows.value.map((x: any) => x.id);
  const skippedCount = selectedRows.value.length - targetIds.length;

  await executeApi({
    fn: async () =>
      Promise.allSettled(targetIds.map((id) => unpublishBanner(id))),
    onSuccess: async (results: PromiseSettledResult<any>[]) => {
      const okCount = results.filter((x) => x.status === 'fulfilled').length;
      const failCount = results.length - okCount;
      const skipText = skippedCount > 0 ? `、略過 ${skippedCount}` : '';

      await openInfoDialog({
        title: '提示訊息',
        message:
          failCount > 0
            ? `下架完成：成功 ${okCount}、失敗 ${failCount}${skipText}`
            : `下架完成：成功 ${okCount}${skipText}`,
        iconType: failCount > 0 ? 'warning' : 'success',
      });

      await refresh();
    },
    showSuccessDialog: false,
  });
};

const deleteSelected = async () => {
  if (!canDelete.value) return;

  const publishedRows = selectedRows.value.filter(
    (r: any) => r.status === 'PUBLISHED',
  );

  if (publishedRows.length > 0) {
    await openInfoDialog({
      title: '提示訊息',
      message: `選中的 ${publishedRows.length} 筆 Banner 目前為上架狀態，請先下架後再刪除。`,
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '刪除確認',
    message: `確定要刪除選中的 ${selectedIds.value.length} 筆 Banner 嗎？（刪除後無法復原）`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(selectedIds.value.map((id) => deleteBanner(id))),
    onSuccess: async (results: PromiseSettledResult<any>[]) => {
      const okCount = results.filter((x) => x.status === 'fulfilled').length;
      const failCount = results.length - okCount;

      await openInfoDialog({
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

/* --------------------------------------
 * Save state / Navigation
 * -------------------------------------- */
const saveListState = () => {
  bannerStore.setList([...list.value]);
  bannerStore.setSearchCondition(formRef.value?.values || initValues.value);
  bannerStore.setSort(sortKey.value, sortOrder.value);
  bannerStore.setCurrentPage(currentPage.value);
  bannerStore.setPageLimitSize(pageLimitSize.value);
  bannerStore.setSelectedIds([...selectedIds.value]);
};

const navigateToEdit = (item: any) => {
  saveListState();
  router.push(`/home/banner/edit/${item.id}`);
};

const navigateToAdd = () => {
  saveListState();
  router.push('/home/banner/add');
};

/* --------------------------------------
 * Lifecycle
 * -------------------------------------- */
onMounted(async () => {
  await loadSelectOptions();

  if (bannerStore.list.length > 0 && !bannerStore.shouldRefresh) {
    list.value = [...bannerStore.list];
    initValues.value = { ...bannerStore.searchCondition };

    await nextTick();
    formRef.value?.setValues(bannerStore.searchCondition);

    sortKey.value = bannerStore.sortKey || '';
    sortOrder.value = bannerStore.sortOrder || 'asc';
    pageLimitSize.value = bannerStore.pageLimitSize;
    selectedIds.value = [...bannerStore.selectedIds];

    await nextTick();
    goToPage(bannerStore.currentPage);

    isSearch.value = true;
    bannerStore.resetAll();
    return;
  }

  const condition = bannerStore.shouldRefresh
    ? { ...bannerStore.searchCondition }
    : { ...initValues.value };

  initValues.value = { ...condition };

  await nextTick();
  formRef.value?.setValues(condition);

  await onSubmit(condition);
  bannerStore.resetAll();
});
</script>

<style scoped lang="scss">
.bl {
  &__table-img {
    width: 120px;
    height: auto;
    border-radius: 4px;
  }
}
</style>

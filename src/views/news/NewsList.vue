<!-- src/views/news/NewsList.vue -->
<template>
  <MCard>
    <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
      <FormTitle title="最新消息管理" />

      <NewsSearchForm
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
          <!-- 標題 -->
          <template #cell-title="{ item }">
            <span class="clickable" @click="navigateToEdit(item)">
              <font-awesome-icon
                v-if="item.isImportant"
                icon="fa-star"
                class="nl__important-icon m-r-4"
                title="重要消息"
              />
              {{ item.title || '-' }}
            </span>
          </template>

          <!-- 店家 -->
          <template #cell-storeName="{ item }">
            <span>{{ item.storeName || item.storeId || '-' }}</span>
          </template>

          <!-- 分類 -->
          <template #cell-category="{ item }">
            <span :class="categoryBadgeClass(item.category)">
              {{ categoryText(item.category) }}
            </span>
          </template>

          <!-- 封面 -->
          <template #cell-imageUrl="{ item }">
            <img
              v-if="item.imageUrl"
              :src="resolveImageUrl(item.imageUrl)"
              alt="news"
              class="nl__table-img"
            />
            <span v-else>-</span>
          </template>

          <!-- 狀態 -->
          <template #cell-status="{ item }">
            <span :class="statusBadgeClass(item.status)">
              {{ item.statusName || statusText(item.status) }}
            </span>
          </template>

          <!-- 上架時間 -->
          <template #cell-scheduledAt="{ item }">
            <DateFormatter
              :date="item.scheduledAt"
              format="YYYY-MM-DD HH:mm:ss"
            />
          </template>

          <!-- 下架時間 -->
          <template #cell-endTime="{ item }">
            <DateFormatter :date="item.endTime" format="YYYY-MM-DD HH:mm:ss" />
          </template>

          <!-- 更新時間 -->
          <template #cell-updatedAt="{ item }">
            <DateFormatter
              :date="item.updatedAt"
              format="YYYY-MM-DD HH:mm:ss"
            />
          </template>

          <!-- 建立時間 -->
          <template #cell-createdAt="{ item }">
            <DateFormatter
              :date="item.createdAt"
              format="YYYY-MM-DD HH:mm:ss"
            />
          </template>

          <!-- 建立者 -->
          <template #cell-createdBy="{ item }">
            <span>{{ item.createdBy || '-' }}</span>
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
import DateFormatter from '@/components/common/DateFormatter.vue';

import NewsSearchForm from '@/components/news/NewsSearchForm.vue';

import { useDialogStore } from '@/stores';
import { executeApi } from '@/utils/executeApiUtils';
import { useNewsStore } from '@/stores/news/useNewsStore';

import {
  queryNews,
  publishNews,
  unpublishNews,
  deleteNews,
} from '@/services/adminNewsService';

import { getStoreOptions } from '@/services/adminStoreService';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

const router = useRouter();
const dialogStore = useDialogStore();
const newsStore = useNewsStore();

/* --------------------------------------
 * Form
 * -------------------------------------- */
const formRef = ref<FormContext | null>(null);

const initValues = ref({
  status: '',
  storeId: '',
  title: '',
  keyword: '',
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
  { label: '下架', value: 'ARCHIVED' },
  { label: '草稿', value: 'DRAFT' },
  { label: '排程中', value: 'SCHEDULED' },
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

const statusText = (status?: string) => {
  if (status === 'PUBLISHED') return '已發布';
  if (status === 'ARCHIVED') return '已封存';
  if (status === 'DRAFT') return '草稿';
  if (status === 'SCHEDULED') return '排程中';
  return '-';
};

const statusBadgeClass = (status?: string) => {
  if (status === 'PUBLISHED') return 'badge badge--green';
  if (status === 'SCHEDULED') return 'badge badge--blue';
  if (status === 'ARCHIVED') return 'badge badge--orange';
  return 'badge badge--gray';
};

const categoryText = (category?: string) => {
  if (category === 'ANNOUNCEMENT') return '公告';
  if (category === 'EVENT') return '活動';
  if (category === 'SYSTEM') return '系統';
  return category || '-';
};

const categoryBadgeClass = (category?: string) => {
  if (category === 'ANNOUNCEMENT') return 'badge badge--blue';
  if (category === 'EVENT') return 'badge badge--purple';
  if (category === 'SYSTEM') return 'badge badge--orange';
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
  { field: 'title', label: '標題', width: 260, sortable: true },
  { field: 'category', label: '分類', width: 110, sortable: true },
  { field: 'imageUrl', label: '封面', width: 160 },
  { field: 'status', label: '狀態', width: 110, sortable: true },
  { field: 'scheduledAt', label: '上架時間', width: 160, sortable: true },
  { field: 'endTime', label: '下架時間', width: 160, sortable: true },
  { field: 'updatedAt', label: '更新時間', width: 160, sortable: true },
  { field: 'createdAt', label: '建立時間', width: 160, sortable: true },
  { field: 'createdBy', label: '建立者', width: 180, sortable: true },
];

/* --------------------------------------
 * Query
 * -------------------------------------- */
const onSubmit = async (values: any) => {
  const condition = {
    status: values.status ?? '',
    storeId: values.storeId ?? '',
    title: values.title ?? '',
    keyword: values.keyword ?? '',
    createdAtStart: values.createdAtStart ?? '',
    createdAtEnd: values.createdAtEnd ?? '',
  };

  await query(() => queryNews({ condition }));

  newsStore.setSearchCondition(condition);
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
    newsStore.setSelectedIds([...value]);
  },
  { deep: true },
);

const selectedRows = computed(() =>
  list.value.filter((row: any) => selectedIds.value.includes(row.id)),
);

const canEnable = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every(
      (row: any) =>
        row.status === 'ARCHIVED' ||
        row.status === 'DRAFT' ||
        row.status === 'SCHEDULED',
    ),
);

const canDisable = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every((row: any) => row.status === 'PUBLISHED'),
);

const canDelete = computed(() => selectedRows.value.length > 0);

/* --------------------------------------
 * Bulk actions
 * -------------------------------------- */
const enableSelected = async () => {
  if (!canEnable.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '只有「草稿／下架／排程中」的消息才能上架。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '上架確認',
    message: '確定要上架選中的最新消息嗎？',
  });

  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(selectedIds.value.map((id) => publishNews(id))),
    onSuccess: async (results: PromiseSettledResult<any>[]) => {
      const okCount = results.filter((x) => x.status === 'fulfilled').length;
      const failCount = results.length - okCount;

      await openInfoDialog({
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
    await openInfoDialog({
      title: '提示訊息',
      message: '只有「上架」的消息才能下架。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '下架確認',
    message: '確定要下架選中的最新消息嗎？',
  });

  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(selectedIds.value.map((id) => unpublishNews(id))),
    onSuccess: async (results: PromiseSettledResult<any>[]) => {
      const okCount = results.filter((x) => x.status === 'fulfilled').length;
      const failCount = results.length - okCount;

      await openInfoDialog({
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

  const publishedRows = selectedRows.value.filter(
    (row: any) => row.status === 'PUBLISHED',
  );

  if (publishedRows.length > 0) {
    await openInfoDialog({
      title: '提示訊息',
      message: `選中的 ${publishedRows.length} 筆最新消息目前為上架狀態，請先下架後再刪除。`,
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '刪除確認',
    message: `確定要刪除選中的 ${selectedIds.value.length} 筆最新消息嗎？（刪除後無法復原）`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(selectedIds.value.map((id) => deleteNews(id))),
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
  newsStore.setList([...list.value]);
  newsStore.setSearchCondition(formRef.value?.values || initValues.value);
  newsStore.setSort(sortKey.value, sortOrder.value);
  newsStore.setCurrentPage(currentPage.value);
  newsStore.setPageLimitSize(pageLimitSize.value);
  newsStore.setSelectedIds([...selectedIds.value]);
};

const navigateToEdit = (item: any) => {
  saveListState();
  router.push(`/home/news/edit/${item.id}`);
};

const navigateToAdd = () => {
  saveListState();
  router.push('/home/news/add');
};

/* --------------------------------------
 * Lifecycle
 * -------------------------------------- */
onMounted(async () => {
  await loadSelectOptions();

  if (newsStore.list.length > 0 && !newsStore.shouldRefresh) {
    list.value = [...newsStore.list];
    initValues.value = { ...newsStore.searchCondition };

    await nextTick();
    formRef.value?.setValues(newsStore.searchCondition);

    sortKey.value = newsStore.sortKey || '';
    sortOrder.value = newsStore.sortOrder || 'asc';
    pageLimitSize.value = newsStore.pageLimitSize;
    selectedIds.value = [...newsStore.selectedIds];

    await nextTick();
    goToPage(newsStore.currentPage);

    isSearch.value = true;
    newsStore.resetAll();
    return;
  }

  const condition = newsStore.shouldRefresh
    ? { ...newsStore.searchCondition }
    : { ...initValues.value };

  initValues.value = { ...condition };

  await nextTick();
  formRef.value?.setValues(condition);

  await onSubmit(condition);
  newsStore.resetAll();
});
</script>

<style scoped lang="scss">
.nl {
  &__table-img {
    width: 120px;
    height: auto;
    border-radius: 4px;
  }

  &__important-icon {
    color: #f59e0b;
  }
}
</style>

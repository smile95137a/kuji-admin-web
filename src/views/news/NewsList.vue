<!-- src/views/news/NewsList.vue -->
<template>
  <MCard>
    <Form
      ref="formRef"
      :initial-values="initValues"
      @submit="onSubmit"
      v-slot="{ values, setFieldValue }"
    >
      <FormTitle title="最新消息管理" />

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
            label="內容關鍵字"
            :modelValue="values.keyword"
            @update:modelValue="setFieldValue('keyword', $event)"
            placeholder="輸入內文關鍵字搜尋"
          />
        </div>
      </div>

      <div class="flex flex-wrap">
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
          <!-- 標題可點 -->
          <template #cell-title="{ item }">
            <span class="clickable" @click="navigateToEdit(item.id)">
              <span v-if="item.isImportant" title="重要消息">⭐ </span>{{ item.title || '-' }}
            </span>
          </template>

          <!-- 分類 -->
          <template #cell-category="{ item }">
            <span :class="categoryBadgeClass(item.category)">{{ categoryText(item.category) }}</span>
          </template>

          <!-- 封面 -->
          <template #cell-imageUrl="{ item }">
            <img
              v-if="item.imageUrl"
              :src="resolveImageUrl(item.imageUrl)"
              alt="news"
              style="width: 120px; height: auto; border-radius: 4px"
            />
            <span v-else>-</span>
          </template>

          <!-- 狀態 -->
          <template #cell-status="{ item }">
            <span :class="statusBadgeClass(item.status)">{{ item.statusName || statusText(item.status) }}</span>
          </template>

          <!-- 上架時間 -->
          <template #cell-scheduledAt="{ item }">
            <DateFormatter
              v-if="item.scheduledAt"
              :date="item.scheduledAt"
              format="YYYY-MM-DD HH:mm:ss"
            />
            <span v-else>-</span>
          </template>

          <!-- 下架時間 -->
          <template #cell-endTime="{ item }">
            <DateFormatter
              v-if="item.endTime"
              :date="item.endTime"
              format="YYYY-MM-DD HH:mm:ss"
            />
            <span v-else>-</span>
          </template>

          <!-- 更新時間 -->
          <template #cell-updatedAt="{ item }">
            <DateFormatter
              v-if="item.updatedAt"
              :date="item.updatedAt"
              format="YYYY-MM-DD HH:mm:ss"
            />
            <span v-else>-</span>
          </template>

          <!-- 建立時間 -->
          <template #cell-createdAt="{ item }">
            <DateFormatter
              v-if="item.createdAt"
              :date="item.createdAt"
              format="YYYY-MM-DD HH:mm:ss"
            />
            <span v-else>-</span>
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

import { useDialogStore } from '@/stores';
import { executeApi } from '@/utils/executeApiUtils';
import { useNewsStore } from '@/stores/news/useNewsStore';

import {
  queryNews,
  publishNews,
  unpublishNews,
  deleteNews,
} from '@/services/adminNewsService';

/* ==============================
 * Router / Store
 * ============================== */
const router = useRouter();
const dialogStore = useDialogStore();
const newsStore = useNewsStore();

/* ==============================
 * Form & InitValues
 * ============================== */
const formRef = ref<FormContext | null>(null);

const initValues = ref<any>({
  status: '',
  title: '',
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
  { label: '下架', value: 'ARCHIVED' },
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
  s === 'PUBLISHED'
    ? '已發布'
    : s === 'ARCHIVED'
    ? '已封存'
    : s === 'DRAFT'
    ? '草稿'
    : s === 'SCHEDULED'
    ? '排程中'
    : '-';

const statusBadgeClass = (s?: string) => {
  if (s === 'PUBLISHED') return 'badge badge--green';
  if (s === 'SCHEDULED') return 'badge badge--blue-outline';
  if (s === 'ARCHIVED') return 'badge badge--orange';
  return 'badge badge--gray';
};

const categoryText = (c?: string) =>
  c === 'ANNOUNCEMENT' ? '公告' : c === 'EVENT' ? '活動' : c === 'SYSTEM' ? '系統' : c || '-';

const categoryBadgeClass = (c?: string) => {
  if (c === 'ANNOUNCEMENT') return 'badge badge--blue';
  if (c === 'EVENT') return 'badge badge--purple';
  if (c === 'SYSTEM') return 'badge badge--orange';
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
 * Table Columns（對齊 NewsRes）
 * ============================== */
const columns = [
  { field: 'title', label: '標題', width: 260, sortable: true },
  { field: 'category', label: '分類', width: 110, sortable: true },
  { field: 'imageUrl', label: '封面', width: 160 },
  { field: 'status', label: '狀態', width: 110, sortable: true },
  { field: 'scheduledAt', label: '上架時間', width: 160, sortable: true },
  { field: 'endTime', label: '下架時間', width: 160, sortable: true },
  { field: 'updatedAt', label: '更新時間', width: 160, sortable: true },
  { field: 'createdAt', label: '建立時間', width: 160, sortable: true },
  { field: 'createdBy', label: '建立者', width: 220, sortable: true },
];

/* ==============================
 * Query
 * ============================== */
const onSubmit = async (values: any) => {
  const req = { condition: values };
  await query(() => queryNews(req));
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

const canEnable = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every(
      (r: any) => r.status === 'ARCHIVED' || r.status === 'DRAFT' || r.status === 'SCHEDULED'
    )
);

const canDisable = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every((r: any) => r.status === 'PUBLISHED')
);

const canDelete = computed(() => selectedRows.value.length > 0);

const refresh = async () => {
  const values = formRef.value?.values || initValues.value;
  await onSubmit(values);
};

const enableSelected = async () => {
  if (!canEnable.value) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '只有「草稿/下架」的消息才能上架。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await dialogStore.openConfirmDialog({
    title: '上架確認',
    message: '確定要上架選中的最新消息嗎？',
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(selectedIds.value.map((id) => publishNews(id))),
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
      message: '只有「上架」的消息才能下架。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await dialogStore.openConfirmDialog({
    title: '下架確認',
    message: '確定要下架選中的最新消息嗎？',
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(selectedIds.value.map((id) => unpublishNews(id))),
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
    message: `確定要刪除選中的 ${selectedIds.value.length} 筆最新消息嗎？（刪除後無法復原）`,
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(selectedIds.value.map((id) => deleteNews(id))),
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
const navigateToEdit = (id: string) => {
  newsStore.setList([...list.value]);
  newsStore.setSearchCondition(formRef.value?.values || {});
  newsStore.setSort(sortKey.value, sortOrder.value);
  newsStore.setCurrentPage(currentPage.value);
  newsStore.setPageLimitSize(pageLimitSize.value);

  router.push(`/home/news/edit/${id}`);
};

const navigateToAdd = () => router.push('/home/news/add');

/* ==============================
 * Lifecycle（回來 → 還原）
 * ============================== */
onMounted(async () => {
  await loadSelectOptions();

  if (newsStore.list?.length > 0) {
    list.value = [...newsStore.list];

    initValues.value = { ...newsStore.searchCondition };
    if (formRef.value) {
      formRef.value.setValues(newsStore.searchCondition);
    }

    sortKey.value = newsStore.sortKey;
    sortOrder.value = (newsStore.sortOrder as any) || 'asc';

    pageLimitSize.value = newsStore.pageLimitSize;
    isSearch.value = true;

    await nextTick();
    goToPage(newsStore.currentPage);

    newsStore.resetAll();
    return;
  }

  await onSubmit(initValues.value);
});
</script>

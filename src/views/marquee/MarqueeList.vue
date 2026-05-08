<!-- src/views/marquee/MarqueeList.vue -->
<template>
  <MCard>
    <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
      <FormTitle title="跑馬燈管理" />

      <MarqueeSearchForm :active-options="activeOptions" />

      <div class="flex justify-center m-y-8">
        <MButton type="submit">
          <font-awesome-icon icon="fa-magnifying-glass" class="m-r-4" />
          查詢
        </MButton>
      </div>
    </Form>
  </MCard>

  <div class="m-t-12">
    <MCard>
      <div class="marquee-list__toolbar">
        <MButton @click="navigateToAdd">
          <font-awesome-icon icon="fa-plus" class="m-r-4" />
          新增
        </MButton>

        <MButton type="button" class="mbtn--gray" @click="broadcastNow">
          <font-awesome-icon icon="fa-bullhorn" class="m-r-4" />
          手動廣播
        </MButton>

        <MButton :disabled="!canEnable" @click="enableSelected">
          <font-awesome-icon icon="fa-circle-check" class="m-r-4" />
          啟用
        </MButton>

        <MButton :disabled="!canDisable" @click="disableSelected">
          <font-awesome-icon icon="fa-ban" class="m-r-4" />
          停用
        </MButton>

        <MButton
          class="mbtn--red"
          :disabled="!canDelete"
          @click="deleteSelected"
        >
          <font-awesome-icon icon="fa-trash" class="m-r-4" />
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
          <!-- 內容 -->
          <template #cell-content="{ item }">
            <span class="clickable" @click="navigateToEdit(item)">
              {{ item.content || '-' }}
            </span>
          </template>

          <!-- 連結類型 -->
          <template #cell-linkType="{ item }">
            <span>{{ linkTypeText(item.linkType) }}</span>
          </template>

          <!-- 排序 -->
          <template #cell-priority="{ item }">
            <span>{{ item.priority ?? '-' }}</span>
          </template>

          <!-- 背景色 -->
          <template #cell-bgColor="{ item }">
            <div class="marquee-list__color-cell">
              <span
                v-if="isValidColor(item.bgColor)"
                class="marquee-list__color-dot"
                :style="{ backgroundColor: item.bgColor }"
              />
              <span>{{ item.bgColor || '-' }}</span>
            </div>
          </template>

          <!-- 文字色 -->
          <template #cell-textColor="{ item }">
            <div class="marquee-list__color-cell">
              <span
                v-if="isValidColor(item.textColor)"
                class="marquee-list__color-dot"
                :style="{ backgroundColor: item.textColor }"
              />
              <span>{{ item.textColor || '-' }}</span>
            </div>
          </template>

          <!-- 狀態 -->
          <template #cell-isActive="{ item }">
            <span :class="activeBadgeClass(item.isActive)">
              {{ normalizeIsActiveNum(item.isActive) === 1 ? '啟用' : '停用' }}
            </span>
          </template>

          <!-- 開始時間 -->
          <template #cell-startTime="{ item }">
            <DateFormatter
              :date="item.startTime"
              format="YYYY-MM-DD HH:mm:ss"
            />
          </template>

          <!-- 更新時間 -->
          <template #cell-updatedAt="{ item }">
            <DateFormatter
              :date="item.updatedAt"
              format="YYYY-MM-DD HH:mm:ss"
            />
          </template>

          <!-- 操作 -->
          <template #cell-actions="{ item }">
            <div class="marquee-list__actions">
              <MButton size="sm" @click="navigateToEdit(item)">
                <font-awesome-icon icon="fa-pen-to-square" class="m-r-4" />
                編輯
              </MButton>

              <MButton size="sm" variant="danger" @click="deleteOne(item)">
                <font-awesome-icon icon="fa-trash" class="m-r-4" />
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
            @update:pageLimitSize="handlePageLimitSizeChange"
          />
        </div>
      </template>
    </MCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { Form, type FormContext } from 'vee-validate';
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

import MarqueeSearchForm from '@/components/marquee/MarqueeSearchForm.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { useMarqueeStore } from '@/stores/marquee/useMarqueeStore';

import {
  getAllMarquees,
  deleteMarquee,
  updateMarqueeStatus,
  broadcastMarquees,
} from '@/services/adminMarqueeService';

import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

const router = useRouter();
const marqueeStore = useMarqueeStore();

/* --------------------------------------
 * Form
 * -------------------------------------- */
const formRef = ref<FormContext | null>(null);

const initValues = ref({
  active: '',
  keyword: '',
  startDate: '',
  endDate: '',
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
const activeOptions = ref<SelectOption[]>([
  { label: '啟用', value: '1' },
  { label: '停用', value: '0' },
]);

/* --------------------------------------
 * Utils
 * -------------------------------------- */
const normalizeIsActiveNum = (value: any): 1 | 0 => {
  if (value === 1 || value === '1' || value === true || value === 'true') {
    return 1;
  }

  return 0;
};

const normalizeMarqueeList = (res: any) => {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res)) return res;

  return [];
};

const normalizeRows = (rows: any[]) => {
  return (rows || []).map((row: any) => ({
    ...row,
    priority: row?.priority ?? row?.orderNum ?? null,
    isActive: normalizeIsActiveNum(row?.isActive),
  }));
};

const filterRows = (rows: any[], condition: any) => {
  const active = String(condition?.active ?? '').trim();

  const keyword = String(condition?.keyword ?? '')
    .trim()
    .toLowerCase();

  const startDate = String(condition?.startDate ?? '').trim();
  const endDate = String(condition?.endDate ?? '').trim();

  return (rows || []).filter((row: any) => {
    const hitActive =
      !active || String(normalizeIsActiveNum(row?.isActive)) === active;

    const hitKeyword =
      !keyword ||
      String(row?.content || '')
        .toLowerCase()
        .includes(keyword);

    const startTime = String(row?.startTime || '');
    const hitStart = !startDate || startTime >= `${startDate}T00:00:00`;
    const hitEnd = !endDate || startTime <= `${endDate}T23:59:59`;

    return hitActive && hitKeyword && hitStart && hitEnd;
  });
};

const activeBadgeClass = (value: any) => {
  return normalizeIsActiveNum(value) === 1
    ? 'badge badge--green'
    : 'badge badge--gray';
};

const linkTypeText = (value?: string) => {
  if (value === 'NONE') return '無連結';
  if (value === 'URL' || value === 'EXTERNAL') return '網址';
  if (value === 'NEWS') return '最新消息';
  if (value === 'BANNER') return 'Banner';

  return value || '-';
};

const isValidColor = (value?: string) => {
  const text = String(value || '').trim();

  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(text);
};

/* --------------------------------------
 * Query
 * -------------------------------------- */
const doQuery = async (condition: any) => {
  await query(async () => {
    const res = await getAllMarquees();
    const rows = normalizeMarqueeList(res);

    return filterRows(normalizeRows(rows), condition);
  });
};

const onSubmit = async (values: any) => {
  const condition = {
    active: values.active ?? '',
    keyword: values.keyword ?? '',
    startDate: values.startDate ?? '',
    endDate: values.endDate ?? '',
  };

  await doQuery(condition);

  marqueeStore.setSearchCondition(condition);
  selectedIds.value = [];
  goToPage(1);
  isSearch.value = true;
};

const refresh = async () => {
  const values = formRef.value?.values || initValues.value;

  await onSubmit(values);
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
  { field: 'content', label: '內容', width: 50, sortable: true },
  { field: 'linkType', label: '連結類型', width: 50, sortable: true },
  { field: 'priority', label: '排序', width: 50, sortable: true },
  { field: 'bgColor', label: '背景色', width: 50 },
  { field: 'textColor', label: '文字色', width: 50 },
  { field: 'isActive', label: '狀態', width: 50, sortable: true },
  { field: 'startTime', label: '開始時間', width: 50, sortable: true },
  { field: 'updatedAt', label: '更新時間', width: 50, sortable: true },
  { field: 'actions', label: '操作', width: 50 },
];

/* --------------------------------------
 * Selection
 * -------------------------------------- */
const selectedIds = ref<string[]>([]);

watch(
  selectedIds,
  (value) => {
    marqueeStore.setSelectedIds([...value]);
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
      (row: any) => normalizeIsActiveNum(row.isActive) !== 1,
    ),
);

const canDisable = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every(
      (row: any) => normalizeIsActiveNum(row.isActive) === 1,
    ),
);

const canDelete = computed(() => selectedRows.value.length > 0);

/* --------------------------------------
 * Bulk actions
 * -------------------------------------- */
const enableSelected = async () => {
  if (!canEnable.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '只有「停用」的跑馬燈才能啟用。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '啟用確認',
    message: `確定要啟用選中的 ${selectedIds.value.length} 筆跑馬燈嗎？`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(
        selectedIds.value.map((id) => updateMarqueeStatus(id, '1')),
      ),
    onSuccess: async (results: PromiseSettledResult<any>[]) => {
      const okCount = results.filter(
        (item) => item.status === 'fulfilled',
      ).length;
      const failCount = results.length - okCount;

      await openInfoDialog({
        title: '提示訊息',
        message:
          failCount > 0
            ? `啟用完成：成功 ${okCount}、失敗 ${failCount}`
            : `啟用完成：成功 ${okCount}`,
        iconType: failCount > 0 ? 'warning' : 'success',
      });

      marqueeStore.setShouldRefresh(true);
      await refresh();
    },
    showSuccessDialog: false,
  });
};

const disableSelected = async () => {
  if (!canDisable.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '只有「啟用」的跑馬燈才能停用。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '停用確認',
    message: `確定要停用選中的 ${selectedIds.value.length} 筆跑馬燈嗎？`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(
        selectedIds.value.map((id) => updateMarqueeStatus(id, '0')),
      ),
    onSuccess: async (results: PromiseSettledResult<any>[]) => {
      const okCount = results.filter(
        (item) => item.status === 'fulfilled',
      ).length;
      const failCount = results.length - okCount;

      await openInfoDialog({
        title: '提示訊息',
        message:
          failCount > 0
            ? `停用完成：成功 ${okCount}、失敗 ${failCount}`
            : `停用完成：成功 ${okCount}`,
        iconType: failCount > 0 ? 'warning' : 'success',
      });

      marqueeStore.setShouldRefresh(true);
      await refresh();
    },
    showSuccessDialog: false,
  });
};

const deleteOne = async (item: any) => {
  const ok = await openConfirmDialog({
    title: '刪除確認',
    message: `確定要刪除「${item?.content || '-'}」嗎？（刪除後無法復原）`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () => deleteMarquee(item.id),
    onSuccess: async () => {
      await openInfoDialog({
        title: '提示訊息',
        message: '刪除成功',
        iconType: 'success',
      });

      marqueeStore.setShouldRefresh(true);
      await refresh();
    },
    showSuccessDialog: false,
  });
};

const deleteSelected = async () => {
  if (!canDelete.value) return;

  const ok = await openConfirmDialog({
    title: '刪除確認',
    message: `確定要刪除選中的 ${selectedIds.value.length} 筆跑馬燈嗎？（刪除後無法復原）`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(selectedIds.value.map((id) => deleteMarquee(id))),
    onSuccess: async (results: PromiseSettledResult<any>[]) => {
      const okCount = results.filter(
        (item) => item.status === 'fulfilled',
      ).length;
      const failCount = results.length - okCount;

      await openInfoDialog({
        title: '提示訊息',
        message:
          failCount > 0
            ? `刪除完成：成功 ${okCount}、失敗 ${failCount}`
            : `刪除完成：成功 ${okCount}`,
        iconType: failCount > 0 ? 'warning' : 'success',
      });

      marqueeStore.setShouldRefresh(true);
      await refresh();
    },
    showSuccessDialog: false,
  });
};

const broadcastNow = async () => {
  const ok = await openConfirmDialog({
    title: '廣播確認',
    message: '確定要手動廣播所有啟用中的跑馬燈嗎？',
  });

  if (!ok) return;

  await executeApi({
    fn: async () => broadcastMarquees(),
    onSuccess: async () => {
      await openInfoDialog({
        title: '提示訊息',
        message: '廣播成功',
        iconType: 'success',
      });
    },
    showSuccessDialog: false,
  });
};

/* --------------------------------------
 * Save state / Navigation
 * -------------------------------------- */
const saveListState = () => {
  marqueeStore.setList([...list.value]);
  marqueeStore.setSearchCondition(formRef.value?.values || initValues.value);
  marqueeStore.setSort(sortKey.value, sortOrder.value);
  marqueeStore.setCurrentPage(currentPage.value);
  marqueeStore.setPageLimitSize(pageLimitSize.value);
  marqueeStore.setSelectedIds([...selectedIds.value]);
};

const navigateToAdd = () => {
  saveListState();
  router.push('/home/marquee/add');
};

const navigateToEdit = (item: any) => {
  saveListState();
  router.push(`/home/marquee/edit/${item.id}`);
};

/* --------------------------------------
 * Lifecycle
 * -------------------------------------- */
onMounted(async () => {
  if (marqueeStore.list.length > 0 && !marqueeStore.shouldRefresh) {
    list.value = [...marqueeStore.list];
    initValues.value = { ...marqueeStore.searchCondition };

    await nextTick();
    formRef.value?.setValues(marqueeStore.searchCondition);

    sortKey.value = marqueeStore.sortKey || '';
    sortOrder.value = marqueeStore.sortOrder || 'asc';
    pageLimitSize.value = marqueeStore.pageLimitSize;
    selectedIds.value = [...marqueeStore.selectedIds];

    await nextTick();
    goToPage(marqueeStore.currentPage);

    isSearch.value = true;
    marqueeStore.resetAll();
    return;
  }

  const condition = marqueeStore.shouldRefresh
    ? { ...marqueeStore.searchCondition }
    : { ...initValues.value };

  initValues.value = { ...condition };

  await nextTick();
  formRef.value?.setValues(condition);

  await onSubmit(condition);
  marqueeStore.resetAll();
});
</script>

<style scoped lang="scss">
.marquee-list {
  &__toolbar {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__link-text {
    display: inline-block;
    max-width: 200px;
    overflow: hidden;
    vertical-align: middle;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__color-cell {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  &__color-dot {
    display: inline-block;
    flex: 0 0 auto;
    width: 14px;
    height: 14px;
    border: 1px solid #d1d5db;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.12);
  }
}
</style>

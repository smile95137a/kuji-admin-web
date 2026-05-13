<!-- src/views/cooperationInquiry/CooperationInquiryList.vue -->
<template>
  <MCard>
    <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
      <FormTitle title="合作洽談管理" />

      <CooperationInquirySearchForm
        :status-options="statusOptions"
        :type-options="typeOptions"
      />

      <div class="flex justify-center m-y-8 gap-x-12 flex-wrap">
        <MButton type="submit">
          <font-awesome-icon icon="fa-magnifying-glass" class="m-r-4" />
          查詢
        </MButton>

        <MButton type="button" class="mbtn--gray" @click="handleReset">
          <font-awesome-icon icon="fa-rotate-left" class="m-r-4" />
          清除
        </MButton>
      </div>
    </Form>
  </MCard>

  <div class="m-t-12">
    <MCard>
      <div class="cooperation-inquiry-list__toolbar">
        <MButton
          type="button"
          class="mbtn--red"
          :disabled="!canDelete"
          @click="deleteSelected"
        >
          <font-awesome-icon icon="fa-trash" class="m-r-4" />
          注記刪除
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
          <template #cell-company="{ item }">
            <span class="clickable" @click="navigateToDetail(item)">
              {{ item.company || '-' }}
            </span>
          </template>

          <template #cell-type="{ item }">
            <span class="cooperation-inquiry-list__badge">
              {{ typeText(item.type) }}
            </span>
          </template>

          <template #cell-status="{ item }">
            <span :class="statusBadgeClass(item.status)">
              {{ statusText(item.status) }}
            </span>
          </template>

          <template #cell-convertedToVendor="{ item }">
            <span
              :class="
                toBoolean(item.convertedToVendor)
                  ? 'badge badge--green'
                  : 'badge badge--gray'
              "
            >
              {{ toBoolean(item.convertedToVendor) ? '已轉換' : '未轉換' }}
            </span>
          </template>

          <template #cell-createdAt="{ item }">
            <span>{{ formatDateTime(item.createdAt) }}</span>
          </template>

          <template #cell-updatedAt="{ item }">
            <span>{{ formatDateTime(item.updatedAt) }}</span>
          </template>

          <template #cell-actions="{ item }">
            <div class="cooperation-inquiry-list__actions">
              <MButton
                size="sm"
                class="mbtn--gray"
                @click="navigateToDetail(item)"
              >
                查看
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
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Form, type FormContext } from 'vee-validate';

import { usePagination } from '@/hook/usePagination';
import { useSearchPage } from '@/hook/useSearchPage';
import { compareByKeySmart } from '@/utils/sortUtils';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import NoData from '@/components/common/NoData.vue';
import Pagination from '@/components/common/Pagination.vue';
import ReportTable from '@/components/common/ReportTable.vue';
import FormTitle from '@/components/common/FormTitle.vue';
import CooperationInquirySearchForm from '@/components/cooperationInquiry/CooperationInquirySearchForm.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';
import { useCooperationInquiryStore } from '@/stores/cooperationInquiry/useCooperationInquiryStore';

import {
  queryCooperationInquiries,
  deleteCooperationInquiry,
  createMockCooperationInquiries,
} from '@/services/adminCooperationInquiryService';

const router = useRouter();
const store = useCooperationInquiryStore();

/* --------------------------------------
 * Form
 * -------------------------------------- */
const formRef = ref<FormContext | null>(null);

const initValues = ref({
  status: '',
  type: '',
  keyword: '',
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
const statusOptions: SelectOption[] = [
  { label: '待處理', value: 'PENDING' },
  { label: '處理中', value: 'PROCESSING' },
  { label: '已完成', value: 'DONE' },
  { label: '已關閉', value: 'CLOSED' },
];

const typeOptions: SelectOption[] = [
  { label: 'IP / 授權', value: 'IP' },
  { label: '供應 / 物流', value: 'SUPPLY' },
  { label: '通路 / 門市', value: 'CHANNEL' },
  { label: '行銷 / 活動', value: 'MARKETING' },
];

/* --------------------------------------
 * Utils
 * -------------------------------------- */
const toBoolean = (value: unknown): boolean => {
  return value === true || value === 1 || value === '1';
};

const formatDateTime = (value?: string) => {
  if (!value) return '-';

  return String(value).replace('T', ' ');
};

const statusText = (v?: string) => {
  if (v === 'PENDING') return '待處理';
  if (v === 'PROCESSING') return '處理中';
  if (v === 'DONE') return '已完成';
  if (v === 'CLOSED') return '已關閉';

  return v || '-';
};

const typeText = (v?: string) => {
  if (v === 'IP') return 'IP / 授權';
  if (v === 'SUPPLY') return '供應 / 物流';
  if (v === 'CHANNEL') return '通路 / 門市';
  if (v === 'MARKETING') return '行銷 / 活動';

  return v || '-';
};

const statusBadgeClass = (status?: string) => {
  if (status === 'PENDING') return 'badge badge--orange';
  if (status === 'PROCESSING') return 'badge badge--blue';
  if (status === 'DONE') return 'badge badge--green';

  return 'badge badge--gray';
};

const normalizeList = (res: any) => {
  const data = res?.data ?? res;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.list)) return data.list;

  return [];
};

const normalizeTotal = (res: any, resultList: any[]) => {
  const data = res?.data ?? res;

  return data?.totalElements ?? data?.total ?? resultList.length;
};

/* --------------------------------------
 * Sorting
 * -------------------------------------- */
const sortKey = ref('');
const sortOrder = ref<'asc' | 'desc' | ''>('desc');

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
  { field: 'company', label: '公司 / 單位', width: 180, sortable: true },
  { field: 'name', label: '聯絡人', width: 120, sortable: true },
  { field: 'email', label: 'Email', width: 220, sortable: true },
  { field: 'phone', label: '電話', width: 140, sortable: true },
  { field: 'type', label: '合作類型', width: 140, sortable: true },
  { field: 'status', label: '狀態', width: 110, sortable: true },
  {
    field: 'convertedToVendor',
    label: '廠商轉換',
    width: 120,
    sortable: true,
  },
  { field: 'createdAt', label: '建立時間', width: 170, sortable: true },
  { field: 'updatedAt', label: '更新時間', width: 170, sortable: true },
  { field: 'actions', label: '操作', width: 100 },
];

/* --------------------------------------
 * Query
 * -------------------------------------- */
const buildQueryParams = (condition: any) => {
  return {
    page: 0,
    size: 9999,
    status: condition.status || undefined,
    type: condition.type || undefined,
    keyword: condition.keyword || undefined,
    sortBy: store.sortKey || 'createdAt',
    sortDir: store.sortOrder?.toUpperCase?.() || 'DESC',
  };
};

const onSubmit = async (values: any) => {
  const condition = {
    status: values.status ?? '',
    type: values.type ?? '',
    keyword: values.keyword ?? '',
  };

  await query(async () => {
    const res = await queryCooperationInquiries(buildQueryParams(condition));
    const resultList = normalizeList(res);

    store.setTotalElements(normalizeTotal(res, resultList));

    return {
      success: true,
      data: resultList,
      message: '查詢成功',
    };
  });

  store.setSearchCondition(condition);
  store.setList([...list.value]);
  selectedIds.value = [];
  store.clearSelectedIds();
  goToPage(1);
  isSearch.value = true;
};

const refresh = async () => {
  const values = formRef.value?.values || initValues.value;

  await onSubmit(values);
};

const handleReset = async () => {
  const empty = {
    status: '',
    type: '',
    keyword: '',
  };

  formRef.value?.setValues(empty);
  store.setSearchCondition(empty);
  store.setCurrentPage(1);
  store.clearSelectedIds();
  selectedIds.value = [];

  await onSubmit(empty);
};

/* --------------------------------------
 * Selection
 * -------------------------------------- */
const selectedIds = ref<string[]>([]);

watch(
  selectedIds,
  (value) => {
    store.setSelectedIds([...value]);
  },
  { deep: true },
);

const selectedRows = computed(() =>
  list.value.filter((row: any) => selectedIds.value.includes(row.id)),
);

const canDelete = computed(() => selectedRows.value.length > 0);

/* --------------------------------------
 * Bulk actions
 * -------------------------------------- */
const deleteSelected = async () => {
  if (!canDelete.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '請先勾選資料',
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '注記刪除確認',
    message: `確定要注記刪除選中的 ${selectedIds.value.length} 筆合作洽談資料嗎？資料不會真的刪除，但列表將不再顯示。`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(
        selectedIds.value.map((id) => deleteCooperationInquiry(id)),
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
            ? `注記刪除完成：成功 ${okCount}、失敗 ${failCount}`
            : `注記刪除完成：成功 ${okCount}`,
        iconType: failCount > 0 ? 'warning' : 'success',
      });

      selectedIds.value = [];
      store.clearSelectedIds();
      await refresh();
    },
    showSuccessDialog: false,
  });
};

/* --------------------------------------
 * Save state / Navigation
 * -------------------------------------- */
const saveListState = () => {
  store.setList([...list.value]);
  store.setSearchCondition(formRef.value?.values || initValues.value);
  store.setSort(sortKey.value, sortOrder.value);
  store.setCurrentPage(currentPage.value);
  store.setPageLimitSize(pageLimitSize.value);
  store.setSelectedIds([...selectedIds.value]);
};

const navigateToDetail = (item: any) => {
  saveListState();

  router.push({
    name: 'CooperationInquiryDetail',
    params: { id: item.id },
  });
};

/* --------------------------------------
 * Lifecycle
 * -------------------------------------- */
onMounted(async () => {
  if (store.list.length > 0 && !store.shouldRefresh) {
    list.value = [...store.list];
    initValues.value = { ...store.searchCondition };

    await nextTick();
    formRef.value?.setValues(store.searchCondition);

    sortKey.value = store.sortKey || '';
    sortOrder.value = store.sortOrder || 'desc';
    pageLimitSize.value = store.pageLimitSize;
    selectedIds.value = [...store.selectedIds];

    await nextTick();
    goToPage(store.currentPage);

    isSearch.value = true;
    store.resetAll?.();
    return;
  }

  const condition = store.shouldRefresh
    ? { ...store.searchCondition }
    : { ...initValues.value };

  initValues.value = { ...condition };

  await nextTick();
  formRef.value?.setValues(condition);

  await onSubmit(condition);
  store.resetAll?.();
});
</script>

<style scoped lang="scss">
.cooperation-inquiry-list {
  &__toolbar {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__actions {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  &__badge {
    display: inline-flex;
    padding: 3px 8px;
    border-radius: 999px;
    background: #f3f4f6;
    color: #374151;
    font-size: 12px;
    font-weight: 800;
  }
}
</style>

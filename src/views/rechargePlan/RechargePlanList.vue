<!-- src/views/rechargePlan/RechargePlanList.vue -->
<template>
  <MCard>
    <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
      <FormTitle title="儲值方案管理" />

      <RechargePlanSearchForm />

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
      <div class="recharge-plan-list__toolbar">
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
            <button
              type="button"
              class="recharge-plan-list__toggle"
              :class="
                item.isActive
                  ? 'recharge-plan-list__toggle--on'
                  : 'recharge-plan-list__toggle--off'
              "
              @click="toggleActive(item)"
            >
              {{ statusText(item.isActive) }}
            </button>
          </template>

          <template #cell-isPromotional="{ item }">
            <span
              v-if="item.isPromotional"
              class="recharge-plan-list__badge recharge-plan-list__badge--promo"
            >
              活動

              <span
                v-if="item.isInPeriod"
                class="recharge-plan-list__badge recharge-plan-list__badge--active"
              >
                進行中
              </span>
            </span>

            <span
              v-else
              class="recharge-plan-list__badge recharge-plan-list__badge--normal"
            >
              一般
            </span>
          </template>

          <template #cell-updatedAt="{ item }">
            <DateFormatter
              :date="item.updatedAt"
              format="YYYY-MM-DD HH:mm:ss"
            />
          </template>

          <template #cell-actions="{ item }">
            <div class="recharge-plan-list__actions">
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

import RechargePlanSearchForm from '@/components/rechargePlan/RechargePlanSearchForm.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { useRechargePlanStore } from '@/stores/rechargePlan/useRechargePlanStore';

import {
  queryRechargePlans,
  deleteRechargePlan,
  updateRechargePlan,
} from '@/services/adminRechargePlanService';

import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

const router = useRouter();
const rechargePlanStore = useRechargePlanStore();

/* --------------------------------------
 * Form
 * -------------------------------------- */
const formRef = ref<FormContext | null>(null);

const initValues = ref({
  keyword: '',
});

/* --------------------------------------
 * Search list
 * -------------------------------------- */
const { list, hasData, isSearch, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

const loadSelectOptions = async () => {
  await nextTick();
};

/* --------------------------------------
 * Utils
 * -------------------------------------- */
const formatMoney = (n: any) => {
  const num = Number(n);

  if (Number.isNaN(num)) return n ?? '-';

  return num.toLocaleString('zh-TW');
};

const statusText = (isActive?: boolean) => (isActive ? '啟用' : '停用');

const filterByKeyword = (rows: any[], keyword?: string) => {
  const text = String(keyword || '')
    .trim()
    .toLowerCase();

  if (!text) return rows;

  return rows.filter((row: any) =>
    String(row?.name || '')
      .toLowerCase()
      .includes(text),
  );
};

const normalizeRechargePlanList = (res: any) => {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res)) return res;

  return [];
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
 * Table Columns
 * 依照目前 API response 精簡顯示
 * -------------------------------------- */
const columns = [
  { field: 'name', label: '方案名稱', width: 50, sortable: true },
  { field: 'amount', label: '金額', width: 50, sortable: true },
  { field: 'goldCoins', label: '金幣', width: 50, sortable: true },
  { field: 'bonusCoins', label: '贈送', width: 50, sortable: true },
  { field: 'bonusPercentage', label: '加碼%', width: 50, sortable: true },
  { field: 'isActive', label: '狀態', width: 50, sortable: true },
  { field: 'isPromotional', label: '類型', width: 50, sortable: true },
  { field: 'updatedAt', label: '更新時間', width: 50, sortable: true },
  { field: 'actions', label: '操作', width: 50 },
];

/* --------------------------------------
 * Query
 * -------------------------------------- */
const onSubmit = async (values: any) => {
  const condition = {
    keyword: values.keyword ?? '',
  };

  await query(async () => {
    const res = await queryRechargePlans();
    const rows = normalizeRechargePlanList(res);

    return filterByKeyword(rows, condition.keyword);
  });

  rechargePlanStore.setSearchCondition(condition);
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
    rechargePlanStore.setSelectedIds([...value]);
  },
  { deep: true },
);

const selectedRows = computed(() =>
  list.value.filter((row: any) => selectedIds.value.includes(row.id)),
);

const canDelete = computed(() => selectedRows.value.length > 0);

/* --------------------------------------
 * Delete
 * -------------------------------------- */
const deleteOne = async (item: any) => {
  const ok = await openConfirmDialog({
    title: '刪除確認',
    message: `確定要刪除「${item?.name || '-'}」嗎？（刪除後無法復原）`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () => deleteRechargePlan(item.id),
    onSuccess: async () => {
      await openInfoDialog({
        title: '提示訊息',
        message: '刪除成功',
        iconType: 'success',
      });

      rechargePlanStore.setShouldRefresh(true);
      await refresh();
    },
    showSuccessDialog: false,
  });
};

const deleteSelected = async () => {
  if (!canDelete.value) return;

  const ok = await openConfirmDialog({
    title: '刪除確認',
    message: `確定要刪除選中的 ${selectedIds.value.length} 筆儲值方案嗎？（刪除後無法復原）`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(selectedIds.value.map((id) => deleteRechargePlan(id))),
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

      rechargePlanStore.setShouldRefresh(true);
      await refresh();
    },
    showSuccessDialog: false,
  });
};

/* --------------------------------------
 * Toggle active
 * -------------------------------------- */
const toggleActive = async (item: any) => {
  const newState = !item.isActive;

  const ok = await openConfirmDialog({
    title: `${newState ? '啟用' : '停用'}確認`,
    message: `確定要將「${item.name || item.id}」${newState ? '啟用' : '停用'}？`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () => updateRechargePlan(item.id, { isActive: newState }),
    onSuccess: async () => {
      item.isActive = newState;
      rechargePlanStore.setList([...list.value]);
    },
    showSuccessDialog: false,
  });
};

/* --------------------------------------
 * Save state / Navigation
 * -------------------------------------- */
const saveListState = () => {
  rechargePlanStore.setList([...list.value]);
  rechargePlanStore.setSearchCondition(
    formRef.value?.values || initValues.value,
  );
  rechargePlanStore.setSort(sortKey.value, sortOrder.value);
  rechargePlanStore.setCurrentPage(currentPage.value);
  rechargePlanStore.setPageLimitSize(pageLimitSize.value);
  rechargePlanStore.setSelectedIds([...selectedIds.value]);
};

const navigateToAdd = () => {
  saveListState();
  router.push('/home/recharge-plan/add');
};

const navigateToEdit = (item: any) => {
  saveListState();
  router.push(`/home/recharge-plan/edit/${item.id}`);
};

/* --------------------------------------
 * Lifecycle
 * -------------------------------------- */
onMounted(async () => {
  await loadSelectOptions();

  if (rechargePlanStore.list.length > 0 && !rechargePlanStore.shouldRefresh) {
    list.value = [...rechargePlanStore.list];
    initValues.value = { ...rechargePlanStore.searchCondition };

    await nextTick();
    formRef.value?.setValues(rechargePlanStore.searchCondition);

    sortKey.value = rechargePlanStore.sortKey || '';
    sortOrder.value = rechargePlanStore.sortOrder || 'asc';
    pageLimitSize.value = rechargePlanStore.pageLimitSize;
    selectedIds.value = [...rechargePlanStore.selectedIds];

    await nextTick();
    goToPage(rechargePlanStore.currentPage);

    isSearch.value = true;
    rechargePlanStore.resetAll();
    return;
  }

  const condition = rechargePlanStore.shouldRefresh
    ? { ...rechargePlanStore.searchCondition }
    : { ...initValues.value };

  initValues.value = { ...condition };

  await nextTick();
  formRef.value?.setValues(condition);

  await onSubmit(condition);
  rechargePlanStore.resetAll();
});
</script>

<style scoped lang="scss">
.recharge-plan-list {
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

  &__toggle {
    border: none;
    border-radius: 12px;
    padding: 3px 12px;
    font-size: 12px;
    cursor: pointer;
    font-weight: 500;
    transition:
      background 0.15s,
      opacity 0.15s;

    &:hover {
      opacity: 0.8;
    }

    &--on {
      background: #d1fae5;
      color: #065f46;
    }

    &--off {
      background: #f3f4f6;
      color: #6b7280;
    }
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border-radius: 4px;
    padding: 2px 8px;
    font-size: 12px;
    font-weight: 500;

    &--promo {
      background: #fef3c7;
      color: #d97706;
    }

    &--active {
      background: #d1fae5;
      color: #065f46;
    }

    &--normal {
      background: #f3f4f6;
      color: #6b7280;
    }
  }
}
</style>

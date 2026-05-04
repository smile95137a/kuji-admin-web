<!-- src/views/rechargePlan/RechargePlanList.vue -->
<template>
  <MCard>
    <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
      <FormTitle title="儲值方案管理" />

      <RechargePlanSearchForm />

      <div class="flex justify-center m-y-8">
        <MButton type="submit">查詢</MButton>
      </div>
    </Form>
  </MCard>

  <div class="m-t-12">
    <MCard>
      <div class="flex justify-end gap-x-12 flex-wrap">
        <MButton @click="navigateToAdd">新增</MButton>

        <MButton class="mbtn--gray" @click="openSortPanel">排序管理</MButton>

        <MButton
          class="mbtn--red"
          :disabled="!canDelete"
          @click="deleteSelected"
        >
          刪除
        </MButton>
      </div>

      <!-- 排序管理 Panel -->
      <div v-if="showSortPanel" class="sort-panel m-t-12">
        <p class="sort-panel__title">拖曳調整顯示順序（上方 = 最前面）</p>
        <ul class="sort-list">
          <li
            v-for="(item, index) in sortableList"
            :key="item.id"
            class="sort-list__item"
            :class="{ 'sort-list__item--over': dragOverIndex === index }"
            draggable="true"
            @dragstart="onDragStart(index)"
            @dragover.prevent="onDragOver(index)"
            @dragleave="dragOverIndex = -1"
            @drop.prevent="onDrop(index)"
            @dragend="onDragEnd"
          >
            <span class="sort-list__handle">⠿</span>
            <span class="sort-list__order">{{ index + 1 }}</span>
            <span class="sort-list__name">{{ item.name || '-' }}</span>
            <span class="sort-list__meta">
              {{ formatMoney(item.amount) }} 台幣
              <span v-if="item.isPromotional" class="sort-list__badge">活動</span>
            </span>
          </li>
        </ul>
        <div class="flex gap-x-12 m-t-12">
          <MButton @click="saveSortOrder" :disabled="isSaving">
            {{ isSaving ? '儲存中...' : '儲存排序' }}
          </MButton>
          <MButton class="mbtn--gray" @click="showSortPanel = false">取消</MButton>
        </div>
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
              class="recharge__toggle"
              :class="
                item.isActive ? 'recharge__toggle--on' : 'recharge__toggle--off'
              "
              @click="toggleActive(item)"
            >
              {{ item.isActive ? '啟用' : '停用' }}
            </button>
          </template>

          <template #cell-isPromotional="{ item }">
            <span
              v-if="item.isPromotional"
              class="recharge__badge recharge__badge--promo"
            >
              活動方案
              <span
                v-if="item.isInPeriod"
                class="recharge__badge recharge__badge--active"
                >進行中</span
              >
            </span>
            <span v-else class="recharge__badge recharge__badge--normal"
              >一般</span
            >
          </template>

          <template #cell-displayOrder="{ item }">
            <span>{{ item.displayOrder ?? '-' }}</span>
          </template>

          <template #cell-startTime="{ item }">
            <DateFormatter
              v-if="item.startTime"
              :date="item.startTime"
              format="YYYY-MM-DD HH:mm:ss"
            />
            <span v-else>-</span>
          </template>

          <template #cell-endTime="{ item }">
            <DateFormatter
              v-if="item.endTime"
              :date="item.endTime"
              format="YYYY-MM-DD HH:mm:ss"
            />
            <span v-else>-</span>
          </template>

          <template #cell-updatedAt="{ item }">
            <DateFormatter
              v-if="item.updatedAt"
              :date="item.updatedAt"
              format="YYYY-MM-DD HH:mm:ss"
            />
            <span v-else>-</span>
          </template>

          <template #cell-actions="{ item }">
            <div class="flex gap-x-8 flex-wrap">
              <MButton size="sm" @click="navigateToEdit(item)">編輯</MButton>
              <MButton size="sm" variant="danger" @click="deleteOne(item)">
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
import DateFormatter from '@/components/common/DateFormatter.vue';

import RechargePlanSearchForm from '@/components/rechargePlan/RechargePlanSearchForm.vue';

import { useDialogStore } from '@/stores';
import { executeApi } from '@/utils/executeApiUtils';

import {
  queryRechargePlans,
  deleteRechargePlan,
  updateRechargePlan,
} from '@/services/adminRechargePlanService';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

/* ==============================
 * Router / Store
 * ============================== */
const router = useRouter();
const dialogStore = useDialogStore();

/* ==============================
 * Form & InitValues
 * ============================== */
const formRef = ref<FormContext | null>(null);

// 後端目前 list 是全查：先保留給 UI（之後你要做前端過濾也可）
const initValues = ref<any>({
  keyword: '',
});

/* ==============================
 * Search Hook (local list)
 * ============================== */
const { list, hasData, isSearch, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

const loadSelectOptions = async () => {
  await nextTick();
};

/* ==============================
 * Utils
 * ============================== */
const formatMoney = (n: any) => {
  const num = Number(n);
  if (Number.isNaN(num)) return n ?? '-';
  return num.toLocaleString('zh-TW');
};

const statusText = (isActive?: boolean) => (isActive ? '啟用' : '停用');

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
    }),
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
  { field: 'displayOrder', label: '排序', width: 80, sortable: true },
  { field: 'name', label: '方案名稱', width: 200, sortable: true },
  { field: 'amount', label: '儲值金額', width: 120, sortable: true },
  { field: 'goldCoins', label: '金幣', width: 100, sortable: true },
  { field: 'bonusCoins', label: '贈送', width: 100, sortable: true },
  { field: 'bonusPercentage', label: '加碼%', width: 100, sortable: true },
  { field: 'isActive', label: '狀態', width: 100, sortable: true },
  { field: 'isPromotional', label: '活動方案', width: 110, sortable: true },
  { field: 'startTime', label: '開始時間', width: 170, sortable: true },
  { field: 'endTime', label: '結束時間', width: 170, sortable: true },
  { field: 'updatedAt', label: '更新時間', width: 170, sortable: true },
  { field: 'actions', label: '操作', width: 200 },
];

/* ==============================
 * Submit (Query)
 * ============================== */
const onSubmit = async (_values: any) => {
  // 後端：GET /admin/recharge-plan/list
  await query(() => queryRechargePlans());
  goToPage(1);
  isSearch.value = true;
};

/* ==============================
 * Selection / Delete
 * ============================== */
const selectedIds = ref<string[]>([]);

const selectedRows = computed(() =>
  list.value.filter((row: any) => selectedIds.value.includes(row.id)),
);

const canDelete = computed(() => selectedRows.value.length > 0);

const refresh = async () => {
  const values = formRef.value?.values || initValues.value;
  await onSubmit(values);
  selectedIds.value = [];
};

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
    onSuccess: async (results: any[]) => {
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

/* ==============================
 * Navigation
 * ============================== */
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
    },
    showSuccessDialog: false,
  });
};

const navigateToAdd = () => router.push('/home/recharge-plan/add');
const navigateToEdit = (item: any) =>
  router.push(`/home/recharge-plan/edit/${item.id}`);

/* ==============================
 * Sort Panel (drag-and-drop)
 * ============================== */
const showSortPanel = ref(false);
const sortableList = ref<any[]>([]);
const isSaving = ref(false);
let dragFromIndex = -1;
const dragOverIndex = ref(-1);

const openSortPanel = () => {
  sortableList.value = [...list.value].sort(
    (a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  );
  showSortPanel.value = true;
};

const onDragStart = (index: number) => {
  dragFromIndex = index;
};

const onDragOver = (index: number) => {
  dragOverIndex.value = index;
};

const onDrop = (toIndex: number) => {
  if (dragFromIndex === -1 || dragFromIndex === toIndex) return;
  const items = [...sortableList.value];
  const moved = items.splice(dragFromIndex, 1)[0];
  items.splice(toIndex, 0, moved);
  sortableList.value = items;
  dragFromIndex = toIndex;
  dragOverIndex.value = -1;
};

const onDragEnd = () => {
  dragFromIndex = -1;
  dragOverIndex.value = -1;
};

const saveSortOrder = async () => {
  isSaving.value = true;
  const updates = sortableList.value.map((item: any, index: number) => ({
    id: item.id,
    displayOrder: index,
  }));

  await executeApi({
    fn: async () =>
      Promise.all(
        updates.map((u) => updateRechargePlan(u.id, { displayOrder: u.displayOrder })),
      ),
    onSuccess: async () => {
      await openInfoDialog({
        title: '提示訊息',
        message: '排序儲存成功',
        iconType: 'success',
      });
      showSortPanel.value = false;
      await refresh();
    },
    showSuccessDialog: false,
  });
  isSaving.value = false;
};

/* ==============================
 * Lifecycle
 * ============================== */
onMounted(async () => {
  await loadSelectOptions();
  await onSubmit(initValues.value);
});
</script>

<style scoped>
.recharge__toggle {
  border: none;
  border-radius: 12px;
  padding: 3px 12px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.15s;
}
.recharge__toggle--on {
  background: #d1fae5;
  color: #065f46;
}
.recharge__toggle--off {
  background: #f3f4f6;
  color: #6b7280;
}

.recharge__toggle:hover {
  opacity: 0.8;
}

.recharge__badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
}
.recharge__badge--promo {
  background: #fef3c7;
  color: #d97706;
}
.recharge__badge--active {
  background: #d1fae5;
  color: #065f46;
}
.recharge__badge--normal {
  background: #f3f4f6;
  color: #6b7280;
}

/* Sort Panel */
.sort-panel {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
}
.sort-panel__title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}
.sort-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sort-list__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: grab;
  transition: box-shadow 0.15s, border-color 0.15s;
  user-select: none;
}
.sort-list__item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.sort-list__item--over {
  border-color: #6366f1;
  background: #eef2ff;
}
.sort-list__handle {
  font-size: 18px;
  color: #9ca3af;
  cursor: grab;
}
.sort-list__order {
  min-width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #6366f1;
  color: #fff;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
}
.sort-list__name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #111827;
}
.sort-list__meta {
  font-size: 12px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 6px;
}
.sort-list__badge {
  background: #fef3c7;
  color: #d97706;
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 11px;
  font-weight: 600;
}
</style>

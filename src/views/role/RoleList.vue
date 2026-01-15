<!-- src/views/role/RoleList.vue -->
<template>
  <MCard>
    <FormTitle title="角色管理" />

    <div class="flex justify-end gap-x-12 flex-wrap m-b-12">
      <MButton @click="navigateToAdd">新增</MButton>

      <MButton class="mbtn--red" :disabled="!canDelete" @click="deleteSelected">
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

        <template #cell-createdAt="{ item }">
          <DateFormatter v-if="item.createdAt" :date="item.createdAt" />
          <span v-else>-</span>
        </template>

        <template #cell-updatedAt="{ item }">
          <DateFormatter v-if="item.updatedAt" :date="item.updatedAt" />
          <span v-else>-</span>
        </template>

        <template #cell-actions="{ item }">
          <div class="flex gap-x-8">
            <MButton size="sm" @click="navigateToEdit(item)">編輯</MButton>
            <MButton size="sm" @click="navigateToPermissions(item)"
              >權限</MButton
            >
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
</template>

<script setup lang="ts">
/* ==============================
 * Imports
 * ============================== */
import { ref, computed, onMounted } from 'vue';
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

import { useDialogStore } from '@/stores';
import { executeApi } from '@/utils/executeApiUtils';

import { getAllRoles, deleteRole } from '@/services/adminRoleService';

/* ==============================
 * Setup
 * ============================== */
const router = useRouter();
const dialogStore = useDialogStore();

/* ==============================
 * Search Hook (local list)
 * ============================== */
const { list, hasData, isSearch, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

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
 * Table Columns（對齊你的回傳欄位）
 * ============================== */
const columns = [
  { field: 'name', label: '角色名稱', width: 200, sortable: true },
  { field: 'code', label: '角色代碼', width: 180, sortable: true },
  { field: 'description', label: '描述', width: 320, sortable: true },
  { field: 'createdAt', label: '建立時間', width: 180, sortable: true },
  { field: 'updatedAt', label: '更新時間', width: 180, sortable: true },
  { field: 'actions', label: '操作', width: 180 },
];

/* ==============================
 * Selection / Bulk Actions
 * ============================== */
const selectedIds = ref<string[]>([]);
const canDelete = computed(() => selectedIds.value.length > 0);

/* ==============================
 * Fetch List
 * ============================== */
const fetchList = async () => {
  await query(() => getAllRoles());
  goToPage(1);
};

/* ==============================
 * Delete Selected
 * ============================== */
const deleteSelected = async () => {
  if (!canDelete.value) return;

  const ok = await dialogStore.openConfirmDialog({
    title: '刪除確認',
    message: `確定要刪除選中的 ${selectedIds.value.length} 筆角色嗎？（系統預設角色不可刪）`,
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(selectedIds.value.map((id) => deleteRole(id))),
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

      selectedIds.value = [];
      await fetchList();
    },
    showSuccessDialog: false,
  });
};

/* ==============================
 * Navigation
 * ============================== */
const navigateToAdd = () => router.push('/home/roles/add');
const navigateToEdit = (item: any) =>
  router.push(`/home/roles/edit/${item.id}`);
const navigateToPermissions = (item: any) =>
  router.push(`/home/roles/permissions/${item.id}`);

/* ==============================
 * Lifecycle
 * ============================== */
onMounted(async () => {
  await fetchList();
  isSearch.value = true;
});
</script>

<style scoped></style>

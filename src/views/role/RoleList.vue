<!-- src/views/role/RoleList.vue -->
<template>
  <MCard>
    <FormTitle title="角色管理" />

    <div class="role-list__toolbar">
      <MButton @click="navigateToAdd">
        <font-awesome-icon icon="fa-plus" class="m-r-4" />
        新增
      </MButton>

      <MButton class="mbtn--red" :disabled="!canDelete" @click="deleteSelected">
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
        <!-- 角色名稱 -->
        <template #cell-name="{ item }">
          <span class="clickable" @click="navigateToEdit(item)">
            {{ item.name || '-' }}
          </span>
        </template>

        <!-- 角色代碼 -->
        <template #cell-code="{ item }">
          <span>{{ item.code || '-' }}</span>
        </template>

        <!-- 描述 -->
        <template #cell-description="{ item }">
          <span class="role-list__description">
            {{ item.description || '-' }}
          </span>
        </template>

        <!-- 建立時間 -->
        <template #cell-createdAt="{ item }">
          <DateFormatter :date="item.createdAt" format="YYYY-MM-DD HH:mm:ss" />
        </template>

        <!-- 更新時間 -->
        <template #cell-updatedAt="{ item }">
          <DateFormatter :date="item.updatedAt" format="YYYY-MM-DD HH:mm:ss" />
        </template>

        <!-- 操作 -->
        <template #cell-actions="{ item }">
          <div class="role-list__actions">
            <MButton size="sm" @click="navigateToEdit(item)">
              <font-awesome-icon icon="fa-pen-to-square" class="m-r-4" />
              編輯
            </MButton>

            <MButton
              size="sm"
              variant="secondary"
              @click="navigateToPermissions(item)"
            >
              <font-awesome-icon icon="fa-key" class="m-r-4" />
              權限
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
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
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

import { executeApi } from '@/utils/executeApiUtils';
import { useRoleStore } from '@/stores/role/useRoleStore';

import { deleteRole, getAllRoles } from '@/services/adminRoleService';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

const router = useRouter();
const roleStore = useRoleStore();

/* --------------------------------------
 * List
 * -------------------------------------- */
const { list, hasData, isSearch, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

/* --------------------------------------
 * Query
 * -------------------------------------- */
const fetchList = async () => {
  await query(() => getAllRoles());

  selectedIds.value = [];
  goToPage(1);
  isSearch.value = true;
};

const refresh = async () => {
  await fetchList();
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
  { field: 'name', label: '角色名稱', width: 180, sortable: true },
  { field: 'code', label: '角色代碼', width: 180, sortable: true },
  { field: 'description', label: '描述', width: 280, sortable: true },
  { field: 'createdAt', label: '建立時間', width: 170, sortable: true },
  { field: 'updatedAt', label: '更新時間', width: 170, sortable: true },
  { field: 'actions', label: '操作', width: 180 },
];

/* --------------------------------------
 * Selection
 * -------------------------------------- */
const selectedIds = ref<string[]>([]);

watch(
  selectedIds,
  (value) => {
    roleStore.setSelectedIds([...value]);
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
const deleteSelected = async () => {
  if (!canDelete.value) return;

  const ok = await openConfirmDialog({
    title: '刪除確認',
    message: `確定要刪除選中的 ${selectedIds.value.length} 筆角色嗎？（刪除後無法復原）`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(selectedIds.value.map((id) => deleteRole(id))),
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

      selectedIds.value = [];
      roleStore.clearSelectedIds();

      await refresh();
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

/* --------------------------------------
 * Save state / Navigation
 * -------------------------------------- */
const saveListState = () => {
  roleStore.setList([...list.value]);
  roleStore.setSort(sortKey.value, sortOrder.value);
  roleStore.setCurrentPage(currentPage.value);
  roleStore.setPageLimitSize(pageLimitSize.value);
  roleStore.setSelectedIds([...selectedIds.value]);
};

const navigateToAdd = () => {
  saveListState();
  router.push('/home/roles/add');
};

const navigateToEdit = (item: any) => {
  saveListState();
  router.push(`/home/roles/edit/${item.id}`);
};

const navigateToPermissions = (item: any) => {
  saveListState();
  router.push(`/home/roles/permissions/${item.id}`);
};

/* --------------------------------------
 * Lifecycle
 * -------------------------------------- */
onMounted(async () => {
  if (roleStore.list.length > 0 && !roleStore.shouldRefresh) {
    list.value = [...roleStore.list];

    sortKey.value = roleStore.sortKey || '';
    sortOrder.value = roleStore.sortOrder || 'asc';
    pageLimitSize.value = roleStore.pageLimitSize;
    selectedIds.value = [...roleStore.selectedIds];

    await nextTick();
    goToPage(roleStore.currentPage);

    isSearch.value = true;
    roleStore.resetAll();
    return;
  }

  await fetchList();
  roleStore.resetAll();
});
</script>

<style scoped lang="scss">
.role-list {
  &__toolbar {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  &__actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__description {
    display: inline-block;
    max-width: 260px;
    overflow: hidden;
    vertical-align: middle;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

@media (max-width: 640px) {
  .role-list {
    &__toolbar {
      justify-content: flex-start;
    }
  }
}
</style>

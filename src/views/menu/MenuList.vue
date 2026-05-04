<!-- src/views/menu/MenuList.vue -->
<template>
  <MCard>
    <FormTitle title="選單管理" />

    <div v-if="isAdmin" class="menuList__notice m-b-12">
      ⚠ 選單資料須與前端路由對應，新增前請確認已部署對應頁面。
    </div>

    <div class="flex justify-end gap-x-12 flex-wrap m-b-12">
      <MButton v-if="isAdmin" @click="navigateToAdd">新增</MButton>

      <MButton v-if="isAdmin" :disabled="!canDelete" class="mbtn--red" @click="deleteSelected">
        刪除
      </MButton>

      <MButton @click="navigateToTree">樹狀檢視</MButton>
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
        <!-- 名稱 -->
        <template #cell-name="{ item }">
          <span class="clickable" @click="navigateToEdit(item)">
            {{ item.name || '-' }}
          </span>
        </template>

        <!-- 父選單 -->
        <template #cell-parentId="{ item }">
          <span>{{ item.parentName || item.parentId || '-' }}</span>
        </template>

        <!-- 圖示 -->
        <template #cell-icon="{ item }">
          <span>{{ item.icon || '-' }}</span>
        </template>

        <!-- 排序 -->
        <template #cell-orderNum="{ item }">
          <NumberFormatter
            v-if="
              item.orderNum !== null &&
              item.orderNum !== undefined &&
              item.orderNum !== ''
            "
            :number="item.orderNum"
            locale="zh-TW"
          />
          <span v-else>-</span>
        </template>

        <!-- 是否可見 -->
        <template #cell-isVisible="{ item }">
          <span>{{ item.isVisible ? '顯示' : '隱藏' }}</span>
        </template>

        <!-- 更新時間 -->
        <template #cell-updatedAt="{ item }">
          <span>{{ formatDateTime(item.updatedAt) }}</span>
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
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthStore } from '@/stores/authStore';
import { usePagination } from '@/hook/usePagination';
import { useSearchPage } from '@/hook/useSearchPage';
import { compareByKeySmart } from '@/utils/sortUtils';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import NoData from '@/components/common/NoData.vue';
import Pagination from '@/components/common/Pagination.vue';
import ReportTable from '@/components/common/ReportTable.vue';
import FormTitle from '@/components/common/FormTitle.vue';
import NumberFormatter from '@/components/common/NumberFormatter.vue';

import { useDialogStore } from '@/stores';
import { useMenuStore } from '@/stores/menu/useMenuStore';
import { executeApi } from '@/utils/executeApiUtils';

import { getAllMenus, deleteMenu } from '@/services/adminMenuService';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

const router = useRouter();
const dialogStore = useDialogStore();
const menuStore = useMenuStore();
const authStore = useAuthStore();

const isAdmin = computed(() =>
  (authStore.user?.roles ?? []).includes('ROLE_ADMIN'),
);

/* --------------------------------------
 * 搜尋 + 清單
 * -------------------------------------- */
const { list, hasData, isSearch, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

/* --------------------------------------
 * datetime
 * -------------------------------------- */
const formatDateTime = (v?: string) => (!v ? '-' : String(v).replace('T', ' '));

/* --------------------------------------
 * 排序
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
 * 分頁
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
 * 欄位
 * -------------------------------------- */
const columns = [
  { field: 'name', label: '名稱', width: 220, sortable: true },
  { field: 'code', label: '代碼', width: 180, sortable: true },
  { field: 'path', label: '路徑', width: 240, sortable: true },
  { field: 'parentId', label: '父選單', width: 220, sortable: true },
  { field: 'icon', label: '圖示', width: 140, sortable: true },
  { field: 'orderNum', label: '排序', width: 90, sortable: true },
  { field: 'isVisible', label: '可見', width: 100, sortable: true },
  { field: 'updatedAt', label: '更新時間', width: 170, sortable: true },
];

/* --------------------------------------
 * 勾選
 * -------------------------------------- */
const selectedIds = ref<string[]>([]);

const canDelete = computed(() => selectedIds.value.length > 0);

watch(
  selectedIds,
  (value) => {
    menuStore.setSelectedIds([...value]);
  },
  { deep: true },
);

/* --------------------------------------
 * 查詢
 * -------------------------------------- */
const fetchList = async () => {
  await query(() => getAllMenus());

  selectedIds.value = [];
  goToPage(1);
};

/* --------------------------------------
 * 刪除
 * -------------------------------------- */
const deleteSelected = async () => {
  if (!canDelete.value) return;

  const ok = await openConfirmDialog({
    title: '刪除確認',
    message: `確定要刪除選中的 ${selectedIds.value.length} 筆選單嗎？（有子選單者不可刪除）`,
  });

  if (!ok) return;

  const ids = [...selectedIds.value];

  await executeApi({
    fn: async () => Promise.allSettled(ids.map((id) => deleteMenu(id))),
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

      selectedIds.value = [];
      menuStore.clearSelectedIds();

      await fetchList();
    },
    showSuccessDialog: false,
  });
};

/* --------------------------------------
 * 保存列表狀態
 * -------------------------------------- */
const saveListState = () => {
  menuStore.setList([...list.value]);
  menuStore.setSort(sortKey.value, sortOrder.value);
  menuStore.setCurrentPage(currentPage.value);
  menuStore.setPageLimitSize(pageLimitSize.value);
  menuStore.setSelectedIds([...selectedIds.value]);
};

/* --------------------------------------
 * 導頁
 * -------------------------------------- */
const navigateToAdd = () => {
  saveListState();
  router.push('/home/menus/add');
};

const navigateToEdit = (item: any) => {
  saveListState();
  router.push(`/home/menus/edit/${item.id}`);
};

const navigateToTree = () => {
  saveListState();
  router.push('/home/menus/tree');
};

/* --------------------------------------
 * Mounted
 * 還原列表狀態 or 初次查詢
 * -------------------------------------- */
onMounted(async () => {
  if (menuStore.list.length > 0 && !menuStore.shouldRefresh) {
    list.value = [...menuStore.list];

    sortKey.value = menuStore.sortKey || '';
    sortOrder.value = menuStore.sortOrder || 'asc';
    pageLimitSize.value = menuStore.pageLimitSize;
    selectedIds.value = [...menuStore.selectedIds];

    await nextTick();
    goToPage(menuStore.currentPage);

    isSearch.value = true;
    menuStore.resetAll();
    return;
  }

  await fetchList();
  isSearch.value = true;
  menuStore.resetAll();
});
</script>

<style scoped lang="scss">
.menuList__notice {
  padding: 10px 14px;
  background: #fffbeb;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  color: #92400e;
  font-size: 13px;
}
</style>

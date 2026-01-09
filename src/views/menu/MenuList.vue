<!-- src/views/menu/MenuList.vue -->
<template>
  <MCard>
    <FormTitle title="選單管理" />

    <div class="flex justify-end gap-x-12 flex-wrap m-b-12">
      <MButton @click="navigateToAdd">新增</MButton>
      <MButton :disabled="!canDelete" class="mbtn--red" @click="deleteSelected">
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

        <!-- ✅ 排序（改用 NumberFormatter） -->
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
          @update:pageLimitSize="pageLimitSize = $event"
        />
      </div>
    </template>
  </MCard>
</template>

<script setup lang="ts">
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
import NumberFormatter from '@/components/common/NumberFormatter.vue';

import { useDialogStore } from '@/stores';
import { executeApi } from '@/utils/executeApiUtils';

import { getAllMenus, deleteMenu } from '@/services/adminMenuService';

const router = useRouter();
const dialogStore = useDialogStore();

const { list, hasData, isSearch, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

/* datetime */
const formatDateTime = (v?: string) => (!v ? '-' : String(v).replace('T', ' '));

/* sorting */
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

/* pagination */
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

/* columns（依 res 欄位） */
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

/* selection */
const selectedIds = ref<string[]>([]);
const canDelete = computed(() => selectedIds.value.length > 0);

/* fetch */
const fetchList = async () => {
  await query(() => getAllMenus());
  goToPage(1);
};

/* delete */
const deleteSelected = async () => {
  if (!canDelete.value) return;

  const ok = await dialogStore.openConfirmDialog({
    title: '刪除確認',
    message: `確定要刪除選中的 ${selectedIds.value.length} 筆選單嗎？（有子選單者不可刪除）`,
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(selectedIds.value.map((id) => deleteMenu(id))),
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

/* navigation */
const navigateToAdd = () => router.push('/home/menus/add');
const navigateToEdit = (item: any) =>
  router.push(`/home/menus/edit/${item.id}`);
const navigateToTree = () => router.push('/home/menus/tree');

onMounted(async () => {
  await fetchList();
  isSearch.value = true;
});
</script>

<style scoped></style>

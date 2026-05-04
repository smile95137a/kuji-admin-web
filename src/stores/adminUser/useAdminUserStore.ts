// src/stores/adminUser/useAdminUserStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAdminUserStore = defineStore('adminUser', () => {
  /** 搜尋條件 */
  const searchCondition = ref({
    keyword: '',
    status: '',
    storeId: '',
    roleCode: '',
  });

  /** 查詢結果 */
  const list = ref<any[]>([]);

  /** 分頁資訊 */
  const currentPage = ref(1);
  const pageLimitSize = ref(10);

  /** 排序 */
  const sortKey = ref('');
  const sortOrder = ref<'asc' | 'desc' | ''>('asc');

  /** 已勾選資料 */
  const selectedIds = ref<string[]>([]);

  /** 返回列表後是否重新查詢 */
  const shouldRefresh = ref(false);

  const setSearchCondition = (value: any) => {
    searchCondition.value = {
      ...searchCondition.value,
      ...(value ?? {}),
    };
  };

  const setList = (value: any[]) => {
    list.value = value ?? [];
  };

  const setCurrentPage = (value: number) => {
    currentPage.value = value;
  };

  const setPageLimitSize = (value: number) => {
    pageLimitSize.value = value;
  };

  const setSort = (key: string, order: 'asc' | 'desc' | '') => {
    sortKey.value = key;
    sortOrder.value = order;
  };

  const setSelectedIds = (value: string[]) => {
    selectedIds.value = value ?? [];
  };

  const setShouldRefresh = (value: boolean) => {
    shouldRefresh.value = value;
  };

  const clearSelectedIds = () => {
    selectedIds.value = [];
  };

  const resetAll = () => {
    searchCondition.value = {
      keyword: '',
      status: '',
      storeId: '',
      roleCode: '',
    };

    list.value = [];
    currentPage.value = 1;
    pageLimitSize.value = 10;
    sortKey.value = '';
    sortOrder.value = 'asc';
    selectedIds.value = [];
    shouldRefresh.value = false;
  };

  return {
    searchCondition,
    list,
    currentPage,
    pageLimitSize,
    sortKey,
    sortOrder,
    selectedIds,
    shouldRefresh,

    setSearchCondition,
    setList,
    setCurrentPage,
    setPageLimitSize,
    setSort,
    setSelectedIds,
    setShouldRefresh,
    clearSelectedIds,
    resetAll,
  };
});

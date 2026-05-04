// src/stores/menu/useMenuStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useMenuStore = defineStore('menu', () => {
  /** 查詢結果 / 選單列表 */
  const list = ref<any[]>([]);

  /** 分頁資訊 */
  const currentPage = ref(1);
  const pageLimitSize = ref(10);

  /** 排序 */
  const sortKey = ref('');
  const sortOrder = ref<'asc' | 'desc' | ''>('asc');

  /** 已勾選資料 */
  const selectedIds = ref<string[]>([]);

  /** 返回列表頁後是否要重新查詢 */
  const shouldRefresh = ref(false);

  /** setters */
  const setList = (v: any[]) => {
    list.value = v ?? [];
  };

  const setCurrentPage = (v: number) => {
    currentPage.value = v;
  };

  const setPageLimitSize = (v: number) => {
    pageLimitSize.value = v;
  };

  const setSort = (key: string, order: 'asc' | 'desc' | '') => {
    sortKey.value = key;
    sortOrder.value = order;
  };

  const setSelectedIds = (v: string[]) => {
    selectedIds.value = v ?? [];
  };

  const setShouldRefresh = (v: boolean) => {
    shouldRefresh.value = v;
  };

  /** 清除勾選 */
  const clearSelectedIds = () => {
    selectedIds.value = [];
  };

  /** Reset */
  const resetAll = () => {
    list.value = [];
    currentPage.value = 1;
    pageLimitSize.value = 10;
    sortKey.value = '';
    sortOrder.value = 'asc';
    selectedIds.value = [];
    shouldRefresh.value = false;
  };

  return {
    list,
    currentPage,
    pageLimitSize,
    sortKey,
    sortOrder,
    selectedIds,
    shouldRefresh,

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

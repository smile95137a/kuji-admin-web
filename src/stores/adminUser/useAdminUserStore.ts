// src/stores/adminUser/useAdminUserStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAdminUserStore = defineStore('adminUser', () => {
  const list = ref<any[]>([]);
  const searchCondition = ref<any>({
    keyword: '',
    role: '',
    storeId: '',
    status: '',
  });

  const sortKey = ref<string>('');
  const sortOrder = ref<'asc' | 'desc' | ''>('asc');

  const currentPage = ref<number>(1);
  const pageLimitSize = ref<number>(10);

  const setList = (rows: any[]) => {
    list.value = rows ?? [];
  };

  const setSearchCondition = (cond: any) => {
    searchCondition.value = { ...searchCondition.value, ...(cond ?? {}) };
  };

  const setSort = (key: string, order: any) => {
    sortKey.value = key || '';
    sortOrder.value = order || 'asc';
  };

  const setCurrentPage = (p: number) => {
    currentPage.value = p;
  };

  const setPageLimitSize = (n: number) => {
    pageLimitSize.value = n;
  };

  const resetAll = () => {
    list.value = [];
    searchCondition.value = {
      keyword: '',
      role: '',
      storeId: '',
      status: '',
    };
    sortKey.value = '';
    sortOrder.value = 'asc';
    currentPage.value = 1;
    pageLimitSize.value = 10;
  };

  return {
    list,
    searchCondition,
    sortKey,
    sortOrder,
    currentPage,
    pageLimitSize,

    setList,
    setSearchCondition,
    setSort,
    setCurrentPage,
    setPageLimitSize,
    resetAll,
  };
});

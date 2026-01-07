// src/stores/lottery/useLotteryStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useLotteryStore = defineStore('lottery', () => {
  const searchCondition = ref<any>({
    status: '',
    title: '',
    keyword: '',
    storeId: '',
    createdAtStart: '',
    createdAtEnd: '',
  });

  const list = ref<any[]>([]);

  const currentPage = ref(1);
  const pageLimitSize = ref(10);

  const sortKey = ref('');
  const sortOrder = ref<'asc' | 'desc' | ''>('asc');

  const setSearchCondition = (cond: any) => {
    searchCondition.value = { ...searchCondition.value, ...(cond || {}) };
  };

  const setList = (rows: any[]) => {
    list.value = Array.isArray(rows) ? rows : [];
  };

  const setCurrentPage = (p: number) => (currentPage.value = p);
  const setPageLimitSize = (n: number) => (pageLimitSize.value = n);

  const setSort = (key: string, order: 'asc' | 'desc' | '' = 'asc') => {
    sortKey.value = key;
    sortOrder.value = order;
  };

  const resetAll = () => {
    list.value = [];
    currentPage.value = 1;
    pageLimitSize.value = 10;
    sortKey.value = '';
    sortOrder.value = 'asc';
  };

  return {
    searchCondition,
    list,
    currentPage,
    pageLimitSize,
    sortKey,
    sortOrder,

    setSearchCondition,
    setList,
    setCurrentPage,
    setPageLimitSize,
    setSort,
    resetAll,
  };
});

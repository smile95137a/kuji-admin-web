// src/stores/banner/useBannerStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export type BannerSearchCondition = {
  storeId: string;
  title: string;
  status: '' | 'PUBLISHED' | 'UNPUBLISHED';

  createdAtStart: string | null;
  createdAtEnd: string | null;
  keyword: string;
};

export const useBannerStore = defineStore('banner', () => {
  /* -----------------------------
   * 搜尋條件
   * ----------------------------- */
  const searchCondition = ref<BannerSearchCondition>({
    storeId: '',
    title: '',
    status: '',

    createdAtStart: null,
    createdAtEnd: null,
    keyword: '',
  });

  /* -----------------------------
   * 查詢結果清單（暫存用）
   * ----------------------------- */
  const list = ref<any[]>([]);

  /* -----------------------------
   * 分頁
   * ----------------------------- */
  const currentPage = ref(1);
  const pageLimitSize = ref(10);

  /* -----------------------------
   * 排序
   * ----------------------------- */
  const sortKey = ref('');
  const sortOrder = ref<'asc' | 'desc' | ''>('');

  /* -----------------------------
   * setters
   * ----------------------------- */
  const setSearchCondition = (v: Partial<BannerSearchCondition>) => {
    searchCondition.value = { ...searchCondition.value, ...v };
  };

  const setList = (v: any[]) => (list.value = v ?? []);

  const setCurrentPage = (v: number) => (currentPage.value = v);
  const setPageLimitSize = (v: number) => (pageLimitSize.value = v);

  const setSort = (key: string, order: 'asc' | 'desc' | '') => {
    sortKey.value = key;
    sortOrder.value = order;
  };

  /* -----------------------------
   * Reset（回列表後清掉）
   * ----------------------------- */
  const resetAll = () => {
    searchCondition.value = {
      storeId: '',
      title: '',
      status: '',

      createdAtStart: null,
      createdAtEnd: null,
      keyword: '',
    };
    list.value = [];
    currentPage.value = 1;
    pageLimitSize.value = 10;
    sortKey.value = '';
    sortOrder.value = '';
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

// src/stores/news/useNewsStore.ts
import { defineStore } from 'pinia';

export interface NewsSearchCondition {
  status?: string;
  title?: string;
  keyword?: string;
  createdAtStart?: string;
  createdAtEnd?: string;

  // 你後端 NewsCondition 之後有加欄位就往這裡補
  [key: string]: any;
}

export type SortOrder = 'asc' | 'desc' | '';

export const useNewsStore = defineStore('newsStore', {
  state: () => ({
    // 搜尋條件暫存（列表 -> 編輯 -> 回來還原用）
    searchCondition: {
      status: '',
      title: '',
      keyword: '',
      createdAtStart: '',
      createdAtEnd: '',
    } as NewsSearchCondition,

    // 列表暫存
    list: [] as any[],

    // 排序暫存
    sortKey: '' as string,
    sortOrder: 'asc' as SortOrder,

    // 分頁暫存
    currentPage: 1 as number,
    pageLimitSize: 10 as number,
  }),

  actions: {
    setSearchCondition(payload: NewsSearchCondition) {
      this.searchCondition = { ...this.searchCondition, ...(payload || {}) };
    },

    setList(list: any[]) {
      this.list = Array.isArray(list) ? list : [];
    },

    setSort(key: string, order: SortOrder) {
      this.sortKey = key || '';
      this.sortOrder = order || '';
    },

    setCurrentPage(page: number) {
      const p = Number(page);
      this.currentPage = Number.isFinite(p) && p > 0 ? p : 1;
    },

    setPageLimitSize(size: number) {
      const n = Number(size);
      this.pageLimitSize = Number.isFinite(n) && n > 0 ? n : 10;
    },

    resetAll() {
      this.searchCondition = {
        status: '',
        title: '',
        keyword: '',
        createdAtStart: '',
        createdAtEnd: '',
      };
      this.list = [];
      this.sortKey = '';
      this.sortOrder = 'asc';
      this.currentPage = 1;
      this.pageLimitSize = 10;
    },
  },
});

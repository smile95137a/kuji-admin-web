// src/stores/member/useMemberStore.ts
import { defineStore } from 'pinia';

export const useMemberStore = defineStore('memberStore', {
  state: () => ({
    /** 查詢條件 */
    searchCondition: {
      keyword: '', // 關鍵字
      status: '', // 狀態（啟用/停用）
    },

    /** 查詢結果列表 */
    list: [] as any[],
  }),

  actions: {
    /** 設定查詢條件（部份更新） */
    setSearchCondition(cond: any) {
      this.searchCondition = { ...this.searchCondition, ...cond };
    },

    /** 設定列表資料 */
    setList(list: any[]) {
      this.list = list;
    },

    /** 清空查詢條件 + 清空列表 */
    clear() {
      this.list = [];
      this.searchCondition = {
        keyword: '',
        status: '',
      };
    },
  },
});

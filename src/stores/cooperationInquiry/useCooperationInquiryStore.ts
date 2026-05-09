// src/stores/cooperationInquiry/useCooperationInquiryStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useCooperationInquiryStore = defineStore(
  'cooperationInquiry',
  () => {
    /** 搜尋條件 */
    const searchCondition = ref({
      status: '',
      type: '',
      keyword: '',
    });

    /** 查詢結果 */
    const list = ref<any[]>([]);

    /** 分頁資訊 */
    const currentPage = ref(1);
    const pageLimitSize = ref(10);
    const totalElements = ref(0);

    /** 排序 */
    const sortKey = ref('createdAt');
    const sortOrder = ref<'asc' | 'desc' | ''>('desc');

    /** 已勾選資料 */
    const selectedIds = ref<string[]>([]);

    /** 返回列表後是否重新查詢 */
    const shouldRefresh = ref(false);

    const setSearchCondition = (v: any) => {
      searchCondition.value = {
        ...searchCondition.value,
        ...(v ?? {}),
      };
    };

    const setList = (v: any[]) => {
      list.value = v ?? [];
    };

    const setCurrentPage = (v: number) => {
      currentPage.value = v;
    };

    const setPageLimitSize = (v: number) => {
      pageLimitSize.value = v;
    };

    const setTotalElements = (v: number) => {
      totalElements.value = v ?? 0;
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

    const clearSelectedIds = () => {
      selectedIds.value = [];
    };

    const resetAll = () => {
      searchCondition.value = {
        status: '',
        type: '',
        keyword: '',
      };

      list.value = [];
      currentPage.value = 1;
      pageLimitSize.value = 10;
      totalElements.value = 0;
      sortKey.value = 'createdAt';
      sortOrder.value = 'desc';
      selectedIds.value = [];
      shouldRefresh.value = false;
    };

    return {
      searchCondition,
      list,
      currentPage,
      pageLimitSize,
      totalElements,
      sortKey,
      sortOrder,
      selectedIds,
      shouldRefresh,

      setSearchCondition,
      setList,
      setCurrentPage,
      setPageLimitSize,
      setTotalElements,
      setSort,
      setSelectedIds,
      setShouldRefresh,
      clearSelectedIds,
      resetAll,
    };
  },
);

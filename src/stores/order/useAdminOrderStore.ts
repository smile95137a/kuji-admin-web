// src/stores/order/useAdminOrderStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAdminOrderStore = defineStore('adminOrder', () => {
  /** 搜尋條件 */
  const searchCondition = ref({
    orderNo: '',
    userKeyword: '',
    shippingMethod: '',
    shippingStatus: '',
    recipientName: '',
    recipientPhone: '',
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

  /** setters */
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

  /** Reset */
  const resetAll = () => {
    searchCondition.value = {
      orderNo: '',
      userKeyword: '',
      shippingMethod: '',
      shippingStatus: '',
      recipientName: '',
      recipientPhone: '',
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

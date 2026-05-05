// src/stores/report/useStorePerformanceReportStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useStorePerformanceReportStore = defineStore(
  'storePerformanceReport',
  () => {
    /** 搜尋條件 */
    const searchCondition = ref<any>({
      startDate: '',
      endDate: '',
      storeId: '',
    });

    /** 報表原始資料 */
    const reportData = ref<any>(null);

    /** 摘要資料 */
    const summaryEntries = ref<any[]>([]);

    /** 報表區塊 */
    const tableSections = ref<any[]>([]);

    /** 目前選中的資料區塊 */
    const selectedSectionKey = ref('');

    /** 目前顯示列表 */
    const list = ref<any[]>([]);

    /** 分頁資訊 */
    const currentPage = ref(1);
    const pageLimitSize = ref(10);

    /** 排序 */
    const sortKey = ref('');
    const sortOrder = ref<'asc' | 'desc' | ''>('asc');

    /** 返回列表後是否重新查詢 */
    const shouldRefresh = ref(false);

    const setSearchCondition = (v: any) => {
      searchCondition.value = {
        ...searchCondition.value,
        ...(v ?? {}),
      };
    };

    const setReportData = (v: any) => {
      reportData.value = v ?? null;
    };

    const setSummaryEntries = (v: any[]) => {
      summaryEntries.value = v ?? [];
    };

    const setTableSections = (v: any[]) => {
      tableSections.value = v ?? [];
    };

    const setSelectedSectionKey = (v: string) => {
      selectedSectionKey.value = v;
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

    const setShouldRefresh = (v: boolean) => {
      shouldRefresh.value = v;
    };

    const resetAll = () => {
      searchCondition.value = {
        startDate: '',
        endDate: '',
        storeId: '',
      };

      reportData.value = null;
      summaryEntries.value = [];
      tableSections.value = [];
      selectedSectionKey.value = '';
      list.value = [];
      currentPage.value = 1;
      pageLimitSize.value = 10;
      sortKey.value = '';
      sortOrder.value = 'asc';
      shouldRefresh.value = false;
    };

    return {
      searchCondition,
      reportData,
      summaryEntries,
      tableSections,
      selectedSectionKey,
      list,
      currentPage,
      pageLimitSize,
      sortKey,
      sortOrder,
      shouldRefresh,

      setSearchCondition,
      setReportData,
      setSummaryEntries,
      setTableSections,
      setSelectedSectionKey,
      setList,
      setCurrentPage,
      setPageLimitSize,
      setSort,
      setShouldRefresh,
      resetAll,
    };
  },
);

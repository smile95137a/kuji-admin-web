// src/hook/useSearchPage.ts
import { ref, computed } from 'vue';
import { executeApi } from '@/utils/executeApiUtils';

/**
 * 通用查詢頁 Hook
 * 支援兩種模式：
 * 1. Local 模式（預設）：內部維護 list 狀態。
 * 2. Store 模式：由外部提供 listRef。
 */
export function useSearchPage<T = any>(options?: {
  noDataText?: string;
  beforeSearchText?: string;
  useLocalList?: boolean;
  externalList?: () => T[];
}) {
  const isSearch = ref(false);

  const useLocalList = options?.useLocalList ?? true;

  // ======================
  // Local 模式：內部維護
  // ======================
  const localList = useLocalList ? ref<T[]>([]) : undefined;

  // ======================
  // Store 模式：外部提供 list
  // ======================
  const externalList = !useLocalList ? options?.externalList : undefined;

  // ======================
  // 是否有資料
  // ======================
  const hasData = computed(() => {
    if (useLocalList) {
      return localList!.value.length > 0;
    }
    return (externalList?.() ?? []).length > 0;
  });

  // ======================
  // 無資料訊息
  // ======================
  const noDataMessage = computed(() =>
    isSearch.value
      ? options?.noDataText ?? '查無資料'
      : options?.beforeSearchText ?? '請輸入查詢條件'
  );

  // ======================
  // 查詢
  // ======================
  const query = async (
    fn: () => Promise<any>,
    extract?: (res: any) => any,
    onAfter?: (data: any) => void
  ) => {
    await executeApi({
      fn,
      onSuccess: (data: any) => {
        isSearch.value = true;

        const result = extract ? extract(data) : data;

        if (useLocalList) {
          localList!.value = result ?? [];
        } else {
        }

        if (onAfter) onAfter(result);
      },
    });
  };

  const reset = () => {
    isSearch.value = false;
    if (useLocalList) localList!.value = [];
  };

  return {
    isSearch,
    noDataMessage,
    query,
    reset,
    list: useLocalList ? localList : undefined,
    hasData,
  };
}

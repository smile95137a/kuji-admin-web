import { useLoadingStore } from '@/stores/loadingStore';

export const withLoading = async <T>(fn: () => Promise<T>): Promise<T> => {
  const loadingStore = useLoadingStore();
  loadingStore.startLoading();
  try {
    return await fn();
  } catch (err) {
    console.error('withLoading error:', err);
    throw err;
  } finally {
    loadingStore.stopLoading();
  }
};

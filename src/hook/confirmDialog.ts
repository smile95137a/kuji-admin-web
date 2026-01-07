import { ref } from 'vue';

interface DialogOptions {
  customClass?: string;
  title?: string;
  message?: string;
}

export function useConfirmDialog() {
  const isConfirmDialogOpen = ref<boolean>(false);
  const confirmDialogOptions = ref<DialogOptions | null>(null);
  const customClass = ref<string | undefined>(undefined);
  let resolveConfirmPromise: (value: boolean) => void;

  const openConfirmDialog = (options: DialogOptions = {}): Promise<boolean> => {
    const mergedOptions: DialogOptions = {
      title: '提示訊息',
      ...options,
    };

    isConfirmDialogOpen.value = true;
    confirmDialogOptions.value = mergedOptions;
    customClass.value = mergedOptions.customClass;

    return new Promise<boolean>((resolve) => {
      resolveConfirmPromise = resolve;
    });
  };

  const closeConfirmDialog = (result: boolean) => {
    isConfirmDialogOpen.value = false;
    if (resolveConfirmPromise) {
      resolveConfirmPromise(result);
    }
  };

  return {
    isConfirmDialogOpen,
    confirmDialogOptions,
    customClass,
    openConfirmDialog,
    closeConfirmDialog,
  };
}

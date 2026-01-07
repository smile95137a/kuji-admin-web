import { ref } from 'vue';

type DialogIconType = 'question' | 'success' | 'warning';
type DialogIconSize =
  | 'xs'
  | 'sm'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | '6xl'
  | '7xl'
  | '8xl'
  | '9xl'
  | '10xl';

interface InfoDialogOptions {
  customClass?: string;
  title?: string;
  message?: string;
  iconType?: DialogIconType;
  iconSize?: DialogIconSize;
}

export function useInfoDialog() {
  const isInfoDialogOpen = ref<boolean>(false);
  const infoDialogOptions = ref<InfoDialogOptions | null>(null);
  const customClass = ref<string | undefined>(undefined);
  let resolveInfoDialogPromise: (value: boolean) => void;

  const openInfoDialog = (
    options: InfoDialogOptions = {}
  ): Promise<boolean> => {
    const mergedOptions: InfoDialogOptions = {
      title: '提示訊息',
      iconType: 'warning',
      iconSize: 'xl',
      ...options,
    };

    isInfoDialogOpen.value = true;
    infoDialogOptions.value = mergedOptions;
    customClass.value = mergedOptions.customClass;

    return new Promise<boolean>((resolve) => {
      resolveInfoDialogPromise = resolve;
    });
  };

  const closeInfoDialog = () => {
    isInfoDialogOpen.value = false;
    if (resolveInfoDialogPromise) {
      resolveInfoDialogPromise(true);
    }
  };

  return {
    isInfoDialogOpen,
    infoDialogOptions,
    customClass,
    openInfoDialog,
    closeInfoDialog,
  };
}

import { h } from 'vue';
import InfoDialog from '@/components/common/InfoDialog.vue';
import { createDialog } from './createDialog';

type IconType = 'question' | 'success' | 'warning';
type IconSize =
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

interface DialogOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  data?: Record<string, string | number | boolean | null | undefined>;
  iconType?: IconType | false;
  iconSize?: IconSize;
  customClass?: string;
  onConfirm?: () => void | Promise<void>;
  onClose?: () => void | Promise<void>;
}

/**
 * await 版本：openInfoDialog
 * 回傳 true = 確定
 * 回傳 false = 關閉
 */
export function openInfoDialog(options: DialogOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let resolved = false;

    const resolveOnce = (value: boolean) => {
      if (resolved) return;
      resolved = true;
      resolve(value);
    };

    createDialog((close) =>
      h(InfoDialog, {
        title: options.title,
        message: options.message,
        confirmText: options.confirmText ?? '確定',
        data: options.data,
        iconType: options.iconType ?? 'warning',
        iconSize: options.iconSize ?? 'xl',
        customClass: options.customClass ?? '',

        onConfirm: async () => {
          try {
            await options.onConfirm?.();
            resolveOnce(true);
          } finally {
            close();
          }
        },

        onClose: async () => {
          try {
            await options.onClose?.();
            resolveOnce(false);
          } finally {
            close();
          }
        },
      }),
    );
  });
}

/** 舊名稱相容 */
export const infoDialog = openInfoDialog;

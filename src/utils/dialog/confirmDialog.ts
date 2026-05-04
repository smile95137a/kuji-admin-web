// src/utils/dialog/openConfirmDialog.ts
import { h } from 'vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import { createDialog } from './createDialog';
interface DialogOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  data?: Record<string, string | number | boolean | null | undefined>;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
}

/**
 * await 版本：openConfirmDialog
 * 回傳 true = 確定
 * 回傳 false = 取消 / 關閉
 */
export function openConfirmDialog(options: DialogOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let resolved = false;

    const resolveOnce = (value: boolean) => {
      if (resolved) return;
      resolved = true;
      resolve(value);
    };

    createDialog((close) =>
      h(ConfirmDialog, {
        title: options.title,
        message: options.message,
        confirmText: options.confirmText ?? '確定',
        cancelText: options.cancelText ?? '取消',
        data: options.data,

        onConfirm: async () => {
          try {
            await options.onConfirm?.();
            resolveOnce(true);
          } finally {
            close();
          }
        },

        onCancel: async () => {
          try {
            await options.onCancel?.();
            resolveOnce(false);
          } finally {
            close();
          }
        },

        onClose: async () => {
          try {
            await options.onCancel?.();
            resolveOnce(false);
          } finally {
            close();
          }
        },
      }),
    );
  });
}

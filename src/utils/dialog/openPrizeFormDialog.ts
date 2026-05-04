// src/utils/dialog/openPrizeFormDialog.ts
import { h } from 'vue';
import PrizeFormDialog, {
  type PrizeFormDialogResult,
  type PrizeFormRow,
} from '@/components/lottery/PrizeFormDialog.vue';
import { createDialog } from './createDialog';

interface DialogOptions {
  customClass?: string;
  title?: string;
  message?: string;
  data?: {
    mode?: 'add' | 'edit';
    prize?: PrizeFormRow | null;
    [key: string]: any;
  };
}

/**
 * await 版本：openPrizeFormDialog
 * 回傳：
 * - PrizeFormDialogResult = 使用者確認
 * - false = 關閉 / 取消
 */
export function openPrizeFormDialog(
  options: DialogOptions = {},
): Promise<PrizeFormDialogResult | false> {
  return new Promise((resolve) => {
    let resolved = false;

    const resolveOnce = (value: PrizeFormDialogResult | false) => {
      if (resolved) return;
      resolved = true;
      resolve(value);
    };

    createDialog((close) =>
      h(PrizeFormDialog, {
        customClass: options.customClass ?? '',
        title: options.title ?? '獎品設定',
        message: options.message ?? '',
        data: options.data,

        onConfirm: async (result: PrizeFormDialogResult) => {
          try {
            resolveOnce(result);
          } finally {
            close();
          }
        },

        onCancel: async () => {
          try {
            resolveOnce(false);
          } finally {
            close();
          }
        },

        onClose: async () => {
          try {
            resolveOnce(false);
          } finally {
            close();
          }
        },
      }),
    );
  });
}

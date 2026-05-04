// src/utils/dialog/openSearchMemberDialog.ts
import { h } from 'vue';
import SearchMemberDialog from '@/components/common/SearchMemberDialog.vue';
import { createDialog } from './createDialog';

interface DialogOptions {
  customClass?: string;
  title?: string;
  message?: string;
  queryFn?: (data?: any) => any | Promise<any>;
  data?: any;
}

/**
 * await 版本：openSearchMemberDialog
 *
 * 回傳：
 * - { value, label, raw? } = 使用者選到的會員
 * - false = 關閉 / 取消
 */
export function openSearchMemberDialog(
  options: DialogOptions = {},
): Promise<any> {
  return new Promise<any>((resolve) => {
    let resolved = false;

    const resolveOnce = (value: any) => {
      if (resolved) return;
      resolved = true;
      resolve(value);
    };

    createDialog((close) =>
      h(SearchMemberDialog, {
        customClass: options.customClass ?? '',
        title: options.title ?? '會員查詢',
        message: options.message ?? '',
        queryFn: options.queryFn,
        data: options.data,

        onConfirm: async (result: any) => {
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

// src/utils/dialog/openSystemLogSnapshotDialog.ts
import { h } from 'vue';
import SystemLogSnapshotDialog from '@/components/systemLog/SystemLogSnapshotDialog.vue';
import { createDialog } from './createDialog';

interface SystemLogSnapshotDialogOptions {
  title?: string;
  subtitle?: string;
  confirmText?: string;
  beforeSnapshot?: string | null;
  afterSnapshot?: string | null;
}

/**
 * await 版本：openSystemLogSnapshotDialog
 * 用於顯示系統日誌操作快照
 */
export function openSystemLogSnapshotDialog(
  options: SystemLogSnapshotDialogOptions,
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let resolved = false;

    const resolveOnce = (value: boolean) => {
      if (resolved) return;
      resolved = true;
      resolve(value);
    };

    createDialog((close) =>
      h(SystemLogSnapshotDialog, {
        title: options.title ?? '操作快照',
        subtitle: options.subtitle ?? '查看該筆後台操作前後的資料差異',
        confirmText: options.confirmText ?? '確定',
        beforeSnapshot: options.beforeSnapshot ?? null,
        afterSnapshot: options.afterSnapshot ?? null,

        onConfirm: async () => {
          resolveOnce(true);
          close();
        },

        onClose: async () => {
          resolveOnce(false);
          close();
        },
      }),
    );
  });
}

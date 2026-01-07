import { useConfirmDialog } from '@/hook/confirmDialog';
import { useInfoDialog } from '@/hook/infoDialog';

import { defineStore } from 'pinia';

export const useDialogStore = defineStore('dialog', () => {
  const confirmDialog = useConfirmDialog();
  const infoDialog = useInfoDialog();

  return {
    ...confirmDialog,
    ...infoDialog,
  };
});

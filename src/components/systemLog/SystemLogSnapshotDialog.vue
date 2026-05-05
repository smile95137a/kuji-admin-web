<!-- src/components/systemLog/SystemLogSnapshotDialog.vue -->
<template>
  <Dialog
    :isOpen="true"
    customClass="dialog--systemLogSnapshot"
    @close="handleClose"
  >
    <div class="systemLogSnapshotDialog">
      <div class="systemLogSnapshotDialog__header">
        <div class="systemLogSnapshotDialog__header-title">
          <p class="systemLogSnapshotDialog__text">
            {{ title }}
          </p>
        </div>

        <div class="systemLogSnapshotDialog__close" @click="handleClose">
          <font-awesome-icon icon="xmark" size="lg" />
        </div>
      </div>

      <div class="systemLogSnapshotDialog__main">
        <div class="systemLogSnapshotDialog__main-desc">
          {{ subtitle }}
        </div>

        <div class="systemLogSnapshotDialog__main-content">
          <div class="systemLogSnapshotDialog__snapshot">
            <div class="systemLogSnapshotDialog__snapshot-header">操作前</div>

            <pre class="systemLogSnapshotDialog__snapshot-code">{{
              formatJson(beforeSnapshot)
            }}</pre>
          </div>

          <div class="systemLogSnapshotDialog__snapshot">
            <div class="systemLogSnapshotDialog__snapshot-header">操作後</div>

            <pre class="systemLogSnapshotDialog__snapshot-code">{{
              formatJson(afterSnapshot)
            }}</pre>
          </div>
        </div>

        <div class="systemLogSnapshotDialog__main-btns">
          <button
            type="button"
            class="systemLogSnapshotDialog__main-btn systemLogSnapshotDialog__main-btn--confirm"
            @click="handleConfirm"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import Dialog from '@/components/common/Dialog.vue';

const props = withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    confirmText?: string;
    beforeSnapshot?: string | null;
    afterSnapshot?: string | null;
    onConfirm?: () => void | Promise<void>;
    onClose?: () => void | Promise<void>;
  }>(),
  {
    title: '操作快照',
    subtitle: '查看該筆後台操作前後的資料差異',
    confirmText: '確定',
    beforeSnapshot: null,
    afterSnapshot: null,
  },
);

const formatJson = (raw?: string | null): string => {
  if (!raw) return '（無資料）';

  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
};

const handleConfirm = async () => {
  await props.onConfirm?.();
};

const handleClose = async () => {
  await props.onClose?.();
};
</script>

<style scoped></style>

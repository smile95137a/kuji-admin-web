<!-- src/components/common/ConfirmDialog.vue -->
<template>
  <Dialog
    :isOpen="true"
    :customClass="
      ['dialog--confirmDialog', customClass].filter(Boolean).join(' ')
    "
    @close="handleDialogClose"
  >
    <div class="confirmDialog">
      <div class="confirmDialog__header">
        <div v-if="title" class="confirmDialog__header-title">
          <p class="confirmDialog__text">
            {{ title }}
          </p>
        </div>

        <div class="confirmDialog__close" @click="handleCancel">
          <font-awesome-icon icon="xmark" size="lg" />
        </div>
      </div>

      <div class="confirmDialog__main">
        <div class="confirmDialog__main-content">
          <div v-if="shouldShowIcon" class="confirmDialog__main-content-icon">
            <font-awesome-icon :icon="resolvedIcon" :size="resolvedIconSize" />
          </div>

          <div class="confirmDialog__main-content-msg">
            <span class="confirmDialog__text" v-html="resolvedMessage"></span>
          </div>
        </div>

        <div class="confirmDialog__main-btns">
          <button
            type="button"
            class="confirmDialog__main-btn confirmDialog__main-btn--confirm"
            @click="handleConfirm"
          >
            {{ confirmText }}
          </button>

          <button
            type="button"
            class="confirmDialog__main-btn confirmDialog__main-btn--cancel"
            @click="handleCancel"
          >
            {{ cancelText }}
          </button>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Dialog from './Dialog.vue';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faCheck,
  faExclamation,
  faQuestion,
} from '@fortawesome/free-solid-svg-icons';

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

type DialogData = Record<string, string | number | boolean | null | undefined>;

interface Props {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  data?: DialogData;
  customClass?: string;
  iconType?: IconType | false;
  iconSize?: IconSize;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  onClose?: () => void | Promise<void>;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  message: '',
  confirmText: '確定',
  cancelText: '取消',
  customClass: '',
  iconType: 'question',
  iconSize: 'xl',
});

const ICON_MAP: Record<IconType, IconDefinition> = {
  question: faQuestion,
  success: faCheck,
  warning: faExclamation,
};

const resolvedIcon = computed<IconDefinition>(() => {
  if (props.iconType === false) {
    return ICON_MAP.question;
  }
  return ICON_MAP[props.iconType] ?? ICON_MAP.question;
});

const resolvedIconSize = computed<IconSize>(() => props.iconSize);

const shouldShowIcon = computed(() => props.iconType !== false);

/**
 * 支援把 message 中的 {{key}} 用 data[key] 取代
 * 例如：
 * message: '是否刪除 {{name}}？'
 * data: { name: '測試資料' }
 */
const resolvedMessage = computed(() => {
  if (!props.message) return '';

  return props.message.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = props.data?.[key];
    return value == null ? '' : String(value);
  });
});

const handleConfirm = async () => {
  await props.onConfirm?.();
};

const handleCancel = async () => {
  await props.onCancel?.();
};

const handleDialogClose = async () => {
  await props.onClose?.();
};
</script>

<style scoped></style>

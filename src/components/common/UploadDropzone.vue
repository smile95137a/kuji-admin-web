<template>
  <div class="uploadDropzoneWrap">
    <p v-if="label" class="form__text form__text--label">{{ label }}</p>

    <div
      class="uploadDropzone"
      :class="{
        'uploadDropzone--dragOver': dragOver,
        'uploadDropzone--disabled': disabled,
        'uploadDropzone--error': hasError,
      }"
      role="button"
      tabindex="0"
      @click="openFilePicker"
      @keydown.enter.prevent="openFilePicker"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <div class="uploadDropzone__logo">
        <div class="uploadDropzone__icon uploadDropzone__icon--cloud">
          <font-awesome-icon :icon="cloudIcon" />
        </div>
      </div>

      <div class="uploadDropzone__icons" v-if="showDecorIcons">
        <div class="uploadDropzone__icon uploadDropzone__icon--video">
          <font-awesome-icon :icon="videoIcon" />
        </div>
        <div class="uploadDropzone__icon uploadDropzone__icon--list">
          <font-awesome-icon :icon="listIcon" />
        </div>
        <div class="uploadDropzone__icon uploadDropzone__icon--music">
          <font-awesome-icon :icon="musicIcon" />
        </div>
        <div class="uploadDropzone__icon uploadDropzone__icon--image">
          <font-awesome-icon :icon="imageIcon" />
        </div>
      </div>

      <p class="uploadDropzone__hint">
        {{ hint }}
      </p>

      <!-- 真正選檔 -->
      <input
        ref="fileInputRef"
        class="uploadDropzone__input"
        type="file"
        :accept="accept"
        @change="onFileChange"
      />

      <div v-if="fileName" class="uploadDropzone__fileName">
        {{ fileName }}
      </div>

      <div v-if="hasError" class="uploadDropzone__error">
        {{ errorMessage }}
      </div>

      <div v-if="statusText" class="uploadDropzone__status">
        {{ statusText }}
      </div>
    </div>

    <div class="flex gap-x-12 m-t-12" v-if="fileName && showClear">
      <MButton
        type="button"
        class="mbtn--gray"
        :disabled="disabled"
        @click="clear"
      >
        清除已選檔
      </MButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import MButton from '@/components/common/MButton.vue';

type IconValue = any;

const props = defineProps<{
  label?: string;

  accept?: string;
  disabled?: boolean;

  hint?: string;

  fileName?: string;

  errorMessage?: string | null;

  statusText?: string;

  showDecorIcons?: boolean;

  showClear?: boolean;

  cloudIcon?: IconValue;
  videoIcon?: IconValue;
  listIcon?: IconValue;
  musicIcon?: IconValue;
  imageIcon?: IconValue;
}>();

const emit = defineEmits<{
  (e: 'select', file: File): void;
  (e: 'clear'): void;
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const dragOver = ref(false);

const hasError = computed(() => Boolean(props.errorMessage));

const openFilePicker = () => {
  if (props.disabled) return;
  fileInputRef.value?.click();
};

const clear = () => {
  if (fileInputRef.value) fileInputRef.value.value = '';
  dragOver.value = false;
  emit('clear');
};

const onFileChange = (evt: Event) => {
  const input = evt.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  emit('select', file);

  input.value = '';
};

const onDragEnter = () => {
  if (props.disabled) return;
  dragOver.value = true;
};
const onDragOver = () => {
  if (props.disabled) return;
  dragOver.value = true;
};
const onDragLeave = () => {
  dragOver.value = false;
};
const onDrop = (e: DragEvent) => {
  dragOver.value = false;
  if (props.disabled) return;

  const file = e.dataTransfer?.files?.[0];
  if (!file) return;

  emit('select', file);
};

const cloudIcon = computed(() => props.cloudIcon ?? ['fas', 'cloud-arrow-up']);
const videoIcon = computed(() => props.videoIcon ?? ['fas', 'video']);
const listIcon = computed(() => props.listIcon ?? ['fas', 'list']);
const musicIcon = computed(() => props.musicIcon ?? ['fas', 'music']);
const imageIcon = computed(() => props.imageIcon ?? ['fas', 'image']);

const hint = computed(() => props.hint ?? '點擊選擇檔案，或把檔案拖曳到這裡');
</script>

<style scoped lang="scss">
.uploadDropzone {
  position: relative;
  width: 100%;
  padding: 28px;
  border: 0.1875em dashed #d1d5db;
  background: #fff;
  border-radius: 10px;
  cursor: pointer;
  user-select: none;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;

  transition: 0.15s ease;

  &--dragOver {
    border-color: rgba(0, 0, 0, 0.35);
    background: rgba(0, 0, 0, 0.02);
  }

  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--error {
    border-color: rgba(217, 48, 37, 0.45);
  }

  &__input {
    position: absolute;
    inset: 0;
    opacity: 0;
    pointer-events: none; /* 由外層 click 觸發 */
  }

  &__logo {
    display: flex;
    margin-bottom: 4px;
  }

  &__icons {
    display: flex;
    gap: 12px;
  }

  &__icon {
    width: 50px;
    height: 50px;
    border-radius: 8px;

    display: flex;
    align-items: center;
    justify-content: center;

    color: rgba(0, 0, 0, 0.55);

    &--cloud {
      background: #d6e6f6;
    }
    &--video {
      background: #f4e9f5;
      transform: rotate(-15deg);
    }
    &--list {
      background: #fce7ee;
      transform: rotate(15deg);
    }
    &--music {
      background: #feece7;
      transform: rotate(-10deg);
    }
    &--image {
      background: #e8f3f4;
      transform: rotate(10deg);
    }
  }

  &__hint {
    font-size: 13px;
    color: #666;
  }

  &__fileName {
    margin-top: 4px;
    font-size: 13px;
    color: #333;
    word-break: break-all;
    text-align: center;
  }

  &__error {
    margin-top: 2px;
    font-size: 12px;
    color: #d93025;
    text-align: center;
  }

  &__status {
    margin-top: 2px;
    font-size: 12px;
    color: #666;
  }
}
</style>

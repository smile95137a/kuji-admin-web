<!-- src/components/common/ImageCropDialog.vue -->
<template>
  <div v-if="modelValue" class="image-crop-dialog">
    <div class="image-crop-dialog__backdrop" @click="onCancel" />

    <div class="image-crop-dialog__panel">
      <!-- Header -->
      <div class="image-crop-dialog__header">
        <div class="image-crop-dialog__header-main">
          <p class="image-crop-dialog__title">{{ titleText }}</p>
        </div>

        <button
          type="button"
          class="image-crop-dialog__close"
          aria-label="關閉"
          @click="onCancel"
        >
          <font-awesome-icon :icon="['fas', 'xmark']" />
        </button>
      </div>

      <!-- Toolbar -->
      <div class="image-crop-dialog__toolbar">
        <button
          class="image-crop-dialog__tool-btn"
          type="button"
          @click="resetCrop"
        >
          重置
        </button>

        <button
          class="image-crop-dialog__tool-btn"
          type="button"
          @click="fitContain"
        >
          看整張
        </button>

        <button
          class="image-crop-dialog__tool-btn"
          type="button"
          @click="fitCover"
        >
          填滿
        </button>

        <button
          class="image-crop-dialog__tool-btn"
          type="button"
          @click="actualSize"
        >
          1:1
        </button>

        <span class="image-crop-dialog__divider" />

        <button
          class="image-crop-dialog__tool-btn"
          type="button"
          @click="zoomIn"
        >
          放大
        </button>

        <button
          class="image-crop-dialog__tool-btn"
          type="button"
          @click="zoomOut"
        >
          縮小
        </button>

        <span class="image-crop-dialog__divider" />

        <button
          class="image-crop-dialog__tool-btn"
          type="button"
          @click="rotateLeft"
        >
          左轉
        </button>

        <button
          class="image-crop-dialog__tool-btn"
          type="button"
          @click="rotateRight"
        >
          右轉
        </button>

        <button
          class="image-crop-dialog__tool-btn"
          type="button"
          @click="flipX"
        >
          左右翻
        </button>

        <button
          class="image-crop-dialog__tool-btn"
          type="button"
          @click="flipY"
        >
          上下翻
        </button>

        <span class="image-crop-dialog__divider" />

        <button
          class="image-crop-dialog__tool-btn image-crop-dialog__tool-btn--mode"
          type="button"
          @click="toggleMoveMode"
        >
          {{ moveMode === 'move' ? '框選模式' : '拖曳模式' }}
        </button>
      </div>

      <!-- Body -->
      <div class="image-crop-dialog__body">
        <cropper-canvas
          ref="canvasRef"
          class="image-crop-dialog__cropper"
          background
        >
          <cropper-image
            ref="imageRef"
            :src="src"
            alt="crop"
            translatable
            rotatable
            scalable
            skewable
            initial-center-size="contain"
          />

          <cropper-handle :action="moveMode" plain />

          <cropper-selection
            ref="selectionRef"
            initial-coverage="0.8"
            movable
            resizable
            outlined
            :aspect-ratio="normalizedAspectRatio"
          >
            <cropper-grid role="grid" covered />
            <cropper-crosshair centered />

            <cropper-handle
              action="move"
              theme-color="rgba(255,255,255,0.35)"
            />
            <cropper-handle action="n-resize" />
            <cropper-handle action="e-resize" />
            <cropper-handle action="s-resize" />
            <cropper-handle action="w-resize" />
            <cropper-handle action="ne-resize" />
            <cropper-handle action="nw-resize" />
            <cropper-handle action="se-resize" />
            <cropper-handle action="sw-resize" />
          </cropper-selection>
        </cropper-canvas>
      </div>

      <!-- Hint -->
      <p v-if="hintText" class="image-crop-dialog__hint">
        {{ hintText }}
      </p>

      <!-- Footer -->
      <div class="image-crop-dialog__footer">
        <button
          class="image-crop-dialog__btn image-crop-dialog__btn--ghost"
          type="button"
          :disabled="confirming"
          @click="onCancel"
        >
          取消
        </button>

        <button
          class="image-crop-dialog__btn image-crop-dialog__btn--primary"
          type="button"
          :disabled="confirming"
          @click="onConfirm"
        >
          {{ confirming ? '處理中...' : '確定裁切' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import 'cropperjs';

import type CropperCanvas from '@cropper/element-canvas';
import type CropperImage from '@cropper/element-image';
import type CropperSelection from '@cropper/element-selection';

import { computed, nextTick, ref, watch } from 'vue';

type OutputMime = 'image/jpeg' | 'image/png' | 'image/webp';
type MoveMode = 'move' | 'select';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    src: string;
    title?: string;
    hint?: string;

    aspectRatio?: number | null;
    outputWidth?: number;
    outputHeight?: number;

    mimeType?: OutputMime;
    quality?: number;
    fileName?: string;
  }>(),
  {
    title: '裁切圖片',
    hint: '',
    aspectRatio: 1,
    outputWidth: undefined,
    outputHeight: undefined,
    mimeType: 'image/jpeg',
    quality: 0.9,
    fileName: 'cropped.jpg',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'cancel'): void;
  (e: 'confirm', file: File): void;
}>();

const titleText = computed(() => props.title || '裁切圖片');
const hintText = computed(() => props.hint || '');

const normalizedAspectRatio = computed(() => {
  const value = props.aspectRatio;

  if (typeof value === 'number' && value > 0) {
    return value;
  }

  return NaN;
});

const canvasRef = ref<CropperCanvas | null>(null);
const imageRef = ref<CropperImage | null>(null);
const selectionRef = ref<CropperSelection | null>(null);

const confirming = ref(false);
const moveMode = ref<MoveMode>('move');

const flipState = ref({
  x: 1,
  y: 1,
});

const safeClose = () => {
  emit('update:modelValue', false);
};

const onCancel = () => {
  if (confirming.value) return;

  emit('cancel');
  safeClose();
};

const ensureReady = async () => {
  await imageRef.value?.$ready?.();
  await nextTick();
};

const toggleMoveMode = () => {
  moveMode.value = moveMode.value === 'move' ? 'select' : 'move';
};

const fitContain = async () => {
  const image = imageRef.value;

  if (!image) return;

  await ensureReady();
  image.$center?.('contain');
};

const fitCover = async () => {
  const image = imageRef.value;

  if (!image) return;

  await ensureReady();
  image.$center?.('cover');
};

const actualSize = async () => {
  const image = imageRef.value;

  if (!image) return;

  await ensureReady();
  image.$resetTransform?.();
  image.$center?.('contain');
};

const resetCrop = async () => {
  const image = imageRef.value;
  const selection = selectionRef.value;

  if (!image || !selection) return;

  await ensureReady();

  image.$resetTransform?.();
  image.$center?.('contain');

  selection.aspectRatio = normalizedAspectRatio.value;
  selection.$reset?.();

  flipState.value = {
    x: 1,
    y: 1,
  };
};

const zoomIn = async () => {
  await ensureReady();
  imageRef.value?.$zoom?.(0.1);
};

const zoomOut = async () => {
  await ensureReady();
  imageRef.value?.$zoom?.(-0.1);
};

const rotate = async (degree: 90 | -90) => {
  const image = imageRef.value;

  if (!image) return;

  await ensureReady();

  image.$rotate?.(`${degree}deg`);
  image.$center?.('contain');
};

const rotateRight = () => rotate(90);
const rotateLeft = () => rotate(-90);

const flipX = async () => {
  const image = imageRef.value;

  if (!image) return;

  await ensureReady();

  flipState.value.x *= -1;

  image.$scale?.(flipState.value.x, flipState.value.y);
  image.$center?.('contain');
};

const flipY = async () => {
  const image = imageRef.value;

  if (!image) return;

  await ensureReady();

  flipState.value.y *= -1;

  image.$scale?.(flipState.value.x, flipState.value.y);
  image.$center?.('contain');
};

const buildFileName = () => {
  if (props.fileName) {
    return props.fileName;
  }

  if (props.mimeType === 'image/png') {
    return 'cropped.png';
  }

  if (props.mimeType === 'image/webp') {
    return 'cropped.webp';
  }

  return 'cropped.jpg';
};

const onConfirm = async () => {
  const selection = selectionRef.value;

  if (!selection || confirming.value) return;

  confirming.value = true;

  try {
    const mimeType: OutputMime = props.mimeType ?? 'image/jpeg';
    const quality = typeof props.quality === 'number' ? props.quality : 0.9;

    const canvas = await selection.$toCanvas?.({
      width: props.outputWidth,
      height: props.outputHeight,
      beforeDraw: (ctx) => {
        (ctx as CanvasRenderingContext2D).imageSmoothingQuality = 'high';
      },
    });

    if (!canvas) {
      return;
    }

    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
            return;
          }

          reject(new Error('toBlob failed'));
        },
        mimeType,
        quality,
      );
    });

    const file = new File([blob], buildFileName(), {
      type: mimeType,
    });

    emit('confirm', file);
    safeClose();
  } finally {
    confirming.value = false;
  }
};

watch(
  () => [props.modelValue, props.src] as const,
  async ([open]) => {
    if (!open || !props.src) return;

    moveMode.value = 'move';
    flipState.value = {
      x: 1,
      y: 1,
    };

    await nextTick();
    await ensureReady();
    await fitContain();

    if (selectionRef.value) {
      selectionRef.value.aspectRatio = normalizedAspectRatio.value;
      selectionRef.value.$reset?.();
    }
  },
  {
    immediate: true,
  },
);
</script>

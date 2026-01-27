<!-- src/components/common/ImageCropDialog.vue -->
<template>
  <div v-if="modelValue" class="dialog">
    <div class="dialog__backdrop" @click="onCancel" />

    <div class="dialog__panel">
      <div class="dialog__header">
        <p class="dialog__title">{{ title }}</p>

        <div class="dialog__actions">
          <button class="dialog__btn" type="button" @click="resetCrop">
            重置
          </button>

          <button class="dialog__btn" type="button" @click="fitContain">
            看整張
          </button>
          <button class="dialog__btn" type="button" @click="fitCover">
            填滿
          </button>
          <button class="dialog__btn" type="button" @click="actualSize">
            1:1
          </button>

          <button class="dialog__btn" type="button" @click="zoomIn">
            放大
          </button>
          <button class="dialog__btn" type="button" @click="zoomOut">
            縮小
          </button>

          <button class="dialog__btn" type="button" @click="rotateLeft">
            左轉
          </button>
          <button class="dialog__btn" type="button" @click="rotateRight">
            右轉
          </button>

          <button class="dialog__btn" type="button" @click="flipX">
            左右翻
          </button>
          <button class="dialog__btn" type="button" @click="flipY">
            上下翻
          </button>

          <button class="dialog__btn" type="button" @click="toggleMoveMode">
            {{ moveMode === 'move' ? '框選模式' : '拖曳模式' }}
          </button>
        </div>
      </div>

      <div class="dialog__body">
        <cropper-canvas ref="canvasRef" class="cropper" background>
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

      <div class="dialog__footer">
        <button
          class="dialog__btn dialog__btn--ghost"
          type="button"
          @click="onCancel"
        >
          取消
        </button>

        <button
          class="dialog__btn dialog__btn--primary"
          type="button"
          :disabled="confirming"
          @click="onConfirm"
        >
          {{ confirming ? '處理中...' : '確定裁切' }}
        </button>
      </div>

      <p v-if="hint" class="dialog__hint">{{ hint }}</p>
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

const props = defineProps<{
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
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'cancel'): void;
  (e: 'confirm', file: File): void;
}>();

const title = computed(() => props.title ?? '裁切圖片');
const hint = computed(() => props.hint ?? '');

const normalizedAspectRatio = computed(() => {
  const v = props.aspectRatio;
  return typeof v === 'number' && v > 0 ? v : NaN;
});

const canvasRef = ref<CropperCanvas | null>(null);
const imageRef = ref<CropperImage | null>(null);
const selectionRef = ref<CropperSelection | null>(null);

const confirming = ref(false);

const moveMode = ref<MoveMode>('move');
const toggleMoveMode = () => {
  moveMode.value = moveMode.value === 'move' ? 'select' : 'move';
};

const safeClose = () => emit('update:modelValue', false);

const onCancel = () => {
  emit('cancel');
  safeClose();
};

const ensureReady = async () => {
  await imageRef.value?.$ready?.();
  // selection 也可能需要等一下才可用
  await nextTick();
};

const fitContain = async () => {
  const img = imageRef.value;
  if (!img) return;
  await ensureReady();
  img.$center?.('contain');
};

const fitCover = async () => {
  const img = imageRef.value;
  if (!img) return;
  await ensureReady();
  img.$center?.('cover');
};

const actualSize = async () => {
  const img = imageRef.value;
  if (!img) return;
  await ensureReady();
  img.$resetTransform?.();
  img.$center?.('contain');
};

const resetCrop = async () => {
  const img = imageRef.value;
  const sel = selectionRef.value;
  if (!img || !sel) return;

  await ensureReady();

  img.$resetTransform?.();
  img.$center?.('contain');

  sel.aspectRatio = normalizedAspectRatio.value;
  sel.$reset?.();
};

const zoomIn = () => imageRef.value?.$zoom?.(0.1);
const zoomOut = () => imageRef.value?.$zoom?.(-0.1);

const rotate = async (deg: 90 | -90) => {
  const img = imageRef.value;
  if (!img) return;

  await img.$ready?.();
  img.$rotate?.(`${deg}deg`);
  img.$center?.('contain');
};

const rotateRight = () => rotate(90);
const rotateLeft = () => rotate(-90);

const flipState = ref({ x: 1, y: 1 });
const flipX = async () => {
  const img = imageRef.value;
  if (!img) return;
  await ensureReady();
  flipState.value.x *= -1;
  img.$scale?.(flipState.value.x, flipState.value.y);
  img.$center?.('contain');
};
const flipY = async () => {
  const img = imageRef.value;
  if (!img) return;
  await ensureReady();
  flipState.value.y *= -1;
  img.$scale?.(flipState.value.x, flipState.value.y);
  img.$center?.('contain');
};

const onConfirm = async () => {
  const sel = selectionRef.value;
  if (!sel) return;

  confirming.value = true;
  try {
    const mimeType: OutputMime = props.mimeType ?? 'image/jpeg';
    const quality = typeof props.quality === 'number' ? props.quality : 0.9;

    const canvas = await sel.$toCanvas?.({
      width: props.outputWidth,
      height: props.outputHeight,
      beforeDraw: (ctx) => {
        (ctx as any).imageSmoothingQuality = 'high';
      },
    });
    if (!canvas) return;

    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
        mimeType,
        quality,
      );
    });

    const fileName =
      props.fileName ??
      (mimeType === 'image/png' ? 'cropped.png' : 'cropped.jpg');

    const file = new File([blob], fileName, { type: mimeType });

    emit('confirm', file);
    safeClose();
  } finally {
    confirming.value = false;
  }
};

watch(
  () => [props.modelValue, props.src] as const,
  async ([open]) => {
    if (!open) return;

    flipState.value = { x: 1, y: 1 };

    await nextTick();
    await ensureReady();

    await fitContain();

    if (selectionRef.value) {
      selectionRef.value.aspectRatio = normalizedAspectRatio.value;
      selectionRef.value.$reset?.();
    }
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.dialog {
  position: fixed;
  inset: 0;
  z-index: 9999;
}
.dialog__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}
.dialog__panel {
  position: relative;
  width: min(920px, calc(100vw - 32px));
  margin: 40px auto;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}
.dialog__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}
.dialog__title {
  font-weight: 700;
  white-space: nowrap;
}
.dialog__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.dialog__body {
  padding: 12px 16px 0;
}
.cropper {
  height: 420px;
  width: 100%;
  display: block;
}
.dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 16px 16px;
}
.dialog__btn {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: #fff;
}
.dialog__btn--primary {
  border-color: #111;
  background: #111;
  color: #fff;
}
.dialog__btn--ghost {
  background: #f7f7f7;
}
.dialog__hint {
  padding: 0 16px 16px;
  color: #666;
  font-size: 12px;
}
</style>

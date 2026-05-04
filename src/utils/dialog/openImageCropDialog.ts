// src/utils/dialog/openImageCropDialog.ts
import { h, ref } from 'vue';
import ImageCropDialog from '@/components/common/ImageCropDialog.vue';
import { createDialog } from './createDialog';

type OutputMime = 'image/jpeg' | 'image/png' | 'image/webp';

export interface OpenImageCropDialogOptions {
  src: string;
  title?: string;
  hint?: string;

  aspectRatio?: number | null;
  outputWidth?: number;
  outputHeight?: number;

  mimeType?: OutputMime;
  quality?: number;
  fileName?: string;
}

/**
 * await 版本：openImageCropDialog
 * 回傳：
 * - File = 使用者確認裁切後的圖片檔
 * - false = 關閉 / 取消
 */
export function openImageCropDialog(
  options: OpenImageCropDialogOptions,
): Promise<File | false> {
  return new Promise((resolve) => {
    let resolved = false;
    const isOpen = ref(true);

    const resolveOnce = (value: File | false) => {
      if (resolved) return;
      resolved = true;
      resolve(value);
    };

    createDialog((close) =>
      h(ImageCropDialog, {
        modelValue: isOpen.value,
        src: options.src,
        title: options.title ?? '裁切圖片',
        hint: options.hint ?? '',
        aspectRatio: options.aspectRatio ?? 1,
        outputWidth: options.outputWidth,
        outputHeight: options.outputHeight,
        mimeType: options.mimeType ?? 'image/jpeg',
        quality: options.quality ?? 0.9,
        fileName: options.fileName ?? 'cropped.jpg',

        'onUpdate:modelValue': (value: boolean) => {
          isOpen.value = value;

          if (!value) {
            resolveOnce(false);
            close();
          }
        },

        onConfirm: async (file: File) => {
          try {
            resolveOnce(file);
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
      }),
    );
  });
}

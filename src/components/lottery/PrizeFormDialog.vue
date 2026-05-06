<!-- src/components/lottery/PrizeFormDialog.vue -->
<template>
  <Dialog
    :isOpen="true"
    :customClass="`${customClass} dialog--prizeForm`"
    @close="handleDialogClose"
  >
    <div class="prize-form-dialog">
      <!-- Header -->
      <div class="prize-form-dialog__header">
        <p class="prize-form-dialog__title">
          {{ title || dialogTitle }}
        </p>

        <button
          type="button"
          class="prize-form-dialog__close"
          aria-label="關閉"
          @click="handleClose"
        >
          <font-awesome-icon :icon="['fas', 'xmark']" />
        </button>
      </div>

      <!-- Body：唯一滾動區 -->
      <div class="prize-form-dialog__body">
        <p v-if="message" class="prize-form-dialog__message">
          {{ message }}
        </p>

        <div class="prize-form-dialog__layout">
          <!-- 左側 60%：表單 -->
          <div class="prize-form-dialog__left">
            <!-- 基本資料 -->
            <FormSection title="基本資料">
              <div class="flex flex-wrap">
                <div class="w-50 w-md-100 p-6">
                  <FormInput
                    label="獎品名稱"
                    v-model="form.name"
                    :error="errors.name"
                    placeholder="請輸入獎品名稱"
                    required
                  />
                </div>

                <div class="w-50 w-md-100 p-6">
                  <FormSelect
                    label="獎品等級"
                    v-model="form.level"
                    :options="levelOptions"
                    :error="errors.level"
                    :disabled="isScratchPrize"
                    required
                  />
                </div>

                <div class="w-50 w-md-100 p-6">
                  <FormInput
                    label="數量"
                    type="number"
                    v-model="form.quantity"
                    :error="errors.quantity"
                    :disabled="isScratchPrize"
                    :min="1"
                    :max="isScratchPrize ? 1 : undefined"
                    required
                  />
                </div>

                <div class="w-50 w-md-100 p-6">
                  <FormInput
                    label="排序"
                    type="number"
                    v-model="form.orderNum"
                    :error="errors.orderNum"
                  />
                </div>
              </div>
            </FormSection>

            <!-- 獎品標記 -->
            <FormSection title="獎品標記">
              <div class="flex flex-wrap">
                <div class="w-100 p-6">
            <FormCheckTagGroup
              label="獎品標記"
              name="prizeTags"
              id-prefix="prize-tags"
              v-model="prizeTags"
              :options="prizeTagOptions"
              :disabled="isScratchPrize"
            />
                </div>
              </div>
            </FormSection>

            <!-- 描述 -->
            <FormSection title="描述">
              <div class="flex flex-wrap">
                <div class="w-100 p-6">
                  <FormTextarea
                    label="獎品描述"
                    v-model="form.description"
                    :error="errors.description"
                    placeholder="請輸入獎品描述"
                    :rows="5"
                    :maxlength="500"
                  />
                </div>
              </div>
            </FormSection>
          </div>

          <!-- 右側 40%：圖片 -->
          <div class="prize-form-dialog__right">
            <FormSection title="獎品圖片">
              <div class="prize-form-dialog__image-card">
                <p class="prize-form-dialog__image-title">獎品圖片</p>

                <div class="prize-form-dialog__image-wrap">
                  <button
                    type="button"
                    class="prize-form-dialog__image-upload"
                    :class="{
                      'prize-form-dialog__image-upload--empty': !form.imageUrl,
                    }"
                    :disabled="uploading || cropOpen"
                    @click="triggerImageUpload"
                  >
                    <img
                      v-if="form.imageUrl"
                      :src="form.imageUrl"
                      alt="獎品圖片"
                      class="prize-form-dialog__image"
                    />

                    <div v-else class="prize-form-dialog__empty-image">
                      <font-awesome-icon :icon="['fas', 'image']" />
                      <span>點擊上傳圖片</span>
                    </div>
                  </button>

                  <button
                    v-if="form.imageUrl"
                    type="button"
                    class="prize-form-dialog__image-remove"
                    :disabled="uploading || cropOpen"
                    aria-label="清除圖片"
                    @click.stop="clearImage"
                  >
                    <font-awesome-icon :icon="['fas', 'xmark']" />
                  </button>
                </div>

                <p v-if="imageError" class="error-text m-t-8">
                  {{ imageError }}
                </p>

                <p v-if="uploading" class="form__text m-t-8">上傳中...</p>

                <input
                  ref="fileInput"
                  class="prize-form-dialog__hidden-input"
                  type="file"
                  accept="image/*"
                  :disabled="uploading || cropOpen"
                  @change="onFileChange"
                />
              </div>
            </FormSection>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="prize-form-dialog__footer">
        <MButton
          type="button"
          :disabled="uploading || cropOpen"
          @click="handleConfirm"
        >
          <font-awesome-icon icon="fa-check" class="m-r-4" />
          確定
        </MButton>

        <MButton type="button" class="mbtn--red" @click="handleClose">
          <font-awesome-icon icon="fa-arrow-left" class="m-r-4" />
          返回
        </MButton>
      </div>

      <ImageCropDialog
        v-model="cropOpen"
        :src="cropSrc"
        title="裁切 獎品圖片"
        :aspectRatio="1"
        :outputWidth="600"
        mimeType="image/jpeg"
        :quality="0.9"
        :fileName="cropFileName"
        @cancel="onCropCancel"
        @confirm="onCropConfirm"
      />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue';

import Dialog from '@/components/common/Dialog.vue';
import MButton from '@/components/common/MButton.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import FormSection from '@/components/common/FormSection.vue';
import FormTextarea from '@/components/common/FormTextarea.vue';
import FormRadioTagGroup from '@/components/common/FormRadioTagGroup.vue';
import FormCheckTagGroup from '@/components/common/FormCheckTagGroup.vue';
import ImageCropDialog from '@/components/common/ImageCropDialog.vue';

import { uploadPrizeImage } from '@/services/adminUploadService';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

import { levelOptions } from '@/constants/lotteryOptions';

interface SelectOption {
  label: string;
  value: any;
}

export interface PrizeFormRow {
  _key: string;
  name: string;
  quantity: number | string;
  level: string;
  prizeType: string;
  pointValue?: number | string;
  prizeNumber?: string;
  isLastPrize: boolean;
  isGrandPrize: boolean;
  orderNum?: number | string;
  imageUrl?: string;
  description?: string;
}

export type PrizeFormDialogResult = PrizeFormRow;

interface Props {
  customClass?: string;
  title?: string;
  message?: string;
  data?: {
    mode?: 'add' | 'edit';
    prize?: PrizeFormRow | null;
    [key: string]: any;
  };
  onConfirm?: (result: PrizeFormDialogResult) => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  onClose?: () => void | Promise<void>;
}

const props = withDefaults(defineProps<Props>(), {
  customClass: '',
  title: '',
  message: '',
  data: undefined,
});

const dialogTitle = computed(() =>
  props.data?.mode === 'edit' ? '編輯獎品' : '新增獎品',
);

const isScratchPrize = computed(() => Boolean(props.data?.isScratchPrize));

const createKey = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2)}`;

const createEmptyPrize = (): PrizeFormRow => ({
  _key: createKey(),
  name: '',
  quantity: 1,
  level: 'A',
  prizeType: 'physical',
  pointValue: undefined,
  prizeNumber: '',
  isLastPrize: false,
  isGrandPrize: false,
  orderNum: undefined,
  imageUrl: '',
  description: '',
});

const source = props.data?.prize ?? createEmptyPrize();

const normalizeScratchPrize = (row: PrizeFormRow): PrizeFormRow => ({
  ...row,
  level: 'GRAND',
  quantity: 1,
  isGrandPrize: true,
  isLastPrize: false,
});

const form = reactive<PrizeFormRow>({
  ...(isScratchPrize.value
    ? normalizeScratchPrize(source as PrizeFormRow)
    : {
        _key: source._key || createKey(),
        name: source.name ?? '',
        quantity: source.quantity ?? 1,
        level: source.level ?? 'A',
        prizeType: source.prizeType ?? 'physical',
        pointValue: source.pointValue,
        prizeNumber: source.prizeNumber ?? '',
        isLastPrize: source.isLastPrize ?? false,
        isGrandPrize: source.isGrandPrize ?? false,
        orderNum: source.orderNum,
        imageUrl: source.imageUrl ?? '',
        description: source.description ?? '',
      }),
});

const errors = reactive<Record<string, string>>({
  name: '',
  level: '',
  quantity: '',
  prizeType: '',
  pointValue: '',
  prizeNumber: '',
  orderNum: '',
  description: '',
});

const prizeTagOptions: SelectOption[] = [
  { label: '最後賞', value: 'LAST_PRIZE' },
  { label: '大獎', value: 'GRAND_PRIZE' },
];

const prizeTags = computed<string[]>({
  get() {
    const tags: string[] = [];

    if (form.isLastPrize) tags.push('LAST_PRIZE');
    if (form.isGrandPrize) tags.push('GRAND_PRIZE');

    return tags;
  },
  set(value) {
    if (isScratchPrize.value) {
      form.isLastPrize = false;
      form.isGrandPrize = true;
      return;
    }

    form.isLastPrize = value.includes('LAST_PRIZE');
    form.isGrandPrize = value.includes('GRAND_PRIZE');
  },
});

const resetErrors = () => {
  Object.keys(errors).forEach((key) => {
    errors[key] = '';
  });
};

const validateForm = () => {
  resetErrors();

  let valid = true;

  if (!String(form.name || '').trim()) {
    errors.name = '獎品名稱不可為空';
    valid = false;
  }

  if (!String(form.level || '').trim()) {
    errors.level = '獎品等級不可為空';
    valid = false;
  }

  if (!String(form.prizeType || '').trim()) {
    errors.prizeType = '獎品類型不可為空';
    valid = false;
  }

  const quantity = Number(form.quantity);

  if (isScratchPrize.value) {
    if (quantity !== 1) {
      errors.quantity = '刮刮樂模式固定為 1';
      valid = false;
    }

    if (String(form.level || '') !== 'GRAND') {
      errors.level = '刮刮樂模式固定為大獎等級';
      valid = false;
    }
  } else if (!Number.isFinite(quantity) || quantity < 1) {
    errors.quantity = '數量必須大於或等於 1';
    valid = false;
  }

  if (form.prizeType === 'point') {
    const pointValue = Number(form.pointValue);

    if (!Number.isFinite(pointValue) || pointValue < 0) {
      errors.pointValue = '點數價值不可為空且不可為負數';
      valid = false;
    }
  }

  if (String(form.description || '').length > 500) {
    errors.description = '獎品描述最多 500 字';
    valid = false;
  }

  return valid;
};

const handleConfirm = async () => {
  if (isScratchPrize.value) {
    form.level = 'GRAND';
    form.quantity = 1;
    form.isGrandPrize = true;
    form.isLastPrize = false;
  }

  if (!validateForm()) return;

  const normalized = isScratchPrize.value
    ? normalizeScratchPrize(form)
    : form;

  await props.onConfirm?.({
    ...normalized,
    name: String(normalized.name || '').trim(),
    description: String(normalized.description || '').trim(),
    quantity: Number(normalized.quantity),
    pointValue:
      normalized.pointValue === '' || normalized.pointValue == null
        ? undefined
        : Number(normalized.pointValue),
    orderNum:
      normalized.orderNum === '' || normalized.orderNum == null
        ? undefined
        : Number(normalized.orderNum),
  });
};

const handleClose = async () => {
  await props.onCancel?.();
};

const handleDialogClose = async () => {
  await props.onClose?.();
};

/* ==============================
 * 圖片上傳
 * ============================== */
const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const imageError = ref('');

const cropOpen = ref(false);
const cropSrc = ref('');
const cropFileName = ref('prize-cropped.jpg');

const triggerImageUpload = () => {
  if (uploading.value || cropOpen.value) return;
  fileInput.value?.click();
};

const revokeCropSrc = () => {
  if (!cropSrc.value) return;

  URL.revokeObjectURL(cropSrc.value);
  cropSrc.value = '';
};

onBeforeUnmount(() => {
  revokeCropSrc();
});

const validateImageFile = async (file: File) => {
  const maxSize = 5 * 1024 * 1024;

  if (file.size > maxSize) return '圖片大小不可超過 5MB';
  if (!file.type.startsWith('image/')) return '請選擇圖片檔案';

  return '';
};

const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  input.value = '';

  if (!file) return;

  imageError.value = '';

  const errorMessage = await validateImageFile(file);

  if (errorMessage) {
    imageError.value = errorMessage;

    await openInfoDialog({
      title: '提示訊息',
      message: errorMessage,
      iconType: 'warning',
    });

    return;
  }

  revokeCropSrc();
  cropSrc.value = URL.createObjectURL(file);

  const baseName = file.name.replace(/\.(png|jpg|jpeg|webp)$/i, '');
  cropFileName.value = `${baseName}-cropped.jpg`;
  cropOpen.value = true;
};

const onCropCancel = () => {
  cropOpen.value = false;
  revokeCropSrc();
};

const onCropConfirm = async (croppedFile: File) => {
  cropOpen.value = false;
  revokeCropSrc();

  uploading.value = true;

  try {
    const { data } = await uploadPrizeImage(croppedFile);
    const url = data?.imageUrl || '';

    if (!url) {
      imageError.value = '上傳成功但未取得 imageUrl，請檢查後端回傳格式';
      return;
    }

    form.imageUrl = url;
  } catch (error: any) {
    imageError.value = error?.message ?? '圖片上傳失敗，請稍後再試';

    await openInfoDialog({
      title: '圖片上傳失敗',
      message: imageError.value,
      iconType: 'warning',
    });
  } finally {
    uploading.value = false;
  }
};

const clearImage = () => {
  form.imageUrl = '';
  imageError.value = '';
};
</script>

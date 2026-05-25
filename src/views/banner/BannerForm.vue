<!-- src/views/banner/BannerForm.vue -->
<template>
  <MCard>
    <form class="banner-form" @submit.prevent="onSubmit">
      <p class="form__text form__text--title">
        Banner{{ isEdit ? '編輯' : '新增' }}
      </p>

      <div class="banner-form__layout">
        <!-- 左側：主要表單 -->
        <div class="banner-form__left">
          <!-- 基本資料 -->
          <FormSection title="基本資料">
            <div class="banner-form__card">
              <div class="flex flex-wrap">
                <!-- 標題 -->
                <div class="w-50 w-md-100 p-6">
                  <FormInput
                    label="標題"
                    v-model="title"
                    :error="displayErrors.title"
                    required
                    maxlength="100"
                    placeholder="請輸入 Banner 標題"
                  />
                </div>

                <!-- 店家 -->
                <div class="w-50 w-md-100 p-6">
                  <FormSelect
                    label="店家"
                    v-model="storeId"
                    :options="storeOptions"
                    :error="displayErrors.storeId"
                    :showAll="true"
                    allLabel="請選擇"
                    :allValue="''"
                    required
                  />
                </div>

                <!-- 排序 -->
                <div class="w-50 w-md-100 p-6">
                  <FormInput
                    label="排序"
                    v-model="orderNum"
                    :error="displayErrors.orderNum"
                    type="number"
                    placeholder="例如：1"
                  />
                </div>
              </div>
            </div>
          </FormSection>

          <!-- 狀態與排程 -->
          <FormSection title="狀態與排程">
            <div class="banner-form__card banner-form__card--schedule">
              <div class="banner-form__status-panel">
                <FormRadioTagGroup
                  label="狀態"
                  name="banner-status"
                  id-prefix="banner-status"
                  v-model="status"
                  :options="statusOptions"
                  :error="displayErrors.status"
                  required
                />
              </div>

              <div class="banner-form__schedule-layout">
                <div class="w-100 p-6">
                  <FormDateRangeField
                    label="顯示時間"
                    type="datetime-local"
                    v-model:start="startTime"
                    v-model:end="endTime"
                    :start-error="displayErrors.startTime"
                    :end-error="displayErrors.endTime"
                    :auto-apply-default="true"
                    :default-start="getDefaultStartTime()"
                    :default-end="getDefaultEndTime()"
                  />
                </div>
              </div>
            </div>
          </FormSection>
        </div>

        <!-- 右側：Banner 圖片 -->
        <div class="banner-form__right">
          <FormSection title="Banner 圖片">
            <div class="banner-form__image-card">
              <div class="banner-form__image-main-block">
                <div class="banner-form__image-main-wrap">
                  <button
                    type="button"
                    class="banner-form__image-upload"
                    :class="{
                      'banner-form__image-upload--empty': !imagePreview,
                    }"
                    :disabled="uploading || cropping"
                    @click="triggerBannerUpload"
                  >
                    <img
                      v-if="imagePreview"
                      :src="imagePreview"
                      alt="Banner 預覽"
                      class="banner-form__image"
                    />

                    <div v-else class="banner-form__empty-image">
                      <font-awesome-icon :icon="['fas', 'image']" />
                      <span>點擊上傳 Banner 圖片</span>
                    </div>
                  </button>

                  <button
                    v-if="imageUrl"
                    type="button"
                    class="banner-form__image-remove"
                    :disabled="uploading || cropping"
                    aria-label="清除圖片"
                    @click.stop="clearImage"
                  >
                    <font-awesome-icon
                      :icon="['fas', 'xmark']"
                      class="banner-form__image-remove-icon"
                    />
                  </button>
                </div>

                <p v-if="displayErrors.imageUrl" class="error-text m-t-8">
                  {{ displayErrors.imageUrl }}
                </p>
              </div>

              <input
                ref="bannerFileInput"
                class="banner-form__hidden-input"
                type="file"
                accept="image/*"
                :disabled="uploading || cropping"
                @change="onBannerFileChange"
              />
            </div>
          </FormSection>
        </div>
      </div>

      <!-- bottom button -->
      <div class="flex justify-center m-y-12 gap-x-12 flex-wrap">
        <MButton type="submit" :disabled="uploading || cropping">
          <font-awesome-icon icon="fa-floppy-disk" class="m-r-4" />
          {{ isEdit ? '更新' : '新增' }}
        </MButton>

        <MButton type="button" class="mbtn--gray" @click="navigateBack">
          <font-awesome-icon icon="fa-arrow-left" class="m-r-4" />
          返回
        </MButton>
      </div>
    </form>
  </MCard>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import * as yup from 'yup';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import FormSection from '@/components/common/FormSection.vue';
import FormDateRangeField from '@/components/common/FormDateRangeField.vue';
import FormRadioTagGroup from '@/components/common/FormRadioTagGroup.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { useBannerStore } from '@/stores/banner/useBannerStore';
import { openImageCropDialog } from '@/utils/dialog/openImageCropDialog';

import {
  getBannerById,
  createBanner,
  updateBanner,
} from '@/services/adminBannerService';
import { uploadBannerImage } from '@/services/adminUploadService';
import { getStoreOptions } from '@/services/adminStoreService';
import { openInfoDialog } from '@/utils/dialog/infoDialog';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';

const route = useRoute();
const router = useRouter();
const bannerStore = useBannerStore();

const isEdit = computed(() => Boolean(route.params.id));
const id = computed(() => String(route.params.id || ''));

/** 是否已按過送出 */
const isSubmitted = ref(false);

/** 只有送出後才顯示錯誤 */
const displayErrors = computed<Record<string, string | undefined>>(() => {
  if (!isSubmitted.value) return {};
  return errors.value;
});

type SelectOption = {
  label: string;
  value: any;
  disabled?: boolean;
  description?: string;
};

const statusOptions: SelectOption[] = [
  { label: '下架', value: 'UNPUBLISHED' },
  { label: '上架', value: 'PUBLISHED' },
];

/* --------------------------------------
 * Store options
 * -------------------------------------- */
const storeOptions = ref<SelectOption[]>([]);

const mapEnumOptionsToSelect = (list: any[] = []): SelectOption[] =>
  list.map((item) => ({
    label: item?.label ?? item?.storeName ?? item?.name ?? '',
    value: item?.value ?? item?.id ?? '',
    ...(item?.description ? { description: item.description } : {}),
  }));

const ensureStoreOptionExists = (storeIdValue: string) => {
  if (!storeIdValue) return;

  const exists = storeOptions.value.some(
    (option) => String(option.value) === String(storeIdValue),
  );

  if (!exists) {
    storeOptions.value.unshift({
      label: `店家（${storeIdValue}）`,
      value: storeIdValue,
    });
  }
};

const loadStoreOptions = async () => {
  await executeApi<any[]>({
    fn: () => getStoreOptions({ activeOnly: true }),
    onSuccess: (res: any) => {
      const data = res?.data ?? res ?? [];
      const arr = Array.isArray(data) ? data : [];

      storeOptions.value = mapEnumOptionsToSelect(arr);
      ensureStoreOptionExists(String(storeId.value || ''));
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

/* --------------------------------------
 * Date utils
 * -------------------------------------- */
const pad = (num: number) => String(num).padStart(2, '0');

const formatToPickerDateTime = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
};

const getDefaultStartTime = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return formatToPickerDateTime(date);
};

const getDefaultEndTime = () => {
  const date = new Date();
  date.setHours(23, 59, 0, 0);
  return formatToPickerDateTime(date);
};

const normalizeToBackendLocalDateTime = (value?: string | null) => {
  const text = String(value ?? '')
    .trim()
    .replace('T', ' ')
    .replace(/\//g, '-');

  if (!text) return null;
  if (text.length >= 19) return text.slice(0, 19);
  if (text.length === 16) return `${text}:00`;

  return text;
};

const normalizeToPickerDateTime = (value?: string | null) => {
  const text = String(value ?? '')
    .trim()
    .replace('T', ' ');

  if (!text) return '';
  return text.length >= 16 ? text.slice(0, 16) : text;
};

/* --------------------------------------
 * Schema
 * -------------------------------------- */
const schema = yup.object({
  storeId: yup.string().required('店家不能為空'),

  title: yup.string().required('請輸入標題').max(100, '標題最多100字'),

  imageUrl: yup.string().required('請上傳 Banner 圖片'),

  orderNum: yup
    .number()
    .typeError('排序必須是數字')
    .min(0, '排序最小為 0')
    .nullable()
    .transform((value, originalValue) =>
      originalValue === '' ||
      originalValue === null ||
      originalValue === undefined
        ? null
        : value,
    ),

  status: yup
    .string()
    .oneOf(['PUBLISHED', 'UNPUBLISHED'])
    .required('請選擇狀態'),

  startTime: yup.string().nullable(),

  endTime: yup
    .string()
    .nullable()
    .test('endAfterStart', '結束時間必須晚於開始時間', function (endValue) {
      const start = this.parent.startTime;

      if (!start || !endValue) return true;

      return (
        normalizeToBackendLocalDateTime(endValue)! >
        normalizeToBackendLocalDateTime(start)!
      );
    }),
});

/* --------------------------------------
 * useForm
 * -------------------------------------- */
const { errors, handleSubmit, setValues, defineField } = useForm({
  validationSchema: schema,
  initialValues: {
    storeId: '',
    title: '',
    imageUrl: '',
    orderNum: null as number | null,
    status: 'UNPUBLISHED',
    startTime: getDefaultStartTime(),
    endTime: getDefaultEndTime(),
  },
  validateOnMount: false,
});

const [storeId] = defineField('storeId');
const [title] = defineField('title');
const [imageUrl] = defineField('imageUrl');
const [orderNum] = defineField('orderNum');
const [status] = defineField('status');
const [startTime] = defineField('startTime');
const [endTime] = defineField('endTime');

/* --------------------------------------
 * Image state
 * -------------------------------------- */
const bannerFileInput = ref<HTMLInputElement | null>(null);
const imagePreview = ref('');

const uploading = ref(false);
const cropping = ref(false);

const triggerBannerUpload = () => {
  if (uploading.value || cropping.value) return;
  bannerFileInput.value?.click();
};

const onBannerFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  input.value = '';

  if (!file) return;

  await handleSelectedFile(file);
};

/* --------------------------------------
 * Load detail
 * -------------------------------------- */
const loadDetail = async () => {
  if (!isEdit.value || !id.value) return;

  await executeApi({
    fn: async () => getBannerById(id.value),
    onSuccess: (res: any) => {
      const data = res?.data ?? res;

      setValues(
        {
          storeId: data?.storeId ?? '',
          title: data?.title ?? '',
          imageUrl: data?.imageUrl ?? '',
          orderNum: data?.orderNum ?? null,
          status: data?.status ?? 'UNPUBLISHED',
          startTime:
            normalizeToPickerDateTime(data?.startTime) || getDefaultStartTime(),
          endTime:
            normalizeToPickerDateTime(data?.endTime) || getDefaultEndTime(),
        },
        false,
      );

      imagePreview.value = data?.imageUrl ?? '';
      ensureStoreOptionExists(data?.storeId ?? '');
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

/* --------------------------------------
 * Image handlers
 * -------------------------------------- */
const clearImage = () => {
  imageUrl.value = '';
  imagePreview.value = '';
};

const validateImageFile = async (file: File) => {
  const maxSize = 5 * 1024 * 1024;

  if (file.size > maxSize) {
    return '圖片大小不可超過 5MB';
  }

  if (!file.type.startsWith('image/')) {
    return '請選擇圖片檔案';
  }

  return '';
};

const handleSelectedFile = async (file: File) => {
  const errorMessage = await validateImageFile(file);

  if (errorMessage) {
    await openInfoDialog({
      title: '提示訊息',
      message: errorMessage,
      iconType: 'warning',
    });

    return;
  }

  const objectUrl = URL.createObjectURL(file);
  const baseName = file.name.replace(/\.(png|jpg|jpeg|webp)$/i, '');
  const croppedFileName = `${baseName}-cropped.jpg`;

  try {
    cropping.value = true;

    const croppedFile = await openImageCropDialog({
      src: objectUrl,
      title: '裁切 Banner 圖片',
      hint: '請裁切成 16:9 圖片比例',
      aspectRatio: 16 / 9,
      outputWidth: 1200,
      mimeType: 'image/jpeg',
      quality: 0.9,
      fileName: croppedFileName,
    });

    if (!croppedFile) return;

    await uploadCroppedBannerImage(croppedFile);
  } finally {
    cropping.value = false;
    URL.revokeObjectURL(objectUrl);
  }
};

const uploadCroppedBannerImage = async (file: File) => {
  uploading.value = true;

  await executeApi<{ imageUrl: string }>({
    fn: async () => uploadBannerImage(file),
    onSuccess: async (res: any) => {
      const url = res?.imageUrl || res?.data?.imageUrl || '';

      if (!url) {
        await openInfoDialog({
          title: '提示訊息',
          message: '上傳成功但未取得 imageUrl，請檢查後端回傳格式',
          iconType: 'warning',
        });

        return;
      }

      imageUrl.value = url;
      imagePreview.value = url;

      await openInfoDialog({
        title: '提示訊息',
        message: '圖片上傳成功',
        iconType: 'success',
      });
    },
    onFinally: async () => {
      uploading.value = false;
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

/* --------------------------------------
 * Submit
 * -------------------------------------- */
const onSubmit = handleSubmit(
  async (values) => {
    isSubmitted.value = true;

    if (uploading.value || cropping.value) {
      await openInfoDialog({
        title: '提示訊息',
        message: cropping.value
          ? '圖片裁切中，請先完成裁切再送出'
          : '圖片上傳中，請稍後再送出',
        iconType: 'warning',
      });

      return;
    }

    const ok = await openConfirmDialog({
      title: '儲存確認',
      message: '確定要儲存 Banner 嗎？',
    });

    if (!ok) return;

    const payload = {
      storeId: values.storeId,
      title: String(values.title ?? '').trim(),
      imageUrl: String(values.imageUrl ?? '').trim(),
      orderNum:
        values.orderNum === null || values.orderNum === undefined
          ? null
          : Number(values.orderNum),
      status: values.status,
      startTime: normalizeToBackendLocalDateTime(values.startTime),
      endTime: normalizeToBackendLocalDateTime(values.endTime),
    };

    await executeApi({
      fn: async () => {
        if (isEdit.value) {
          return updateBanner(id.value, payload);
        }

        return createBanner(payload);
      },
      onSuccess: async () => {
        await openInfoDialog({
          title: '提示訊息',
          message: isEdit.value ? '更新成功' : '新增成功',
          iconType: 'success',
        });

        bannerStore.setShouldRefresh(true);
        router.push('/home/banner');
      },
      showSuccessDialog: false,
      showFailDialog: true,
      showCatchDialog: true,
    });
  },
  () => {
    isSubmitted.value = true;
  },
);

/* --------------------------------------
 * Navigation
 * -------------------------------------- */
const navigateBack = () => {
  router.push('/home/banner');
};

/* --------------------------------------
 * Mounted
 * -------------------------------------- */
onMounted(async () => {
  await loadStoreOptions();
  await loadDetail();
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as *;

.banner-form {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;

  &__layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 440px);
    gap: 18px;
    align-items: flex-start;
    width: 100%;
    max-width: 100%;
  }

  &__left,
  &__right {
    min-width: 0;
    width: 100%;
  }

  &__card,
  &__image-card {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    padding: 14px;
    border: 1px solid color.mix($form-border, #fff, 72%);
    border-radius: 14px;
    background: $form-bg;
  }

  &__card--schedule {
    padding: 14px 8px;
  }

  &__status-panel {
    padding: 0 6px 14px;
    margin-bottom: 8px;
    border-bottom: 1px dashed $form-border;
  }

  &__schedule-layout {
    display: flex;
    flex-wrap: wrap;
    min-width: 0;
  }

  &__image-card {
    overflow: hidden;
  }

  &__image-main-block {
    width: 100%;
    min-width: 0;
  }

  &__image-main-wrap {
    position: relative;
    width: 100%;
    min-width: 0;
  }

  &__image-upload {
    position: relative;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border: 1px dashed $form-border;
    border-radius: 14px;
    background: color.mix($form-border, #fff, 28%);
    cursor: pointer;
    padding: 0;
    line-height: 0;
    transition:
      border-color 0.15s ease,
      background-color 0.15s ease,
      transform 0.12s ease;

    &:hover:not(:disabled) {
      border-color: $brand;
      background: $brand-light;
    }

    &:active:not(:disabled) {
      transform: scale(0.995);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.65;
    }

    &--empty {
      align-items: center;
      justify-content: center;
      line-height: normal;
    }
  }

  &__image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  &__empty-image {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    padding: 12px;
    color: $form-muted;
    text-align: center;

    svg {
      color: $brand;
      font-size: 26px;
      opacity: 0.85;
    }

    span {
      color: $form-text;
      font-size: 13px;
      font-weight: 700;
    }
  }

  &__image-remove {
    position: absolute;
    top: -8px;
    right: -8px;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: 0;
    border-radius: 999px;
    background: $danger;
    color: #fff;
    cursor: pointer;
    box-shadow: 0 6px 16px rgba($ink-900, 0.18);
    transition:
      background-color 0.12s ease,
      transform 0.12s ease,
      opacity 0.12s ease;

    &:hover {
      background: color.adjust($danger, $lightness: -6%);
      transform: scale(1.06);
    }

    &:active {
      background: color.adjust($danger, $lightness: -12%);
      transform: scale(0.96);
    }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      transform: none;
    }
  }

  &__hidden-input {
    display: none;
  }

  @media (max-width: 1180px) {
    &__layout {
      grid-template-columns: 1fr;
    }

    &__right {
      position: static;
    }
  }

  @media (max-width: 576px) {
    &__card,
    &__image-card {
      padding: 12px;
    }

    &__image-remove {
      top: 8px;
      right: 8px;
    }
  }
}
</style>

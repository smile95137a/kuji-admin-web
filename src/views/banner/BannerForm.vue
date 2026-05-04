<!-- src/views/banner/BannerForm.vue -->
<template>
  <MCard>
    <form class="banner-form" @submit.prevent="onSubmit">
      <p class="form__text form__text--title">
        Banner{{ isEdit ? '編輯' : '新增' }}
      </p>

      <!-- 基本資料 -->
      <FormSection title="基本資料">
        <div class="flex flex-wrap">
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

          <!-- 狀態 -->
          <div class="w-50 w-md-100 p-6">
            <FormSelect
              label="狀態"
              v-model="status"
              :options="statusOptions"
              :error="displayErrors.status"
              required
            />
          </div>
        </div>
      </FormSection>

      <!-- 顯示時間 -->
      <FormSection title="顯示時間">
        <div class="flex flex-wrap">
          <div class="w-100 p-6">
            <FormDateRangeField
              label="顯示時間"
              type="datetime-local"
              v-model:start="startTime"
              v-model:end="endTime"
              :start-error="displayErrors.startTime"
              :end-error="displayErrors.endTime"
            />
          </div>
        </div>
      </FormSection>

      <!-- 圖片設定 -->
      <FormSection title="圖片設定">
        <div class="flex flex-wrap">
          <div class="w-50 w-md-100 p-6">
            <UploadDropzone
              label="圖片"
              accept="image/*"
              :disabled="uploading || bulkCreating || cropOpen"
              :fileName="uploadFileName"
              :errorMessage="uploadErrorMessage"
              :statusText="
                uploading ? '上傳中...' : cropOpen ? '裁切中...' : ''
              "
              :showDecorIcons="true"
              :showClear="true"
              @select="handleSelectedFile"
              @clear="clearSelectedFileUi"
            />

            <div class="m-t-12">
              <FormInput
                label="圖片 URL"
                v-model="imageUrl"
                :error="displayErrors.imageUrl"
                maxlength="500"
                placeholder="https://example.com/banner.jpg（或上方上傳後自動回填）"
                @blur="syncPreviewFromUrl"
              />
            </div>

            <div class="flex gap-x-12 m-t-12" v-if="imageUrl">
              <MButton
                type="button"
                class="mbtn--gray"
                :disabled="uploading || bulkCreating || cropOpen"
                @click="clearImage"
              >
                <font-awesome-icon icon="fa-trash" class="m-r-4" />
                清除圖片
              </MButton>

              <p class="form__text" v-if="uploading">上傳中...</p>
            </div>

            <div v-if="imagePreview" class="banner-form__image-preview m-t-12">
              <img :src="imagePreview" alt="preview" />
            </div>
          </div>
        </div>
      </FormSection>

      <!-- bottom button -->
      <div class="flex justify-center m-y-12 gap-x-12 flex-wrap">
        <MButton
          type="submit"
          :disabled="uploading || bulkCreating || cropOpen"
        >
          <font-awesome-icon icon="fa-floppy-disk" class="m-r-4" />
          {{ isEdit ? '更新' : '新增' }}
        </MButton>

        <MButton type="button" class="mbtn--red" @click="navigateBack">
          <font-awesome-icon icon="fa-arrow-left" class="m-r-4" />
          返回
        </MButton>
      </div>
    </form>

    <ImageCropDialog
      v-model="cropOpen"
      :src="cropSrc"
      title="裁切 Banner 圖片"
      :aspectRatio="16 / 9"
      :outputWidth="1200"
      mimeType="image/jpeg"
      :quality="0.9"
      :fileName="cropFileName"
      @cancel="onCropCancel"
      @confirm="onCropConfirm"
    />
  </MCard>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import * as yup from 'yup';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import FormSection from '@/components/common/FormSection.vue';
import FormDateRangeField from '@/components/common/FormDateRangeField.vue';
import ImageCropDialog from '@/components/common/ImageCropDialog.vue';
import UploadDropzone from '@/components/common/UploadDropzone.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { useDialogStore } from '@/stores';
import { useBannerStore } from '@/stores/banner/useBannerStore';

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
const dialogStore = useDialogStore();
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
const normalizeToBackendLocalDateTime = (value?: string | null) => {
  const text = String(value ?? '').trim();

  if (!text) return null;
  if (text.length >= 19) return text.slice(0, 19);
  if (text.length === 16) return `${text}:00`;

  return text;
};

const normalizeToDatetimeLocalInput = (value?: string | null) => {
  const text = String(value ?? '').trim();
  if (!text) return '';
  return text.length >= 16 ? text.slice(0, 16) : text;
};

/* --------------------------------------
 * Schema
 * -------------------------------------- */
const schema = yup.object({
  storeId: yup.string().required('店家不能為空'),

  title: yup.string().required('請輸入標題').max(100, '標題最多100字'),

  imageUrl: yup
    .string()
    .required('圖片 URL 不能為空')
    .max(500, '圖片 URL 最多500字'),

  orderNum: yup
    .number()
    .typeError('排序必須是數字')
    .min(1, '排序最小為 1')
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

      return endValue > start;
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
    startTime: '',
    endTime: '',
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
const imagePreview = ref('');

const uploading = ref(false);
const bulkCreating = ref(false);

const cropOpen = ref(false);
const cropSrc = ref('');
const cropFileName = ref('cropped.jpg');

const uploadFileName = ref('');
const uploadErrorMessage = ref<string | null>(null);

const clearSelectedFileUi = () => {
  uploadFileName.value = '';
  uploadErrorMessage.value = null;
};

const revokeCropSrc = () => {
  if (cropSrc.value) {
    URL.revokeObjectURL(cropSrc.value);
    cropSrc.value = '';
  }
};

const onCropCancel = () => {
  cropOpen.value = false;
  revokeCropSrc();
};

onBeforeUnmount(() => {
  revokeCropSrc();
});

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
          startTime: normalizeToDatetimeLocalInput(data?.startTime),
          endTime: normalizeToDatetimeLocalInput(data?.endTime),
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
const syncPreviewFromUrl = () => {
  imagePreview.value = imageUrl.value || '';
};

const clearImage = () => {
  imageUrl.value = '';
  imagePreview.value = '';
  clearSelectedFileUi();
};

const handleSelectedFile = async (file: File) => {
  uploadErrorMessage.value = null;

  const maxSize = 5 * 1024 * 1024;

  if (file.size > maxSize) {
    uploadErrorMessage.value = '圖片大小不可超過 5MB';

    await openInfoDialog({
      title: '提示訊息',
      message: '圖片大小不可超過 5MB',
      iconType: 'warning',
    });

    clearSelectedFileUi();
    return;
  }

  if (!file.type.startsWith('image/')) {
    uploadErrorMessage.value = '請選擇圖片檔案';

    await openInfoDialog({
      title: '提示訊息',
      message: '請選擇圖片檔案',
      iconType: 'warning',
    });

    clearSelectedFileUi();
    return;
  }

  uploadFileName.value = file.name;

  revokeCropSrc();
  cropSrc.value = URL.createObjectURL(file);

  const base = file.name.replace(/\.(png|jpg|jpeg|webp)$/i, '');
  cropFileName.value = `${base}-cropped.jpg`;

  cropOpen.value = true;
};

const onCropConfirm = async (croppedFile: File) => {
  cropOpen.value = false;
  revokeCropSrc();

  if (bulkCreating.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '批量新增進行中，請稍後再上傳圖片',
      iconType: 'warning',
    });

    return;
  }

  uploading.value = true;

  await executeApi<{ imageUrl: string }>({
    fn: async () => uploadBannerImage(croppedFile),
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

    if (uploading.value || bulkCreating.value || cropOpen.value) {
      await openInfoDialog({
        title: '提示訊息',
        message: cropOpen.value
          ? '圖片裁切中，請先完成裁切再送出'
          : '操作進行中，請稍後再送出',
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
.banner-form {
  &__image-preview {
    img {
      max-width: 240px;
      border-radius: 8px;
    }
  }
}
</style>

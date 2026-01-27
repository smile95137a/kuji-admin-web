<!-- src/views/banner/BannerForm.vue -->
<template>
  <MCard>
    <form @submit.prevent="onSubmit">
      <p class="form__text form__text--title">
        Banner {{ isEdit ? '編輯' : '新增' }}
      </p>

      <div class="flex flex-wrap">
        <!-- 店家 -->
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="店家"
            v-model="storeId"
            :options="storeOptions"
            :error="errors.storeId"
            :showAll="true"
            allLabel="請選擇"
            :allValue="''"
          />
        </div>
      </div>
      <div class="flex flex-wrap">
        <!-- 標題 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="標題"
            v-model="title"
            :error="errors.title"
            placeholder="請輸入 Banner 標題"
          />
        </div>
      </div>
      <div class="flex flex-wrap">
        <!-- 排序 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="排序"
            v-model="orderNum"
            :error="errors.orderNum"
            type="number"
          />
        </div>
      </div>
      <div class="flex flex-wrap">
        <!-- 狀態 -->
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="狀態"
            v-model="status"
            :options="statusOptions"
            :error="errors.status"
          />
        </div>
      </div>
      <div class="flex flex-wrap">
        <div class="w-50 flex">
          <!-- 開始時間 -->
          <div class="w-50 p-6">
            <FormInput
              label="開始顯示時間"
              type="datetime-local"
              v-model="startTime"
              :error="errors.startTime"
            />
          </div>

          <!-- 結束時間 -->
          <div class="w-50 p-6">
            <FormInput
              label="結束顯示時間"
              type="datetime-local"
              v-model="endTime"
              :error="errors.endTime"
            />
          </div>
        </div>
      </div>
      <div class="flex flex-wrap">
        <!-- 圖片 -->
        <div class="w-50 p-6">
          <UploadDropzone
            label="圖片"
            accept="image/*"
            :disabled="uploading || bulkCreating || cropOpen"
            :fileName="uploadFileName"
            :errorMessage="uploadErrorMessage"
            :statusText="uploading ? '上傳中...' : cropOpen ? '裁切中...' : ''"
            :showDecorIcons="true"
            :showClear="true"
            @select="handleSelectedFile"
            @clear="clearSelectedFileUi"
          />

          <!-- 也允許直接貼 URL -->
          <div class="m-t-12">
            <FormInput
              label="圖片 URL"
              v-model="imageUrl"
              :error="errors.imageUrl"
              @blur="syncPreviewFromUrl"
            />
          </div>

          <div class="flex gap-x-12 m-t-12" v-if="imageUrl">
            <MButton
              type="button"
              class="mbtn--gray"
              :disabled="uploading || bulkCreating"
              @click="clearImage"
            >
              清除圖片
            </MButton>
            <p class="form__text" v-if="uploading">上傳中...</p>
          </div>

          <div v-if="imagePreview" class="m-t-12">
            <img
              :src="imagePreview"
              alt="preview"
              style="max-width: 240px; border-radius: 8px"
            />
          </div>
        </div>
      </div>

      <div class="flex justify-center m-y-12 gap-x-12">
        <MButton @click="fillMockData"> 快速產生資料 </MButton>

        <MButton type="submit" :disabled="uploading || bulkCreating">
          {{ isEdit ? '更新' : '新增' }}
        </MButton>

        <MButton @click="router.back()"> 返回 </MButton>
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
import ImageCropDialog from '@/components/common/ImageCropDialog.vue';
import UploadDropzone from '@/components/common/UploadDropzone.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { useDialogStore } from '@/stores';

import {
  getBannerById,
  createBanner,
  updateBanner,
} from '@/services/adminBannerService';
import { uploadBannerImage } from '@/services/adminUploadService';
import { getStoreOptions } from '@/services/adminStoreService';

const route = useRoute();
const router = useRouter();
const dialogStore = useDialogStore();

const isEdit = computed(() => Boolean(route.params.id));

const statusOptions: SelectOption[] = [
  { label: '下架', value: 'UNPUBLISHED' },
  { label: '上架', value: 'PUBLISHED' },
];

/* 店家選項 */
const storeOptions = ref<SelectOption[]>([]);

const mapEnumOptionsToSelect = (list: any[] = []): SelectOption[] =>
  list.map((x) => ({
    label: x?.label ?? '',
    value: x?.value ?? '',
    ...(x?.description ? { description: x.description } : {}),
  }));

const ensureStoreOptionExists = (storeIdValue: string) => {
  if (!storeIdValue) return;
  const exists = storeOptions.value.some((o) => o.value === storeIdValue);
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
    onSuccess: (data) => {
      storeOptions.value = mapEnumOptionsToSelect(
        Array.isArray(data) ? data : [],
      );
      ensureStoreOptionExists(storeId.value);
    },
  });
};

/* schema */
const schema = yup.object({
  storeId: yup.string().required('店家不能為空'),
  title: yup.string().required('請輸入標題'),
  imageUrl: yup.string().required('圖片 URL 不能為空'),
  orderNum: yup
    .number()
    .typeError('排序必須是數字')
    .nullable()
    .transform((v, o) =>
      o === '' || o === null || o === undefined ? null : v,
    ),
  status: yup
    .string()
    .oneOf(['PUBLISHED', 'UNPUBLISHED'])
    .required('請選擇狀態'),
  startTime: yup.string().nullable(),
  endTime: yup.string().nullable(),
});

/* useForm */
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
});

/* defineField */
const [storeId] = defineField('storeId');
const [title] = defineField('title');
const [imageUrl] = defineField('imageUrl');
const [orderNum] = defineField('orderNum');
const [status] = defineField('status');
const [startTime] = defineField('startTime');
const [endTime] = defineField('endTime');

const imagePreview = ref('');

const uploading = ref(false);
const bulkCreating = ref(false);

/* crop */
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

/* 編輯模式載入 */
onMounted(async () => {
  await loadStoreOptions();

  if (!isEdit.value) return;

  await executeApi({
    fn: async () => getBannerById(route.params.id as string),
    onSuccess: (data) => {
      const d: any = data;

      setValues({
        storeId: d.storeId ?? '',
        title: d.title ?? '',
        imageUrl: d.imageUrl ?? '',
        orderNum: d.orderNum ?? null,
        status: d.status ?? 'UNPUBLISHED',
        startTime: d.startTime,
        endTime: d.endTime,
      });

      imagePreview.value = d.imageUrl ?? '';
      ensureStoreOptionExists(d.storeId ?? '');
    },
  });
});

/* 手動貼 URL 同步預覽 */
const syncPreviewFromUrl = () => {
  imagePreview.value = imageUrl.value || '';
};

/* 清除圖片 */
const clearImage = () => {
  imageUrl.value = '';
  imagePreview.value = '';
};

/* 由 UploadDropzone 丟進來的 file */
const handleSelectedFile = async (file: File) => {
  uploadErrorMessage.value = null;

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    uploadErrorMessage.value = '圖片大小不可超過 5MB';
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '圖片大小不可超過 5MB',
      iconType: 'warning',
    });
    clearSelectedFileUi();
    return;
  }
  if (!file.type.startsWith('image/')) {
    uploadErrorMessage.value = '請選擇圖片檔案';
    await dialogStore.openInfoDialog({
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

/* crop confirm -> upload */
const onCropConfirm = async (croppedFile: File) => {
  cropOpen.value = false;
  revokeCropSrc();

  if (bulkCreating.value) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '批量新增進行中，請稍後再上傳圖片',
      iconType: 'warning',
    });
    return;
  }

  uploading.value = true;

  await executeApi<{ imageUrl: string }>({
    fn: async () => uploadBannerImage(croppedFile),
    onSuccess: async (data) => {
      const url = data?.imageUrl || '';

      if (!url) {
        await dialogStore.openInfoDialog({
          title: '提示訊息',
          message: '上傳成功但未取得 imageUrl，請檢查後端回傳格式',
          iconType: 'warning',
        });
        return;
      }

      imageUrl.value = url;
      imagePreview.value = url;

      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '圖片上傳成功',
        iconType: 'success',
      });
    },
    onFinally: async () => {
      uploading.value = false;
    },
  });
};

/* 快速產生資料 */
const pad2 = (n: number) => String(n).padStart(2, '0');
const toDatetimeLocal = (date: Date) => {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const mm = pad2(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
};

const fillMockData = async () => {
  const now = new Date();
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const mockOrder = Math.floor(Math.random() * 20) + 1;

  const firstStoreId =
    storeOptions.value.find((o) => o.value)?.value || 'STORE_001';

  const mockImg =
    imageUrl.value || 'https://picsum.photos/seed/banner/1200/600';

  setValues({
    storeId: firstStoreId,
    title: `測試 Banner ${now.getTime()}`,
    imageUrl: mockImg,
    orderNum: mockOrder,
    status: 'PUBLISHED',
    startTime: toDatetimeLocal(now),
    endTime: toDatetimeLocal(twoWeeksLater),
  });

  imagePreview.value = mockImg;

  await dialogStore.openInfoDialog({
    title: '提示訊息',
    message: '已帶入測試資料',
    iconType: 'success',
  });
};

/* submit */
const onSubmit = handleSubmit(async (values) => {
  if (uploading.value || bulkCreating.value || cropOpen.value) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: cropOpen.value
        ? '圖片裁切中，請先完成裁切再送出'
        : '操作進行中，請稍後再送出',
      iconType: 'warning',
    });
    return;
  }

  if (!values.storeId) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '請選擇店家',
      iconType: 'warning',
    });
    return;
  }

  if (!values.imageUrl) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '請上傳（裁切）或輸入圖片 URL',
      iconType: 'warning',
    });
    return;
  }

  const payload = {
    storeId: values.storeId,
    title: values.title,
    imageUrl: values.imageUrl,
    orderNum: values.orderNum ?? null,
    status: values.status,
    startTime: values.startTime,
    endTime: values.endTime,
  };

  if (!isEdit.value) {
    await executeApi({
      fn: async () => createBanner(payload),
      onSuccess: async () => {
        await dialogStore.openInfoDialog({
          title: '提示訊息',
          message: '新增成功',
          iconType: 'success',
        });
        router.push('/home/banner');
      },
    });
  } else {
    await executeApi({
      fn: async () => updateBanner(route.params.id as string, payload),
      onSuccess: async () => {
        await dialogStore.openInfoDialog({
          title: '提示訊息',
          message: '更新成功',
          iconType: 'success',
        });
        router.push('/home/banner');
      },
    });
  }
});
</script>

<style scoped></style>

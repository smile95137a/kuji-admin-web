<!-- src/views/news/NewsForm.vue -->
<template>
  <MCard>
    <form @submit.prevent="onSubmit">
      <p class="form__text form__text--title">
        最新消息 {{ isEdit ? '編輯' : '新增' }}
      </p>

      <!-- 標題 -->
      <div class="flex flex-wrap">
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="標題"
            v-model="title"
            :error="errors.title"
            placeholder="請輸入最新消息標題"
          />
        </div>
      </div>

      <!-- 狀態 -->
      <div class="flex flex-wrap">
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="狀態"
            v-model="status"
            :options="statusOptions"
            :error="errors.status"
          />
        </div>
      </div>

      <!-- 上架 / 下架時間 -->
      <div class="flex flex-wrap">
        <div class="w-50 flex">
          <div class="w-50 p-6">
            <FormInput
              label="上架時間（scheduledAt）"
              v-model="scheduledAt"
              :error="errors.scheduledAt"
              type="datetime-local"
              placeholder="可不填"
            />
          </div>

          <div class="w-50 p-6">
            <FormInput
              label="下架時間（endTime）"
              v-model="endTime"
              :error="errors.endTime"
              type="datetime-local"
              placeholder="可不填"
            />
          </div>
        </div>
      </div>

      <!-- 封面圖（UploadDropzone + 裁切） -->
      <div class="flex flex-wrap">
        <div class="w-50 p-6">
          <UploadDropzone
            label="封面圖片"
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
              label="封面圖片 URL（imageUrl，可直接貼）"
              v-model="imageUrl"
              :error="errors.imageUrl"
              placeholder="https://example.com/news.jpg（或上方上傳會自動回填）"
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

      <!-- 內容（CKEditor） -->
      <div class="flex flex-wrap">
        <div class="w-100 p-6">
          <p class="form__text form__text--red">內容（content）</p>

          <Ckeditor
            :editor="ClassicEditor"
            v-model="content"
            :config="editorConfig"
          />

          <p class="error-text m-t-8" v-if="errors.content">
            {{ errors.content }}
          </p>
        </div>
      </div>

      <!-- bottom button -->
      <div class="flex justify-center m-y-12 gap-x-12">
        <MButton
          type="submit"
          :disabled="uploading || bulkCreating || cropOpen"
        >
          {{ isEdit ? '更新' : '新增' }}
        </MButton>

        <MButton type="button" class="mbtn--red" @click="router.back()">
          返回
        </MButton>
      </div>
    </form>

    <ImageCropDialog
      v-model="cropOpen"
      :src="cropSrc"
      title="裁切 最新消息 封面圖"
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

/* CKEditor */
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Ckeditor } from '@ckeditor/ckeditor5-vue';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import UploadDropzone from '@/components/common/UploadDropzone.vue';
import ImageCropDialog from '@/components/common/ImageCropDialog.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { useDialogStore } from '@/stores';

import {
  getNewsById,
  createNews,
  updateNews,
} from '@/services/adminNewsService';
import { uploadNewsImage } from '@/services/adminUploadService';

/* Setup */
const route = useRoute();
const router = useRouter();
const dialogStore = useDialogStore();
const isEdit = computed(() => Boolean(route.params.id));

/** 狀態 */
const statusOptions: SelectOption[] = [
  { label: '草稿（DRAFT）', value: 'DRAFT' },
  { label: '上架（PUBLISHED）', value: 'PUBLISHED' },
];

/** CKEditor 設定 */
class MyCustomUploadAdapter {
  loader: any;

  constructor(loader: any) {
    this.loader = loader;
  }

  upload() {
    return this.loader.file.then(async (file: File) => {
      const { data } = await uploadNewsImage(file);

      return {
        default: data.imageUrl,
      };
    });
  }

  abort() {
    console.log('圖片上傳被中止');
  }
}

function CustomUploadAdapterPlugin(editor: any) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
    return new MyCustomUploadAdapter(loader);
  };
}
const editorConfig: any = {
  toolbar: [
    'heading',
    '|',
    'bold',
    'italic',
    'link',
    'bulletedList',
    'numberedList',
    'blockQuote',
    'imageUpload',
    '|',
    'imageResize',
  ],
  language: 'zh-tw',
  image: {
    toolbar: ['imageStyle:full', 'imageStyle:side', 'imageResize'],
    resizeOptions: [
      { name: 'resizeImage:original', label: '原始大小', value: null },
      { name: 'resizeImage:50', label: '50%', value: '50' },
      { name: 'resizeImage:75', label: '75%', value: '75' },
    ],
    resizeUnit: '%',
  },
  extraPlugins: [CustomUploadAdapterPlugin],
};

/** datetime-local <-> LocalDateTime */
const toLocalDateTime = (v?: string | null) => {
  if (!v) return null;
  if (v.length >= 19) return v.slice(0, 19);
  return `${v}:00`;
};

const toDateTimeLocalValue = (v?: string | null) => {
  if (!v) return '';
  return String(v).slice(0, 16);
};

/** schema */
const schema = yup.object({
  title: yup.string().required('請輸入標題'),
  status: yup.string().required('請選擇狀態'),
  imageUrl: yup.string().nullable(),
  content: yup.string().required('請輸入內容'),
  scheduledAt: yup.string().nullable(),
  endTime: yup.string().nullable(),
});

const { errors, handleSubmit, setValues, defineField } = useForm({
  validationSchema: schema,
  initialValues: {
    title: '',
    status: 'DRAFT',
    imageUrl: '',
    content: '',
    scheduledAt: '',
    endTime: '',
  },
});

const [title] = defineField('title');
const [status] = defineField('status');
const [imageUrl] = defineField('imageUrl');
const [content] = defineField('content');
const [scheduledAt] = defineField('scheduledAt');
const [endTime] = defineField('endTime');

const imagePreview = ref('');
const uploading = ref(false);
const bulkCreating = ref(false);

/* UploadDropzone UI */
const uploadFileName = ref('');
const uploadErrorMessage = ref<string | null>(null);

const clearSelectedFileUi = () => {
  uploadFileName.value = '';
  uploadErrorMessage.value = null;
};

/* ✅ crop（比照 BannerForm） */
const cropOpen = ref(false);
const cropSrc = ref('');
const cropFileName = ref('cropped.jpg');

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
  if (!isEdit.value) return;

  await executeApi({
    fn: async () => getNewsById(route.params.id as string),
    onSuccess: (data) => {
      const d: any = data;

      setValues({
        title: d.title ?? '',
        status: d.status ?? 'DRAFT',
        imageUrl: d.imageUrl ?? '',
        content: d.content ?? '',
        scheduledAt: toDateTimeLocalValue(d.scheduledAt),
        endTime: toDateTimeLocalValue(d.endTime),
      });

      imagePreview.value = d.imageUrl ?? '';
    },
  });
});

const syncPreviewFromUrl = () => {
  imagePreview.value = imageUrl.value || '';
};

const clearImage = () => {
  imageUrl.value = '';
  imagePreview.value = '';
};

/* ✅ 選檔：先驗檔 -> 開裁切，不直接上傳 */
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

/* ✅ 裁切確認 -> 上傳 */
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
    fn: async () => uploadNewsImage(croppedFile),
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
    onFinally: () => {
      uploading.value = false;
    },
    showSuccessDialog: false,
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

  const payload = {
    title: values.title,
    content: values.content,
    imageUrl: values.imageUrl || '',
    status: values.status,
    scheduledAt: toLocalDateTime(values.scheduledAt),
    endTime: toLocalDateTime(values.endTime),
  };

  if (!isEdit.value) {
    await executeApi({
      fn: async () => createNews(payload),
      onSuccess: async () => {
        await dialogStore.openInfoDialog({
          title: '提示訊息',
          message: '新增成功',
          iconType: 'success',
        });
        router.push('/home/news');
      },
    });
  } else {
    await executeApi({
      fn: async () => updateNews(route.params.id as string, payload),
      onSuccess: async () => {
        await dialogStore.openInfoDialog({
          title: '提示訊息',
          message: '更新成功',
          iconType: 'success',
        });
        router.push('/home/news');
      },
    });
  }
});
</script>

<style scoped>
:deep(.ck-editor__editable) {
  min-height: 260px;
}
</style>

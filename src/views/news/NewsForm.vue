<!-- src/views/news/NewsForm.vue -->
<template>
  <MCard>
    <form class="news-form" @submit.prevent="onSubmit">
      <p class="form__text form__text--title">
        最新消息{{ isEdit ? '編輯' : '新增' }}
      </p>

      <div class="news-form__layout">
        <!-- 左側：主要表單 -->
        <div class="news-form__left">
          <!-- 基本資料 -->
          <FormSection title="基本資料">
            <div class="news-form__card">
              <div class="flex flex-wrap">
                <!-- 標題 -->
                <div class="w-50 w-md-100 p-6">
                  <FormInput
                    label="標題"
                    v-model="title"
                    :error="displayErrors.title"
                    required
                    maxlength="100"
                    placeholder="請輸入最新消息標題"
                  />
                </div>

                <!-- 分類 -->
                <div class="w-50 w-md-100 p-6">
                  <FormRadioTagGroup
                    label="分類"
                    name="news-category"
                    id-prefix="news-category"
                    v-model="category"
                    :options="categoryOptions"
                    :error="displayErrors.category"
                    required
                  />
                </div>

                <!-- 重要消息 -->
                <div class="w-100 p-6">
                  <FormCheckboxField
                    label="重要程度"
                    checkbox-label="標記為重要消息"
                    v-model="isImportant"
                    :trueValue="true"
                    :falseValue="false"
                    :error="displayErrors.isImportant"
                    hint="勾選後，列表會顯示重要消息標記。"
                  />
                </div>
              </div>
            </div>
          </FormSection>

          <!-- 狀態與排程 -->
          <FormSection title="狀態與排程">
            <div class="news-form__card news-form__card--schedule">
              <div class="news-form__status-panel">
                <FormRadioTagGroup
                  label="狀態"
                  name="news-status"
                  id-prefix="news-status"
                  v-model="status"
                  :options="statusOptions"
                  :error="displayErrors.status"
                  required
                />
              </div>

              <div class="news-form__schedule-layout">
                <div class="w-100 p-6">
                  <FormDateRangeField
                    label="發布 / 下架時間"
                    type="datetime-local"
                    v-model:start="scheduledAt"
                    v-model:end="endTime"
                    :start-error="displayErrors.scheduledAt"
                    :end-error="displayErrors.endTime"
                    hint="發布時間留空代表立即發布；下架時間可不填。"
                  />
                </div>
              </div>
            </div>
          </FormSection>

          <!-- 內容 -->
          <FormSection title="內容">
            <div class="news-form__editor-card">
              <div class="news-form__editor-head">
                <p class="news-form__editor-title">消息內容</p>

                <span class="news-form__editor-badge">
                  可插入圖片與格式化文字
                </span>
              </div>

              <div class="news-form__editor-main">
                <Ckeditor
                  :editor="ckeditorEditor"
                  v-model="content"
                  :config="editorConfig"
                />
              </div>

              <p class="error-text m-t-8" v-if="displayErrors.content">
                {{ displayErrors.content }}
              </p>
            </div>
          </FormSection>
        </div>

        <!-- 右側：封面圖片 -->
        <div class="news-form__right">
          <FormSection title="封面圖片">
            <div class="news-form__image-card">
              <div class="news-form__image-main-block">
                <div class="news-form__image-main-wrap">
                  <button
                    type="button"
                    class="news-form__image-upload"
                    :class="{
                      'news-form__image-upload--empty': !imagePreview,
                    }"
                    :disabled="uploading || cropping"
                    @click="triggerCoverUpload"
                  >
                    <img
                      v-if="imagePreview"
                      :src="imagePreview"
                      alt="最新消息封面預覽"
                      class="news-form__image"
                    />

                    <div v-else class="news-form__empty-image">
                      <font-awesome-icon :icon="['fas', 'image']" />
                      <span>點擊上傳封面圖片</span>
                    </div>
                  </button>

                  <button
                    v-if="imageUrl"
                    type="button"
                    class="news-form__image-remove"
                    :disabled="uploading || cropping"
                    aria-label="清除圖片"
                    @click.stop="clearImage"
                  >
                    <font-awesome-icon
                      :icon="['fas', 'xmark']"
                      class="news-form__image-remove-icon"
                    />
                  </button>
                </div>

                <p v-if="displayErrors.imageUrl" class="error-text m-t-8">
                  {{ displayErrors.imageUrl }}
                </p>
              </div>

              <input
                ref="coverFileInput"
                class="news-form__hidden-input"
                type="file"
                accept="image/*"
                :disabled="uploading || cropping"
                @change="onCoverFileChange"
              />
            </div>
          </FormSection>
        </div>
      </div>

      <!-- bottom button -->
      <div class="flex justify-center m-y-12 gap-x-12 flex-wrap">
        <MButton
          v-if="isDev"
          type="button"
          class="mbtn--gray"
          :disabled="uploading || cropping"
          @click="fillMockData"
        >
          快速帶入假資料
        </MButton>

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
import { computed, ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import * as yup from 'yup';

import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Ckeditor } from '@ckeditor/ckeditor5-vue';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSection from '@/components/common/FormSection.vue';
import FormCheckboxField from '@/components/common/FormCheckboxField.vue';
import FormDateRangeField from '@/components/common/FormDateRangeField.vue';
import FormRadioTagGroup from '@/components/common/FormRadioTagGroup.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { useNewsStore } from '@/stores/news/useNewsStore';
import { openImageCropDialog } from '@/utils/dialog/openImageCropDialog';

import {
  getNewsById,
  createNews,
  updateNews,
} from '@/services/adminNewsService';
import { uploadNewsImage } from '@/services/adminUploadService';
import { openInfoDialog } from '@/utils/dialog/infoDialog';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';

const route = useRoute();
const router = useRouter();
const newsStore = useNewsStore();

const isEdit = computed(() => Boolean(route.params.id));
const id = computed(() => String(route.params.id || ''));

const isDev = import.meta.env.DEV;

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
};

/** 選項 */
const statusOptions: SelectOption[] = [
  { label: '草稿', value: 'DRAFT' },
  { label: '上架', value: 'PUBLISHED' },
];

const categoryOptions: SelectOption[] = [
  { label: '公告', value: 'ANNOUNCEMENT' },
  { label: '活動', value: 'EVENT' },
  { label: '系統通知', value: 'SYSTEM' },
];

/** datetime-local <-> LocalDateTime */
const toLocalDateTime = (value?: string | null) => {
  const text = String(value ?? '').trim();

  if (!text) return null;
  if (text.length >= 19) return text.slice(0, 19);
  if (text.length === 16) return `${text}:00`;

  return text;
};

const toDateTimeLocalValue = (value?: string | null) => {
  if (!value) return '';
  return String(value).slice(0, 16);
};

const normalizeBoolean = (value: any) => {
  if (value === true || value === false) return value;

  const text = String(value ?? '')
    .trim()
    .toLowerCase();

  if (text === 'true' || text === '1') return true;
  if (text === 'false' || text === '0') return false;

  return false;
};

/** schema */
const schema = yup.object({
  title: yup.string().required('請輸入標題').max(100, '標題最多100字'),

  category: yup.string().required('請選擇分類'),

  isImportant: yup.mixed().nullable(),

  status: yup.string().required('請選擇狀態'),

  imageUrl: yup.string().nullable().max(500, '封面圖片 URL 最多500字'),

  content: yup.string().required('請輸入內容'),

  scheduledAt: yup.string().nullable(),

  endTime: yup
    .string()
    .nullable()
    .test('endAfterStart', '下架時間必須晚於發布時間', function (endValue) {
      const start = this.parent.scheduledAt;

      if (!start || !endValue) return true;

      return endValue > start;
    }),
});

const { errors, handleSubmit, setValues, defineField } = useForm({
  validationSchema: schema,
  initialValues: {
    title: '',
    category: 'ANNOUNCEMENT',
    isImportant: false as boolean | string,
    status: 'DRAFT',
    imageUrl: '',
    content: '',
    scheduledAt: '',
    endTime: '',
  },
  validateOnMount: false,
});

const [title] = defineField('title');
const [category] = defineField('category');
const [isImportant] = defineField('isImportant');
const [status] = defineField('status');
const [imageUrl] = defineField('imageUrl');
const [content] = defineField('content');
const [scheduledAt] = defineField('scheduledAt');
const [endTime] = defineField('endTime');

/* --------------------------------------
 * CKEditor
 * -------------------------------------- */
const ckeditorEditor = ClassicEditor as unknown as {
  create(...args: any[]): Promise<any>;
};

class NewsCustomUploadAdapter {
  loader: any;

  constructor(loader: any) {
    this.loader = loader;
  }

  upload() {
    return this.loader.file.then(async (file: File) => {
      const res: any = await uploadNewsImage(file);
      const url = res?.data?.imageUrl || res?.imageUrl || '';

      if (!url) {
        throw new Error('上傳成功但未取得 imageUrl');
      }

      return {
        default: url,
      };
    });
  }

  abort() {
    console.log('CKEditor 圖片上傳被中止');
  }
}

function CustomUploadAdapterPlugin(editor: any) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
    return new NewsCustomUploadAdapter(loader);
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
    'undo',
    'redo',
  ],
  language: 'zh-tw',
  image: {
    toolbar: ['imageStyle:full', 'imageStyle:side'],
  },
  extraPlugins: [CustomUploadAdapterPlugin],
};

/* --------------------------------------
 * Image state
 * -------------------------------------- */
const coverFileInput = ref<HTMLInputElement | null>(null);

const imagePreview = ref('');
const uploading = ref(false);
const cropping = ref(false);

const triggerCoverUpload = () => {
  if (uploading.value || cropping.value) return;
  coverFileInput.value?.click();
};

const onCoverFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  input.value = '';

  if (!file) return;

  await handleSelectedFile(file);
};

/* 編輯模式載入 */
const loadDetail = async () => {
  if (!isEdit.value || !id.value) return;

  await executeApi({
    fn: async () => getNewsById(id.value),
    onSuccess: (res: any) => {
      const data = res?.data ?? res;

      setValues(
        {
          title: data?.title ?? '',
          category: data?.category ?? 'ANNOUNCEMENT',
          isImportant: normalizeBoolean(data?.isImportant),
          status: data?.status ?? 'DRAFT',
          imageUrl: data?.imageUrl ?? '',
          content: data?.content ?? '',
          scheduledAt: toDateTimeLocalValue(data?.scheduledAt),
          endTime: toDateTimeLocalValue(data?.endTime),
        },
        false,
      );

      imagePreview.value = data?.imageUrl ?? '';
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

watch(
  imageUrl,
  (value) => {
    imagePreview.value = String(value || '');
  },
  { immediate: true },
);

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
      title: '裁切最新消息封面圖',
      hint: '請裁切成 16:9 圖片比例',
      aspectRatio: 16 / 9,
      outputWidth: 1200,
      mimeType: 'image/jpeg',
      quality: 0.9,
      fileName: croppedFileName,
    });

    if (!croppedFile) return;

    await uploadCroppedNewsImage(croppedFile);
  } finally {
    cropping.value = false;
    URL.revokeObjectURL(objectUrl);
  }
};

const uploadCroppedNewsImage = async (file: File) => {
  uploading.value = true;

  await executeApi<{ imageUrl: string }>({
    fn: async () => uploadNewsImage(file),
    onSuccess: async (data: any) => {
      const url = data?.imageUrl || data?.data?.imageUrl || '';

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
    onFinally: () => {
      uploading.value = false;
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

/* --------------------------------------
 * Dev mock
 * -------------------------------------- */
const fillMockData = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');

  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const mi = pad(now.getMinutes());

  const scheduledAtValue = `${yyyy}-${mm}-${dd}T${hh}:${mi}`;

  const mockContent = `
    <h2>最新活動公告</h2>
    <p>這是一筆開發環境快速帶入的測試內容，可用來確認最新消息前台顯示效果。</p>
    <p>內容包含活動說明、注意事項與相關連結，可依實際需求調整。</p>
    <ul>
      <li>活動期間請以後台設定為準</li>
      <li>封面圖可點擊右側圖片區塊上傳</li>
      <li>上架後將顯示於最新消息列表</li>
    </ul>
  `.trim();

  setValues(
    {
      title: `測試消息_${Date.now()}`,
      category: 'ANNOUNCEMENT',
      isImportant: true,
      status: 'DRAFT',
      imageUrl: '',
      content: mockContent,
      scheduledAt: scheduledAtValue,
      endTime: '',
    },
    false,
  );

  imagePreview.value = '';
};

/* submit */
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
      message: '確定要儲存最新消息嗎？',
    });

    if (!ok) return;

    const payload = {
      title: String(values.title ?? '').trim(),
      content: values.content,
      imageUrl: String(values.imageUrl ?? '').trim(),
      status: values.status,
      category: values.category,
      isImportant: normalizeBoolean(values.isImportant),
      scheduledAt: toLocalDateTime(values.scheduledAt),
      endTime: toLocalDateTime(values.endTime),
    };

    await executeApi({
      fn: async () => {
        if (isEdit.value) {
          return updateNews(id.value, payload);
        }

        return createNews(payload);
      },
      onSuccess: async () => {
        await openInfoDialog({
          title: '提示訊息',
          message: isEdit.value ? '更新成功' : '新增成功',
          iconType: 'success',
        });

        newsStore.setShouldRefresh(true);
        router.push('/home/news');
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

const navigateBack = () => {
  router.push('/home/news');
};

onMounted(async () => {
  await loadDetail();
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as *;

.news-form {
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

  &__editor-card {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    padding: 16px;
    border: 1px solid color.mix($form-border, #fff, 72%);
    border-radius: 18px;
    background: $form-bg;
    box-shadow: 0 8px 20px rgba($ink-900, 0.035);
    overflow: hidden;
  }

  &__editor-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 12px;
    min-width: 0;
  }

  &__editor-title {
    margin: 0;
    color: $form-text;
    font-size: 14px;
    font-weight: 800;
    line-height: 1.4;
    word-break: break-word;
  }

  &__editor-badge {
    flex: 0 0 auto;
    padding: 3px 9px;
    border-radius: 999px;
    background: color.mix($brand-light, #fff, 28%);
    color: $brand-dark;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.4;
  }

  &__editor-main {
    overflow: hidden;
    background: #fff;

    :deep(.ck.ck-toolbar) {
      background: color.mix($brand-light, #fff, 12%);
    }

    :deep(.ck.ck-editor__main > .ck-editor__editable) {
      box-shadow: none;
    }

    :deep(.ck-editor__editable_inline) {
      min-height: 560px;
      padding: 18px 20px;
      line-height: 1.8;
    }
  }

  @media (max-width: 1180px) {
    &__layout {
      grid-template-columns: 1fr;
    }

    &__right {
      position: static;
    }
  }

  @media (max-width: 960px) {
    &__editor-head {
      align-items: flex-start;
      flex-direction: column;
    }
  }

  @media (max-width: 576px) {
    &__card,
    &__image-card,
    &__editor-card {
      padding: 12px;
    }

    &__image-remove {
      top: 8px;
      right: 8px;
    }

    &__editor-badge {
      max-width: 100%;
      white-space: normal;
      word-break: break-word;
    }

    &__editor-main {
      :deep(.ck-editor__editable_inline) {
        min-height: 420px;
        padding: 14px;
      }
    }
  }
}
</style>

<!-- src/views/news/NewsForm.vue -->
<template>
  <MCard>
    <form class="news-form" @submit.prevent="onSubmit">
      <p class="form__text form__text--title">
        最新消息{{ isEdit ? '編輯' : '新增' }}
      </p>

      <!-- 基本資料 -->
      <FormSection title="基本資料">
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
            <FormSelect
              label="分類"
              v-model="category"
              :options="categoryOptions"
              :error="displayErrors.category"
              required
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

          <!-- 重要消息 -->
          <div class="w-50 w-md-100 p-6">
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
      </FormSection>

      <!-- 上下架時間 -->
      <FormSection title="上下架時間">
        <div class="flex flex-wrap">
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
      </FormSection>

      <!-- 封面圖片 -->
      <FormSection title="封面圖片">
        <div class="flex flex-wrap">
          <div class="w-50 w-md-100 p-6">
            <UploadDropzone
              label="封面圖片"
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
                label="封面圖片 URL"
                v-model="imageUrl"
                :error="displayErrors.imageUrl"
                maxlength="500"
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
                <font-awesome-icon icon="fa-trash" class="m-r-4" />
                清除圖片
              </MButton>

              <p class="form__text" v-if="uploading">上傳中...</p>
            </div>

            <div v-if="imagePreview" class="news-form__image-preview m-t-12">
              <img :src="imagePreview" alt="preview" />
            </div>
          </div>
        </div>
      </FormSection>

      <!-- 內容 -->
      <FormSection title="內容">
        <div class="flex flex-wrap">
          <div class="w-100 p-6">
            <div class="news-form__editor-toolbar" v-if="editor">
              <button
                type="button"
                @click="editor.chain().focus().toggleBold().run()"
                :class="{ 'is-active': editor.isActive('bold') }"
              >
                B
              </button>

              <button
                type="button"
                @click="editor.chain().focus().toggleItalic().run()"
                :class="{ 'is-active': editor.isActive('italic') }"
              >
                I
              </button>

              <button
                type="button"
                @click="
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                "
                :class="{
                  'is-active': editor.isActive('heading', { level: 2 }),
                }"
              >
                H2
              </button>

              <button
                type="button"
                @click="
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                "
                :class="{
                  'is-active': editor.isActive('heading', { level: 3 }),
                }"
              >
                H3
              </button>

              <button
                type="button"
                @click="editor.chain().focus().toggleBulletList().run()"
                :class="{ 'is-active': editor.isActive('bulletList') }"
              >
                <font-awesome-icon icon="fa-list-ul" class="m-r-4" />
                List
              </button>

              <button
                type="button"
                @click="editor.chain().focus().toggleOrderedList().run()"
                :class="{ 'is-active': editor.isActive('orderedList') }"
              >
                <font-awesome-icon icon="fa-list-ol" class="m-r-4" />
                List
              </button>

              <button type="button" @click="setLink">
                <font-awesome-icon icon="fa-link" class="m-r-4" />
                Link
              </button>
            </div>

            <EditorContent :editor="editor" />

            <p class="error-text m-t-8" v-if="displayErrors.content">
              {{ displayErrors.content }}
            </p>
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
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import * as yup from 'yup';

/* TipTap */
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import FormSection from '@/components/common/FormSection.vue';
import FormCheckboxField from '@/components/common/FormCheckboxField.vue';
import FormDateRangeField from '@/components/common/FormDateRangeField.vue';
import UploadDropzone from '@/components/common/UploadDropzone.vue';
import ImageCropDialog from '@/components/common/ImageCropDialog.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { useDialogStore } from '@/stores';
import { useNewsStore } from '@/stores/news/useNewsStore';

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
const dialogStore = useDialogStore();
const newsStore = useNewsStore();

const isEdit = computed(() => Boolean(route.params.id));
const id = computed(() => String(route.params.id || ''));

/** 是否已按過送出 */
const isSubmitted = ref(false);

/** 只有送出後才顯示錯誤 */
const displayErrors = computed<Record<string, string | undefined>>(() => {
  if (!isSubmitted.value) return {};
  return errors.value;
});

/** 選項 */
const statusOptions: SelectOption[] = [
  { label: '草稿（DRAFT）', value: 'DRAFT' },
  { label: '上架（PUBLISHED）', value: 'PUBLISHED' },
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
  endTime: yup.string().nullable(),
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

/** TipTap editor */
const editor = useEditor({
  extensions: [StarterKit, Link.configure({ openOnClick: false }), Image],
  content: '',
  onUpdate({ editor: instance }) {
    content.value = instance.getHTML();
  },
});

const setLink = () => {
  const previousUrl = editor.value?.getAttributes('link').href ?? '';
  const url = window.prompt('請輸入連結 URL', previousUrl);

  if (url === null) return;

  if (url === '') {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }

  editor.value
    ?.chain()
    .focus()
    .extendMarkRange('link')
    .setLink({ href: url })
    .run();
};

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

/* crop */
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
  editor.value?.destroy();
});

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

      if (editor.value && data?.content) {
        editor.value.commands.setContent(data.content, { emitUpdate: false });
      }
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

watch(
  () => editor.value,
  (instance) => {
    if (instance && content.value) {
      instance.commands.setContent(content.value, { emitUpdate: false });
    }
  },
  { once: true },
);

const syncPreviewFromUrl = () => {
  imagePreview.value = imageUrl.value || '';
};

const clearImage = () => {
  imageUrl.value = '';
  imagePreview.value = '';
  clearSelectedFileUi();
};

/* 選檔：先驗檔 -> 開裁切 */
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

/* 裁切確認 -> 上傳 */
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
    fn: async () => uploadNewsImage(croppedFile),
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
  });
};

/* submit */
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
.news-form {
  &__image-preview {
    img {
      max-width: 240px;
      border-radius: 8px;
    }
  }

  &__editor-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 4px;

    button {
      padding: 4px 10px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: #f9fafb;
      cursor: pointer;
      font-size: 13px;

      &.is-active {
        background: #6366f1;
        color: #ffffff;
        border-color: #6366f1;
      }
    }
  }

  :deep(.ProseMirror) {
    min-height: 260px;
    padding: 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    outline: none;
  }

  :deep(.ProseMirror:focus) {
    border-color: #6366f1;
  }
}
</style>

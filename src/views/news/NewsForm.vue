<!-- src/views/news/NewsForm.vue -->
<template>
  <MCard>
    <form @submit.prevent="onSubmit">
      <p class="form__text form__text--title">
        最新消息 {{ isEdit ? '編輯' : '新增' }}
      </p>

      <!-- 標題 / 分類 -->
      <div class="flex flex-wrap">
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="標題"
            v-model="title"
            :error="errors.title"
            placeholder="請輸入最新消息標題"
          />
        </div>
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="分類"
            v-model="category"
            :options="categoryOptions"
            :error="errors.category"
          />
        </div>
      </div>

      <!-- 重要程度 / 狀態 -->
      <div class="flex flex-wrap">
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="重要程度"
            v-model="isImportant"
            :options="importantOptions"
            :error="errors.isImportant"
          />
        </div>
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
              label="發布時間（留空=立即）"
              v-model="scheduledAt"
              :error="errors.scheduledAt"
              type="datetime-local"
              placeholder="可不填"
            />
          </div>

          <div class="w-50 p-6">
            <FormInput
              label="下架時間（可選）"
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

      <!-- 內容（TipTap） -->
      <div class="flex flex-wrap">
        <div class="w-100 p-6">
          <p class="form__text form__text--red">內容</p>

          <div class="tiptap-toolbar" v-if="editor">
            <button
              type="button"
              @click="editor.chain().focus().toggleBold().run()"
              :class="{ 'is-active': editor.isActive('bold') }"
            >B</button>
            <button
              type="button"
              @click="editor.chain().focus().toggleItalic().run()"
              :class="{ 'is-active': editor.isActive('italic') }"
            >I</button>
            <button
              type="button"
              @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
              :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
            >H2</button>
            <button
              type="button"
              @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
              :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
            >H3</button>
            <button
              type="button"
              @click="editor.chain().focus().toggleBulletList().run()"
              :class="{ 'is-active': editor.isActive('bulletList') }"
            >• List</button>
            <button
              type="button"
              @click="editor.chain().focus().toggleOrderedList().run()"
              :class="{ 'is-active': editor.isActive('orderedList') }"
            >1. List</button>
            <button type="button" @click="setLink">Link</button>
          </div>

          <EditorContent :editor="editor" />

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

const importantOptions = [
  { label: '一般消息', value: false },
  { label: '重要消息 ⭐', value: true },
];

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
  category: yup.string().required('請選擇分類'),
  isImportant: yup.mixed().nullable(),
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
    category: 'ANNOUNCEMENT',
    isImportant: false as boolean | string,
    status: 'DRAFT',
    imageUrl: '',
    content: '',
    scheduledAt: '',
    endTime: '',
  },
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
  extensions: [
    StarterKit,
    Link.configure({ openOnClick: false }),
    Image,
  ],
  content: '',
  onUpdate({ editor: e }) {
    content.value = e.getHTML();
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
onMounted(async () => {
  if (!isEdit.value) return;

  await executeApi({
    fn: async () => getNewsById(route.params.id as string),
    onSuccess: (data) => {
      const d: any = data;

      setValues({
        title: d.title ?? '',
        category: d.category ?? 'ANNOUNCEMENT',
        isImportant: d.isImportant ?? false,
        status: d.status ?? 'DRAFT',
        imageUrl: d.imageUrl ?? '',
        content: d.content ?? '',
        scheduledAt: toDateTimeLocalValue(d.scheduledAt),
        endTime: toDateTimeLocalValue(d.endTime),
      });

      imagePreview.value = d.imageUrl ?? '';

      if (editor.value && d.content) {
        editor.value.commands.setContent(d.content, false);
      }
    },
  });
});

/* Keep vee-validate content field in sync when editor is set externally */
watch(
  () => editor.value,
  (e) => {
    if (e && content.value) {
      e.commands.setContent(content.value, false);
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
};

/* 選檔：先驗檔 -> 開裁切 */
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

/* 裁切確認 -> 上傳 */
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
    category: values.category,
    isImportant: values.isImportant === true || values.isImportant === 'true',
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
:deep(.ProseMirror) {
  min-height: 260px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 12px;
  outline: none;
}
:deep(.ProseMirror:focus) {
  border-color: #6366f1;
}

.tiptap-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}

.tiptap-toolbar button {
  padding: 4px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #f9fafb;
  cursor: pointer;
  font-size: 13px;
}

.tiptap-toolbar button.is-active {
  background: #6366f1;
  color: #fff;
  border-color: #6366f1;
}
</style>

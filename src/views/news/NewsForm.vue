<!-- src/views/news/NewsForm.vue -->
<template>
  <MCard>
    <form @submit.prevent="onSubmit">
      <p class="form__text form__text--title">
        最新消息 {{ isEdit ? '編輯' : '新增' }}
      </p>

      <div class="flex flex-wrap">
        <!-- 標題 -->
        <div class="w-100 p-6">
          <FormInput
            label="標題"
            v-model="title"
            :error="errors.title"
            placeholder="請輸入最新消息標題"
          />
        </div>

        <!-- 狀態 -->
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="狀態"
            v-model="status"
            :options="statusOptions"
            :error="errors.status"
          />
        </div>

        <!-- 排序 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="排序（orderNum）"
            v-model="orderNum"
            :error="errors.orderNum"
            type="number"
            placeholder="數字越小越前面"
          />
        </div>

        <!-- 封面圖 -->
        <div class="w-100 p-6">
          <FormInput
            label="封面圖片（上傳到 S3 後回填 coverImageUrl）"
            type="file"
            accept="image/*"
            @change="onFileChange"
            :error="errors.coverImageUrl"
          />

          <div class="m-t-12">
            <FormInput
              label="封面圖片 URL（可直接貼）"
              v-model="coverImageUrl"
              :error="errors.coverImageUrl"
              placeholder="https://example.com/news.jpg（或上方上傳會自動回填）"
              @blur="syncPreviewFromUrl"
            />
          </div>

          <div class="flex gap-x-12 m-t-12" v-if="coverImageUrl">
            <MButton
              type="button"
              class="mbtn--gray"
              :disabled="uploading"
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

        <!-- 摘要 -->
        <div class="w-100 p-6">
          <FormInput
            label="摘要（summary）"
            v-model="summary"
            :error="errors.summary"
            placeholder="可不填"
          />
        </div>

        <!-- ✅ 內容（CKEditor） -->
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
        <MButton type="button" class="mbtn--gray" @click="fillMockData">
          快速產生資料
        </MButton>

        <MButton type="submit" :disabled="uploading">
          {{ isEdit ? '更新' : '新增' }}
        </MButton>

        <MButton type="button" class="mbtn--red" @click="router.back()">
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

/* CKEditor */
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Ckeditor } from '@ckeditor/ckeditor5-vue';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';

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

/** 狀態（依你的後端 enum 調整） */
const statusOptions: SelectOption[] = [
  { label: '草稿（DRAFT）', value: 'DRAFT' },
  { label: '上架（PUBLISHED）', value: 'PUBLISHED' },
  { label: '下架（ARCHIVED）', value: 'ARCHIVED' },
];

/** CKEditor 設定（可按需加 toolbar、圖片等） */
const editorConfig = {
  placeholder: '請輸入內容...',
  toolbar: [
    'heading',
    '|',
    'bold',
    'italic',
    'underline',
    'link',
    '|',
    'bulletedList',
    'numberedList',
    '|',
    'blockQuote',
    'insertTable',
    '|',
    'undo',
    'redo',
  ],
};

/** schema（欄位請依你的 NewsCreateReq/NewsUpdateReq 調整） */
const schema = yup.object({
  title: yup.string().required('請輸入標題'),
  status: yup.string().required('請選擇狀態'),
  orderNum: yup
    .number()
    .typeError('排序必須是數字')
    .nullable()
    .transform((v, o) =>
      o === '' || o === null || o === undefined ? null : v
    ),
  coverImageUrl: yup.string().required('封面圖片 URL 不能為空'),
  summary: yup.string().nullable(),
  content: yup.string().required('請輸入內容'),
});

const { errors, handleSubmit, setValues, defineField } = useForm({
  validationSchema: schema,
  initialValues: {
    title: '',
    status: 'DRAFT',
    orderNum: null as number | null,
    coverImageUrl: '',
    summary: '',
    content: '',
  },
});

const [title] = defineField('title');
const [status] = defineField('status');
const [orderNum] = defineField('orderNum');
const [coverImageUrl] = defineField('coverImageUrl');
const [summary] = defineField('summary');
const [content] = defineField('content');

const imagePreview = ref('');
const uploading = ref(false);

onMounted(async () => {
  if (!isEdit.value) return;

  await executeApi({
    fn: async () => getNewsById(route.params.id as string),
    onSuccess: (data) => {
      const d: any = data;

      setValues({
        title: d.title ?? '',
        status: d.status ?? 'DRAFT',
        orderNum: d.orderNum ?? null,
        coverImageUrl: d.coverImageUrl ?? d.imageUrl ?? '',
        summary: d.summary ?? '',
        content: d.content ?? '',
      });

      imagePreview.value = d.coverImageUrl ?? d.imageUrl ?? '';
    },
  });
});

const syncPreviewFromUrl = () => {
  imagePreview.value = coverImageUrl.value || '';
};

const clearImage = () => {
  coverImageUrl.value = '';
  imagePreview.value = '';
};

const onFileChange = async (evt: Event) => {
  const input = evt.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '圖片大小不可超過 5MB',
      iconType: 'warning',
    });
    input.value = '';
    return;
  }
  if (!file.type.startsWith('image/')) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '請選擇圖片檔案',
      iconType: 'warning',
    });
    input.value = '';
    return;
  }

  uploading.value = true;

  await executeApi<{ imageUrl: string }>({
    fn: async () => uploadNewsImage(file),
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
      coverImageUrl.value = url;
      imagePreview.value = url;

      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '圖片上傳成功',
        iconType: 'success',
      });
    },
    onFinally: () => {
      uploading.value = false;
      input.value = '';
    },
    showSuccessDialog: false,
  });
};

const pad2 = (n: number) => String(n).padStart(2, '0');
const fillMockData = async () => {
  const now = new Date();
  const mockOrder = Math.floor(Math.random() * 20) + 1;

  const mockImg =
    coverImageUrl.value || 'https://picsum.photos/seed/news/1200/630';

  setValues({
    title: `測試最新消息 ${now.getTime()}`,
    status: 'PUBLISHED',
    orderNum: mockOrder,
    coverImageUrl: mockImg,
    summary: '這是一段測試摘要（可不填）',
    content: `<p>測試內容 ${now.getFullYear()}-${pad2(
      now.getMonth() + 1
    )}-${pad2(now.getDate())}</p><p><strong>CKEditor</strong> 內容測試</p>`,
  });

  imagePreview.value = mockImg;

  await dialogStore.openInfoDialog({
    title: '提示訊息',
    message: '已帶入測試資料',
    iconType: 'success',
  });
};

const onSubmit = handleSubmit(async (values) => {
  if (uploading.value) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '圖片上傳中，請稍後再送出',
      iconType: 'warning',
    });
    return;
  }

  const payload = {
    title: values.title,
    status: values.status,
    orderNum: values.orderNum ?? null,
    coverImageUrl: values.coverImageUrl,
    summary: values.summary || '',
    content: values.content, // ✅ CKEditor HTML 字串
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
/* 若你專案已有 .error-text 可移除 */
.error-text {
  color: #d93025;
  font-size: 12px;
}

/* CKEditor 外框微調（避免太貼邊） */
:deep(.ck-editor__editable) {
  min-height: 260px;
}
</style>

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
        <MButton type="button" class="mbtn--gray" @click="fillMockData">
          快速產生資料
        </MButton>

        <MButton
          type="button"
          class="mbtn--gray"
          :disabled="uploading || bulkCreating || cropOpen || isEdit"
          @click="batchCreateMockNews"
        >
          一鍵批量新增（10 筆）
        </MButton>

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

/* mock */
const pad2 = (n: number) => String(n).padStart(2, '0');

const buildRichMockHtml = (seed: string) => {
  return `
    <h2>📣 ${seed}｜系統公告與活動資訊</h2>
    <p>感謝各位玩家的支持！本次更新將帶來更完整的抽獎體驗與穩定性改善。</p>
    <h3>✅ 本次更新重點</h3>
    <ul>
      <li><strong>抽獎流程優化</strong>：提高抽獎畫面反應速度</li>
      <li><strong>儲值方案更新</strong>：付款流程提示更清楚</li>
      <li><strong>賞品盒出貨體驗</strong>：支援批次出貨</li>
    </ul>
    <blockquote>📌 小提醒：若你遇到頁面異常，建議重新整理或稍後再試。</blockquote>
    <table>
      <thead><tr><th>功能</th><th>狀態</th><th>備註</th></tr></thead>
      <tbody>
        <tr><td>抽獎</td><td>正常</td><td>流程優化完成</td></tr>
        <tr><td>儲值</td><td>正常</td><td>付款提示更新</td></tr>
        <tr><td>賞品盒</td><td>正常</td><td>支援批次出貨</td></tr>
      </tbody>
    </table>
    <p>祝你抽到夢想中的大獎！✨</p>
  `;
};

const fillMockData = async () => {
  const now = new Date();
  const mockImg = imageUrl.value || 'https://picsum.photos/seed/news/1200/630';

  const yyyy = now.getFullYear();
  const MM = pad2(now.getMonth() + 1);
  const dd = pad2(now.getDate());
  const hh = pad2(now.getHours());
  const mm = pad2(now.getMinutes());

  setValues({
    title: `測試最新消息 ${now.getTime()}`,
    status: 'PUBLISHED',
    imageUrl: mockImg,
    scheduledAt: `${yyyy}-${MM}-${dd}T${hh}:${mm}`,
    endTime: '',
    content: buildRichMockHtml(`測試公告｜${yyyy}-${MM}-${dd}`),
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

/* batch create */
const batchCreateMockNews = async () => {
  if (uploading.value || cropOpen.value) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: cropOpen.value
        ? '圖片裁切中，請稍後再試'
        : '圖片上傳中，請稍後再試',
      iconType: 'warning',
    });
    return;
  }

  if (isEdit.value) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '目前是編輯模式，批量新增只允許在新增頁使用',
      iconType: 'warning',
    });
    return;
  }

  const count = 10;
  bulkCreating.value = true;

  const ok = await dialogStore.openConfirmDialog({
    title: '批量新增確認',
    message: `即將建立 ${count} 筆最新消息，確定要執行嗎？`,
  });

  if (!ok) {
    bulkCreating.value = false;
    return;
  }

  await executeApi({
    fn: async () => {
      for (let i = 1; i <= count; i++) {
        const now = new Date();
        const seed = `批量公告 #${i}`;

        await createNews({
          title: `${seed}｜${now.getTime()}`,
          status: 'PUBLISHED',
          imageUrl:
            imageUrl.value || `https://picsum.photos/seed/news-${i}/1200/630`,
          content: buildRichMockHtml(seed),
          scheduledAt: null,
          endTime: null,
        });
      }
      return true;
    },
    onSuccess: async () => {
      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: `批量新增完成 ✅ 已建立 ${count} 筆最新消息`,
        iconType: 'success',
      });
      router.push('/home/news');
    },
    onFinally: () => {
      bulkCreating.value = false;
    },
    showSuccessDialog: false,
  });
};
</script>

<style scoped>
:deep(.ck-editor__editable) {
  min-height: 260px;
}
</style>

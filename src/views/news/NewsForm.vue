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

        <!-- 上架時間 scheduledAt -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="上架時間（scheduledAt）"
            v-model="scheduledAt"
            :error="errors.scheduledAt"
            type="datetime-local"
            placeholder="可不填"
          />
        </div>

        <!-- 下架時間 endTime -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="下架時間（endTime）"
            v-model="endTime"
            :error="errors.endTime"
            type="datetime-local"
            placeholder="可不填"
          />
        </div>

        <!-- 封面圖 -->
        <div class="w-100 p-6">
          <FormInput
            label="封面圖片（上傳到 S3 後回填 imageUrl）"
            type="file"
            accept="image/*"
            @change="onFileChange"
            :error="errors.imageUrl"
          />

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
      <!-- bottom button -->
      <div class="flex justify-center m-y-12 gap-x-12">
        <MButton type="button" class="mbtn--gray" @click="fillMockData">
          快速產生資料
        </MButton>

        <!-- ✅ 新增：批量建立 -->
        <MButton
          type="button"
          class="mbtn--gray"
          :disabled="uploading || isEdit"
          @click="batchCreateMockNews"
        >
          一鍵批量新增（10 筆）
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

/** 狀態（依你的後端 NewsCreateReq：DRAFT/PUBLISHED） */
const statusOptions: SelectOption[] = [
  { label: '草稿（DRAFT）', value: 'DRAFT' },
  { label: '上架（PUBLISHED）', value: 'PUBLISHED' },
];

/** CKEditor 設定 */
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

/**
 * ✅ datetime-local <-> LocalDateTime 格式處理
 * datetime-local 會是：YYYY-MM-DDTHH:mm
 * 後端 LocalDateTime 建議送：YYYY-MM-DDTHH:mm:ss
 */
const toLocalDateTime = (v?: string | null) => {
  if (!v) return null;
  // 如果已經有秒數就原樣回傳
  if (v.length >= 19) return v.slice(0, 19);
  // 補上 :00 秒
  return `${v}:00`;
};

/** 後端回來可能是 2026-01-10T10:00:00，datetime-local 只吃到分鐘 */
const toDateTimeLocalValue = (v?: string | null) => {
  if (!v) return '';
  return String(v).slice(0, 16); // YYYY-MM-DDTHH:mm
};

/** schema（依 NewsCreateReq / NewsUpdateReq 調整） */
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
      input.value = '';
    },
    showSuccessDialog: false,
  });
};

const pad2 = (n: number) => String(n).padStart(2, '0');
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
    content: `<p>測試內容 ${yyyy}-${MM}-${dd}</p><p><strong>CKEditor</strong> 內容測試</p>`,
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

  // ✅ 對齊 NewsCreateReq / NewsUpdateReq
  const payload = {
    title: values.title,
    content: values.content, // CKEditor HTML string
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
/** ✅ 產生更豐富的 CKEditor HTML（比原本長很多） */
const buildRichMockHtml = (seed: string) => {
  return `
    <h2>📣 ${seed}｜系統公告與活動資訊</h2>

    <p>
      感謝各位玩家的支持！本次更新將帶來更完整的抽獎體驗與穩定性改善，
      包含伺服器優化、抽獎流程更順暢、以及儲值與賞品盒流程調整。
    </p>

    <h3>✅ 本次更新重點</h3>
    <ul>
      <li><strong>抽獎流程優化</strong>：提高抽獎畫面反應速度，降低等待時間</li>
      <li><strong>儲值方案更新</strong>：新增活動加碼，並改善付款流程提示</li>
      <li><strong>賞品盒出貨體驗</strong>：新增分店彙總與批次出貨功能</li>
      <li><strong>最新消息顯示</strong>：支援封面圖、內容格式完整呈現</li>
    </ul>

    <h3>🕒 活動時間</h3>
    <p>
      活動期間：<strong>即日起 ～ 2026/12/31</strong><br />
      期間內不定期推出限量加碼與特殊賞項，請密切關注最新公告。
    </p>

    <blockquote>
      📌 小提醒：若你遇到頁面異常或載入較慢，建議重新整理或稍後再試。
      我們會持續優化系統穩定性。
    </blockquote>

    <h3>🎁 加碼說明</h3>
    <ol>
      <li>單筆儲值達門檻可獲得額外點數回饋</li>
      <li>指定系列抽獎將提高稀有賞出現機率（依活動規則為準）</li>
      <li>每日首次登入有機會獲得免費抽獎次數</li>
    </ol>

    <h3>📦 出貨資訊</h3>
    <p>
      若你已累積多項實體獎品，可前往「賞品盒」進行出貨。<br />
      出貨時請確認收件資料完整，避免配送失敗。
    </p>

    <table>
      <thead>
        <tr>
          <th>功能</th>
          <th>狀態</th>
          <th>備註</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>抽獎</td>
          <td>正常</td>
          <td>流程優化完成</td>
        </tr>
        <tr>
          <td>儲值</td>
          <td>正常</td>
          <td>付款提示更新</td>
        </tr>
        <tr>
          <td>賞品盒</td>
          <td>正常</td>
          <td>支援批次出貨</td>
        </tr>
      </tbody>
    </table>

    <p>
      若你有任何問題，歡迎透過客服聯絡我們。<br />
      再次感謝你的支持，祝你抽到夢想中的大獎！✨
    </p>
  `;
};

/** ✅ 批量建立 mock 最新消息（一次建立 N 筆） */
const batchCreateMockNews = async () => {
  if (uploading.value) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '圖片上傳中，請稍後再試',
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

  // ✅ 你可以改成 5 / 20
  const count = 10;

  const ok = await dialogStore.openConfirmDialog({
    title: '批量新增確認',
    message: `即將建立 ${count} 筆最新消息，確定要執行嗎？`,
  });

  if (!ok) return;

  // ✅ 建議用「逐筆」送，避免後端瞬間壓力太大
  // 如果你後端扛得住，也可改 Promise.all
  await executeApi({
    fn: async () => {
      for (let i = 1; i <= count; i++) {
        const now = new Date();
        const seed = `批量公告 #${i}`;

        const payload = {
          title: `${seed}｜${now.getTime()}`,
          status: 'PUBLISHED',
          imageUrl:
            imageUrl.value || `https://picsum.photos/seed/news-${i}/1200/630`,
          content: buildRichMockHtml(seed),
          scheduledAt: null,
          endTime: null,
        };

        await createNews(payload);
      }
      return true;
    },
    onSuccess: async () => {
      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: `批量新增完成 ✅ 已建立 ${count} 筆最新消息`,
        iconType: 'success',
      });

      // ✅ 新增完回列表
      router.push('/home/news');
    },

    showSuccessDialog: false,
  });
};
</script>

<style scoped>
.error-text {
  color: #d93025;
  font-size: 12px;
}

:deep(.ck-editor__editable) {
  min-height: 260px;
}
</style>

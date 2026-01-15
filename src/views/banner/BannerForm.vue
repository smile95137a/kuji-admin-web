<!-- src/views/banner/BannerForm.vue -->
<template>
  <MCard>
    <form @submit.prevent="onSubmit">
      <p class="form__text form__text--title">
        Banner {{ isEdit ? '編輯' : '新增' }}
      </p>

      <div class="flex flex-wrap">
        <!-- 店家（改成打 API 的 Select） -->
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
          <p class="form__text m-t-6" v-if="storeLoading">店家選項載入中...</p>
        </div>

        <!-- 標題 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="標題"
            v-model="title"
            :error="errors.title"
            placeholder="請輸入 Banner 標題"
          />
        </div>

        <!-- 排序 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="排序"
            v-model="orderNum"
            :error="errors.orderNum"
            type="number"
            placeholder="數字越小越前面"
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

        <!-- 開始顯示時間 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="開始顯示時間"
            type="datetime-local"
            v-model="startTime"
            :error="errors.startTime"
          />
        </div>

        <!-- 結束顯示時間 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="結束顯示時間"
            type="datetime-local"
            v-model="endTime"
            :error="errors.endTime"
          />
        </div>

        <!-- 圖片 -->
        <div class="w-100 p-6">
          <FormInput
            label="圖片（上傳到 S3 後回填 imageUrl）"
            type="file"
            accept="image/*"
            @change="onFileChange"
            :error="errors.imageUrl"
          />

          <!-- 也允許直接貼 URL -->
          <div class="m-t-12">
            <FormInput
              label="圖片 URL（可直接貼）"
              v-model="imageUrl"
              :error="errors.imageUrl"
              placeholder="https://example.com/banner.jpg（或上方上傳會自動回填）"
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

      <!-- bottom button -->
      <div class="flex justify-center m-y-12 gap-x-12">
        <MButton type="button" class="mbtn--gray" @click="fillMockData">
          快速產生資料
        </MButton>

        <!-- ✅ 批量新增 -->
        <MButton
          type="button"
          class="mbtn--gray"
          :disabled="isEdit || uploading || bulkCreating"
          @click="bulkCreateMockBanners"
        >
          批量新增 15 筆
        </MButton>

        <MButton type="submit" :disabled="uploading || bulkCreating">
          {{ isEdit ? '更新' : '新增' }}
        </MButton>

        <MButton type="button" class="mbtn--red" @click="router.back()">
          返回
        </MButton>
      </div>

      <p class="form__text m-t-6" v-if="bulkCreating">批量新增中...</p>
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

import { executeApi } from '@/utils/executeApiUtils';
import { useDialogStore } from '@/stores';

import {
  getBannerById,
  createBanner,
  updateBanner,
} from '@/services/adminBannerService';
import { uploadBannerImage } from '@/services/adminUploadService';
import { getStoreOptions } from '@/services/adminStoreService';

/* Setup */
const route = useRoute();
const router = useRouter();
const dialogStore = useDialogStore();

const isEdit = computed(() => Boolean(route.params.id));

/* 狀態選單（對齊後端：PUBLISHED/UNPUBLISHED） */
const statusOptions: SelectOption[] = [
  { label: '下架', value: 'UNPUBLISHED' },
  { label: '上架', value: 'PUBLISHED' },
];

/* 店家選項 */
const storeOptions = ref<SelectOption[]>([]);
const storeLoading = ref(false);

const mapEnumOptionsToSelect = (list: any[] = []): SelectOption[] => {
  return list.map((x) => ({
    label: x?.label ?? '',
    value: x?.value ?? '',
    ...(x?.description ? { description: x.description } : {}),
  }));
};

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
  storeLoading.value = true;

  await executeApi<any[]>({
    fn: async () => getStoreOptions({ activeOnly: true }),
    onSuccess: (data) => {
      storeOptions.value = mapEnumOptionsToSelect(
        Array.isArray(data) ? data : []
      );
      ensureStoreOptionExists(storeId.value);
    },
    onFinally: () => {
      storeLoading.value = false;
    },
    showFailDialog: true,
    showCatchDialog: true,
  });
};

/* schema（對齊 BannerCreateReq） */
const schema = yup.object({
  storeId: yup.string().required('店家不能為空'),
  title: yup.string().required('請輸入標題'),
  imageUrl: yup.string().required('圖片 URL 不能為空'),
  orderNum: yup
    .number()
    .typeError('排序必須是數字')
    .nullable()
    .transform((v, o) =>
      o === '' || o === null || o === undefined ? null : v
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

/* 預覽圖 */
const imagePreview = ref('');

/* 上傳狀態 */
const uploading = ref(false);

/* 批量新增狀態 */
const bulkCreating = ref(false);

/* datetime-local: 送出時補秒 / 載入時裁秒（避免 input 不吃秒） */
const normalizeToBackendLocalDateTime = (v?: string | null) => {
  if (!v) return null;
  if (v.length === 16) return `${v}:00`;
  return v;
};
const normalizeToDatetimeLocalInput = (v?: string | null) => {
  if (!v) return '';
  return v.length >= 16 ? v.slice(0, 16) : v;
};

/* 編輯模式載入資料（GET /admin/banner/{id}） */
onMounted(async () => {
  // 1) 先載入店家選單
  await loadStoreOptions();

  // 2) 再載入 banner（若為 edit）
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
        startTime: normalizeToDatetimeLocalInput(d.startTime),
        endTime: normalizeToDatetimeLocalInput(d.endTime),
      });

      imagePreview.value = d.imageUrl ?? '';
      ensureStoreOptionExists(d.storeId ?? '');
    },
  });
});

/** 手動貼 URL 後同步預覽 */
const syncPreviewFromUrl = () => {
  imagePreview.value = imageUrl.value || '';
};

/** 清除圖片 */
const clearImage = () => {
  imageUrl.value = '';
  imagePreview.value = '';
};

/**
 * ✅ 選檔後上傳到 S3 → 回填 imageUrl（URL）
 */
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
    fn: async () => uploadBannerImage(file),
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
      input.value = '';
    },
    showSuccessDialog: false,
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

/* ✅ 批量新增 15 筆 */
const bulkCreateMockBanners = async () => {
  if (isEdit.value) return;

  if (uploading.value) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '圖片上傳中，請稍後再操作批量新增',
      iconType: 'warning',
    });
    return;
  }

  // 先決定 storeId（優先用目前選的）
  const pickedStoreId =
    storeId.value || storeOptions.value.find((o) => o.value)?.value || '';

  if (!pickedStoreId) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '請先選擇店家（storeId）後再批量新增',
      iconType: 'warning',
    });
    return;
  }

  const ok = await dialogStore.openConfirmDialog({
    title: '批量新增確認',
    message: '確定要批量新增 15 筆 Banner 測試資料嗎？',
  });
  if (!ok) return;

  bulkCreating.value = true;

  const now = new Date();
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const start = toDatetimeLocal(now);
  const end = toDatetimeLocal(twoWeeksLater);

  // orderNum 基準（避免全部一樣）
  const baseOrder =
    typeof orderNum.value === 'number' && !Number.isNaN(orderNum.value)
      ? Number(orderNum.value)
      : Math.floor(Math.random() * 30) + 1;

  // 產生 15 筆 payload
  const count = 15;
  const tasks = Array.from({ length: count }).map((_, i) => {
    const idx = i + 1;

    const payload = {
      storeId: pickedStoreId,
      title: `批量 Banner #${idx}｜${Date.now()}`,
      imageUrl: `https://picsum.photos/seed/banner-${Date.now()}-${idx}/1200/600`,
      orderNum: baseOrder + i,
      status: 'PUBLISHED',
      startTime: normalizeToBackendLocalDateTime(start),
      endTime: normalizeToBackendLocalDateTime(end),
    };

    return createBanner(payload);
  });

  try {
    const results = await Promise.allSettled(tasks);
    const okCount = results.filter((x) => x.status === 'fulfilled').length;
    const failCount = results.length - okCount;

    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message:
        failCount > 0
          ? `批量新增完成：成功 ${okCount}、失敗 ${failCount}`
          : `批量新增完成：成功 ${okCount}`,
      iconType: failCount > 0 ? 'warning' : 'success',
    });

    // 新增完直接回列表
    router.push('/home/banner');
  } catch (e) {
    console.error(e);
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '批量新增失敗，請稍後再試',
      iconType: 'warning',
    });
  } finally {
    bulkCreating.value = false;
  }
};

/* 提交（對齊 BannerCreateReq / BannerUpdateReq） */
const onSubmit = handleSubmit(async (values) => {
  if (uploading.value || bulkCreating.value) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '操作進行中，請稍後再送出',
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
      message: '請上傳或輸入圖片 URL',
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
    startTime: normalizeToBackendLocalDateTime(values.startTime),
    endTime: normalizeToBackendLocalDateTime(values.endTime),
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

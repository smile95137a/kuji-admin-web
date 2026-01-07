<!-- src/views/lottery/LotteryForm.vue -->
<template>
  <MCard>
    <form @submit.prevent="onSubmit">
      <p class="form__text form__text--title">
        {{ isEdit ? '商品編輯' : '商品新增' }}
      </p>

      <div class="flex flex-wrap">
        <!-- 店家（跟 BannerForm 一樣：下拉選單 + API 載入） -->
        <div class="w-50 w-md-100 p-6" v-if="showStoreSelect">
          <FormSelect
            label="店家"
            v-model="storeId"
            :options="storeOptions"
            :error="errors.storeId"
            :showAll="true"
            allLabel="請選擇"
            :allValue="''"
            :disabled="storeLoading"
          />
          <p class="form__text m-t-6" v-if="storeLoading">店家選項載入中...</p>
          <p class="form__text m-t-6" v-else-if="isAdmin && !isEdit">
            Admin 新增時必須選擇店家（後端要求 storeId）
          </p>
          <p class="form__text m-t-6" v-else>
            非 Admin 不選也可（後端會自動帶入店家）
          </p>
        </div>

        <!-- 商品名稱 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="商品名稱"
            v-model="title"
            :error="errors.title"
            placeholder="鬼滅之刃一番賞"
          />
        </div>

        <!-- 分類 -->
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="商品分類"
            v-model="category"
            :options="categoryOptions"
            :error="errors.category"
          />
        </div>

        <!-- 自製賞子類型（CUSTOM_GACHA 才顯示/必填） -->
        <div class="w-50 w-md-100 p-6" v-if="category === 'CUSTOM_GACHA'">
          <FormSelect
            label="自製賞子類型"
            v-model="subCategory"
            :options="subCategoryOptions"
            :error="errors.subCategory"
          />
        </div>

        <!-- 每抽價格 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="每抽價格"
            type="number"
            v-model="pricePerDraw"
            :error="errors.pricePerDraw"
            placeholder="650"
          />
        </div>

        <!-- 折扣價 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="大獎售完折扣價（可選）"
            type="number"
            v-model="discountedPrice"
            :error="errors.discountedPrice"
            placeholder="500"
          />
        </div>

        <!-- 自動降價 -->
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="是否啟用自動降價"
            v-model="autoDiscountEnabled"
            :options="booleanOptions"
            :error="errors.autoDiscountEnabled"
          />
        </div>

        <!-- 允許多抽 -->
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="是否允許多抽"
            v-model="allowMultiDraw"
            :options="booleanOptions"
            :error="errors.allowMultiDraw"
          />
        </div>

        <!-- 多抽選項（allowMultiDraw=true 才顯示） -->
        <div class="w-100 p-6" v-if="allowMultiDraw === 'true'">
          <FormInput
            label="多抽選項（逗號分隔）"
            v-model="multiDrawOptionsText"
            :error="errors.multiDrawOptionsText"
            placeholder="例如：10,50"
          />
          <p class="form__text m-t-6">送出會自動轉成 [10, 50]</p>
        </div>

        <!-- 圖片 URL -->
        <div class="w-100 p-6">
          <FormInput
            label="商品主圖 URL（可選）"
            v-model="imageUrl"
            :error="errors.imageUrl"
            placeholder="https://example.com/images/kimetsu.jpg"
            @blur="syncPreviewFromUrl"
          />
          <div v-if="imagePreview" class="m-t-12">
            <img
              :src="imagePreview"
              alt="preview"
              style="max-width: 240px; border-radius: 8px"
            />
          </div>
        </div>

        <!-- 描述 -->
        <div class="w-100 p-6">
          <FormInput
            label="商品詳細描述（可選）"
            type="textarea"
            v-model="description"
            :error="errors.description"
            placeholder="限量發售的鬼滅之刃一番賞，共有 A~G 獎項"
          />
        </div>

        <!-- 定時上架時間 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="定時上架時間（可選）"
            type="datetime-local"
            v-model="scheduledAt"
            :error="errors.scheduledAt"
          />
        </div>

        <!-- 活動開始時間 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="活動開始時間（可選）"
            type="datetime-local"
            v-model="startTime"
            :error="errors.startTime"
          />
        </div>

        <!-- 活動結束時間 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="活動結束時間（可選）"
            type="datetime-local"
            v-model="endTime"
            :error="errors.endTime"
          />
        </div>

        <!-- 總抽數 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="總抽數上限（0=無限制）"
            type="number"
            v-model="maxDraws"
            :error="errors.maxDraws"
            placeholder="80"
          />
        </div>

        <!-- 排序 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="顯示排序（越小越前）"
            type="number"
            v-model="orderNum"
            :error="errors.orderNum"
            placeholder="1"
          />
        </div>

        <!-- 權重 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="推薦權重"
            type="number"
            v-model="weight"
            :error="errors.weight"
            placeholder="10"
          />
        </div>

        <!-- 內部備註 -->
        <div class="w-100 p-6">
          <FormInput
            label="內部備註（不對外顯示，可選）"
            type="textarea"
            v-model="remark"
            :error="errors.remark"
            placeholder="這批貨進價較高"
          />
        </div>

        <!-- 編輯模式：顯示目前狀態 -->
        <div class="w-50 w-md-100 p-6" v-if="isEdit">
          <FormInput
            label="目前狀態"
            :modelValue="statusText(detail)"
            disabled
          />
        </div>
      </div>

      <!-- bottom button -->
      <div class="flex justify-center m-y-12 gap-x-12 flex-wrap">
        <MButton type="button" class="mbtn--gray" @click="fillMockData">
          快速產生資料
        </MButton>

        <MButton type="submit">
          {{ isEdit ? '更新' : '新增' }}
        </MButton>

        <MButton
          v-if="isEdit"
          :disabled="detail?.status === 'ON_SHELF'"
          @click="doOnShelf"
        >
          上架
        </MButton>

        <MButton
          v-if="isEdit"
          :disabled="detail?.status === 'OFF_SHELF'"
          @click="doOffShelf"
        >
          下架
        </MButton>

        <MButton v-if="isEdit" class="mbtn--red" @click="doDelete">
          刪除
        </MButton>

        <MButton type="button" class="mbtn--red" @click="router.back()">
          返回
        </MButton>
      </div>
    </form>
  </MCard>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import * as yup from 'yup';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { useDialogStore, useAuthStore } from '@/stores';

import {
  createLottery,
  updateLottery,
  getLotteryById,
  deleteLottery,
  onShelfLottery,
  offShelfLottery,
} from '@/services/AdminLotteryService';

// ✅ 跟 BannerForm 一樣
import { getStoreOptions } from '@/services/adminStoreService';

/* Setup */
const route = useRoute();
const router = useRouter();
const dialogStore = useDialogStore();
const authStore = useAuthStore();

const isEdit = computed(() => Boolean(route.params.id));
const id = computed(() => String(route.params.id || ''));

/** 判斷是否 Admin */
const isAdmin = computed(() => {
  const roles = authStore.user?.roles || authStore.user?.authorities || [];
  const codes = Array.isArray(roles)
    ? roles.map((r: any) => r?.code || r).filter(Boolean)
    : [roles];
  return codes.some(
    (x: any) => String(x).includes('ROLE_ADMIN') || String(x).includes('ADMIN')
  );
});

/** 這裡讓所有人都看得到下拉（你說要跟 Banner 一樣） */
const showStoreSelect = computed(() => true);

/* ===== 店家選項（跟 BannerForm 同款） ===== */
const storeOptions = ref<SelectOption[]>([]);
const storeLoading = ref(false);

const mapEnumOptionsToSelect = (list: any[] = []): SelectOption[] => {
  return list.map((x) => ({
    label: x?.label ?? x?.storeName ?? '',
    value: x?.value ?? x?.id ?? '',
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

      // 如果目前已有 storeId（例如 edit），確保 select 不會空白
      ensureStoreOptionExists(storeId.value);

      // 新增時：如果不是 admin，預設選第一筆（純 UX，後端就算不選也能自動帶）
      if (!isEdit.value && !isAdmin.value && !storeId.value) {
        const first = storeOptions.value.find((o) => o.value)?.value;
        if (first) storeId.value = first;
      }
    },
    onFinally: () => {
      storeLoading.value = false;
    },
    showFailDialog: true,
    showCatchDialog: true,
  });
};

/* ===== Select options ===== */
const categoryOptions: SelectOption[] = [
  { label: '官方一番賞', value: 'OFFICIAL_ICHIBAN' },
  { label: '扭蛋', value: 'GACHA' },
  { label: '卡牌', value: 'TRADING_CARD' },
  { label: '自製賞', value: 'CUSTOM_GACHA' },
];

const subCategoryOptions: SelectOption[] = [
  { label: '抽籤型（LOTTERY_MODE）', value: 'LOTTERY_MODE' },
  { label: '刮刮樂型（SCRATCH_MODE）', value: 'SCRATCH_MODE' },
];

const booleanOptions: SelectOption[] = [
  { label: '否', value: 'false' },
  { label: '是', value: 'true' },
];

/* helpers */
const parseMultiDrawOptions = (text: string): number[] => {
  const raw = String(text || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  const nums = raw
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n) && n > 0);
  return Array.from(new Set(nums)).sort((a, b) => a - b);
};

// datetime-local: 送出補秒 / 載入裁秒
const normalizeToBackendLocalDateTime = (v?: string | null) => {
  if (!v) return null;
  return v.length === 16 ? `${v}:00` : v;
};
const normalizeToDatetimeLocalInput = (v?: string | null) => {
  if (!v) return '';
  return v.length >= 16 ? v.slice(0, 16) : v;
};

const statusText = (row: any) => {
  const s = row?.status;
  return s === 'ON_SHELF' ? '上架' : s === 'OFF_SHELF' ? '下架' : s || '-';
};

/* schema（含：Admin 新增需選店家 + 條件式驗證） */
const schema = yup
  .object({
    storeId: yup.string().nullable(),

    title: yup
      .string()
      .required('商品名稱不可為空')
      .max(255, '商品名稱最多255字'),
    description: yup.string().nullable(),
    imageUrl: yup.string().nullable(),

    category: yup
      .string()
      .oneOf(['OFFICIAL_ICHIBAN', 'GACHA', 'TRADING_CARD', 'CUSTOM_GACHA'])
      .required('商品分類不可為空'),

    subCategory: yup.string().nullable(),

    pricePerDraw: yup
      .number()
      .typeError('每抽價格不可為空')
      .required('每抽價格不可為空')
      .min(0, '價格不可為負數'),

    discountedPrice: yup
      .number()
      .transform((v, o) =>
        o === '' || o === null || o === undefined ? null : v
      )
      .nullable()
      .min(0, '折扣價不可為負數'),

    autoDiscountEnabled: yup
      .string()
      .oneOf(['true', 'false'])
      .required('請選擇是否自動降價'),
    allowMultiDraw: yup
      .string()
      .oneOf(['true', 'false'])
      .required('請選擇是否允許多抽'),
    multiDrawOptionsText: yup.string().nullable(),

    scheduledAt: yup.string().nullable(),
    startTime: yup.string().nullable(),
    endTime: yup.string().nullable(),

    maxDraws: yup
      .number()
      .transform((v, o) => (o === '' || o === null || o === undefined ? 0 : v))
      .min(0, '抽數上限不可為負數'),

    orderNum: yup
      .number()
      .transform((v, o) =>
        o === '' || o === null || o === undefined ? null : v
      )
      .nullable(),

    weight: yup
      .number()
      .transform((v, o) =>
        o === '' || o === null || o === undefined ? null : v
      )
      .nullable(),

    remark: yup.string().nullable(),
  })
  .test('subCategory-required', '自製賞必須選擇子類型', (values: any) => {
    if (values?.category !== 'CUSTOM_GACHA') return true;
    return Boolean(String(values?.subCategory || '').trim());
  })
  .test(
    'multiDrawOptions-required',
    '允許多抽時，多抽選項必填',
    (values: any) => {
      if (values?.allowMultiDraw !== 'true') return true;
      return (
        parseMultiDrawOptions(values?.multiDrawOptionsText || '').length > 0
      );
    }
  )
  .test(
    'admin-storeId-required',
    'Admin 新增商品時必須指定店家',
    (values: any) => {
      if (isEdit.value) return true;
      if (!isAdmin.value) return true;
      return Boolean(String(values?.storeId || '').trim());
    }
  );

/* useForm */
const { errors, handleSubmit, setValues, defineField } = useForm({
  validationSchema: schema,
  initialValues: {
    storeId: '',
    title: '',
    description: '',
    imageUrl: '',
    category: 'OFFICIAL_ICHIBAN',
    subCategory: '',
    pricePerDraw: '' as any,
    discountedPrice: '' as any,
    autoDiscountEnabled: 'false',
    allowMultiDraw: 'false',
    multiDrawOptionsText: '',
    scheduledAt: '',
    startTime: '',
    endTime: '',
    maxDraws: 0,
    orderNum: '' as any,
    weight: '' as any,
    remark: '',
  },
});

/* defineField（BannerForm 風格） */
const [storeId] = defineField('storeId');
const [title] = defineField('title');
const [description] = defineField('description');
const [imageUrl] = defineField('imageUrl');
const [category] = defineField('category');
const [subCategory] = defineField('subCategory');
const [pricePerDraw] = defineField('pricePerDraw');
const [discountedPrice] = defineField('discountedPrice');
const [autoDiscountEnabled] = defineField('autoDiscountEnabled');
const [allowMultiDraw] = defineField('allowMultiDraw');
const [multiDrawOptionsText] = defineField('multiDrawOptionsText');
const [scheduledAt] = defineField('scheduledAt');
const [startTime] = defineField('startTime');
const [endTime] = defineField('endTime');
const [maxDraws] = defineField('maxDraws');
const [orderNum] = defineField('orderNum');
const [weight] = defineField('weight');
const [remark] = defineField('remark');

/* preview */
const imagePreview = ref('');
const syncPreviewFromUrl = () => {
  imagePreview.value = imageUrl.value || '';
};

/* detail */
const detail = ref<any>(null);

const loadDetail = async () => {
  if (!isEdit.value) return;

  await executeApi({
    fn: async () => getLotteryById(id.value),
    onSuccess: (data) => {
      detail.value = data;

      setValues({
        storeId: data?.storeId ?? '',
        title: data?.title ?? '',
        description: data?.description ?? '',
        imageUrl: data?.imageUrl ?? '',
        category: data?.category ?? 'OFFICIAL_ICHIBAN',
        subCategory: data?.subCategory ?? '',
        pricePerDraw: data?.pricePerDraw ?? '',
        discountedPrice: data?.discountedPrice ?? '',
        autoDiscountEnabled: String(Boolean(data?.autoDiscountEnabled)),
        allowMultiDraw: String(Boolean(data?.allowMultiDraw)),
        multiDrawOptionsText: Array.isArray(data?.multiDrawOptions)
          ? data.multiDrawOptions.join(',')
          : '',
        scheduledAt: normalizeToDatetimeLocalInput(data?.scheduledAt),
        startTime: normalizeToDatetimeLocalInput(data?.startTime),
        endTime: normalizeToDatetimeLocalInput(data?.endTime),
        maxDraws: data?.maxDraws ?? 0,
        orderNum: data?.orderNum ?? '',
        weight: data?.weight ?? '',
        remark: data?.remark ?? '',
      });

      imagePreview.value = data?.imageUrl ?? '';
      ensureStoreOptionExists(data?.storeId ?? '');
    },
  });
};

onMounted(async () => {
  await loadStoreOptions();
  await loadDetail();
});

/** category 切換時清 subCategory */
watch(
  () => category.value,
  (v) => {
    if (v !== 'CUSTOM_GACHA') subCategory.value = '';
  }
);

/* mock */
const fillMockData = async () => {
  const now = Date.now();
  const firstStoreId = storeOptions.value.find((o) => o.value)?.value || '';

  setValues({
    storeId: isAdmin.value ? firstStoreId : firstStoreId,
    title: `測試商品 ${now}`,
    description: '限量發售測試描述',
    imageUrl: 'https://picsum.photos/seed/lottery/1200/600',
    category: 'OFFICIAL_ICHIBAN',
    subCategory: '',
    pricePerDraw: 650,
    discountedPrice: 500,
    autoDiscountEnabled: 'true',
    allowMultiDraw: 'true',
    multiDrawOptionsText: '10,50',
    scheduledAt: '',
    startTime: '',
    endTime: '',
    maxDraws: 80,
    orderNum: 1,
    weight: 10,
    remark: '內部備註測試',
  });

  imagePreview.value = imageUrl.value || '';

  await dialogStore.openInfoDialog({
    title: '提示訊息',
    message: '已帶入測試資料',
    iconType: 'success',
  });
};

/* submit */
const onSubmit = handleSubmit(async (values) => {
  const payload: any = {
    // 非 Admin 就算不選也 OK（後端會帶），但你現在 UI 是下拉，所以會有值
    storeId: values.storeId || null,

    title: values.title,
    description: values.description || null,
    imageUrl: values.imageUrl || null,

    category: values.category,
    subCategory:
      values.category === 'CUSTOM_GACHA' ? values.subCategory || null : null,

    pricePerDraw: Number(values.pricePerDraw),
    discountedPrice:
      values.discountedPrice === '' ||
      values.discountedPrice === null ||
      values.discountedPrice === undefined
        ? null
        : Number(values.discountedPrice),

    autoDiscountEnabled: values.autoDiscountEnabled === 'true',
    allowMultiDraw: values.allowMultiDraw === 'true',
    multiDrawOptions:
      values.allowMultiDraw === 'true'
        ? parseMultiDrawOptions(values.multiDrawOptionsText || '')
        : null,

    scheduledAt: normalizeToBackendLocalDateTime(values.scheduledAt),
    startTime: normalizeToBackendLocalDateTime(values.startTime),
    endTime: normalizeToBackendLocalDateTime(values.endTime),

    maxDraws: Number(values.maxDraws ?? 0),
    orderNum: values.orderNum === '' ? null : Number(values.orderNum),
    weight: values.weight === '' ? null : Number(values.weight),

    remark: values.remark || null,
  };

  if (!isEdit.value) {
    await executeApi({
      fn: async () => createLottery(payload),
      onSuccess: async () => {
        await dialogStore.openInfoDialog({
          title: '提示訊息',
          message: '新增成功',
          iconType: 'success',
        });
        router.push('/home/lottery');
      },
    });
    return;
  }

  await executeApi({
    fn: async () => updateLottery(id.value, payload),
    onSuccess: async () => {
      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '更新成功',
        iconType: 'success',
      });
      router.back();
    },
  });
});

/* 上/下架/刪除 */
const doOnShelf = async () => {
  const ok = await dialogStore.openConfirmDialog({
    title: '上架確認',
    message: '確定要上架此商品嗎？',
  });
  if (!ok) return;

  await executeApi({
    fn: async () => onShelfLottery(id.value),
    onSuccess: async (data) => {
      detail.value = data;
      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '已上架',
        iconType: 'success',
      });
    },
  });
};

const doOffShelf = async () => {
  const ok = await dialogStore.openConfirmDialog({
    title: '下架確認',
    message: '確定要下架此商品嗎？',
  });
  if (!ok) return;

  await executeApi({
    fn: async () => offShelfLottery(id.value),
    onSuccess: async (data) => {
      detail.value = data;
      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '已下架',
        iconType: 'success',
      });
    },
  });
};

const doDelete = async () => {
  const ok = await dialogStore.openConfirmDialog({
    title: '刪除確認',
    message: '確定要刪除此商品嗎？（刪除後無法復原）',
  });
  if (!ok) return;

  await executeApi({
    fn: async () => deleteLottery(id.value),
    onSuccess: async () => {
      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '刪除成功',
        iconType: 'success',
      });
      router.push('/home/lottery');
    },
  });
};
</script>

<style scoped></style>

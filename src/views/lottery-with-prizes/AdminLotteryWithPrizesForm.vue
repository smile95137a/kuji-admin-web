<!-- src/views/admin/lottery-with-prizes/AdminLotteryWithPrizesForm.vue -->
<template>
  <div class="lotteryWithPrizesForm">
    <MCard>
      <div class="lotteryWithPrizesForm__header">
        <p class="lotteryWithPrizesForm__title">
          {{ isEdit ? '編輯商品與獎品' : '新增商品與獎品' }}
        </p>

        <div class="lotteryWithPrizesForm__actions">
          <MButton variant="secondary" @click="goBack">返回</MButton>
          <MButton variant="secondary" @click="fillMockData">假資料</MButton>
          <MButton @click="onSubmit">儲存</MButton>
        </div>
      </div>

      <!-- 商品資訊 -->
      <div class="lotteryWithPrizesForm__section">
        <p class="lotteryWithPrizesForm__sectionTitle">商品資訊</p>

        <div class="lotteryWithPrizesForm__grid">
          <!-- ✅ storeId：改用下拉 -->
          <div class="w-50 w-md-100 p-6">
            <FormSelect
              label="所屬店家"
              v-model="storeId"
              :options="storeOptions"
              :error="errors.storeId"
              :showAll="true"
              allLabel="請選擇"
              :allValue="''"
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="商品名稱"
              v-model="title"
              :error="errors.title"
              required
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormSelect
              label="分類"
              v-model="category"
              :options="categoryOptions"
              :error="errors.category"
              required
            />
          </div>

          <!-- playMode -->
          <div class="w-50 w-md-100 p-6">
            <FormSelect
              label="遊玩模式"
              v-model="playMode"
              :options="playModeOptions"
              :error="errors.playMode"
            />
          </div>

          <!-- subCategory: CUSTOM_GACHA 才顯示 -->
          <div class="w-50 w-md-100 p-6" v-if="category === 'CUSTOM_GACHA'">
            <FormSelect
              label="自製賞子類型（CUSTOM_GACHA）"
              v-model="subCategory"
              :options="playModeOptions"
              :error="errors.subCategory"
              placeholder="LOTTERY_MODE / SCRATCH_MODE"
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormSelect
              label="商品狀態"
              v-model="status"
              :options="statusOptions"
              :error="errors.status"
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="每抽價格"
              v-model="pricePerDraw"
              :error="errors.pricePerDraw"
              type="number"
              required
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="總抽數上限（0=無限制）"
              v-model="maxDraws"
              :error="errors.maxDraws"
              type="number"
            />
          </div>

          <!-- orderNum -->
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="顯示排序（數字越小越前面）"
              v-model="orderNum"
              :error="errors.orderNum"
              type="number"
            />
          </div>

          <!-- hotCount -->
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="熱門程度（熱門標籤用）"
              v-model="hotCount"
              :error="errors.hotCount"
              type="number"
            />
          </div>

          <!-- theme -->
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="主題分類（火影/航海王/鬼滅等）"
              v-model="theme"
              :error="errors.theme"
            />
          </div>

          <div class="w-100 p-6">
            <FormInput
              label="商品主圖 URL"
              v-model="imageUrl"
              :error="errors.imageUrl"
            />
          </div>

          <!-- galleryImages -->
          <div class="w-100 p-6">
            <FormInput
              label="商品圖集（多張圖片 URL，用逗號分隔）"
              v-model="galleryImagesText"
              :error="errors.galleryImagesText"
              placeholder="https://a.jpg, https://b.jpg"
            />
          </div>

          <div class="w-100 p-6">
            <FormInput
              label="商品描述"
              v-model="description"
              :error="errors.description"
              type="textarea"
            />
          </div>

          <!-- content -->
          <div class="w-100 p-6">
            <FormInput
              label="商品詳細內容（可貼活動說明）"
              v-model="content"
              :error="errors.content"
              type="textarea"
              placeholder="【活動說明】&#10;- 單抽 / 多抽&#10;- 注意事項..."
            />
          </div>

          <!-- tags -->
          <div class="w-100 p-6">
            <FormInput
              label="標籤（逗號分隔）"
              v-model="tagsText"
              :error="errors.tagsText"
              placeholder="鬼滅之刃, 一番賞, 熱門"
            />
          </div>

          <!-- remark -->
          <div class="w-100 p-6">
            <FormInput
              label="內部備註（不對外顯示）"
              v-model="remark"
              :error="errors.remark"
              type="textarea"
            />
          </div>

          <!-- scheduledAt / startTime / endTime -->
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="定時上架時間（留空=手動上架）"
              v-model="scheduledAt"
              :error="errors.scheduledAt"
              type="datetime-local"
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="活動開始時間"
              v-model="startTime"
              :error="errors.startTime"
              type="datetime-local"
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="活動結束時間"
              v-model="endTime"
              :error="errors.endTime"
              type="datetime-local"
            />
          </div>

          <!-- discount -->
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="折扣價（大獎售完後）"
              v-model="discountedPrice"
              :error="errors.discountedPrice"
              type="number"
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormSelect
              label="大獎售完自動降價"
              v-model="autoDiscountEnabled"
              :options="boolOptions"
              :error="errors.autoDiscountEnabled"
            />
          </div>

          <!-- multi draw -->
          <div class="w-50 w-md-100 p-6">
            <FormSelect
              label="允許多抽"
              v-model="allowMultiDraw"
              :options="boolOptions"
              :error="errors.allowMultiDraw"
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="多抽選項（逗號分隔，例如：10,50）"
              v-model="multiDrawOptionsText"
              :error="errors.multiDrawOptionsText"
              placeholder="10,50"
            />
          </div>

          <!-- bonus -->
          <div class="w-50 w-md-100 p-6">
            <FormSelect
              label="是否啟用紅利點數"
              v-model="bonusEnabled"
              :options="boolOptions"
              :error="errors.bonusEnabled"
            />
          </div>

          <div class="w-50 w-md-100 p-6" v-if="bonusEnabled">
            <FormInput
              label="每抽贈送紅利點數"
              v-model="bonusPointsPerDraw"
              :error="errors.bonusPointsPerDraw"
              type="number"
            />
          </div>

          <div class="w-50 w-md-100 p-6" v-if="bonusEnabled">
            <FormInput
              label="每抽消耗紅利點數"
              v-model="bonusCostPerDraw"
              :error="errors.bonusCostPerDraw"
              type="number"
            />
          </div>
        </div>
      </div>

      <!-- 獎品清單 -->
      <div class="lotteryWithPrizesForm__section">
        <div class="lotteryWithPrizesForm__sectionHeader">
          <p class="lotteryWithPrizesForm__sectionTitle">獎品清單</p>

          <MButton size="sm" variant="secondary" @click="addPrize">
            + 新增獎品
          </MButton>
        </div>

        <div v-if="prizes.length === 0" class="lotteryWithPrizesForm__empty">
          尚未建立獎品（建議至少新增 1 個）
        </div>

        <div
          v-for="(p, idx) in prizes"
          :key="p._key"
          class="lotteryWithPrizesForm__prizeCard"
        >
          <div class="lotteryWithPrizesForm__prizeTop">
            <p class="lotteryWithPrizesForm__prizeTitle">
              獎品 #{{ idx + 1 }}
              <span v-if="p.id" class="lotteryWithPrizesForm__badge"
                >已存在</span
              >
            </p>

            <MButton size="sm" variant="danger" @click="removePrize(idx)">
              刪除
            </MButton>
          </div>

          <div class="lotteryWithPrizesForm__grid">
            <div class="w-50 w-md-100 p-6">
              <FormInput label="獎品名稱" v-model="p.name" required />
            </div>

            <div class="w-50 w-md-100 p-6">
              <FormSelect
                label="等級"
                v-model="p.level"
                :options="levelOptions"
                placeholder="A / B / C / D / LAST"
              />
            </div>

            <div class="w-50 w-md-100 p-6">
              <FormSelect
                label="獎品類型"
                v-model="p.prizeType"
                :options="prizeTypeOptions"
                placeholder="physical / digital / point"
              />
            </div>

            <div class="w-50 w-md-100 p-6" v-if="p.prizeType === 'point'">
              <FormInput
                label="點數金額（point 類型）"
                v-model="p.pointValue"
                type="number"
              />
            </div>

            <div class="w-50 w-md-100 p-6">
              <FormInput
                label="數量"
                v-model="p.quantity"
                type="number"
                required
              />
            </div>

            <div class="w-50 w-md-100 p-6">
              <FormInput
                label="權重（0=不可抽）"
                v-model="p.weight"
                type="number"
              />
            </div>

            <div class="w-50 w-md-100 p-6">
              <FormInput
                label="顯示排序（數字越小越前面）"
                v-model="p.orderNum"
                type="number"
              />
            </div>

            <div class="w-50 w-md-100 p-6" v-if="playMode === 'SCRATCH_MODE'">
              <FormInput
                label="籤號（刮刮樂模式用）"
                v-model="p.prizeNumber"
                placeholder="01"
              />
            </div>

            <div class="w-100 p-6">
              <FormInput label="獎品圖片 URL" v-model="p.imageUrl" />
            </div>

            <div class="w-100 p-6">
              <FormInput
                label="獎品描述"
                v-model="p.description"
                type="textarea"
              />
            </div>

            <div class="w-50 w-md-100 p-6">
              <FormSelect
                label="是否最後賞"
                v-model="p.isLastPrize"
                :options="boolOptions"
              />
            </div>

            <div class="w-50 w-md-100 p-6">
              <FormSelect
                label="是否大賞（降價觸發）"
                v-model="p.isGrandPrize"
                :options="boolOptions"
              />
            </div>
          </div>
        </div>
      </div>
    </MCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import * as yup from 'yup';
import { useForm } from 'vee-validate';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';

import { useDialogStore } from '@/stores';

// ✅ ✅ ✅ service
import {
  createLotteryWithPrizes,
  updateLotteryWithPrizes,
  getLotteryWithPrizes,
} from '@/services/adminLotteryWithPrizesService';

// ✅ 店家下拉 options（參考 AdminUserForm）
import { getStoreOptions } from '@/services/adminStoreService';

const router = useRouter();
const route = useRoute();
const dialogStore = useDialogStore();

const id = computed(() => route.params.id as string | undefined);
const isEdit = computed(() => !!id.value);

/** ========== options ========== */
const categoryOptions = [
  { label: '官方一番賞', value: 'OFFICIAL_ICHIBAN' },
  { label: '扭蛋', value: 'GACHA' },
  { label: '卡牌', value: 'TRADING_CARD' },
  { label: '自製賞', value: 'CUSTOM_GACHA' },
];

const playModeOptions = [
  { label: '抽籤型（LOTTERY_MODE）', value: 'LOTTERY_MODE' },
  { label: '刮刮樂型（SCRATCH_MODE）', value: 'SCRATCH_MODE' },
];

const statusOptions = [
  { label: '草稿（DRAFT）', value: 'DRAFT' },
  { label: '上架（ON_SHELF）', value: 'ON_SHELF' },
  { label: '下架（OFF_SHELF）', value: 'OFF_SHELF' },
];

const levelOptions = [
  { label: 'A', value: 'A' },
  { label: 'B', value: 'B' },
  { label: 'C', value: 'C' },
  { label: 'D', value: 'D' },
  { label: 'E', value: 'E' },
  { label: 'F', value: 'F' },
  { label: 'G', value: 'G' },
  { label: 'LAST', value: 'LAST' },
  { label: 'GRAND', value: 'GRAND' },
];

const prizeTypeOptions = [
  { label: '實體（physical）', value: 'physical' },
  { label: '數位（digital）', value: 'digital' },
  { label: '點數（point）', value: 'point' },
];

const boolOptions = [
  { label: '是', value: true },
  { label: '否', value: false },
];

/** ========== 店家下拉 ========== */
interface SelectOption {
  label: string;
  value: any;
  description?: string;
}
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
  try {
    const res = await getStoreOptions({ activeOnly: true });
    const data = (res as any)?.data ?? res;
    storeOptions.value = mapEnumOptionsToSelect(
      Array.isArray(data) ? data : []
    );
    ensureStoreOptionExists(storeId.value);
  } catch (e) {
    storeOptions.value = [];
  }
};

/** ========== helpers ========== */
const cleanText = (v: any) => (v === '' ? undefined : v);

const parseCsvText = (text: string) =>
  (text || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const toLocalDateTimeOrUndefined = (v: string) => {
  // ✅ LocalDateTime 最穩：直接送 "YYYY-MM-DDTHH:mm"
  if (!v) return undefined;
  return v;
};

// 轉換： "10, 50" => [10,50]
const parseMultiDrawOptions = (text: string) => {
  if (!text) return [];
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n) && n > 0);
};

/** ========== schema ========== */
const schema = yup.object({
  storeId: yup.string().notRequired(),

  title: yup.string().required('商品名稱不可為空'),
  category: yup.string().required('分類不可為空'),

  playMode: yup.string().notRequired(),
  subCategory: yup.string().notRequired(),
  status: yup.string().notRequired(),

  pricePerDraw: yup
    .number()
    .typeError('每抽價格必須為數字')
    .min(0, '價格不可為負數')
    .required('每抽價格不可為空'),

  maxDraws: yup
    .number()
    .transform((v, o) => (o === '' || o == null ? undefined : v))
    .min(0, '抽數上限不可為負數')
    .notRequired(),

  orderNum: yup
    .number()
    .transform((v, o) => (o === '' || o == null ? undefined : v))
    .min(0, '排序不可為負數')
    .notRequired(),

  hotCount: yup
    .number()
    .transform((v, o) => (o === '' || o == null ? undefined : v))
    .min(0, '熱門程度不可為負數')
    .notRequired(),

  theme: yup.string().notRequired(),

  imageUrl: yup.string().notRequired(),
  galleryImagesText: yup.string().notRequired(),

  description: yup.string().notRequired(),
  content: yup.string().notRequired(),
  tagsText: yup.string().notRequired(),

  remark: yup.string().notRequired(),

  scheduledAt: yup.string().notRequired(),
  startTime: yup.string().notRequired(),
  endTime: yup.string().notRequired(),

  discountedPrice: yup
    .number()
    .transform((v, o) => (o === '' || o == null ? undefined : v))
    .min(0, '折扣價不可為負數')
    .notRequired(),

  autoDiscountEnabled: yup.boolean().notRequired(),
  allowMultiDraw: yup.boolean().notRequired(),
  multiDrawOptionsText: yup.string().notRequired(),

  bonusEnabled: yup.boolean().notRequired(),
  bonusPointsPerDraw: yup
    .number()
    .transform((v, o) => (o === '' || o == null ? undefined : v))
    .min(0, '紅利點數不可為負數')
    .notRequired(),
  bonusCostPerDraw: yup
    .number()
    .transform((v, o) => (o === '' || o == null ? undefined : v))
    .min(0, '紅利消耗不可為負數')
    .notRequired(),
});

/** ========== useForm ========== */
const { defineField, errors, setValues, handleSubmit } = useForm({
  validationSchema: schema,
  initialValues: {
    storeId: '',

    title: '',
    category: 'OFFICIAL_ICHIBAN',
    playMode: 'LOTTERY_MODE',
    subCategory: '',
    status: 'DRAFT',

    pricePerDraw: 0,
    maxDraws: 0,

    orderNum: undefined as any,
    hotCount: undefined as any,
    theme: '',

    imageUrl: '',
    galleryImagesText: '',

    description: '',
    content: '',
    tagsText: '',

    remark: '',

    scheduledAt: '',
    startTime: '',
    endTime: '',

    discountedPrice: undefined as any,
    autoDiscountEnabled: false,

    allowMultiDraw: true,
    multiDrawOptionsText: '10',

    bonusEnabled: false,
    bonusPointsPerDraw: undefined as any,
    bonusCostPerDraw: undefined as any,
  },
});

const [storeId] = defineField('storeId');

const [title] = defineField('title');
const [category] = defineField('category');
const [playMode] = defineField('playMode');
const [subCategory] = defineField('subCategory');
const [status] = defineField('status');

const [pricePerDraw] = defineField('pricePerDraw');
const [maxDraws] = defineField('maxDraws');

const [orderNum] = defineField('orderNum');
const [hotCount] = defineField('hotCount');
const [theme] = defineField('theme');

const [imageUrl] = defineField('imageUrl');
const [galleryImagesText] = defineField('galleryImagesText');

const [description] = defineField('description');
const [content] = defineField('content');
const [tagsText] = defineField('tagsText');

const [remark] = defineField('remark');

const [scheduledAt] = defineField('scheduledAt');
const [startTime] = defineField('startTime');
const [endTime] = defineField('endTime');

const [discountedPrice] = defineField('discountedPrice');
const [autoDiscountEnabled] = defineField('autoDiscountEnabled');

const [allowMultiDraw] = defineField('allowMultiDraw');
const [multiDrawOptionsText] = defineField('multiDrawOptionsText');

const [bonusEnabled] = defineField('bonusEnabled');
const [bonusPointsPerDraw] = defineField('bonusPointsPerDraw');
const [bonusCostPerDraw] = defineField('bonusCostPerDraw');

/** ========== prizes (local state) ========== */
type PrizeFormRow = {
  _key: string;
  id?: string;

  name: string;
  quantity: number;

  description?: string;
  imageUrl?: string;
  level?: string;
  weight?: number;

  prizeNumber?: string;
  prizeType?: string;
  pointValue?: number;

  isLastPrize?: boolean;
  isGrandPrize?: boolean;

  orderNum?: number;
};

const prizes = reactive<PrizeFormRow[]>([]);

const addPrize = () => {
  prizes.push({
    _key: crypto.randomUUID(),
    name: '',
    quantity: 1,
    weight: 1,
    level: 'A',

    prizeType: 'physical',
    pointValue: undefined,

    prizeNumber: '',
    isLastPrize: false,
    isGrandPrize: false,

    orderNum: undefined,
  });
};

const removePrize = (index: number) => prizes.splice(index, 1);

const goBack = () => router.push('/admin/lottery-with-prizes');

const normalizePrizePayload = (p: PrizeFormRow) => {
  return {
    ...(p.id ? { id: p.id } : {}),
    name: cleanText(p.name),
    quantity: Number(p.quantity),

    description: cleanText(p.description),
    imageUrl: cleanText(p.imageUrl),
    level: cleanText(p.level),

    // ⚠️ 你後端 req 沒寫 weight，但你原本有，就先保留（後端若沒用也不會影響）
    weight: p.weight == null ? undefined : Number(p.weight),

    prizeNumber: cleanText(p.prizeNumber),
    prizeType: cleanText(p.prizeType),
    pointValue:
      p.prizeType === 'point' && p.pointValue != null
        ? Number(p.pointValue)
        : undefined,

    isLastPrize: p.isLastPrize ?? false,
    isGrandPrize: p.isGrandPrize ?? false,
    orderNum: p.orderNum == null ? undefined : Number(p.orderNum),
  };
};

/** ========== load detail ========== */
const loadDetail = async () => {
  if (!id.value) return;

  try {
    const res = await getLotteryWithPrizes(id.value);
    const data = (res as any)?.data ?? res;

    setValues({
      storeId: data?.storeId ?? '',

      title: data?.title ?? '',
      category: data?.category ?? 'OFFICIAL_ICHIBAN',
      playMode: data?.playMode ?? 'LOTTERY_MODE',
      subCategory: data?.subCategory ?? '',
      status: data?.status ?? 'DRAFT',

      pricePerDraw: Number(data?.pricePerDraw ?? 0),
      maxDraws: Number(data?.maxDraws ?? 0),

      orderNum: data?.orderNum ?? undefined,
      hotCount: data?.hotCount ?? undefined,
      theme: data?.theme ?? '',

      imageUrl: data?.imageUrl ?? '',
      galleryImagesText: Array.isArray(data?.galleryImages)
        ? data.galleryImages.join(',')
        : '',

      description: data?.description ?? '',
      content: data?.content ?? '',
      tagsText: Array.isArray(data?.tags) ? data.tags.join(',') : '',

      remark: data?.remark ?? '',

      scheduledAt: data?.scheduledAt ?? '',
      startTime: data?.startTime ?? '',
      endTime: data?.endTime ?? '',

      discountedPrice: data?.discountedPrice ?? undefined,
      autoDiscountEnabled: data?.autoDiscountEnabled ?? false,

      allowMultiDraw: data?.allowMultiDraw ?? true,
      multiDrawOptionsText: Array.isArray(data?.multiDrawOptions)
        ? data.multiDrawOptions.join(',')
        : '10',

      bonusEnabled: data?.bonusEnabled ?? false,
      bonusPointsPerDraw: data?.bonusPointsPerDraw ?? undefined,
      bonusCostPerDraw: data?.bonusCostPerDraw ?? undefined,
    });

    ensureStoreOptionExists(data?.storeId ?? '');

    prizes.splice(0, prizes.length);
    (data?.prizes ?? []).forEach((p: any) => {
      prizes.push({
        _key: crypto.randomUUID(),
        id: p.id,

        name: p.name ?? '',
        quantity: Number(p.quantity ?? 1),

        description: p.description ?? '',
        imageUrl: p.imageUrl ?? '',
        level: p.level ?? 'A',
        weight: p.weight ?? 1,

        prizeNumber: p.prizeNumber ?? '',
        prizeType: p.prizeType ?? 'physical',
        pointValue: p.pointValue ?? undefined,

        isLastPrize: p.isLastPrize ?? false,
        isGrandPrize: p.isGrandPrize ?? false,

        orderNum: p.orderNum ?? undefined,
      });
    });

    if (prizes.length === 0) addPrize();
  } catch (e: any) {
    dialogStore.openInfoDialog({
      title: '載入失敗',
      message: e?.message ?? '請稍後再試',
    });
  }
};

/** ========== mock data (更完整) ========== */
const randomPick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const pad2 = (n: number) => String(n).padStart(2, '0');

const mockContentBlocks = [
  `【活動說明】
- 單抽 / 多抽（10、50）
- 大獎售完後可自動降價
- 最後賞 LAST 會保底（最後一抽獲得）

【注意事項】
- 本商品為測試資料
- 圖片僅供示意，請以實際出貨為準`,
  `【玩法】
- 每抽皆可獲得紅利點數
- 支援自動輪播開獎動畫（前端預留）

【提醒】
- 建議先建立完整獎項與數量
- 總抽數可設定 0 表示不限量`,
];

const fillMockData = () => {
  const ts = Date.now();
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const mi = pad2(date.getMinutes());

  // ✅ datetime-local 的格式：YYYY-MM-DDTHH:mm
  const nowLocal = `${yyyy}-${mm}-${dd}T${hh}:${mi}`;

  const plusHours = (h: number) => {
    const d = new Date(date.getTime() + h * 60 * 60 * 1000);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(
      d.getDate()
    )}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };

  const pickCategory = randomPick([
    'OFFICIAL_ICHIBAN',
    'GACHA',
    'TRADING_CARD',
    'CUSTOM_GACHA',
  ]);

  const pickPlayMode = randomPick(['LOTTERY_MODE', 'SCRATCH_MODE']);

  const enableBonus = randomPick([true, false]);
  const multiOptions = randomPick(['10', '10,20,50', '5,10', '10,50']);

  // ✅ 若你有 storeOptions，幫你自動挑第一個店家
  const firstStoreId = storeOptions.value.find((x) => !!x.value)?.value || '';

  setValues({
    storeId: firstStoreId,

    title: `${randomPick([
      '鬼滅之刃',
      '航海王',
      '火影忍者',
      '咒術迴戰',
    ])} 一番賞 ${Math.floor(Math.random() * 999)}`,
    category: pickCategory,

    playMode: pickPlayMode,
    subCategory: pickCategory === 'CUSTOM_GACHA' ? pickPlayMode : '',

    status: randomPick(['DRAFT', 'ON_SHELF', 'OFF_SHELF']),

    pricePerDraw: randomPick([80, 120, 150, 200, 350]),
    maxDraws: randomPick([0, 80, 100, 120]),

    orderNum: randomPick([1, 2, 3, 5, 10]) as any,
    hotCount: randomPick([0, 9, 99, 999]) as any,
    theme: randomPick(['鬼滅之刃', '航海王', '火影忍者', '咒術迴戰']),

    imageUrl: `https://picsum.photos/seed/lottery_${ts}/1200/600`,
    galleryImagesText: [
      `https://picsum.photos/seed/gallery_${ts}_1/900/600`,
      `https://picsum.photos/seed/gallery_${ts}_2/900/600`,
      `https://picsum.photos/seed/gallery_${ts}_3/900/600`,
    ].join(','),

    description: `這是一筆快速產生的測試資料（商品+獎品整合），ID:${ts}`,
    content: randomPick(mockContentBlocks),
    tagsText: randomPick([
      '熱門,必抽,限量',
      '新品,一番賞,收藏',
      '官方,一番賞,保底',
      '自製賞,抽翻天,超值',
    ]),

    remark: `內部備註：mock-${ts}`,

    scheduledAt: randomPick(['', nowLocal, plusHours(2)]),
    startTime: randomPick(['', nowLocal, plusHours(1)]),
    endTime: randomPick(['', plusHours(24), plusHours(72)]),

    discountedPrice: randomPick([undefined, 50, 80, 100, 150]) as any,
    autoDiscountEnabled: randomPick([true, false]),

    allowMultiDraw: true,
    multiDrawOptionsText: multiOptions,

    bonusEnabled: enableBonus,
    bonusPointsPerDraw: enableBonus
      ? randomPick([5, 10, 20])
      : (undefined as any),
    bonusCostPerDraw: enableBonus
      ? randomPick([50, 100, 200])
      : (undefined as any),
  });

  prizes.splice(0, prizes.length);

  // ✅ 更完整的獎品模板（含 point/digital/physical + 籤號）
  const base = [
    {
      level: 'A',
      quantity: 1,
      weight: 1,
      isGrandPrize: true,
      prizeType: 'physical',
      pointValue: undefined,
    },
    {
      level: 'B',
      quantity: 2,
      weight: 2,
      prizeType: 'physical',
      pointValue: undefined,
    },
    {
      level: 'C',
      quantity: 4,
      weight: 4,
      prizeType: 'digital',
      pointValue: undefined,
    },
    {
      level: 'D',
      quantity: 8,
      weight: 8,
      prizeType: 'point',
      pointValue: 100,
    },
    {
      level: 'E',
      quantity: 12,
      weight: 12,
      prizeType: 'point',
      pointValue: 50,
    },
    {
      level: 'LAST',
      quantity: 1,
      weight: 0,
      isLastPrize: true,
      prizeType: 'physical',
      pointValue: undefined,
    },
  ];

  base.forEach((b, idx) => {
    const prizeName =
      b.level === 'A'
        ? 'A賞 角色大型公仔'
        : b.level === 'LAST'
        ? '最後賞 LAST 保底大獎'
        : `${b.level}賞 精緻週邊`;

    prizes.push({
      _key: crypto.randomUUID(),
      name: prizeName,
      description: `這是 ${b.level} 獎項的測試描述（第 ${idx + 1} 個獎品）`,
      imageUrl: `https://picsum.photos/seed/prize_${ts}_${idx}/600/600`,

      level: b.level,
      quantity: b.quantity,
      weight: b.weight,

      prizeType: (b as any).prizeType,
      pointValue: (b as any).pointValue,

      isLastPrize: (b as any).isLastPrize ?? false,
      isGrandPrize: (b as any).isGrandPrize ?? false,

      orderNum: idx + 1,

      // ✅ 刮刮樂才需要籤號，但有填也不影響
      prizeNumber: pad2(idx + 1),
    });
  });

  dialogStore.openInfoDialog({
    title: '已填入假資料',
    message: '商品與獎品已自動生成（含完整欄位），可直接按儲存送出',
  });
};

/** ========== submit ========== */
const onSubmit = handleSubmit(async (values) => {
  try {
    const payload = {
      lottery: {
        storeId: cleanText(values.storeId),

        title: values.title,
        category: values.category,

        playMode: cleanText(values.playMode),
        subCategory:
          values.category === 'CUSTOM_GACHA'
            ? cleanText(values.subCategory || values.playMode)
            : undefined,

        status: cleanText(values.status),

        pricePerDraw: Number(values.pricePerDraw),

        discountedPrice: values.discountedPrice ?? undefined,
        autoDiscountEnabled: values.autoDiscountEnabled ?? false,

        allowMultiDraw: values.allowMultiDraw ?? true,
        multiDrawOptions: parseMultiDrawOptions(values.multiDrawOptionsText),

        scheduledAt: toLocalDateTimeOrUndefined(values.scheduledAt),
        startTime: toLocalDateTimeOrUndefined(values.startTime),
        endTime: toLocalDateTimeOrUndefined(values.endTime),

        maxDraws: Number(values.maxDraws ?? 0),

        orderNum: values.orderNum == null ? undefined : Number(values.orderNum),
        remark: cleanText(values.remark),

        hotCount: values.hotCount == null ? undefined : Number(values.hotCount),
        theme: cleanText(values.theme),

        galleryImages: parseCsvText(values.galleryImagesText),
        content: cleanText(values.content),
        tags: parseCsvText(values.tagsText),

        bonusEnabled: values.bonusEnabled ?? false,
        bonusPointsPerDraw:
          values.bonusEnabled && values.bonusPointsPerDraw != null
            ? Number(values.bonusPointsPerDraw)
            : undefined,
        bonusCostPerDraw:
          values.bonusEnabled && values.bonusCostPerDraw != null
            ? Number(values.bonusCostPerDraw)
            : undefined,
      },
      prizes: prizes
        .filter((p) => p.name?.trim())
        .map((p) => normalizePrizePayload(p)),
    };

    if (payload.prizes.length === 0) {
      dialogStore.openInfoDialog({
        title: '請至少新增 1 個獎品',
        message: '獎品清單不可為空',
      });
      return;
    }

    if (!isEdit.value) {
      await createLotteryWithPrizes(payload);

      dialogStore.openInfoDialog({
        title: '新增成功',
        message: '商品與獎品已建立完成',
      });

      router.push('/admin/lottery-with-prizes');
      return;
    }

    await updateLotteryWithPrizes(id.value!, payload);

    dialogStore.openInfoDialog({
      title: '更新成功',
      message: '商品與獎品已更新',
    });

    await loadDetail();
  } catch (e: any) {
    dialogStore.openInfoDialog({
      title: '儲存失敗',
      message: e?.message ?? '請稍後再試',
    });
  }
});

/** ========== mounted ========== */
onMounted(async () => {
  await loadStoreOptions();

  if (isEdit.value) await loadDetail();
  else addPrize();
});
</script>

<style scoped lang="scss">
.lotteryWithPrizesForm {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }

  &__title {
    font-size: 18px;
    font-weight: 800;
  }

  &__actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  &__section {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }

  &__sectionHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  &__sectionTitle {
    font-size: 16px;
    font-weight: 700;
  }

  &__grid {
    display: flex;
    flex-wrap: wrap;
  }

  &__empty {
    padding: 12px 6px;
    opacity: 0.7;
    font-size: 14px;
  }

  &__prizeCard {
    margin-top: 12px;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid rgba(0, 0, 0, 0.08);
  }

  &__prizeTop {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  &__prizeTitle {
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__badge {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.06);
  }
}
</style>

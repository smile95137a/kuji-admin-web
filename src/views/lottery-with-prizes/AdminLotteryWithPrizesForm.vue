<!-- src/views/lottery/LotteryWithPrizesForm.vue -->
<template>
  <MCard>
    <div class="admin-lottery-form__header">
      <FormTitle
        :title="isEdit ? '編輯一番賞商品設定' : '新增一番賞商品設定'"
      />

      <MButton
        v-if="isEdit && isScratchStoreEdit"
        type="button"
        @click="showDesignateModal = true"
      >
        指定大獎號碼
      </MButton>
    </div>

    <Form
      ref="formRef"
      keep-values
      :initial-values="lotteryWithPrizesInitialValues"
      :validation-schema="lotteryWithPrizesSchema"
      :validate-on-mount="false"
      :validate-on-blur="false"
      :validate-on-change="false"
      :validate-on-input="false"
      @submit="onSubmitForm"
      @invalid-submit="onInvalidSubmit"
    >
      <Tabs :active-tab="activeTab" @update:active-tab="updateActiveTab">
        <template #headers="{ activeTab, setActiveTab }">
          <div
            v-for="tab in tabList"
            :key="tab.code"
            class="tab-button"
            :class="{ active: activeTab === tab.code }"
            @click="setActiveTab(tab.code)"
          >
            {{ tab.label }}
          </div>
        </template>

        <Tab v-for="tab in tabList" :key="tab.code" :name="tab.code">
          <component :is="tab.component" v-bind="tab.props || {}" />
        </Tab>
      </Tabs>

      <div class="flex justify-end m-y-8 gap-x-12 flex-wrap">
        <MButton type="submit">
          {{ isEdit ? '更新' : '送出' }}
        </MButton>

        <MButton type="button" class="mbtn--gray" @click="resetForm">
          清除
        </MButton>

        <MButton type="button" class="mbtn--red" @click="goBack">
          返回
        </MButton>
      </div>
    </Form>

    <!-- T021 — 大獎指定狀態資訊列（編輯模式才顯示） -->
    <template v-if="isEdit">
      <!-- SCRATCH_STORE + PENDING -->
      <div
        v-if="isScratchStoreEdit && lotteryDesignationStatus === 'PENDING'"
        style="
          border-left: 4px solid #d46b08;
          background: #fff7e6;
          border-radius: 8px;
          margin-top: 12px;
        "
      >
        <div
          class="flex items-center justify-between flex-wrap gap-x-12"
          style="padding: 12px 16px"
        >
          <span style="color: #d46b08; font-size: 13px">
            ⚠️
            此刷刷樂商品（店家指定模式）尚未完成大獎號碼指定。開始抽獎前需先指定大獎號碼。
          </span>

          <MButton size="sm" type="button" @click="showDesignateModal = true">
            前往指定大獎號碼
          </MButton>
        </div>
      </div>

      <!-- SCRATCH_STORE + DESIGNATED -->
      <div
        v-if="isScratchStoreEdit && lotteryDesignationStatus === 'DESIGNATED'"
        style="
          border-left: 4px solid #52c41a;
          background: #f6ffed;
          border-radius: 8px;
          margin-top: 12px;
        "
      >
        <div style="padding: 12px 16px; color: #389e0d; font-size: 13px">
          ✅ 大獎號碼已完成指定，可開始抽獎。
        </div>
      </div>

      <!-- SCRATCH_PLAYER -->
      <div
        v-if="isScratchPlayerEdit"
        style="
          border-left: 4px solid #1890ff;
          background: #e6f7ff;
          border-radius: 8px;
          margin-top: 12px;
        "
      >
        <div style="padding: 12px 16px; color: #005a99; font-size: 13px">
          ℹ️
          此刷刷樂商品（玩家指定模式）：玩家購票後自行指定大獎號碼，無需店家操作。
        </div>
      </div>
    </template>

    <DesignatePrizeModal
      v-if="isEdit && isScratchStoreEdit && id"
      :show="showDesignateModal"
      :lotteryId="String(id)"
      :lotteryName="loadedTitle"
      :maxDraws="loadedMaxDraws"
      @close="showDesignateModal = false"
      @success="onDesignateSuccess"
    />
  </MCard>
</template>

<script setup lang="ts">
import { computed, onMounted, provide, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Form, type FormContext } from 'vee-validate';

import Tabs from '@/components/common/Tabs.vue';
import Tab from '@/components/common/Tab.vue';
import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormTitle from '@/components/common/FormTitle.vue';

import TabLotteryBasic from '@/components/lottery/TabLotteryBasic.vue';
import TabLotteryPrice from '@/components/lottery/TabLotteryPrice.vue';
import TabLotteryPrizes from '@/components/lottery/TabLotteryPrizes.vue';
import DesignatePrizeModal from '@/components/lottery-with-prizes/DesignatePrizeModal.vue';

import type { PrizeFormRow } from '@/components/lottery/PrizeFormDialog.vue';

import {
  lotteryWithPrizesInitialValues,
  lotteryWithPrizesSchema,
} from '@/validators/lotteryWithPrizesSchema';

import { openInfoDialog } from '@/utils/dialog/infoDialog';
import { getErrorMessage } from '@/utils/ErrorUtils';

import { useAuthStore } from '@/stores';
import { getStoreOptions } from '@/services/adminStoreService';
import { queryThemes } from '@/services/adminCategoryService';

import {
  createLotteryWithPrizes,
  updateLotteryWithPrizes,
  getLotteryWithPrizes,
} from '@/services/adminLotteryWithPrizesService';

interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
  description?: string;
}

const LIST_PATH = '/home/lottery-with-prizes';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const id = computed(() => route.params.id as string | undefined);
const isEdit = computed(() => !!id.value);

const formRef = ref<FormContext | null>(null);

const activeTab = ref('basic');

/* ==============================
 * 指定大獎號碼 Modal
 * ============================== */
const showDesignateModal = ref(false);
const loadedTitle = ref('');
const loadedMaxDraws = ref(0);
const isScratchStoreEdit = ref(false);
const isScratchPlayerEdit = ref(false);

/** 後端回傳的指定狀態（PENDING / DESIGNATED） */
const lotteryDesignationStatus = ref<string | null>(null);

/** 後端當前狀態（不隨 form values 改變），用於編輯時的 ACTIVE 上架封鎖 */
const originalStatus = ref('');

const onDesignateSuccess = async () => {
  showDesignateModal.value = false;
  await loadDetail();
};

const updateActiveTab = (value: string) => {
  activeTab.value = value;
};

provide('activeTab', activeTab);
provide('setActiveTab', updateActiveTab);

/* ==============================
 * 店家 / 主題下拉
 * ============================== */
const storeOptions = ref<SelectOption[]>([]);
const themeOptions = ref<SelectOption[]>([]);

const isAdmin = computed(() => {
  const role = String(
    authStore.user?.role ?? authStore.user?.roleCode ?? '',
  ).toUpperCase();

  return ['ADMIN', 'SUPER_ADMIN'].includes(role);
});

const mapEnumOptionsToSelect = (list: any[] = []): SelectOption[] => {
  return list.map((item) => ({
    label: item?.label ?? item?.name ?? item?.title ?? '',
    value: item?.value ?? item?.id ?? item?.storeId ?? item?.name ?? '',
    ...(item?.description ? { description: item.description } : {}),
  }));
};

const ensureStoreOptionExists = (storeIdValue?: string) => {
  if (!storeIdValue) return;

  const exists = storeOptions.value.some(
    (option) => String(option.value) === String(storeIdValue),
  );

  if (exists) return;

  storeOptions.value.unshift({
    label: `店家（${storeIdValue}）`,
    value: storeIdValue,
  });
};

const loadStoreOptions = async () => {
  try {
    const res = await getStoreOptions({ activeOnly: true });
    const data = (res as any)?.data ?? res;

    storeOptions.value = mapEnumOptionsToSelect(
      Array.isArray(data) ? data : [],
    );
  } catch (error) {
    console.error('[LotteryWithPrizesForm] loadStoreOptions failed:', error);
    storeOptions.value = [];
  }
};

const loadThemeOptions = async () => {
  try {
    const res = await queryThemes();
    const data = (res as any)?.data ?? res;

    themeOptions.value = (Array.isArray(data) ? data : []).map((item: any) => ({
      label: item?.label ?? item?.name ?? item,
      value: item?.value ?? item?.name ?? item,
    }));
  } catch (error) {
    console.error('[LotteryWithPrizesForm] loadThemeOptions failed:', error);
    themeOptions.value = [];
  }
};

/**
 * 只保留 3 個 tab：
 * 1. 基本資料：基本欄位 + 內容 + 圖片 + 上下架
 * 2. 價格紅利：價格 + 紅利 + 抽選設定
 * 3. 獎品清單：獎品 rows
 */
const tabList = computed(() => [
  {
    code: 'basic',
    label: '基本資料',
    component: TabLotteryBasic,
    props: {
      storeOptions: storeOptions.value,
      themeOptions: themeOptions.value,
      isAdmin: isAdmin.value,
      isEdit: isEdit.value,
    },
  },
  {
    code: 'price',
    label: '價格紅利',
    component: TabLotteryPrice,
  },
  {
    code: 'prizes',
    label: '獎品清單',
    component: TabLotteryPrizes,
  },
]);

/* ==============================
 * 錯誤 tab 對應
 * ============================== */
const fieldTabMap: Record<string, string> = {
  // 基本資料
  storeId: 'basic',
  title: 'basic',
  category: 'basic',
  subCategory: 'basic',
  playMode: 'basic',
  gameMode: 'basic',
  status: 'basic',
  theme: 'basic',

  // 內容 / 圖片
  imageUrl: 'basic',
  galleryImagesText: 'basic',
  description: 'basic',
  content: 'basic',
  tagsText: 'basic',
  remark: 'basic',

  // 上下架
  scheduledAt: 'basic',
  startTime: 'basic',
  endTime: 'basic',
  delistStrategy: 'basic',

  // 價格紅利
  pricePerDraw: 'price',
  paymentType: 'price',
  freeDrawThreshold: 'price',
  discountedPrice: 'price',
  autoDiscountEnabled: 'price',
  bonusEnabled: 'price',
  bonusPointsPerDraw: 'price',
  bonusCostPerDraw: 'price',

  // 抽選設定
  maxDraws: 'price',
  allowMultiDraw: 'price',
  multiDrawOptionsText: 'price',
  designatedPrizeNumbers: 'price',
  pendingDesignatedPrizeNumber: 'price',
  hotCount: 'price',

  // 獎品清單
  prizes: 'prizes',
};

const getFieldRoot = (field: string) => {
  return (
    String(field || '')
      .split(/[.[\]]/)
      .filter(Boolean)[0] || field
  );
};

const jumpToErrorTab = (errors: Record<string, any>) => {
  const firstField = Object.keys(errors || {})[0];

  if (!firstField) return;

  const rootField = getFieldRoot(firstField);
  activeTab.value =
    fieldTabMap[firstField] || fieldTabMap[rootField] || 'basic';
};

/* ==============================
 * Payload helpers
 * ============================== */
const cleanText = (value: any) => {
  if (value === '' || value === null || value === undefined) return undefined;
  return value;
};

const toNumberOrUndefined = (value: any) => {
  if (value === '' || value === null || value === undefined) return undefined;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const toBoolean = (value: any) => {
  return value === true || value === 'true';
};
const normalizeToBackendLocalDateTime = (value?: string | null) => {
  const text = String(value ?? '')
    .trim()
    .replace('T', ' ')
    .replace(/\//g, '-');

  if (!text) return undefined;
  if (text.length >= 19) return text.slice(0, 19);
  if (text.length === 16) return `${text}:00`;

  return text;
};
const normalizeToPickerDateTime = (value?: string | null) => {
  const text = String(value ?? '')
    .trim()
    .replace('T', ' ')
    .replace(/-/g, '/');

  if (!text) return '';

  return text.length >= 16 ? text.slice(0, 16) : text;
};
const parseTextList = (value: any, separator: string | RegExp) => {
  return String(value || '')
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseNumberList = (value: any) => {
  return String(value || '')
    .split(',')
    .map((item) => Number(String(item).trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
};

const parseDesignatedPrizeNumbers = (value: any) => {
  const raw = cleanText(value);

  if (!raw) return undefined;

  if (Array.isArray(raw)) return raw;

  const text = String(raw).trim();

  if (!text) return undefined;

  try {
    return JSON.parse(text);
  } catch {
    const numberList = parseNumberList(text);

    if (numberList.length > 0) return numberList;

    return text;
  }
};

const inferScratchGameMode = (lotteryData: any, rootData: any) => {
  const explicitGameMode = String(
    lotteryData?.gameMode ?? rootData?.gameMode ?? '',
  )
    .trim()
    .toUpperCase();

  if (explicitGameMode) return explicitGameMode;

  const isScratchMode =
    String(lotteryData?.subCategory ?? rootData?.subCategory ?? '') ===
      'SCRATCH_MODE' ||
    String(lotteryData?.playMode ?? rootData?.playMode ?? '') ===
      'SCRATCH_MODE';

  if (!isScratchMode) return '';

  const designationStatus = String(
    lotteryData?.designationStatus ?? rootData?.designationStatus ?? '',
  )
    .trim()
    .toUpperCase();

  if (designationStatus === 'PENDING' || designationStatus === 'DESIGNATED') {
    return 'SCRATCH_STORE';
  }

  const lotteryText = [
    lotteryData?.title,
    lotteryData?.description,
    lotteryData?.content,
    ...(Array.isArray(lotteryData?.tags) ? lotteryData.tags : []),
    rootData?.title,
    rootData?.description,
    rootData?.content,
    ...(Array.isArray(rootData?.tags) ? rootData.tags : []),
  ]
    .filter(Boolean)
    .join(' ');

  if (lotteryText.includes('玩家指定')) return 'SCRATCH_PLAYER';
  if (lotteryText.includes('店家指定')) return 'SCRATCH_STORE';

  return '';
};

const normalizePrizePayload = (prize: any, index: number) => {
  const isScratchGrandPrize = toBoolean(prize.isGrandPrize);
  // || String(prize.level || '').toUpperCase() === 'GRAND';

  return {
    ...(prize.id ? { id: prize.id } : {}),

    name: cleanText(String(prize.name || '').trim()),
    quantity: isScratchGrandPrize ? 1 : Number(prize.quantity ?? 1),

    description: cleanText(String(prize.description || '').trim()),
    imageUrl: cleanText(prize.imageUrl),
    level: cleanText(prize.level),

    prizeNumber: cleanText(prize.prizeNumber),
    prizeType: cleanText(prize.prizeType),
    pointValue:
      prize.prizeType === 'point'
        ? toNumberOrUndefined(prize.pointValue)
        : undefined,

    isLastPrize: isScratchGrandPrize ? false : toBoolean(prize.isLastPrize),
    isGrandPrize: isScratchGrandPrize,
    orderNum:
      prize.orderNum === '' || prize.orderNum == null
        ? index + 1
        : Number(prize.orderNum),
  };
};

const normalizePrizes = (prizes: PrizeFormRow[] = []) => {
  return prizes
    .filter((item) => String(item?.name || '').trim())
    .map((item, index) => normalizePrizePayload(item, index));
};

const normalizeScratchFormPrizes = (prizes: PrizeFormRow[] = []) => {
  const usable = prizes.filter((item) => String(item?.name || '').trim());
  if (!usable.length) return prizes;

  const first = usable[0];
  return [
    {
      ...first,
      quantity: 1,
      level: 'GRAND',
      isGrandPrize: true,
      isLastPrize: false,
    },
  ];
};

const buildSubmitPayload = (values: any) => {
  const rawPrizes =
    String(values.subCategory || '') === 'SCRATCH_MODE'
      ? normalizeScratchFormPrizes(values.prizes || [])
      : values.prizes || [];
  const prizes = normalizePrizes(rawPrizes);
  const galleryImages = parseTextList(values.galleryImagesText, '\n');
  const tags = parseTextList(values.tagsText, ',');
  const multiDrawOptions = parseNumberList(values.multiDrawOptionsText);
  const designatedPrizeNumbers =
    parseDesignatedPrizeNumbers(values.designatedPrizeNumbers) ??
    (isScratchStoreMode(values)
      ? parseDesignatedPrizeNumbers(values.pendingDesignatedPrizeNumber)
      : undefined);

  return {
    lottery: {
      storeId: cleanText(values.storeId),

      title: String(values.title || '').trim(),
      category: cleanText(values.category),
      subCategory: cleanText(values.subCategory),
      playMode: cleanText(values.playMode),
      gameMode: cleanText(values.gameMode),

      designatedPrizeNumbers,

      status: cleanText(values.status),

      pricePerDraw: Number(values.pricePerDraw ?? 0),

      imageUrl: cleanText(values.imageUrl),
      galleryImages,

      discountedPrice: toNumberOrUndefined(values.discountedPrice),
      autoDiscountEnabled: toBoolean(values.autoDiscountEnabled),

      allowMultiDraw: values.allowMultiDraw !== false,
      multiDrawOptions,

      scheduledAt: normalizeToBackendLocalDateTime(values.scheduledAt),
      startTime: normalizeToBackendLocalDateTime(values.startTime),
      endTime: normalizeToBackendLocalDateTime(values.endTime),
      maxDraws: Number(values.maxDraws ?? 0),

      remark: cleanText(values.remark),

      hotCount: toNumberOrUndefined(values.hotCount),
      theme: cleanText(values.theme),

      delistStrategy:
        String(values.category || '') === 'OFFICIAL_ICHIBAN'
          ? cleanText(values.delistStrategy)
          : undefined,
      paymentType: cleanText(values.paymentType),
      freeDrawThreshold: toNumberOrUndefined(values.freeDrawThreshold),

      description: cleanText(values.description),
      content: cleanText(values.content),
      tags,

      bonusEnabled: toBoolean(values.bonusEnabled),
      bonusPointsPerDraw: toBoolean(values.bonusEnabled)
        ? toNumberOrUndefined(values.bonusPointsPerDraw)
        : undefined,
      bonusCostPerDraw: toBoolean(values.bonusEnabled)
        ? toNumberOrUndefined(values.bonusCostPerDraw)
        : undefined,
    },

    prizes,
  };
};

const isOnShelfStatus = (status: any) => {
  return ['ON_SHELF'].includes(String(status || ''));
};

const isScratchStoreMode = (values: any) => {
  return (
    String(values?.gameMode || '') === 'SCRATCH_STORE' ||
    (String(values?.subCategory || '') === 'SCRATCH_MODE' &&
      String(values?.gameMode || '') === 'SCRATCH_STORE')
  );
};

/* ==============================
 * 載入明細
 * ============================== */
const mapPrizesToForm = (prizes: any[] = []) => {
  return prizes.map((item) => ({
    _key:
      item?._key ||
      item?.id ||
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(36).slice(2)}`),

    id: item?.id,
    name: item?.name ?? '',
    quantity: Number(item?.quantity ?? 1),
    level: item?.level ?? 'A',

    prizeType: item?.prizeType ?? 'physical',
    pointValue: item?.pointValue ?? undefined,

    prizeNumber: item?.prizeNumber ?? '',
    isLastPrize: item?.isLastPrize ?? false,
    isGrandPrize: item?.isGrandPrize ?? false,

    orderNum: item?.orderNum ?? undefined,
    imageUrl: item?.imageUrl ?? '',
    description: item?.description ?? '',
  }));
};

const loadDetail = async () => {
  if (!id.value) return;

  try {
    const res = await getLotteryWithPrizes(id.value);
    const data = (res as any)?.data ?? res;
    const lotteryData = data?.lottery ?? data;
    const resolvedGameMode = inferScratchGameMode(lotteryData, data);
    const resolvedDesignationStatus =
      lotteryData?.designationStatus ?? data?.designationStatus ?? null;
    const resolvedDesignatedPrizeNumbers =
      lotteryData?.designatedPrizeNumbers ?? data?.designatedPrizeNumbers;

    loadedTitle.value = lotteryData?.title ?? data?.title ?? '';
    loadedMaxDraws.value = Number(lotteryData?.maxDraws ?? data?.maxDraws ?? 0);
    originalStatus.value = lotteryData?.status ?? data?.status ?? '';
    lotteryDesignationStatus.value = resolvedDesignationStatus;

    isScratchStoreEdit.value = resolvedGameMode === 'SCRATCH_STORE';
    isScratchPlayerEdit.value = resolvedGameMode === 'SCRATCH_PLAYER';

    ensureStoreOptionExists(lotteryData?.storeId ?? data?.storeId ?? '');

    formRef.value?.setValues?.({
      storeId: lotteryData?.storeId ?? data?.storeId ?? '',

      title: lotteryData?.title ?? data?.title ?? '',
      category: lotteryData?.category ?? data?.category ?? 'OFFICIAL_ICHIBAN',
      subCategory: lotteryData?.subCategory ?? data?.subCategory ?? '',
      playMode: lotteryData?.playMode ?? data?.playMode ?? 'LOTTERY_MODE',
      gameMode: resolvedGameMode,

      designatedPrizeNumbers: Array.isArray(resolvedDesignatedPrizeNumbers)
        ? resolvedDesignatedPrizeNumbers.join(',')
        : resolvedDesignatedPrizeNumbers
          ? String(resolvedDesignatedPrizeNumbers)
          : '',

      delistStrategy: lotteryData?.delistStrategy ?? data?.delistStrategy ?? '',
      paymentType: lotteryData?.paymentType ?? data?.paymentType ?? 'GOLD',
      freeDrawThreshold:
        lotteryData?.freeDrawThreshold == null
          ? data?.freeDrawThreshold == null
            ? undefined
            : data.freeDrawThreshold
          : lotteryData.freeDrawThreshold,
      status: lotteryData?.status ?? data?.status ?? 'DRAFT',
      designationStatus: resolvedDesignationStatus ?? '',

      pricePerDraw: Number(
        lotteryData?.pricePerDraw ?? data?.pricePerDraw ?? 0,
      ),
      maxDraws: Number(lotteryData?.maxDraws ?? data?.maxDraws ?? 0),

      hotCount: lotteryData?.hotCount ?? data?.hotCount ?? undefined,
      theme: lotteryData?.theme ?? data?.theme ?? '',

      imageUrl: lotteryData?.imageUrl ?? data?.imageUrl ?? '',
      galleryImagesText: Array.isArray(
        lotteryData?.galleryImages ?? data?.galleryImages,
      )
        ? (lotteryData?.galleryImages ?? data?.galleryImages).join('\n')
        : '',

      description: lotteryData?.description ?? data?.description ?? '',
      content: lotteryData?.content ?? data?.content ?? '',
      tagsText: Array.isArray(lotteryData?.tags ?? data?.tags)
        ? (lotteryData?.tags ?? data?.tags).join(',')
        : '',

      remark: lotteryData?.remark ?? data?.remark ?? '',

      scheduledAt: normalizeToPickerDateTime(
        lotteryData?.scheduledAt ?? data?.scheduledAt,
      ),
      startTime: normalizeToPickerDateTime(
        lotteryData?.startTime ?? data?.startTime,
      ),
      endTime: normalizeToPickerDateTime(lotteryData?.endTime ?? data?.endTime),

      discountedPrice:
        lotteryData?.discountedPrice ?? data?.discountedPrice ?? undefined,
      autoDiscountEnabled:
        lotteryData?.autoDiscountEnabled ?? data?.autoDiscountEnabled ?? false,

      allowMultiDraw:
        lotteryData?.allowMultiDraw ?? data?.allowMultiDraw ?? true,
      multiDrawOptionsText: Array.isArray(
        lotteryData?.multiDrawOptions ?? data?.multiDrawOptions,
      )
        ? (lotteryData?.multiDrawOptions ?? data?.multiDrawOptions).join(',')
        : '10',

      pendingDesignatedPrizeNumber: undefined,

      bonusEnabled: lotteryData?.bonusEnabled ?? data?.bonusEnabled ?? false,
      bonusPointsPerDraw:
        lotteryData?.bonusPointsPerDraw ??
        data?.bonusPointsPerDraw ??
        undefined,
      bonusCostPerDraw:
        lotteryData?.bonusCostPerDraw ?? data?.bonusCostPerDraw ?? undefined,

      prizes:
        String(lotteryData?.subCategory ?? data?.subCategory ?? '') ===
        'SCRATCH_MODE'
          ? normalizeScratchFormPrizes(mapPrizesToForm(data?.prizes ?? []))
          : mapPrizesToForm(data?.prizes ?? []),
    });
  } catch (error: any) {
    await openInfoDialog({
      title: '讀取失敗',
      message: getErrorMessage(error, '請稍後再試'),
      iconType: 'warning',
    });

    goBack();
  }
};

/* ==============================
 * Submit
 * ============================== */
const validateBeforeSubmit = async (values: any, payload: any) => {
  /**
   * 商品目前在後端為「上架 / 抽獎中」狀態時，後端禁止修改內容。
   * 前端提早攔截，引導用戶先至列表頁下架後再編輯。
   */
  if (isEdit.value && isOnShelfStatus(originalStatus.value)) {
    activeTab.value = 'basic';

    await openInfoDialog({
      title: '商品已上架，部分欄位不可修改',
      message:
        '商品一旦上架，遊戲模式與上下架狀態不可任意修改。請先下架後再調整相關設定。',

      iconType: 'warning',
    });

    return false;
  }

  if (!payload.prizes.length) {
    activeTab.value = 'prizes';

    await openInfoDialog({
      title: '請至少新增 1 個獎項',
      message: '建立商品前，請先新增至少一個獎項。',
      iconType: 'warning',
    });

    return false;
  }

  if (String(values.subCategory || '') === 'SCRATCH_MODE') {
    const hasGrandPrize =
      payload.prizes.length === 1 &&
      payload.prizes[0]?.isGrandPrize === true &&
      Number(payload.prizes[0]?.quantity ?? 0) === 1 &&
      String(payload.prizes[0]?.level || '').toUpperCase() === 'GRAND';

    if (!hasGrandPrize) {
      activeTab.value = 'prizes';

      await openInfoDialog({
        title: '刮刮樂獎項設定不完整',
        message: '刮刮樂模式必須只有 1 個獎項，且該獎項需為唯一大獎。',
        iconType: 'warning',
      });

      return false;
    }
  }

  /**
   * 舊版 T021b：
   * 編輯刮刮樂店家指定模式時，如果大獎號碼尚未指定，不允許直接上架/抽獎中。
   * 僅以 ON_SHELF 視為上架中，避免舊狀態字串再混入新流程。
   */
  if (
    isEdit.value &&
    isOnShelfStatus(values.status) &&
    isScratchStoreMode(values) &&
    String(values.designationStatus || '') === 'PENDING'
  ) {
    activeTab.value = 'basic';

    await openInfoDialog({
      title: '無法直接上架',
      message: '刮刮樂店家指定模式尚未完成大獎號碼設定，請先完成指定後再上架。',

      iconType: 'warning',
    });

    return false;
  }

  return true;
};

const onSubmitForm = async (values: any, actions: any) => {
  if (actions?.errors && Object.keys(actions.errors).length > 0) {
    jumpToErrorTab(actions.errors);
    return;
  }

  const formErrors = formRef.value?.errors || {};

  if (Object.keys(formErrors).length > 0) {
    jumpToErrorTab(formErrors);
    return;
  }

  const payload = buildSubmitPayload(values);

  const canSubmit = await validateBeforeSubmit(values, payload);

  if (!canSubmit) return;

  try {
    console.log('[LotteryWithPrizesForm] submit values:', values);
    console.log('[LotteryWithPrizesForm] submit content:', values.content);
    console.log('[LotteryWithPrizesForm] submit payload:', payload);

    if (!isEdit.value) {
      await createLotteryWithPrizes(payload);

      await openInfoDialog({
        title: '建立成功',
        message: '商品與獎項已建立完成',
        iconType: 'success',
      });

      router.push(LIST_PATH);
      return;
    }

    await updateLotteryWithPrizes(id.value!, payload);

    await openInfoDialog({
      title: '更新成功',
      message: '商品與獎項已更新完成',
      iconType: 'success',
    });

    router.push(LIST_PATH);
  } catch (error: any) {
    await openInfoDialog({
      title: '送出失敗',
      message: getErrorMessage(error, '請稍後再試'),
      iconType: 'warning',
    });
  }
};
const onInvalidSubmit = ({ errors }: any) => {
  jumpToErrorTab(errors || {});
};

const resetForm = async () => {
  if (isEdit.value) {
    await loadDetail();
    activeTab.value = 'basic';
    return;
  }

  formRef.value?.resetForm?.({
    values: {
      ...lotteryWithPrizesInitialValues,
      prizes: [],
    },
  });

  activeTab.value = 'basic';
};

const goBack = () => {
  router.push(LIST_PATH);
};

onMounted(async () => {
  await Promise.all([loadStoreOptions(), loadThemeOptions()]);

  if (isEdit.value) {
    await loadDetail();
  }
});
</script>

<style scoped lang="scss">
.admin-lottery-form__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}
</style>

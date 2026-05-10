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
  designatePrize,
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

const normalizePrizePayload = (prize: any, index: number) => {
  const isScratchGrandPrize =
    toBoolean(prize.isGrandPrize) ||
    String(prize.level || '').toUpperCase() === 'GRAND';

  return {
    ...(prize.id ? { id: prize.id } : {}),

    name: cleanText(String(prize.name || '').trim()),
    quantity: isScratchGrandPrize ? 1 : Number(prize.quantity ?? 1),

    description: cleanText(String(prize.description || '').trim()),
    imageUrl: cleanText(prize.imageUrl),
    level: isScratchGrandPrize ? 'GRAND' : cleanText(prize.level),

    prizeNumber: cleanText(prize.prizeNumber),
    prizeType: cleanText(prize.prizeType),
    pointValue:
      prize.prizeType === 'point'
        ? toNumberOrUndefined(prize.pointValue)
        : undefined,

    isLastPrize: isScratchGrandPrize ? false : toBoolean(prize.isLastPrize),
    isGrandPrize: isScratchGrandPrize ? true : toBoolean(prize.isGrandPrize),
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

  return {
    lottery: {
      storeId: cleanText(values.storeId),

      title: String(values.title || '').trim(),
      category: cleanText(values.category),
      subCategory: cleanText(values.subCategory),
      playMode: cleanText(values.playMode),
      gameMode: cleanText(values.gameMode),

      designatedPrizeNumbers: parseDesignatedPrizeNumbers(
        values.designatedPrizeNumbers,
      ),

      status: cleanText(values.status),

      pricePerDraw: Number(values.pricePerDraw ?? 0),

      imageUrl: cleanText(values.imageUrl),
      galleryImages,

      discountedPrice: toNumberOrUndefined(values.discountedPrice),
      autoDiscountEnabled: toBoolean(values.autoDiscountEnabled),

      allowMultiDraw: values.allowMultiDraw !== false,
      multiDrawOptions,

      scheduledAt: cleanText(values.scheduledAt),
      startTime: cleanText(values.startTime),
      endTime: cleanText(values.endTime),

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

    loadedTitle.value = data?.title ?? '';
    loadedMaxDraws.value = Number(data?.maxDraws ?? 0);
    originalStatus.value = data?.status ?? '';
    lotteryDesignationStatus.value = data?.designationStatus ?? null;

    // 只看 gameMode，與 copy form 行為一致
    isScratchStoreEdit.value = String(data?.gameMode ?? '') === 'SCRATCH_STORE';
    isScratchPlayerEdit.value =
      String(data?.gameMode ?? '') === 'SCRATCH_PLAYER';

    ensureStoreOptionExists(data?.storeId ?? '');

    formRef.value?.setValues?.({
      storeId: data?.storeId ?? '',

      title: data?.title ?? '',
      category: data?.category ?? 'OFFICIAL_ICHIBAN',
      subCategory: data?.subCategory ?? '',
      playMode: data?.playMode ?? 'LOTTERY_MODE',
      gameMode: data?.gameMode ?? '',

      designatedPrizeNumbers: Array.isArray(data?.designatedPrizeNumbers)
        ? data.designatedPrizeNumbers.join(',')
        : data?.designatedPrizeNumbers
          ? String(data.designatedPrizeNumbers)
          : '',

      delistStrategy: data?.delistStrategy ?? '',
      paymentType: data?.paymentType ?? 'GOLD',
      freeDrawThreshold:
        data?.freeDrawThreshold == null ? undefined : data.freeDrawThreshold,
      status: data?.status ?? 'DRAFT',

      pricePerDraw: Number(data?.pricePerDraw ?? 0),
      maxDraws: Number(data?.maxDraws ?? 0),

      hotCount: data?.hotCount ?? undefined,
      theme: data?.theme ?? '',

      imageUrl: data?.imageUrl ?? '',
      galleryImagesText: Array.isArray(data?.galleryImages)
        ? data.galleryImages.join('\n')
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

      pendingDesignatedPrizeNumber: undefined,

      bonusEnabled: data?.bonusEnabled ?? false,
      bonusPointsPerDraw: data?.bonusPointsPerDraw ?? undefined,
      bonusCostPerDraw: data?.bonusCostPerDraw ?? undefined,

      prizes:
        String(data?.subCategory ?? '') === 'SCRATCH_MODE'
          ? normalizeScratchFormPrizes(mapPrizesToForm(data?.prizes ?? []))
          : mapPrizesToForm(data?.prizes ?? []),
    });
  } catch (error: any) {
    await openInfoDialog({
      title: '載入失敗',
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
      title: '商品已上架，無法直接儲存',
      message:
        '此商品目前狀態為「抽獎中 / 上架中」，無法直接修改內容。\n請先至列表頁將商品下架後，再進行編輯。',
      iconType: 'warning',
    });

    return false;
  }

  if (!payload.prizes.length) {
    activeTab.value = 'prizes';

    await openInfoDialog({
      title: '請至少新增 1 個獎品',
      message: '獎品清單不可為空',
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
        title: '刮刮樂獎品設定不完整',
        message: '刮刮樂模式需至少設定 1 個「大獎」。',
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
      title: '無法儲存',
      message:
        '此刮刮樂商品（店家指定模式）尚未完成大獎號碼指定，請先完成指定流程。',
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
      const createRes = await createLotteryWithPrizes(payload);
      const newId = createRes?.data?.id ?? createRes?.data;

      const pendingDesignatedPrizeNumber = toNumberOrUndefined(
        values.pendingDesignatedPrizeNumber,
      );

      /**
       * 舊版新增時：
       * 如果是 SCRATCH_STORE，且新增畫面有填大獎號碼，
       * 建立商品後會補呼叫 designatePrize。
       */
      if (
        isScratchStoreMode(values) &&
        pendingDesignatedPrizeNumber != null &&
        newId
      ) {
        // 從建立回應取得大獎 prizeId（新 designations 格式必要欄位）
        const createdGrandPrize = (
          (createRes?.data?.prizes ?? []) as any[]
        ).find((p: any) => p.isGrandPrize === true);

        const grandPrizeIdForDesignate = createdGrandPrize?.id;

        if (!grandPrizeIdForDesignate) {
          await openInfoDialog({
            title: '大獎號碼指定失敗',
            message:
              '商品已建立，但無法取得大獎 ID。請至編輯頁手動指定大獎號碼。',
            iconType: 'warning',
          });

          router.push(LIST_PATH);
          return;
        }

        try {
          await designatePrize(String(newId), {
            designations: [
              {
                revealedNumber: pendingDesignatedPrizeNumber,
                prizeId: grandPrizeIdForDesignate,
              },
            ],
          });
        } catch (designateError: any) {
          await openInfoDialog({
            title: '大獎號碼指定失敗',
            message: `商品已建立，但大獎號碼指定失敗：${getErrorMessage(
              designateError,
              '請到編輯頁重試',
            )}`,
            iconType: 'warning',
          });

          router.push(LIST_PATH);
          return;
        }
      }

      await openInfoDialog({
        title: '新增成功',
        message: '商品與獎品已建立完成',
        iconType: 'success',
      });

      router.push(LIST_PATH);
      return;
    }

    await updateLotteryWithPrizes(id.value!, payload);

    await openInfoDialog({
      title: '更新成功',
      message: '商品與獎品已更新',
      iconType: 'success',
    });

    router.push(LIST_PATH);
  } catch (error: any) {
    await openInfoDialog({
      title: '儲存失敗',
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

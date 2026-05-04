<!-- src/views/lottery/LotteryWithPrizesForm.vue -->
<template>
  <MCard>
    <FormTitle title="一番賞商品設定" />

    <Form
      ref="formRef"
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
          <component :is="tab.component" />
        </Tab>
      </Tabs>

      <div class="flex justify-end m-y-8 gap-x-12 flex-wrap">
        <MButton type="submit">送出</MButton>

        <MButton type="button" class="mbtn--gray" @click="resetForm">
          清除
        </MButton>

        <MButton type="button" class="mbtn--red" @click="goBack">
          返回
        </MButton>
      </div>
    </Form>
  </MCard>
</template>

<script setup lang="ts">
import { computed, provide, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Form, FormContext } from 'vee-validate';

import Tabs from '@/components/common/Tabs.vue';
import Tab from '@/components/common/Tab.vue';
import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormTitle from '@/components/common/FormTitle.vue';

import TabLotteryBasic from '@/components/lottery/TabLotteryBasic.vue';
import TabLotteryPrice from '@/components/lottery/TabLotteryPrice.vue';
import TabLotteryPrizes from '@/components/lottery/TabLotteryPrizes.vue';

import {
  lotteryWithPrizesInitialValues,
  lotteryWithPrizesSchema,
} from '@/validators/lotteryWithPrizesSchema';

import { openInfoDialog } from '@/utils/dialog/infoDialog';

const router = useRouter();

const formRef = ref<FormContext | null>(null);

const activeTab = ref('basic');

const updateActiveTab = (value: string) => {
  activeTab.value = value;
};

provide('activeTab', activeTab);
provide('setActiveTab', updateActiveTab);

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

/**
 * submit 後如果有錯誤，自動切到對應 tab
 */
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

  // 內容 / 圖片也併在 basic
  imageUrl: 'basic',
  galleryImagesText: 'basic',
  description: 'basic',
  content: 'basic',
  tagsText: 'basic',
  remark: 'basic',

  // 上下架也併在 basic
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

  // 抽選設定也併在 price
  maxDraws: 'price',
  allowMultiDraw: 'price',
  multiDrawOptionsText: 'price',
  designatedPrizeNumbers: 'price',
  pendingDesignatedPrizeNumber: 'price',
  hotCount: 'price',

  // 獎品清單
  prizes: 'prizes',
};

const jumpToErrorTab = (errors: Record<string, any>) => {
  const firstField = Object.keys(errors || {})[0];

  if (!firstField) return;

  activeTab.value = fieldTabMap[firstField] || 'basic';
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

const normalizePrizes = (prizes: any[] = []) => {
  return prizes
    .filter((item) => String(item?.name || '').trim())
    .map((item, index) => ({
      ...item,
      name: String(item.name || '').trim(),
      quantity: Number(item.quantity ?? 1),
      orderNum:
        item.orderNum == null || item.orderNum === ''
          ? index + 1
          : Number(item.orderNum),
      pointValue:
        item.pointValue == null || item.pointValue === ''
          ? undefined
          : Number(item.pointValue),
      isLastPrize: item.isLastPrize === true || item.isLastPrize === 'true',
      isGrandPrize: item.isGrandPrize === true || item.isGrandPrize === 'true',
    }));
};

const buildSubmitPayload = (values: any) => {
  const prizes = normalizePrizes(values.prizes || []);

  return {
    ...values,

    galleryImages: parseTextList(values.galleryImagesText, '\n'),

    tags: parseTextList(values.tagsText, ','),

    multiDrawOptions: parseNumberList(values.multiDrawOptionsText),

    designatedPrizeNumbers: parseNumberList(values.designatedPrizeNumbers),

    prizes,
  };
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

  console.log('[LotteryWithPrizesForm] submit values:', values);
  console.log('[LotteryWithPrizesForm] submit payload:', payload);

  await openInfoDialog({
    title: '提示訊息',
    message: '表單資料已印在 console.log，後續可在這裡串接儲存 API。',
    iconType: 'success',
  });
};

const onInvalidSubmit = ({ errors }: any) => {
  jumpToErrorTab(errors || {});
};

const resetForm = () => {
  formRef.value?.resetForm?.({
    values: {
      ...lotteryWithPrizesInitialValues,
    },
  });

  activeTab.value = 'basic';
};

const goBack = () => {
  router.back();
};
</script>

<style scoped lang="scss"></style>

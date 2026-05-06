<!-- src/components/lottery/TabLotteryPrice.vue -->
<template>
  <div class="tab-lottery-price">
    <!-- 價格設定 -->
    <FormSection title="價格設定">
      <div class="flex flex-wrap">
        <!-- 付款方式 -->
        <div class="w-100 p-6">
          <div class="tab-lottery-price__payment-box">
            <FormRadioTagGroup
              label="付款方式"
              name="paymentType"
              id-prefix="lottery-payment-type"
              v-model="paymentType"
              :options="paymentTypeOptions"
              :error="showError('paymentType')"
              required
            />
          </div>
        </div>

        <!-- 每抽價格 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="每抽價格"
            type="number"
            v-model="pricePerDraw"
            :error="showError('pricePerDraw')"
            required
            placeholder="請輸入每抽價格"
          />
        </div>

        <!-- 免費抽門檻：只有自製賞才顯示 -->
        <div v-if="isCustomGacha" class="w-50 w-md-100 p-6">
          <FormInput
            label="免費抽門檻"
            type="number"
            v-model="freeDrawThreshold"
            :error="showError('freeDrawThreshold')"
            placeholder="例如：10"
          />
        </div>

        <!-- 自動折扣（先選才顯示折扣價） -->
        <div class="w-50 w-md-100 p-6">
          <div class="tab-lottery-price__setting-card">
            <div class="tab-lottery-price__setting-main">
              <p class="tab-lottery-price__setting-title">自動折扣</p>
              <span
                class="tab-lottery-price__status-pill"
                :class="{
                  'tab-lottery-price__status-pill--active': isEnabled(autoDiscountEnabled),
                }"
              >
                {{ isEnabled(autoDiscountEnabled) ? '已啟用' : '未啟用' }}
              </span>
            </div>
            <div class="tab-lottery-price__setting-control">
              <FormRadioTagGroup
                label="是否啟用"
                name="autoDiscountEnabled"
                id-prefix="lottery-auto-discount"
                v-model="autoDiscountEnabled"
                :options="boolOptions"
                :error="showError('autoDiscountEnabled')"
                hideLabel
              />
            </div>
          </div>
        </div>

        <!-- 折扣價：僅在自動折扣啟用後顯示 -->
        <div v-if="isEnabled(autoDiscountEnabled)" class="w-50 w-md-100 p-6">
          <FormInput
            label="折扣價"
            type="number"
            v-model="discountedPrice"
            :error="showError('discountedPrice')"
            placeholder="請輸入折扣價"
          />
        </div>
      </div>
    </FormSection>

    <!-- 抽選設定：只有刮刮樂才需要設定抽數 -->
    <FormSection v-if="isScratchMode" title="抽選設定">
      <div class="flex flex-wrap">
        <!-- 抽數上限 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="抽數上限"
            type="number"
            v-model="maxDraws"
            :error="showError('maxDraws')"
            placeholder="請輸入抽數上限"
          />
        </div>
      </div>
    </FormSection>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useFormContext } from 'vee-validate';

import FormInput from '@/components/common/FormInput.vue';
import FormSection from '@/components/common/FormSection.vue';
import FormRadioTagGroup from '@/components/common/FormRadioTagGroup.vue';

import { paymentTypeOptions, boolOptions } from '@/constants/lotteryOptions';

const { defineField, errors, submitCount } = useFormContext();

const [category] = defineField('category');
const [subCategory] = defineField('subCategory');
const [pricePerDraw] = defineField('pricePerDraw');
const [paymentType] = defineField('paymentType');
const [freeDrawThreshold] = defineField('freeDrawThreshold');
const [discountedPrice] = defineField('discountedPrice');
const [autoDiscountEnabled] = defineField('autoDiscountEnabled');
const [maxDraws] = defineField('maxDraws');
const [hotCount] = defineField('hotCount');
const [allowMultiDraw] = defineField('allowMultiDraw');
const [multiDrawOptionsText] = defineField('multiDrawOptionsText');
const [bonusEnabled] = defineField('bonusEnabled');
const [bonusPointsPerDraw] = defineField('bonusPointsPerDraw');
const [bonusCostPerDraw] = defineField('bonusCostPerDraw');

const isCustomGacha = computed(() => category.value === 'CUSTOM_GACHA');
const isScratchMode = computed(() => subCategory.value === 'SCRATCH_MODE');

const showError = (field: string) => {
  if (!submitCount.value) return '';
  return errors.value[field] as string;
};

const isEnabled = (value: any) => {
  return value === true || value === 'true';
};
</script>

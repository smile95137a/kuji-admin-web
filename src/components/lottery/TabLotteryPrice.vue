<!-- src/components/lottery/TabLotteryPrice.vue -->
<template>
  <div class="tab-lottery-price">
    <!-- 價格設定 -->
    <div class="tab-lottery-price__section">
      <p class="tab-lottery-price__section-title">價格設定</p>

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

        <!-- 免費抽門檻 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="免費抽門檻"
            type="number"
            v-model="freeDrawThreshold"
            :error="showError('freeDrawThreshold')"
            placeholder="例如：10"
          />
        </div>

        <!-- 折扣價 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="折扣價"
            type="number"
            v-model="discountedPrice"
            :error="showError('discountedPrice')"
            placeholder="請輸入折扣價"
          />
        </div>

        <!-- 自動折扣 -->
        <div class="w-50 w-md-100 p-6">
          <div class="tab-lottery-price__setting-card">
            <div class="tab-lottery-price__setting-main">
              <div>
                <p class="tab-lottery-price__setting-title">自動折扣</p>
              </div>

              <span
                class="tab-lottery-price__status-pill"
                :class="{
                  'tab-lottery-price__status-pill--active':
                    isEnabled(autoDiscountEnabled),
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
      </div>
    </div>

    <!-- 功能設定 -->
    <div class="tab-lottery-price__section">
      <p class="tab-lottery-price__section-title">功能設定</p>

      <div class="tab-lottery-price__feature-grid">
        <!-- 紅利功能 -->
        <div class="tab-lottery-price__feature-card">
          <div class="tab-lottery-price__feature-head">
            <div>
              <p class="tab-lottery-price__setting-title">紅利功能</p>
              <p class="tab-lottery-price__setting-desc">
                設定每抽可獲得或消耗的紅利點數
              </p>
            </div>

            <span
              class="tab-lottery-price__status-pill"
              :class="{
                'tab-lottery-price__status-pill--active':
                  isEnabled(bonusEnabled),
              }"
            >
              {{ isEnabled(bonusEnabled) ? '已啟用' : '未啟用' }}
            </span>
          </div>

          <div class="tab-lottery-price__feature-control">
            <FormRadioTagGroup
              label="是否啟用"
              name="bonusEnabled"
              id-prefix="lottery-bonus-enabled"
              v-model="bonusEnabled"
              :options="boolOptions"
              :error="showError('bonusEnabled')"
              hideLabel
            />
          </div>

          <Transition name="soft-expand">
            <div
              v-if="isEnabled(bonusEnabled)"
              class="tab-lottery-price__feature-expand"
            >
              <div class="flex flex-wrap">
                <div class="w-50 w-md-100 p-6">
                  <FormInput
                    label="每抽紅利點數"
                    type="number"
                    v-model="bonusPointsPerDraw"
                    :error="showError('bonusPointsPerDraw')"
                    required
                    placeholder="請輸入每抽獲得紅利"
                  />
                </div>

                <div class="w-50 w-md-100 p-6">
                  <FormInput
                    label="每抽紅利消耗"
                    type="number"
                    v-model="bonusCostPerDraw"
                    :error="showError('bonusCostPerDraw')"
                    required
                    placeholder="請輸入每抽消耗紅利"
                  />
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- 連抽設定 -->
        <div class="tab-lottery-price__feature-card">
          <div class="tab-lottery-price__feature-head">
            <div>
              <p class="tab-lottery-price__setting-title">連抽設定</p>
            </div>

            <span
              class="tab-lottery-price__status-pill"
              :class="{
                'tab-lottery-price__status-pill--active':
                  isEnabled(allowMultiDraw),
              }"
            >
              {{ isEnabled(allowMultiDraw) ? '已啟用' : '未啟用' }}
            </span>
          </div>

          <div class="tab-lottery-price__feature-control">
            <FormRadioTagGroup
              label="是否允許連抽"
              name="allowMultiDraw"
              id-prefix="lottery-allow-multi-draw"
              v-model="allowMultiDraw"
              :options="boolOptions"
              :error="showError('allowMultiDraw')"
              hideLabel
            />
          </div>

          <Transition name="soft-expand">
            <div
              v-if="isEnabled(allowMultiDraw)"
              class="tab-lottery-price__feature-expand"
            >
              <div class="tab-lottery-price__quick-panel">
                <div class="tab-lottery-price__quick-head">
                  <p class="tab-lottery-price__quick-title">快速選項</p>
                  <p class="tab-lottery-price__setting-desc">
                    點選常用連抽數，系統會自動排序
                  </p>
                </div>

                <div class="tab-lottery-price__quick-list">
                  <button
                    v-for="n in multiDrawPresetOptions"
                    :key="n"
                    type="button"
                    class="tab-lottery-price__quick-btn"
                    :class="{
                      'tab-lottery-price__quick-btn--active':
                        hasMultiDrawOption(n),
                    }"
                    @click="toggleMultiDrawOption(n)"
                  >
                    {{ n }} 連抽
                  </button>
                </div>
              </div>

              <div class="tab-lottery-price__multi-input">
                <FormInput
                  label="連抽選項"
                  v-model="multiDrawOptionsText"
                  :error="showError('multiDrawOptionsText')"
                  placeholder="例如：10,50,100"
                  required
                />
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- 抽選設定 -->
    <div class="tab-lottery-price__section">
      <p class="tab-lottery-price__section-title">抽選設定</p>

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

        <!-- 熱門程度 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="熱門程度"
            type="number"
            v-model="hotCount"
            :error="showError('hotCount')"
            placeholder="請輸入熱門程度"
          />
        </div>

        <!-- 指定獎號 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="指定獎號"
            v-model="designatedPrizeNumbers"
            :error="showError('designatedPrizeNumbers')"
            placeholder="例如：1,2,3"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useFormContext } from 'vee-validate';

import FormInput from '@/components/common/FormInput.vue';
import FormRadioTagGroup from '@/components/common/FormRadioTagGroup.vue';

import { paymentTypeOptions, boolOptions } from '@/constants/lotteryOptions';

const { defineField, errors, submitCount } = useFormContext();

const [pricePerDraw] = defineField('pricePerDraw');
const [paymentType] = defineField('paymentType');
const [freeDrawThreshold] = defineField('freeDrawThreshold');
const [discountedPrice] = defineField('discountedPrice');
const [autoDiscountEnabled] = defineField('autoDiscountEnabled');

const [bonusEnabled] = defineField('bonusEnabled');
const [bonusPointsPerDraw] = defineField('bonusPointsPerDraw');
const [bonusCostPerDraw] = defineField('bonusCostPerDraw');

const [maxDraws] = defineField('maxDraws');
const [hotCount] = defineField('hotCount');
const [allowMultiDraw] = defineField('allowMultiDraw');
const [multiDrawOptionsText] = defineField('multiDrawOptionsText');
const [designatedPrizeNumbers] = defineField('designatedPrizeNumbers');

const multiDrawPresetOptions = [3, 5, 10, 30, 50, 100];

const showError = (field: string) => {
  if (!submitCount.value) return '';
  return errors.value[field] as string;
};

const isEnabled = (value: any) => {
  return value === true || value === 'true';
};

const getMultiDrawOptions = () => {
  return String(multiDrawOptionsText.value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const hasMultiDrawOption = (n: number) => {
  return getMultiDrawOptions().includes(String(n));
};

const sortMultiDrawOptions = (list: string[]) => {
  return [...new Set(list)]
    .filter((item) => Number.isFinite(Number(item)) && Number(item) > 0)
    .sort((a, b) => Number(a) - Number(b));
};

const toggleMultiDrawOption = (n: number) => {
  const value = String(n);
  const current = getMultiDrawOptions();

  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];

  multiDrawOptionsText.value = sortMultiDrawOptions(next).join(',');
};

/**
 * 關閉紅利時，清掉紅利欄位，避免殘留送出。
 */
watch(bonusEnabled, (enabled) => {
  if (isEnabled(enabled)) return;

  bonusPointsPerDraw.value = undefined;
  bonusCostPerDraw.value = undefined;
});

/**
 * 關閉連抽時，清掉連抽選項。
 */
watch(allowMultiDraw, (enabled) => {
  if (isEnabled(enabled)) return;

  multiDrawOptionsText.value = '';
});
</script>

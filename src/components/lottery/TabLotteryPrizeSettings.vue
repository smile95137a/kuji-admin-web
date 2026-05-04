<!-- src/components/lottery/TabLotteryPrizeSettings.vue -->
<template>
  <div class="flex flex-wrap">
    <!-- 抽數上限 -->
    <div class="w-50 w-md-100 p-6">
      <FormInput
        label="抽數上限"
        type="number"
        v-model="maxDraws"
        :error="showError('maxDraws')"
      />
    </div>

    <!-- 熱門程度 -->
    <div class="w-50 w-md-100 p-6">
      <FormInput
        label="熱門程度"
        type="number"
        v-model="hotCount"
        :error="showError('hotCount')"
      />
    </div>

    <!-- 連抽設定 -->
    <div class="w-50 w-md-100 p-6">
      <div class="lottery-prize-settings__checkbox-field">
        <p class="form__text">連抽設定</p>

        <FormCheckbox
          v-model="allowMultiDraw"
          label="允許連抽"
          :trueValue="true"
          :falseValue="false"
          :error="showError('allowMultiDraw')"
          size="md"
        />

        <p class="lottery-prize-settings__hint">
          啟用後，可設定玩家一次連續抽取的抽數選項。
        </p>
      </div>
    </div>

    <!-- 連抽選項 -->
    <div class="w-50 w-md-100 p-6" v-if="allowMultiDraw">
      <FormInput
        label="連抽選項"
        v-model="multiDrawOptionsText"
        :error="showError('multiDrawOptionsText')"
        placeholder="例如：10,20,30"
        required
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

    <!-- 待加入指定獎號 -->
    <div class="w-50 w-md-100 p-6">
      <FormInput
        label="待加入指定獎號"
        type="number"
        v-model="pendingDesignatedPrizeNumber"
        :error="showError('pendingDesignatedPrizeNumber')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFormContext } from 'vee-validate';

import FormInput from '@/components/common/FormInput.vue';
import FormCheckbox from '@/components/common/FormCheckbox.vue';

const { defineField, errors, submitCount } = useFormContext();

const [maxDraws] = defineField('maxDraws');
const [hotCount] = defineField('hotCount');
const [allowMultiDraw] = defineField('allowMultiDraw');
const [multiDrawOptionsText] = defineField('multiDrawOptionsText');
const [designatedPrizeNumbers] = defineField('designatedPrizeNumbers');
const [pendingDesignatedPrizeNumber] = defineField(
  'pendingDesignatedPrizeNumber',
);

const showError = (field: string) => {
  if (!submitCount.value) return '';
  return errors.value[field] as string;
};
</script>

<style scoped lang="scss">
.lottery-prize-settings {
  &__checkbox-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__hint {
    margin: 0;
    color: #6b7280;
    font-size: 12px;
    line-height: 1.4;
  }
}
</style>

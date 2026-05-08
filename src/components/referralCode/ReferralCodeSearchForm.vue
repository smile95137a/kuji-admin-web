<!-- src/components/referralCode/ReferralCodeSearchForm.vue -->
<template>
  <div class="referral-code-search-form">
    <div class="referral-code-search-form__head">
      <div>
        <p class="referral-code-search-form__title">查詢條件</p>
        <p class="referral-code-search-form__sub">
          可依查詢範圍、指定店家、推薦碼關鍵字與啟用狀態查詢推薦碼。
        </p>
      </div>
    </div>

    <div class="referral-code-search-form__grid">
      <!-- 查詢範圍 -->
      <div class="referral-code-search-form__item">
        <FormSelect label="查詢範圍" v-model="scope" :options="scopeOptions" />
      </div>

      <!-- 指定店家 -->
      <div class="referral-code-search-form__item">
        <FormSelect
          label="指定店家"
          v-model="storeId"
          :options="storeOptions"
          :showAll="true"
          allLabel="請選擇店家"
          :allValue="''"
          :disabled="scope !== 'STORE'"
        />
      </div>

      <!-- 推薦碼關鍵字 -->
      <div
        class="referral-code-search-form__item referral-code-search-form__item--wide"
      >
        <FormInput
          label="推薦碼關鍵字"
          v-model="codeKeyword"
          placeholder="輸入推薦碼關鍵字"
        />
      </div>

      <!-- 狀態 -->
      <div class="referral-code-search-form__item">
        <FormSelect
          label="狀態"
          v-model="enabled"
          :options="enabledOptions"
          :showAll="true"
          allLabel="全部"
          :allValue="''"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFormContext } from 'vee-validate';

import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';

interface SelectOption {
  label: string;
  value: any;
}

defineProps<{
  scopeOptions: SelectOption[];
  enabledOptions: SelectOption[];
  storeOptions: SelectOption[];
}>();

const { defineField } = useFormContext();

const [scope] = defineField('scope');
const [storeId] = defineField('storeId');
const [codeKeyword] = defineField('codeKeyword');
const [enabled] = defineField('enabled');
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as tokens;

.referral-code-search-form {
  margin-top: 12px;

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }

  &__title {
    margin: 0;
    padding-left: 10px;
    border-left: 4px solid tokens.$brand;
    color: tokens.$form-text;
    font-size: 15px;
    font-weight: 800;
    line-height: 1.4;
  }

  &__sub {
    margin: 4px 0 0;
    color: tokens.$form-muted;
    font-size: 13px;
    line-height: 1.5;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    padding: 14px;
    border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
    border-radius: 16px;
    background: color.mix(tokens.$brand-light, #fff, 7%);
  }

  &__item {
    min-width: 0;

    &--wide {
      grid-column: span 2;
    }
  }
}

@media (max-width: 1180px) {
  .referral-code-search-form {
    &__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    &__item {
      &--wide {
        grid-column: span 2;
      }
    }
  }
}

@media (max-width: 640px) {
  .referral-code-search-form {
    &__grid {
      grid-template-columns: 1fr;
    }

    &__item {
      &--wide {
        grid-column: span 1;
      }
    }
  }
}
</style>

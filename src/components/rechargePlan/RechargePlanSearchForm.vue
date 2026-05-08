<!-- src/components/rechargePlan/RechargePlanSearchForm.vue -->
<template>
  <div class="recharge-plan-search-form">
    <div class="recharge-plan-search-form__head">
      <div>
        <p class="recharge-plan-search-form__title">查詢條件</p>
        <p class="recharge-plan-search-form__sub">
          可依方案名稱關鍵字查詢儲值方案。
        </p>
      </div>
    </div>

    <div class="recharge-plan-search-form__grid">
      <div
        class="recharge-plan-search-form__item recharge-plan-search-form__item--wide"
      >
        <FormInput
          label="方案名稱"
          v-model="keyword"
          :error="keywordError"
          placeholder="輸入方案名稱關鍵字"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useField } from 'vee-validate';

import FormInput from '@/components/common/FormInput.vue';

const { value: keyword, errorMessage: keywordError } =
  useField<string>('keyword');
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as tokens;

.recharge-plan-search-form {
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
  .recharge-plan-search-form {
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
  .recharge-plan-search-form {
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

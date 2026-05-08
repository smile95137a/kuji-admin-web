<!-- src/components/member/FrontendUserSearchForm.vue -->
<template>
  <div class="frontend-user-search-form">
    <div class="frontend-user-search-form__head">
      <div>
        <p class="frontend-user-search-form__title">查詢條件</p>
        <p class="frontend-user-search-form__sub">
          可依 Email、暱稱、手機號碼、狀態、登入方式與金幣區間查詢會員。
        </p>
      </div>
    </div>

    <div class="frontend-user-search-form__grid">
      <!-- Email -->
      <div
        class="frontend-user-search-form__item frontend-user-search-form__item--wide"
      >
        <FormInput
          label="Email"
          v-model="email"
          :error="emailError"
          placeholder="模糊查詢"
        />
      </div>

      <!-- Nickname -->
      <div class="frontend-user-search-form__item">
        <FormInput
          label="暱稱"
          v-model="nickname"
          :error="nicknameError"
          placeholder="模糊查詢"
        />
      </div>

      <!-- Phone -->
      <div class="frontend-user-search-form__item">
        <FormInput
          label="手機號碼"
          v-model="phone"
          :error="phoneError"
          placeholder="模糊查詢"
        />
      </div>

      <!-- Status -->
      <div class="frontend-user-search-form__item">
        <FormSelect
          label="狀態"
          v-model="status"
          :options="statusOptions"
          :error="statusError"
          :showAll="true"
          allLabel="全部"
          allValue=""
        />
      </div>

      <!-- Provider -->
      <div class="frontend-user-search-form__item">
        <FormSelect
          label="登入方式"
          v-model="provider"
          :options="providerOptions"
          :error="providerError"
          :showAll="true"
          allLabel="全部"
          allValue=""
        />
      </div>

      <!-- GoldCoinsMin -->
      <div class="frontend-user-search-form__item">
        <FormInput
          label="金幣最小值"
          type="number"
          v-model="goldCoinsMin"
          :error="goldCoinsMinError"
          placeholder="例如：0"
        />
      </div>

      <!-- GoldCoinsMax -->
      <div class="frontend-user-search-form__item">
        <FormInput
          label="金幣最大值"
          type="number"
          v-model="goldCoinsMax"
          :error="goldCoinsMaxError"
          placeholder="例如：99999"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useField } from 'vee-validate';

import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';

interface SelectOption {
  label: string;
  value: any;
}

defineProps<{
  statusOptions: SelectOption[];
  providerOptions: SelectOption[];
}>();

/** fields（必須對齊 FrontendUserList.vue 的 initValues / condition） */
const { value: email, errorMessage: emailError } = useField<string>('email');
const { value: nickname, errorMessage: nicknameError } =
  useField<string>('nickname');
const { value: phone, errorMessage: phoneError } = useField<string>('phone');
const { value: status, errorMessage: statusError } = useField<string>('status');
const { value: provider, errorMessage: providerError } =
  useField<string>('provider');

const { value: goldCoinsMin, errorMessage: goldCoinsMinError } =
  useField<any>('goldCoinsMin');
const { value: goldCoinsMax, errorMessage: goldCoinsMaxError } =
  useField<any>('goldCoinsMax');
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as tokens;

.frontend-user-search-form {
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
  .frontend-user-search-form {
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
  .frontend-user-search-form {
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

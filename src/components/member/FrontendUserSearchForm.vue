<!-- src/components/member/FrontendUserSearchForm.vue -->
<template>
  <div class="flex flex-wrap">
    <!-- Email -->
    <div class="w-50 w-md-100 p-6">
      <FormInput
        label="Email"
        v-model="email"
        :error="emailError"
        placeholder="模糊查詢"
      />
    </div>

    <!-- Nickname -->
    <div class="w-50 w-md-100 p-6">
      <FormInput
        label="暱稱"
        v-model="nickname"
        :error="nicknameError"
        placeholder="模糊查詢"
      />
    </div>

    <!-- Phone -->
    <div class="w-50 w-md-100 p-6">
      <FormInput
        label="手機號碼"
        v-model="phone"
        :error="phoneError"
        placeholder="模糊查詢"
      />
    </div>

    <!-- Status -->
    <div class="w-50 w-md-100 p-6">
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
    <div class="w-50 w-md-100 p-6">
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
    <div class="w-50 w-md-100 p-6">
      <FormInput
        label="金幣最小值"
        type="number"
        v-model="goldCoinsMin"
        :error="goldCoinsMinError"
        placeholder="例如：0"
      />
    </div>

    <!-- GoldCoinsMax -->
    <div class="w-50 w-md-100 p-6">
      <FormInput
        label="金幣最大值"
        type="number"
        v-model="goldCoinsMax"
        :error="goldCoinsMaxError"
        placeholder="例如：99999"
      />
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

<style scoped></style>

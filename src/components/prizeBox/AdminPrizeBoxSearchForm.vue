<!-- src/components/prizeBox/AdminPrizeBoxSearchForm.vue -->
<template>
  <div class="flex flex-wrap">
    <div class="w-50 w-md-100 p-6">
      <FormInput
        label="User ID"
        v-model="userId"
        :error="userIdError"
        placeholder="輸入玩家 userId"
        required
      />
    </div>

    <div class="w-50 w-md-100 p-6">
      <FormSelect
        label="顯示模式"
        v-model="mode"
        :options="modeOptions"
        :error="modeError"
        required
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useField } from 'vee-validate';

import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';

interface SelectOption {
  label: string;
  value: any;
}

const { value: userId, errorMessage: userIdError } = useField<string>('userId');
const { value: mode, errorMessage: modeError } = useField<string>('mode');

const modeOptions = computed<SelectOption[]>(() => [
  { label: '按店家分組（Summary）', value: 'summary' },
  { label: '明細（Detail）', value: 'detail' },
]);
</script>

<style scoped></style>

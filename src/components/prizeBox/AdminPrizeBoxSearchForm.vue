<!-- src/components/prizeBox/AdminPrizeBoxSearchForm.vue -->
<template>
  <div class="flex flex-wrap">
    <!-- 會員選擇器 -->
    <div class="w-100 p-6">
      <MemberPicker
        v-model="userId"
        v-model:selectedLabel="memberLabel"
        :required="true"
        :error="userIdError"
      />
    </div>

    <!-- 顯示模式 -->
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
import { ref, computed } from 'vue';
import { useField } from 'vee-validate';

import MemberPicker from '@/components/common/MemberPicker.vue';
import FormSelect from '@/components/common/FormSelect.vue';

interface SelectOption {
  label: string;
  value: any;
}

const { value: userId, errorMessage: userIdError } = useField<string>('userId');
const { value: mode, errorMessage: modeError } = useField<string>('mode');

const memberLabel = ref('');

const modeOptions = computed<SelectOption[]>(() => [
  { label: '按店家分組（Summary）', value: 'summary' },
  { label: '明細（Detail）', value: 'detail' },
]);
</script>

<style scoped></style>

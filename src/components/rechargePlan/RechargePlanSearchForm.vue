<!-- src/components/rechargePlan/RechargePlanSearchForm.vue -->
<template>
  <div class="flex flex-wrap">
    <div class="w-50 w-md-100 p-6">
      <FormInput
        label="方案名稱"
        v-model="keyword"
        :error="keywordError"
        placeholder="輸入方案名稱關鍵字"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useField } from 'vee-validate';
import FormInput from '@/components/common/FormInput.vue';

const { value: keyword, errorMessage: keywordError } =
  useField<string>('keyword');
</script>

<style scoped></style>

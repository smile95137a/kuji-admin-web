<!-- src/components/rechargePlan/RechargePlanSearchForm.vue -->
<template>
  <div class="flex flex-wrap">
    <div class="w-50 w-md-100 p-6">
      <FormInput
        label="關鍵字"
        v-model="keyword"
        :error="keywordError"
        placeholder="目前後端為全查；此欄位先保留（之後可改成前端過濾/後端條件）"
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

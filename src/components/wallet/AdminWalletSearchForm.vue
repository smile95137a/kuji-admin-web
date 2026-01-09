<template>
  <div class="flex flex-wrap">
    <div class="w-50 w-md-100 p-6">
      <FormInput
        label="User ID"
        v-model="userId"
        :error="userIdError"
        placeholder="輸入要查詢的 userId"
        required
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useField } from 'vee-validate';
import FormInput from '@/components/common/FormInput.vue';

const { value: userId, errorMessage: userIdError } = useField<string>('userId');
</script>

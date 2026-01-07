<template>
  <div class="flex flex-wrap">
    <div class="w-33 w-md-100 p-6">
      <FormInput label="關鍵字" v-model="keyword" placeholder="帳號/名稱" />
    </div>

    <div class="w-33 w-md-100 p-6">
      <FormInput label="店家 ID" v-model="storeId" placeholder="storeId" />
    </div>

    <div class="w-33 w-md-100 p-6">
      <FormSelect
        label="狀態"
        v-model="status"
        :options="statusOptions"
        :showAll="false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import { useForm } from 'vee-validate';

defineProps<{
  statusOptions: SelectOption[];
}>();

const { defineField } = useForm();

// name 必須對應 AdminUserList.vue 的 initialValues 欄位
const [keyword] = defineField('keyword');
const [storeId] = defineField('storeId');
const [status] = defineField('status');
</script>

<style scoped></style>

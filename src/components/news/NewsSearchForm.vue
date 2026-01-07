<!-- src/components/news/NewsSearchForm.vue -->
<template>
  <div class="flex flex-wrap">
    <!-- 狀態 -->
    <div class="w-50 w-md-100 p-6">
      <FormSelect
        label="狀態"
        v-model="status"
        :options="statusOptions"
        placeholder="請選擇狀態"
      />
    </div>

    <!-- 類型 -->
    <div class="w-50 w-md-100 p-6">
      <FormSelect
        label="公告類型"
        v-model="type"
        :options="typeOptions"
        placeholder="請選擇類型"
      />
    </div>

    <!-- 標題關鍵字 -->
    <div class="w-50 w-md-100 p-6">
      <FormInput
        label="標題關鍵字"
        v-model="keyword"
        placeholder="輸入關鍵字搜尋"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import { useForm } from 'vee-validate';
import FormSelect from '@/components/common/FormSelect.vue';
import FormInput from '@/components/common/FormInput.vue';

defineProps<{
  statusOptions: SelectOption[];
}>();

/* ===========================
   使用父層的 useForm Context
=========================== */
const { defineField } = useForm();

/* 單一欄位 defineField */
const [status] = defineField('status');
const [type] = defineField('type');
const [keyword] = defineField('keyword');

/* 類型選單（固定） */
const typeOptions = [
  { label: '全部', value: '' },
  { label: '系統', value: 'system' },
  { label: '活動', value: 'event' },
  { label: '更新', value: 'update' },
];
</script>

<style scoped></style>

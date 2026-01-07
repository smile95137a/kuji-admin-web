<!-- src/components/member/MemberSearchForm.vue -->
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

    <!-- 關鍵字（姓名 / 信箱） -->
    <div class="w-50 w-md-100 p-6">
      <FormInput
        label="關鍵字"
        v-model="keyword"
        placeholder="輸入姓名或 Email"
      />
    </div>

    <!-- 手機 -->
    <div class="w-50 w-md-100 p-6">
      <FormInput label="手機" v-model="phone" placeholder="輸入手機號碼" />
    </div>

    <!-- 會員等級 -->
    <div class="w-50 w-md-100 p-6">
      <FormSelect
        label="會員等級"
        v-model="level"
        :options="levelOptions"
        placeholder="請選擇等級"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import { useForm } from 'vee-validate';

import FormSelect from '@/components/common/FormSelect.vue';
import FormInput from '@/components/common/FormInput.vue';

/* 父層傳入 */
defineProps<{
  statusOptions: SelectOption[];
}>();

/* 使用父層 Form context */
const { defineField } = useForm();

/* 定義欄位 (對應 memberStore.searchCondition) */
const [status] = defineField('status');
const [keyword] = defineField('keyword');
const [phone] = defineField('phone');
const [level] = defineField('level');

/* 會員等級選項（可依後端修改） */
const levelOptions: SelectOption[] = [
  { label: '全部', value: '' },
  { label: '一般會員', value: 'normal' },
  { label: '白金會員', value: 'platinum' },
  { label: 'VIP 會員', value: 'vip' },
];
</script>

<style scoped></style>

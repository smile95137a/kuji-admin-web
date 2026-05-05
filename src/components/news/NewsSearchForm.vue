<!-- src/components/news/NewsSearchForm.vue -->
<template>
  <div class="flex flex-wrap">
    <!-- 狀態 -->
    <div class="w-50 w-md-100 p-6">
      <FormSelect
        label="狀態"
        v-model="status"
        :options="statusOptions"
        :error="errors.status"
        :showAll="true"
        allLabel="全部"
        :allValue="''"
      />
    </div>

    <!-- 標題 -->
    <div class="w-50 w-md-100 p-6">
      <FormInput
        label="標題"
        v-model="title"
        :error="errors.title"
        maxlength="50"
        placeholder="請輸入標題"
      />
    </div>
  </div>

  <div class="flex flex-wrap">
    <!-- 內容關鍵字 -->
    <div class="w-50 w-md-100 p-6">
      <FormInput
        label="內容關鍵字"
        v-model="keyword"
        :error="errors.keyword"
        maxlength="50"
        placeholder="請輸入內文關鍵字"
      />
    </div>

    <!-- 建立日期 -->
    <div class="w-50 w-md-100 p-6">
      <p class="form__text">建立日期</p>

      <div class="flex items-center gap-x-8">
        <FormInput
          type="date"
          v-model="createdAtStart"
          :error="errors.createdAtStart"
          :show-label="false"
        />

        <span>~</span>

        <FormInput
          type="date"
          v-model="createdAtEnd"
          :error="errors.createdAtEnd"
          :show-label="false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFormContext } from 'vee-validate';

import FormSelect from '@/components/common/FormSelect.vue';
import FormInput from '@/components/common/FormInput.vue';

defineProps<{
  statusOptions: SelectOption[];
}>();

const { defineField, errors } = useFormContext();

const [status] = defineField('status');
const [title] = defineField('title');
const [keyword] = defineField('keyword');
const [createdAtStart] = defineField('createdAtStart');
const [createdAtEnd] = defineField('createdAtEnd');
</script>

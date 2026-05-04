<!-- src/components/marquee/MarqueeSearchForm.vue -->
<template>
  <div class="flex flex-wrap">
    <!-- 狀態 -->
    <div class="w-50 w-md-100 p-6">
      <FormSelect
        label="狀態"
        v-model="active"
        :options="activeOptions"
        :error="errors.active"
        :showAll="true"
        allLabel="全部"
        :allValue="''"
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
        maxlength="100"
        placeholder="請輸入內容關鍵字"
      />
    </div>
  </div>
  <div class="flex flex-wrap">
    <!-- 開始日期 -->
    <div class="w-50 w-md-100 p-6">
      <p class="form__text">開始日期</p>

      <div class="flex items-center gap-x-8">
        <FormInput
          type="date"
          v-model="startDate"
          :error="errors.startDate"
          :show-label="false"
        />

        <span>~</span>

        <FormInput
          type="date"
          v-model="endDate"
          :error="errors.endDate"
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
  activeOptions: SelectOption[];
}>();

const { defineField, errors } = useFormContext();

const [active] = defineField('active');
const [keyword] = defineField('keyword');
const [startDate] = defineField('startDate');
const [endDate] = defineField('endDate');
</script>

<!-- src/components/banner/BannerSearchForm.vue -->
<template>
  <div class="flex flex-wrap">
    <!-- 狀態 -->
    <div class="w-25 w-md-50 w-sm-100 p-6">
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

    <!-- 店家 -->
    <div class="w-25 w-md-50 w-sm-100 p-6">
      <FormSelect
        label="店家"
        v-model="storeId"
        :options="storeOptions"
        :error="errors.storeId"
        :showAll="true"
        allLabel="全部"
        :allValue="''"
      />
    </div>

    <!-- 標題 -->
  </div>
  <div class="flex flex-wrap">
    <div class="w-50 w-md-100 p-6">
      <FormInput
        label="標題"
        v-model="title"
        :error="errors.title"
        maxlength="50"
      />
    </div>
  </div>
  <div class="flex flex-wrap">
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
  storeOptions: SelectOption[];
}>();

const { defineField, errors } = useFormContext();

const [status] = defineField('status');
const [title] = defineField('title');
const [storeId] = defineField('storeId');
const [createdAtStart] = defineField('createdAtStart');
const [createdAtEnd] = defineField('createdAtEnd');
</script>

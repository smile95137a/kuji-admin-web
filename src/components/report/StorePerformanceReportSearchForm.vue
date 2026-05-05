<!-- src/components/report/StorePerformanceReportSearchForm.vue -->
<template>
  <div class="flex flex-wrap">
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
        :disabled="storeFilterDisabled"
      />
    </div>

    <!-- 開始日期 -->
    <div class="w-25 w-md-50 w-sm-100 p-6">
      <FormInput
        label="開始日期"
        type="date"
        v-model="startDate"
        :error="errors.startDate"
      />
    </div>

    <!-- 結束日期 -->
    <div class="w-25 w-md-50 w-sm-100 p-6">
      <FormInput
        label="結束日期"
        type="date"
        v-model="endDate"
        :error="errors.endDate"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFormContext } from 'vee-validate';

import FormSelect from '@/components/common/FormSelect.vue';
import FormInput from '@/components/common/FormInput.vue';

defineProps<{
  storeOptions: any[];
  storeFilterDisabled?: boolean;
}>();

const { defineField, errors } = useFormContext();

const [storeId] = defineField('storeId');
const [startDate] = defineField('startDate');
const [endDate] = defineField('endDate');
</script>

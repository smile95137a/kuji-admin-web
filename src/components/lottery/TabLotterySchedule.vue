<!-- src/components/lottery/TabLotterySchedule.vue -->
<template>
  <div class="flex flex-wrap">
    <div class="w-50 w-md-100 p-6">
      <FormInput
        label="預約上架時間"
        type="datetime-local"
        v-model="scheduledAt"
        :error="showError('scheduledAt')"
      />
    </div>

    <div class="w-50 w-md-100 p-6">
      <FormSelect
        label="下架策略"
        v-model="delistStrategy"
        :options="delistStrategyOptions"
        :error="showError('delistStrategy')"
        :showAll="true"
        allLabel="不指定"
        :allValue="''"
      />
    </div>

    <div class="w-50 w-md-100 p-6">
      <FormInput
        label="開始時間"
        type="datetime-local"
        v-model="startTime"
        :error="showError('startTime')"
      />
    </div>

    <div class="w-50 w-md-100 p-6">
      <FormInput
        label="結束時間"
        type="datetime-local"
        v-model="endTime"
        :error="showError('endTime')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFormContext } from 'vee-validate';

import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';

interface SelectOption {
  label: string;
  value: any;
}

const { defineField, errors, submitCount } = useFormContext();

const [scheduledAt] = defineField('scheduledAt');
const [startTime] = defineField('startTime');
const [endTime] = defineField('endTime');
const [delistStrategy] = defineField('delistStrategy');

const showError = (field: string) => {
  if (!submitCount.value) return '';
  return errors.value[field] as string;
};

const delistStrategyOptions: SelectOption[] = [
  { label: '售完下架', value: 'SOLD_OUT' },
  { label: '到期下架', value: 'EXPIRED' },
  { label: '手動下架', value: 'MANUAL' },
];
</script>

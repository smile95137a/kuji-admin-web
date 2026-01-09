<!-- src/components/order/AdminOrderSearchForm.vue -->
<template>
  <div class="flex flex-wrap">
    <div class="w-25 w-md-50 w-sm-100 p-6">
      <FormInput
        label="訂單編號"
        v-model="orderNo"
        :error="orderNoError"
        placeholder="輸入訂單編號"
      />
    </div>

    <div class="w-25 w-md-50 w-sm-100 p-6">
      <FormInput
        label="關鍵字"
        v-model="keyword"
        :error="keywordError"
        placeholder="買家姓名 / Email"
      />
    </div>

    <div class="w-25 w-md-50 w-sm-100 p-6">
      <FormSelect
        label="狀態"
        v-model="status"
        :options="statusOptions"
        :error="statusError"
        :showAll="true"
        allLabel="全部"
        allValue=""
      />
    </div>

    <div class="w-25 w-md-50 w-sm-100 p-6">
      <FormInput
        label="物流單號"
        v-model="trackingNo"
        :error="trackingNoError"
        placeholder="輸入物流單號"
      />
    </div>

    <div class="w-50 w-md-100 p-6">
      <p class="form__text">建立日期</p>
      <div class="flex gap-x-12">
        <div class="flex-1">
          <FormInput
            type="date"
            :showLabel="false"
            v-model="createdAtStart"
            :error="createdAtStartError"
          />
        </div>
        <div class="flex items-center">~</div>
        <div class="flex-1">
          <FormInput
            type="date"
            :showLabel="false"
            v-model="createdAtEnd"
            :error="createdAtEndError"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useField } from 'vee-validate';

import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';

interface SelectOption {
  label: string;
  value: any;
}

defineProps<{
  statusOptions: SelectOption[];
}>();

const { value: orderNo, errorMessage: orderNoError } =
  useField<string>('orderNo');
const { value: keyword, errorMessage: keywordError } =
  useField<string>('keyword');
const { value: status, errorMessage: statusError } = useField<string>('status');
const { value: trackingNo, errorMessage: trackingNoError } =
  useField<string>('trackingNo');
const { value: createdAtStart, errorMessage: createdAtStartError } =
  useField<string>('createdAtStart');
const { value: createdAtEnd, errorMessage: createdAtEndError } =
  useField<string>('createdAtEnd');
</script>

<style scoped></style>

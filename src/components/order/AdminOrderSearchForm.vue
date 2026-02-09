<!-- src/components/order/AdminOrderSearchForm.vue -->
<template>
  <div class="flex flex-wrap">
    <!-- 訂單編號 -->
    <div class="w-25 w-md-50 w-sm-100 p-6">
      <FormInput
        label="訂單編號"
        v-model="orderNo"
        :error="orderNoError"
        placeholder="輸入訂單編號（模糊查詢）"
      />
    </div>

    <!-- 訂單狀態 -->
    <div class="w-25 w-md-50 w-sm-100 p-6">
      <FormSelect
        label="訂單狀態"
        v-model="shippingStatus"
        :options="statusOptions"
        :error="shippingStatusError"
        :showAll="true"
        allLabel="全部"
        :allValue="''"
      />
    </div>

    <!-- 玩家 ID -->
    <div class="w-25 w-md-50 w-sm-100 p-6">
      <FormInput
        label="玩家 ID"
        v-model="userId"
        :error="userIdError"
        placeholder="輸入玩家 ID"
      />
    </div>

    <!-- 配送方式 -->
    <div class="w-25 w-md-50 w-sm-100 p-6">
      <FormSelect
        label="配送方式"
        v-model="shippingMethod"
        :options="shippingMethodOptions"
        :error="shippingMethodError"
        :showAll="true"
        allLabel="全部"
        :allValue="''"
      />
    </div>

    <!-- 收件人姓名 -->
    <div class="w-25 w-md-50 w-sm-100 p-6">
      <FormInput
        label="收件人姓名"
        v-model="recipientName"
        :error="recipientNameError"
        placeholder="輸入收件人姓名（模糊查詢）"
      />
    </div>

    <!-- 收件人電話 -->
    <div class="w-25 w-md-50 w-sm-100 p-6">
      <FormInput
        label="收件人電話"
        v-model="recipientPhone"
        :error="recipientPhoneError"
        placeholder="輸入收件人電話（模糊查詢）"
      />
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

const { value: shippingStatus, errorMessage: shippingStatusError } =
  useField<string>('shippingStatus');

const { value: userId, errorMessage: userIdError } = useField<string>('userId');

const { value: shippingMethod, errorMessage: shippingMethodError } =
  useField<string>('shippingMethod');

const { value: recipientName, errorMessage: recipientNameError } =
  useField<string>('recipientName');

const { value: recipientPhone, errorMessage: recipientPhoneError } =
  useField<string>('recipientPhone');

const shippingMethodOptions: SelectOption[] = [
  { label: '宅配', value: 'HOME_DELIVERY' },
  { label: '超商取貨', value: 'CONVENIENCE_STORE' },
];
</script>

<style scoped></style>

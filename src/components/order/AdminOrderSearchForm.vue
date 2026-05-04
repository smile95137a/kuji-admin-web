<!-- src/components/order/AdminOrderSearchForm.vue -->
<template>
  <div class="flex flex-wrap">
    <!-- 訂單編號 -->
    <div class="w-25 w-md-50 w-sm-100 p-6">
      <FormInput
        label="訂單編號"
        v-model="orderNo"
        :error="errors.orderNo"
        maxlength="50"
        placeholder="輸入訂單編號（模糊查詢）"
      />
    </div>

    <!-- 訂單狀態 -->
    <div class="w-25 w-md-50 w-sm-100 p-6">
      <FormSelect
        label="訂單狀態"
        v-model="shippingStatus"
        :options="statusOptions"
        :error="errors.shippingStatus"
        :showAll="true"
        allLabel="全部"
        :allValue="''"
      />
    </div>

    <!-- 玩家關鍵字 -->
    <div class="w-25 w-md-50 w-sm-100 p-6">
      <FormInput
        label="玩家"
        v-model="userKeyword"
        :error="errors.userKeyword"
        maxlength="100"
        placeholder="暱稱 / Email / 手機"
      />
    </div>

    <!-- 配送方式 -->
    <div class="w-25 w-md-50 w-sm-100 p-6">
      <FormSelect
        label="配送方式"
        v-model="shippingMethod"
        :options="shippingMethodOptions"
        :error="errors.shippingMethod"
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
        :error="errors.recipientName"
        maxlength="50"
        placeholder="輸入收件人姓名"
      />
    </div>

    <!-- 收件人電話 -->
    <div class="w-25 w-md-50 w-sm-100 p-6">
      <FormInput
        label="收件人電話"
        v-model="recipientPhone"
        :error="errors.recipientPhone"
        maxlength="30"
        placeholder="輸入收件人電話"
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

defineProps<{
  statusOptions: SelectOption[];
}>();

const { defineField, errors } = useFormContext();

const [orderNo] = defineField('orderNo');
const [shippingStatus] = defineField('shippingStatus');
const [userKeyword] = defineField('userKeyword');
const [shippingMethod] = defineField('shippingMethod');
const [recipientName] = defineField('recipientName');
const [recipientPhone] = defineField('recipientPhone');

const shippingMethodOptions: SelectOption[] = [
  { label: '宅配', value: 'HOME_DELIVERY' },
  { label: '超商取貨', value: 'CONVENIENCE_STORE' },
];
</script>

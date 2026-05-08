<!-- src/components/order/AdminOrderSearchForm.vue -->
<template>
  <div class="admin-order-search">
    <div class="admin-order-search__head">
      <div>
        <p class="admin-order-search__title">查詢條件</p>
        <p class="admin-order-search__sub">
          可依訂單編號、狀態、玩家、配送方式與收件人資料查詢訂單。
        </p>
      </div>
    </div>

    <div class="admin-order-search__grid">
      <!-- 訂單編號 -->
      <div class="admin-order-search__item">
        <FormInput
          label="訂單編號"
          v-model="orderNo"
          :error="errors.orderNo"
          maxlength="50"
          placeholder="輸入訂單編號（模糊查詢）"
        />
      </div>

      <!-- 訂單狀態 -->
      <div class="admin-order-search__item">
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
      <div class="admin-order-search__item">
        <FormInput
          label="玩家"
          v-model="userKeyword"
          :error="errors.userKeyword"
          maxlength="100"
          placeholder="暱稱 / Email / 手機"
        />
      </div>

      <!-- 配送方式 -->
      <div class="admin-order-search__item">
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
      <div class="admin-order-search__item">
        <FormInput
          label="收件人姓名"
          v-model="recipientName"
          :error="errors.recipientName"
          maxlength="50"
          placeholder="輸入收件人姓名"
        />
      </div>

      <!-- 收件人電話 -->
      <div class="admin-order-search__item">
        <FormInput
          label="收件人電話"
          v-model="recipientPhone"
          :error="errors.recipientPhone"
          maxlength="30"
          placeholder="輸入收件人電話"
        />
      </div>
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

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as tokens;

.admin-order-search {
  margin-top: 12px;

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }

  &__title {
    margin: 0;
    padding-left: 10px;
    border-left: 4px solid tokens.$brand;
    color: tokens.$form-text;
    font-size: 15px;
    font-weight: 800;
    line-height: 1.4;
  }

  &__sub {
    margin: 4px 0 0;
    color: tokens.$form-muted;
    font-size: 13px;
    line-height: 1.5;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    padding: 14px;
    border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
    border-radius: 16px;
    background: color.mix(tokens.$brand-light, #fff, 7%);
  }

  &__item {
    min-width: 0;
  }
}

@media (max-width: 1180px) {
  .admin-order-search {
    &__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
}

@media (max-width: 640px) {
  .admin-order-search {
    &__grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>

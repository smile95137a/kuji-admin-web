<script setup lang="ts">
import { computed } from 'vue';
import { useFormContext } from 'vee-validate';

import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';

type SelectOption = {
  label: string;
  value: any;
};

const props = defineProps<{
  storeOptions: SelectOption[];
  categoryOptions: SelectOption[];
  playModeOptions: SelectOption[];
  statusOptions: SelectOption[];
}>();

const { defineField, errors } = useFormContext();

const [storeId] = defineField('storeId');

const [title] = defineField('title');
const [category] = defineField('category');
const [playMode] = defineField('playMode');
const [subCategory] = defineField('subCategory');
const [status] = defineField('status');

const [pricePerDraw] = defineField('pricePerDraw');
const [maxDraws] = defineField('maxDraws');

const [orderNum] = defineField('orderNum');
const [hotCount] = defineField('hotCount');
const [theme] = defineField('theme');

const isCustomGacha = computed(() => category.value === 'CUSTOM_GACHA');
</script>

<template>
  <div class="w-50 w-md-100 p-6">
    <FormSelect
      label="所屬店家"
      v-model="storeId"
      :options="props.storeOptions"
      :error="errors.storeId"
      :showAll="true"
      allLabel="請選擇"
      :allValue="''"
    />
  </div>

  <div class="w-50 w-md-100 p-6">
    <FormInput
      label="商品名稱"
      v-model="title"
      :error="errors.title"
      required
    />
  </div>

  <!-- category -->
  <div class="w-50 w-md-100 p-6">
    <FormSelect
      label="分類"
      v-model="category"
      :options="props.categoryOptions"
      :error="errors.category"
      required
    />
  </div>

  <!-- playMode -->
  <div class="w-50 w-md-100 p-6">
    <FormSelect
      label="遊玩模式"
      v-model="playMode"
      :options="props.playModeOptions"
      :error="errors.playMode"
    />
  </div>

  <!-- subCategory: CUSTOM_GACHA 才顯示 -->
  <div class="w-50 w-md-100 p-6" v-if="isCustomGacha">
    <FormSelect
      label="自製賞子類型（CUSTOM_GACHA）"
      v-model="subCategory"
      :options="props.playModeOptions"
      :error="errors.subCategory"
      placeholder="LOTTERY_MODE / SCRATCH_MODE"
    />
  </div>

  <!-- status -->
  <div class="w-50 w-md-100 p-6">
    <FormSelect
      label="商品狀態"
      v-model="status"
      :options="props.statusOptions"
      :error="errors.status"
    />
  </div>

  <!-- pricePerDraw -->
  <div class="w-50 w-md-100 p-6">
    <FormInput
      label="每抽價格"
      v-model="pricePerDraw"
      :error="errors.pricePerDraw"
      type="number"
      required
    />
  </div>

  <!-- maxDraws -->
  <div class="w-50 w-md-100 p-6">
    <FormInput
      label="總抽數上限（0=無限制）"
      v-model="maxDraws"
      :error="errors.maxDraws"
      type="number"
    />
  </div>

  <!-- orderNum -->
  <div class="w-50 w-md-100 p-6">
    <FormInput
      label="顯示排序（數字越小越前面）"
      v-model="orderNum"
      :error="errors.orderNum"
      type="number"
    />
  </div>

  <!-- hotCount -->
  <div class="w-50 w-md-100 p-6">
    <FormInput
      label="熱門程度（熱門標籤用）"
      v-model="hotCount"
      :error="errors.hotCount"
      type="number"
    />
  </div>

  <!-- theme -->
  <div class="w-50 w-md-100 p-6">
    <FormInput
      label="主題分類（火影/航海王/鬼滅等）"
      v-model="theme"
      :error="errors.theme"
    />
  </div>
</template>

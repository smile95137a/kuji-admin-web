<template>
  <div class="flex flex-wrap">
    <div class="w-25 w-md-50 w-sm-100 p-6">
      <FormInput
        label="User ID"
        v-model="userId"
        :error="userIdError"
        placeholder="可空"
      />
    </div>

    <div class="w-25 w-md-50 w-sm-100 p-6">
      <FormSelect
        label="幣別"
        v-model="coinType"
        :options="coinTypeOptionsWithAll"
        :error="coinTypeError"
      />
    </div>

    <div class="w-25 w-md-50 w-sm-100 p-6">
      <FormSelect
        label="交易類型"
        v-model="type"
        :options="txTypeOptionsWithAll"
        :error="typeError"
      />
    </div>

    <div class="w-50 w-md-100 p-6">
      <p class="form__text">交易日期</p>
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
import { computed } from 'vue';
import { useField } from 'vee-validate';

import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';

interface SelectOption {
  label: string;
  value: any;
}

const props = defineProps<{ coinTypeOptions: SelectOption[]; txTypeOptions?: SelectOption[] }>();

const coinTypeOptionsWithAll = computed<SelectOption[]>(() => [
  { label: '全部', value: '' },
  ...props.coinTypeOptions,
]);

const txTypeOptionsWithAll = computed<SelectOption[]>(() => [
  { label: '全部', value: '' },
  ...(props.txTypeOptions ?? [
    { label: '儲值', value: 'RECHARGE' },
    { label: '抽獎消費', value: 'DRAW' },
    { label: '獎品回收', value: 'RECYCLE' },
    { label: '退款', value: 'REFUND' },
    { label: '系統調整', value: 'ADMIN_ADJUST' },
  ]),
]);

const { value: userId, errorMessage: userIdError } = useField<string>('userId');
const { value: coinType, errorMessage: coinTypeError } =
  useField<string>('coinType');
const { value: type, errorMessage: typeError } = useField<string>('type');
const { value: createdAtStart, errorMessage: createdAtStartError } =
  useField<string>('createdAtStart');
const { value: createdAtEnd, errorMessage: createdAtEndError } =
  useField<string>('createdAtEnd');
</script>

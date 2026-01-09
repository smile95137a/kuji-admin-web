<template>
  <div class="flex flex-wrap">
    <div class="w-50 w-md-100 p-6">
      <FormInput
        label="User ID"
        v-model="userId"
        :error="userIdError"
        placeholder="要調整的 userId"
        required
      />
    </div>

    <div class="w-50 w-md-100 p-6">
      <FormSelect
        label="幣別"
        v-model="coinType"
        :options="coinTypeOptions"
        :error="coinTypeError"
        required
      />
    </div>

    <div class="w-50 w-md-100 p-6">
      <FormInput
        label="調整金額（可負數）"
        type="number"
        v-model="amount"
        :error="amountError"
        placeholder="正數=加值；負數=扣除"
        required
      />
    </div>

    <div class="w-50 w-md-100 p-6">
      <FormInput
        label="原因（選填）"
        v-model="reason"
        :error="reasonError"
        placeholder="例如：客服補償 / 手動扣款"
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

defineProps<{ coinTypeOptions: SelectOption[] }>();

const { value: userId, errorMessage: userIdError } = useField<string>('userId');
const { value: coinType, errorMessage: coinTypeError } =
  useField<string>('coinType');
const { value: amount, errorMessage: amountError } = useField<any>('amount');
const { value: reason, errorMessage: reasonError } = useField<string>('reason');
</script>

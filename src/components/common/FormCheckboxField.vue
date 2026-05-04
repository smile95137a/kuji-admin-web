<!-- src/components/common/FormCheckboxField.vue -->
<template>
  <div class="form-checkbox-field">
    <p v-if="label" class="form-checkbox-field__label">
      {{ label }}
      <span v-if="required" class="form-checkbox-field__required">*</span>
    </p>

    <FormCheckbox
      v-model="checkboxValue"
      :label="checkboxLabel"
      :trueValue="trueValue"
      :falseValue="falseValue"
      :error="error"
      :size="size"
      :disabled="disabled"
      :required="required"
      :labelPlacement="labelPlacement"
    />

    <p v-if="hint" class="form-checkbox-field__hint">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import FormCheckbox from '@/components/common/FormCheckbox.vue';

type Size = 'sm' | 'md' | 'lg';

const props = withDefaults(
  defineProps<{
    modelValue?: any;
    label?: string;
    checkboxLabel?: string;
    hint?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    size?: Size;
    trueValue?: any;
    falseValue?: any;
    labelPlacement?: 'left' | 'right';
  }>(),
  {
    modelValue: false,
    label: '',
    checkboxLabel: '',
    hint: '',
    error: '',
    required: false,
    disabled: false,
    size: 'md',
    trueValue: true,
    falseValue: false,
    labelPlacement: 'right',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
  (e: 'change', value: any): void;
}>();

const checkboxValue = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value);
    emit('change', value);
  },
});
</script>

<style scoped lang="scss">
.form-checkbox-field {
  min-height: 72px;
  padding: 8px 0 0;

  &__label {
    margin: 0 0 8px;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }

  &__required {
    color: #dc2626;
  }

  &__hint {
    margin: 6px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: #6b7280;
  }
}
</style>

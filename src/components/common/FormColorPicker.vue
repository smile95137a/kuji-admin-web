<!-- src/components/common/FormColorPicker.vue -->
<template>
  <div class="form-color-picker">
    <p v-if="label" class="form-color-picker__label">
      {{ label }}
      <span v-if="required" class="form-color-picker__required">*</span>
    </p>

    <div
      class="form-color-picker__body"
      :class="{ 'form-color-picker__body--error': !!error }"
    >
      <ColorPicker
        v-model:pureColor="colorValue"
        format="hex"
        shape="square"
        picker-type="chrome"
        :disable-alpha="true"
      />

      <FormInput
        v-model="colorValue"
        :error="''"
        :show-label="false"
        :maxlength="maxlength"
        :placeholder="placeholder"
        readonly
      />
    </div>

    <p v-if="hint && !error" class="form-color-picker__hint">
      {{ hint }}
    </p>

    <p v-if="error" class="form-color-picker__error">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ColorPicker } from 'vue3-colorpicker';
import 'vue3-colorpicker/style.css';

import FormInput from '@/components/common/FormInput.vue';

const props = withDefaults(
  defineProps<{
    modelValue?: string | null;
    label?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    maxlength?: string | number;
    placeholder?: string;
  }>(),
  {
    modelValue: '',
    label: '',
    error: '',
    hint: '',
    required: false,
    maxlength: 20,
    placeholder: '#FFFFFF',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const colorValue = computed({
  get: () => props.modelValue || '',
  set: (value) => {
    emit('update:modelValue', normalizeHexColor(value));
  },
});

const normalizeHexColor = (value: any) => {
  const text = String(value ?? '').trim();

  if (!text) return '';

  if (/^#[0-9A-Fa-f]{6}$/.test(text)) {
    return text.toUpperCase();
  }

  if (/^[0-9A-Fa-f]{6}$/.test(text)) {
    return `#${text}`.toUpperCase();
  }

  return text;
};
</script>

<style scoped lang="scss">
.form-color-picker {
  width: 100%;

  &__label {
    margin: 0 0 6px;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }

  &__required {
    color: #dc2626;
  }

  &__body {
    display: grid;
    grid-template-columns: auto minmax(160px, 1fr);
    align-items: center;
    gap: 8px;

    &--error {
      :deep(input) {
        border-color: #dc2626;
      }
    }

    :deep(input[readonly]) {
      cursor: default;
      background-color: #f9fafb;
      color: #374151;
    }
  }

  &__hint {
    margin: 6px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: #6b7280;
  }

  &__error {
    margin: 6px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: #dc2626;
  }

  :deep(.vc-color-wrap) {
    width: 32px;
    height: 32px;
    margin: 0;
    border-radius: 8px;
  }
}

@media (max-width: 576px) {
  .form-color-picker {
    &__body {
      grid-template-columns: auto 1fr;
    }
  }
}
</style>

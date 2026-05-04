<!-- src/components/common/FormDateRangeField.vue -->
<template>
  <div class="form-date-range-field">
    <p v-if="label" class="form-date-range-field__label">
      {{ label }}
      <span v-if="required" class="form-date-range-field__required">*</span>
    </p>

    <div class="form-date-range-field__body">
      <FormInput
        :type="type"
        v-model="startValue"
        :error="startError"
        :show-label="false"
        :disabled="disabled"
      />

      <span class="form-date-range-field__separator">
        {{ separator }}
      </span>

      <FormInput
        :type="type"
        v-model="endValue"
        :error="endError"
        :show-label="false"
        :disabled="disabled"
      />
    </div>

    <p v-if="hint" class="form-date-range-field__hint">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import FormInput from '@/components/common/FormInput.vue';

const props = withDefaults(
  defineProps<{
    start?: string | null;
    end?: string | null;
    label?: string;
    startError?: string;
    endError?: string;
    hint?: string;
    required?: boolean;
    disabled?: boolean;
    separator?: string;
    type?: 'date' | 'datetime-local';
  }>(),
  {
    start: '',
    end: '',
    label: '',
    startError: '',
    endError: '',
    hint: '',
    required: false,
    disabled: false,
    separator: '~',
    type: 'date',
  },
);

const emit = defineEmits<{
  (e: 'update:start', value: string): void;
  (e: 'update:end', value: string): void;
}>();

const startValue = computed({
  get: () => props.start ?? '',
  set: (value) => emit('update:start', value),
});

const endValue = computed({
  get: () => props.end ?? '',
  set: (value) => emit('update:end', value),
});
</script>

<style scoped lang="scss">
.form-date-range-field {
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
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  &__separator {
    display: inline-flex;
    align-items: center;
    min-height: 38px;
    color: #6b7280;
    font-size: 14px;
    line-height: 1;
  }

  &__hint {
    margin: 6px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: #6b7280;
  }
}

@media (max-width: 576px) {
  .form-date-range-field {
    &__body {
      flex-direction: column;
      gap: 6px;
    }

    &__separator {
      min-height: auto;
      padding-left: 4px;
    }
  }
}
</style>

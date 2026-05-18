<!-- src/components/common/FormDateTimeField.vue -->
<template>
  <div class="form-date-time-field">
    <p v-if="label" class="form-date-time-field__label">
      {{ label }}
      <span v-if="required" class="form-date-time-field__required">*</span>
    </p>

    <div class="form-date-time-field__item" @click="openPicker">
      <VueDatePicker
        ref="pickerRef"
        v-model="inputValue"
        :model-type="dateFormat"
        :formats="pickerFormats"
        :enable-time-picker="isDateTime"
        :is-24="true"
        :auto-apply="true"
        :clearable="clearable"
        :disabled="disabled"
        :text-input="textInputOptions"
        :placeholder="placeholder"
        :class="{ 'is-invalid': !!error }"
      />

      <p v-if="error" class="form-date-time-field__error">
        {{ error }}
      </p>
    </div>

    <p v-if="hint" class="form-date-time-field__hint">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { VueDatePicker } from '@vuepic/vue-datepicker';

type PickerType = 'date' | 'datetime-local' | 'datetime';

const props = withDefaults(
  defineProps<{
    modelValue?: string | null;
    label?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    disabled?: boolean;
    type?: PickerType;
    clearable?: boolean;
    autoApplyDefault?: boolean;
    placeholder?: string;
    defaultValue?: string;
  }>(),
  {
    modelValue: '',
    label: '',
    error: '',
    hint: '',
    required: false,
    disabled: false,
    type: 'datetime-local',
    clearable: true,
    autoApplyDefault: false,
    placeholder: '請選擇時間',
    defaultValue: '',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const pickerRef = ref<any>(null);

const isDateTime = computed(() => {
  return props.type === 'datetime' || props.type === 'datetime-local';
});

const dateFormat = computed(() => {
  return isDateTime.value ? 'yyyy/MM/dd HH:mm' : 'yyyy/MM/dd';
});

const pickerFormats = computed(() => ({
  input: dateFormat.value,
  preview: dateFormat.value,
}));

const textInputOptions = computed(() => ({
  format: dateFormat.value,
}));

const pad2 = (value: number) => String(value).padStart(2, '0');

const formatDate = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());

  return `${yyyy}/${mm}/${dd}`;
};

const formatDateTime = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const mi = pad2(date.getMinutes());

  return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
};

const getDefaultValue = () => {
  const date = new Date();

  if (!isDateTime.value) {
    return formatDate(date);
  }

  date.setMinutes(0, 0, 0);
  return formatDateTime(date);
};

const normalizeValue = (value?: string | null) => {
  const text = String(value ?? '')
    .trim()
    .replace('T', ' ')
    .replace(/-/g, '/')
    .replace(',', '');

  if (!text) return '';

  return isDateTime.value ? text.slice(0, 16) : text.slice(0, 10);
};

const inputValue = computed({
  get: () => normalizeValue(props.modelValue),
  set: (value) => emit('update:modelValue', normalizeValue(value)),
});

const openPicker = () => {
  if (props.disabled) return;
  pickerRef.value?.openMenu?.();
};

onMounted(() => {
  if (!props.autoApplyDefault || props.disabled || props.modelValue) return;

  emit('update:modelValue', props.defaultValue || getDefaultValue());
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as *;

$date-field-font-xs: 1.2rem;
$date-field-font-md: 1.4rem;
$date-field-placeholder: color.mix($form-muted, #fff, 70%);
$date-field-disabled-bg: color.mix($border-light, #fff, 28%);

.form-date-time-field {
  width: 100%;

  &__label {
    margin: 0 0 6px;
    color: $form-text;
    font-size: $date-field-font-md;
    font-weight: 500;
    line-height: 1.3;
  }

  &__required {
    color: $danger;
  }

  &__item {
    width: 100%;
    min-width: 0;
    cursor: pointer;
  }

  &__hint {
    margin: 6px 0 0;
    color: $form-muted;
    font-size: $date-field-font-xs;
    line-height: 1.5;
  }

  &__error {
    margin-top: 2px;
    color: $danger;
    font-size: $date-field-font-xs;
    line-height: 1.25;
  }

  :deep(.dp__main) {
    width: 100%;
    font-family: inherit;
  }

  :deep(.dp__input_wrap) {
    width: 100%;
  }

  :deep(.dp__input) {
    width: 100%;
    height: $form-h-md;
    min-height: $form-h-md;
    padding: 0 10px;
    border: 1px solid $form-border;
    border-radius: $form-radius;
    outline: none;
    background: $form-bg;
    color: $form-text;
    font-size: $date-field-font-md;
    line-height: $form-h-md;
    cursor: pointer;
    box-shadow: none;
    transition:
      border-color 120ms ease,
      box-shadow 120ms ease,
      background-color 120ms ease,
      opacity 120ms ease;

    &::placeholder {
      color: $date-field-placeholder;
    }

    &:hover {
      border-color: color.mix($brand, $form-border, 30%);
    }

    &:focus {
      border-color: $brand;
      box-shadow: 0 0 0 2px color.change($brand, $alpha: 0.2);
    }

    &:disabled {
      background: $date-field-disabled-bg;
      border-color: color.mix($form-border, #fff, 72%);
      color: $date-field-placeholder;
      cursor: not-allowed;
      opacity: 0.72;
    }
  }

  :deep(.dp__input_icon) {
    display: none;
  }

  :deep(.dp__clear_icon) {
    right: 10px;
    width: 30px;
    height: 100%;
    color: $form-muted;

    &:hover {
      color: $brand;
    }
  }

  :deep(.is-invalid .dp__input),
  :deep(.dp__main.is-invalid .dp__input) {
    border-color: $danger;
    background: color.mix($danger-light, #fff, 18%);

    &:focus {
      box-shadow: 0 0 0 2px color.change($danger, $alpha: 0.2);
    }
  }

  :deep(.dp__menu) {
    border: 1px solid $form-border;
    border-radius: $form-radius;
    box-shadow: 0 10px 28px rgba($ink-900, 0.12);
    font-size: $date-field-font-md;
  }

  :deep(.dp__active_date),
  :deep(.dp__action_select) {
    background: $brand;
  }

  :deep(.dp__today) {
    border-color: $brand;
  }
}
</style>

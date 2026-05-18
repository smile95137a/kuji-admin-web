<!-- src/components/common/FormDateRangeField.vue -->
<template>
  <div class="form-date-range-field">
    <p v-if="label" class="form-date-range-field__label">
      {{ label }}
      <span v-if="required" class="form-date-range-field__required">*</span>
    </p>

    <div class="form-date-range-field__body">
      <!-- 開始時間 -->
      <div class="form-date-range-field__item" @click="openStartPicker">
        <VueDatePicker
          ref="startPickerRef"
          v-model="startValue"
          :model-type="dateFormat"
          :formats="pickerFormats"
          :enable-time-picker="isDateTime"
          :is-24="true"
          :auto-apply="true"
          :clearable="clearable"
          :disabled="disabled"
          :text-input="textInputOptions"
          :placeholder="startPlaceholder"
          :class="{ 'is-invalid': !!startError }"
        />

        <p v-if="startError" class="form-date-range-field__error">
          {{ startError }}
        </p>
      </div>

      <span class="form-date-range-field__separator">
        {{ separator }}
      </span>

      <!-- 結束時間 -->
      <div class="form-date-range-field__item" @click="openEndPicker">
        <VueDatePicker
          ref="endPickerRef"
          v-model="endValue"
          :model-type="dateFormat"
          :formats="pickerFormats"
          :enable-time-picker="isDateTime"
          :is-24="true"
          :auto-apply="true"
          :clearable="clearable"
          :disabled="disabled"
          :text-input="textInputOptions"
          :placeholder="endPlaceholder"
          :class="{ 'is-invalid': !!endError }"
        />

        <p v-if="endError" class="form-date-range-field__error">
          {{ endError }}
        </p>
      </div>
    </div>

    <p v-if="hint" class="form-date-range-field__hint">
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
    start?: string | null;
    end?: string | null;
    label?: string;
    startError?: string;
    endError?: string;
    hint?: string;
    required?: boolean;
    disabled?: boolean;
    separator?: string;
    type?: PickerType;
    clearable?: boolean;
    autoApplyDefault?: boolean;
    startPlaceholder?: string;
    endPlaceholder?: string;
    defaultStart?: string;
    defaultEnd?: string;
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
    clearable: true,
    autoApplyDefault: true,
    startPlaceholder: '請選擇開始時間',
    endPlaceholder: '請選擇結束時間',
    defaultStart: '',
    defaultEnd: '',
  },
);

const emit = defineEmits<{
  (e: 'update:start', value: string): void;
  (e: 'update:end', value: string): void;
}>();

const startPickerRef = ref<any>(null);
const endPickerRef = ref<any>(null);

const isDateTime = computed(() => {
  return props.type === 'datetime' || props.type === 'datetime-local';
});

/**
 * v-model 實際格式
 * datetime-local => 2026/05/18 00:00
 * date => 2026/05/18
 */
const dateFormat = computed(() => {
  return isDateTime.value ? 'yyyy/MM/dd HH:mm' : 'yyyy/MM/dd';
});

/**
 * 控制輸入框顯示格式
 * 避免套件預設顯示成 05/18/2026, 00:00
 */
const pickerFormats = computed(() => ({
  input: dateFormat.value,
  preview: dateFormat.value,
}));

/**
 * text-input 也指定 format，避免手打或重新 focus 後又被轉成美式格式
 */
const textInputOptions = computed(() => ({
  format: dateFormat.value,
}));

const pad = (num: number) => String(num).padStart(2, '0');

const formatDate = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());

  return `${yyyy}/${mm}/${dd}`;
};

const formatDateTime = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());

  return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
};

const getDefaultStart = () => {
  const date = new Date();

  if (!isDateTime.value) {
    return formatDate(date);
  }

  date.setHours(0, 0, 0, 0);
  return formatDateTime(date);
};

const getDefaultEnd = () => {
  const date = new Date();

  if (!isDateTime.value) {
    return formatDate(date);
  }

  date.setHours(23, 59, 0, 0);
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

const startValue = computed({
  get: () => normalizeValue(props.start),
  set: (value) => emit('update:start', normalizeValue(value)),
});

const endValue = computed({
  get: () => normalizeValue(props.end),
  set: (value) => emit('update:end', normalizeValue(value)),
});

const openStartPicker = () => {
  if (props.disabled) return;
  startPickerRef.value?.openMenu?.();
};

const openEndPicker = () => {
  if (props.disabled) return;
  endPickerRef.value?.openMenu?.();
};

onMounted(() => {
  if (!props.autoApplyDefault || props.disabled) return;

  if (!props.start) {
    emit('update:start', props.defaultStart || getDefaultStart());
  }

  if (!props.end) {
    emit('update:end', props.defaultEnd || getDefaultEnd());
  }
});
</script>
<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as *;

// 對齊 FormInput 字級
$date-range-font-xs: 1.2rem;
$date-range-font-md: 1.4rem;

$date-range-placeholder: color.mix($form-muted, #fff, 70%);
$date-range-disabled-bg: color.mix($border-light, #fff, 28%);

.form-date-range-field {
  width: 100%;

  &__label {
    margin: 0 0 6px;
    color: $form-text;
    font-size: $date-range-font-md;
    font-weight: 500;
    line-height: 1.3;
  }

  &__required {
    color: $danger;
  }

  &__body {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
  }

  &__item {
    flex: 1 1 0;
    min-width: 0;
    cursor: pointer;
  }

  &__separator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: $form-h-md;
    color: $form-muted;
    font-size: $date-range-font-md;
    font-weight: 500;
    line-height: 1;
  }

  &__hint {
    margin: 6px 0 0;
    color: $form-muted;
    font-size: $date-range-font-xs;
    line-height: 1.5;
  }

  &__error {
    margin-top: 2px;
    color: $danger;
    font-size: $date-range-font-xs;
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
    font-size: $date-range-font-md;
    line-height: $form-h-md;
    cursor: pointer;
    box-shadow: none;

    transition:
      border-color 120ms ease,
      box-shadow 120ms ease,
      background-color 120ms ease,
      opacity 120ms ease;

    &::placeholder {
      color: $date-range-placeholder;
    }

    &:hover {
      border-color: color.mix($brand, $form-border, 30%);
    }

    &:focus {
      border-color: $brand;
      box-shadow: 0 0 0 2px color.change($brand, $alpha: 0.2);
    }

    &:disabled {
      background: $date-range-disabled-bg;
      border-color: color.mix($form-border, #fff, 72%);
      color: $date-range-placeholder;
      cursor: not-allowed;
      opacity: 0.72;
    }
  }

  // 隱藏左側 icon，讓輸入文字不要被擠歪
  :deep(.dp__input_icon) {
    display: none;
  }

  // 清除按鈕對齊 FormInput 的 x 按鈕大小
  :deep(.dp__clear_icon) {
    right: 10px;
    width: 30px;
    height: 100%;
    color: $form-muted;
    transition:
      color 120ms ease,
      background-color 120ms ease,
      transform 120ms ease;

    &:hover {
      color: $brand;
    }
  }

  :deep(.dp__disabled) {
    opacity: 0.72;
    cursor: not-allowed;
  }

  :deep(.is-invalid .dp__input),
  :deep(.dp__main.is-invalid .dp__input) {
    border-color: $danger;
    background: color.mix($danger-light, #fff, 18%);

    &:focus {
      box-shadow: 0 0 0 2px color.change($danger, $alpha: 0.2);
    }
  }

  // 下拉面板也稍微跟專案表單風格靠近
  :deep(.dp__menu) {
    border: 1px solid $form-border;
    border-radius: $form-radius;
    box-shadow: 0 10px 28px rgba($ink-900, 0.12);
    font-size: $date-range-font-md;
  }

  :deep(.dp__calendar_item),
  :deep(.dp__month_year_select),
  :deep(.dp__time_display),
  :deep(.dp__overlay_cell) {
    font-size: $date-range-font-md;
  }

  :deep(.dp__active_date),
  :deep(.dp__action_select) {
    background: $brand;
  }

  :deep(.dp__today) {
    border-color: $brand;
  }
}

@media (max-width: 576px) {
  .form-date-range-field {
    &__body {
      flex-direction: column;
      gap: 6px;
    }

    &__item {
      width: 100%;
    }

    &__separator {
      justify-content: center;
      min-height: auto;
      padding-left: 4px;
    }
  }
}
</style>

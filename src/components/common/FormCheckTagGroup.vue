<!-- src/components/common/FormCheckTagGroup.vue -->
<template>
  <div class="form-check-tag-group">
    <div
      v-if="label || required"
      class="form-check-tag-group__label"
      :class="{ 'form-check-tag-group__label--required': required }"
    >
      {{ label || '\u00A0' }}
    </div>

    <div class="form-check-tag-group__list">
      <div
        v-for="option in options"
        :key="String(option.value)"
        class="form-check-tag-group__item"
        :class="{
          'form-check-tag-group__item--checked': isChecked(option.value),
          'form-check-tag-group__item--disabled': disabled || option.disabled,
          'form-check-tag-group__item--error': !!error,
        }"
        @click="toggle(option)"
      >
        <input
          class="form-check-tag-group__input"
          type="checkbox"
          :id="getOptionId(option.value)"
          :name="name"
          :value="option.value"
          :checked="isChecked(option.value)"
          :disabled="disabled || option.disabled"
          :aria-checked="isChecked(option.value)"
          :aria-disabled="disabled || option.disabled"
          @change.stop
        />

        <label
          class="form-check-tag-group__tag"
          :for="getOptionId(option.value)"
          @click.prevent
        >
          <span class="form-check-tag-group__text">
            {{ option.label }}
          </span>
        </label>
      </div>
    </div>

    <span v-if="error" class="form-check-tag-group__error">
      {{ error }}
    </span>

    <span v-else-if="hint" class="form-check-tag-group__hint">
      {{ hint }}
    </span>
  </div>
</template>

<script setup lang="ts">
type CheckTagValue = string | number | boolean;

interface CheckTagOption {
  label: string;
  value: CheckTagValue;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    modelValue: CheckTagValue[];
    options: CheckTagOption[];
    label?: string;
    name?: string;
    idPrefix?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    disabled?: boolean;
  }>(),
  {
    modelValue: () => [],
    options: () => [],
    idPrefix: 'form-check-tag',
    required: false,
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: CheckTagValue[]): void;
  (e: 'change', value: CheckTagValue[]): void;
}>();

const getOptionId = (value: CheckTagValue) => {
  return `${props.idPrefix}-${String(value).replace(/\s+/g, '-')}`;
};

const isChecked = (value: CheckTagValue) => {
  return props.modelValue.some((item) => item === value);
};

const toggle = (option: CheckTagOption) => {
  if (props.disabled || option.disabled) return;

  const checked = isChecked(option.value);

  const nextValue = checked
    ? props.modelValue.filter((item) => item !== option.value)
    : [...props.modelValue, option.value];

  emit('update:modelValue', nextValue);
  emit('change', nextValue);
};
</script>

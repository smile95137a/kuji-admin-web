<!-- src/components/common/FormRadioTagGroup.vue -->
<template>
  <div class="form-radio-tag-group">
    <div
      v-if="label || required"
      class="form-radio-tag-group__label"
      :class="{ 'form-radio-tag-group__label--required': required }"
    >
      {{ label || '\u00A0' }}
      <span v-if="required" class="form-radio-tag-group__asterisk">*</span>
    </div>

    <div class="form-radio-tag-group__list">
      <div
        v-for="option in options"
        :key="String(option.value)"
        class="form-radio-tag-group__item"
        :class="{
          'form-radio-tag-group__item--checked': isChecked(option.value),
          'form-radio-tag-group__item--disabled': disabled || option.disabled,
          'form-radio-tag-group__item--error': !!error,
        }"
        @click="select(option)"
      >
        <input
          class="form-radio-tag-group__input"
          type="radio"
          :id="getOptionId(option.value)"
          :name="name || computedName"
          :value="option.value"
          :checked="isChecked(option.value)"
          :disabled="disabled || option.disabled"
          :aria-checked="isChecked(option.value)"
          :aria-disabled="disabled || option.disabled"
          @change.stop
        />

        <label
          class="form-radio-tag-group__tag"
          :for="getOptionId(option.value)"
          @click.prevent
        >
          <span class="form-radio-tag-group__text">
            {{ option.label }}
          </span>
        </label>
      </div>
    </div>

    <span v-if="error" class="form-radio-tag-group__error">
      {{ error }}
    </span>

    <span v-else-if="hint" class="form-radio-tag-group__hint">
      {{ hint }}
    </span>
  </div>
</template>

<script setup lang="ts">
const uid = Math.random().toString(36).slice(2, 9);

type RadioTagValue = string | number | boolean;

interface RadioTagOption {
  label: string;
  value: RadioTagValue;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    modelValue: RadioTagValue | null | undefined;
    options: RadioTagOption[];
    label?: string;
    name?: string;
    idPrefix?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    disabled?: boolean;
  }>(),
  {
    modelValue: '',
    options: () => [],
    idPrefix: 'form-radio-tag',
    required: false,
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: RadioTagValue): void;
  (e: 'change', value: RadioTagValue): void;
}>();

const computedName = `form-radio-tag-group-${uid}`;

const getOptionId = (value: RadioTagValue) => {
  return `${props.idPrefix}-${String(value).replace(/\s+/g, '-')}`;
};

const isChecked = (value: RadioTagValue) => {
  return props.modelValue === value;
};

const select = (option: RadioTagOption) => {
  if (props.disabled || option.disabled) return;

  emit('update:modelValue', option.value);
  emit('change', option.value);
};
</script>

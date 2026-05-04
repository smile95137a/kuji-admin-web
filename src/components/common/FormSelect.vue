<template>
  <div class="form-select">
    <!-- 標題 -->
    <label
      v-if="showLabel"
      class="form-select__label"
      :for="id"
      :class="{ 'form-select__label--required': required }"
    >
      {{ label || '\u00A0' }}
    </label>

    <!-- 控制區：select + addon -->
    <div class="form-select__control">
      <select
        :id="id"
        :name="name"
        class="form-select__field"
        :class="{ 'is-error': !!error }"
        :value="modelValue"
        :disabled="disabled"
        :aria-required="required ? 'true' : 'false'"
        @change="
          $emit('update:modelValue', ($event.target as HTMLSelectElement).value)
        "
      >
        <option v-if="showAll" :value="allValue">{{ allLabel }}</option>
        <option v-for="opt in options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>

      <!-- 右側附加區（例如：搜尋按鈕/圖示） -->
      <slot name="addonRight" />
    </div>

    <!-- 錯誤訊息 -->
    <span class="form-select__error" v-if="error">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
interface SelectOption {
  value: any;
  label: any;
}
const props = withDefaults(
  defineProps<{
    label?: string;
    modelValue: any;
    options: SelectOption[];
    error?: string;
    required?: boolean;
    disabled?: boolean;

    showAll?: boolean;
    allLabel?: string;
    allValue?: string | number;

    id?: string;
    name?: string;
    showLabel?: boolean;
  }>(),
  {
    showLabel: true,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | number): void;
}>();
</script>

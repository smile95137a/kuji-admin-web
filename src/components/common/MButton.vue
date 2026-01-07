<template>
  <button
    :type="btnType"
    :class="[
      'mbtn',
      typeClass,
      { 'mbtn--disabled': disabled },
      ...normalizeClass(customClass),
    ]"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { withDefaults, defineProps, defineEmits, computed } from 'vue';

const props = withDefaults(
  defineProps<{
    customClass?: string | string[];
    variant?: string; // primary / secondary / danger...
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset'; // HTML 原生 button type
  }>(),
  {
    customClass: '',
    variant: 'primary',
    disabled: false,
    type: 'button', // 預設是 button
  }
);

const emit = defineEmits<{
  (e: 'click', ev: Event): void;
}>();

// 處理類名
const normalizeClass = (
  classValue: string | string[] | undefined
): string[] => {
  if (!classValue) return [];
  return Array.isArray(classValue) ? classValue : classValue.split(' ');
};

// 動態樣式類名
const typeClass = computed(() => `mbtn--${props.variant}`);

// button type
const btnType = computed(() => props.type);

const handleClick = (event: Event) => {
  if (!props.disabled) {
    emit('click', event);
  }
};
</script>

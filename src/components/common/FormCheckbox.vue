<!-- src/components/common/FormCheckbox.vue -->
<template>
  <div
    class="mcheckbox"
    :class="[
      `mcheckbox--${props.size}`,
      {
        'mcheckbox--disabled': props.disabled,
        'mcheckbox--error': !!props.error,
      },
    ]"
  >
    <input
      ref="inputEl"
      class="mcheckbox__input sr-only"
      type="checkbox"
      :id="computedId"
      :name="props.name"
      :disabled="props.disabled"
      :required="props.required"
      :value="props.value"
      :true-value="props.trueValue"
      :false-value="props.falseValue"
      :aria-invalid="!!props.error || undefined"
      :aria-describedby="describedById"
      :checked="isChecked"
      @change="onChange"
      @focus="onFocus"
      @blur="onBlur"
      @keydown.space.prevent="toggle()"
    />

    <label class="mcheckbox__label" :for="computedId">
      <!-- 右側文字（預設）：方框在左、文字在右 -->
      <template v-if="props.labelPlacement === 'right'">
        <span class="mcheckbox__box" aria-hidden="true" />
        <span class="mcheckbox__text">
          <slot>{{ props.label }}</slot>
        </span>
      </template>

      <!-- 左側文字：文字在左、方框在右 -->
      <template v-else>
        <span class="mcheckbox__text">
          <slot>{{ props.label }}</slot>
        </span>
        <span class="mcheckbox__box" aria-hidden="true" />
      </template>
    </label>

    <p
      v-if="props.hint && !props.error"
      class="mcheckbox__hint"
      :id="describedById"
    >
      {{ props.hint }}
    </p>
    <p v-if="props.error" class="mcheckbox__error" :id="describedById">
      {{ props.error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

type Size = 'sm' | 'md' | 'lg';

const props = withDefaults(
  defineProps<{
    /** v-model 綁定值（布林或群組陣列） */
    modelValue?: boolean | unknown[] | string | number | null;

    /** 單選布林或群組值（陣列）時使用的值 */
    value?: any;

    /** 自定義 true/false 對映（布林模式） */
    trueValue?: any;
    falseValue?: any;

    id?: string;
    name?: string;
    label?: string;
    hint?: string;
    error?: string;

    disabled?: boolean;
    required?: boolean;
    size?: Size;

    /** 半選狀態（僅視覺），不會自動改變 model 值 */
    indeterminate?: boolean;

    /** 標籤位置：left = 文字在左、方框在右；right = 方框在左、文字在右（預設） */
    labelPlacement?: 'left' | 'right';
  }>(),
  {
    modelValue: false,
    trueValue: true,
    falseValue: false,
    disabled: false,
    required: false,
    size: 'md',
    indeterminate: false,
    labelPlacement: 'right',
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
  (e: 'change', value: any): void;
  (e: 'focus'): void;
  (e: 'blur'): void;
}>();

const inputEl = ref<HTMLInputElement | null>(null);
const uid = Math.random().toString(36).slice(2, 9);
const computedId = computed(() => props.id ?? `mcheckbox-${uid}`);
const describedById = computed(() =>
  props.hint || props.error ? `${computedId.value}-desc` : undefined
);

/** 判斷是否為陣列綁定（群組） */
const isArrayModel = computed(() => Array.isArray(props.modelValue));

/** 是否勾選（支援布林、true/false 對映、群組） */
const isChecked = computed<boolean>(() => {
  if (isArrayModel.value) {
    return (props.modelValue as unknown[]).some((v) => v === props.value);
  }
  return props.modelValue === props.trueValue || props.modelValue === true;
});

function setIndeterminateFlag() {
  if (inputEl.value) {
    inputEl.value.indeterminate = !!props.indeterminate && !isChecked.value;
  }
}
onMounted(setIndeterminateFlag);
watch(() => props.indeterminate, setIndeterminateFlag);
watch(isChecked, setIndeterminateFlag);

/** 切換值（支援群組與布林） */
function toggle() {
  if (props.disabled) return;

  if (isArrayModel.value) {
    const arr = Array.isArray(props.modelValue)
      ? [...(props.modelValue as any[])]
      : [];
    const idx = arr.findIndex((v) => v === props.value);
    if (idx > -1) arr.splice(idx, 1);
    else arr.push(props.value);
    emit('update:modelValue', arr);
    emit('change', arr);
  } else {
    const next = isChecked.value ? props.falseValue : props.trueValue;
    emit('update:modelValue', next);
    emit('change', next);
  }
}

function onChange() {
  // 與 keyboard toggle 行為一致
  toggle();
}
function onFocus() {
  emit('focus');
}
function onBlur() {
  emit('blur');
}
</script>

<!-- src/components/common/FormRadio.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue';

type Size = 'sm' | 'md' | 'lg';

const props = withDefaults(
  defineProps<{
    /** v-model 綁定的值 */
    modelValue: string | number | boolean | null;
    /** 此 radio 的實際值（被選中時會回傳） */
    value: string | number | boolean;
    /** 顯示在 label 的文字（也可用 slot 覆蓋） */
    label?: string;
    /** 表單用 name，建立同組 radio 群組 */
    name?: string;
    /** 自訂 id（不傳則自動產生） */
    id?: string;
    /** 尺寸 */
    size?: Size;
    /** 是否必填（僅加上屬性與 aria 標記） */
    required?: boolean;
    /** 是否禁用 */
    disabled?: boolean;
    /** 錯誤訊息（控制樣式與 a11y） */
    error?: string | null;
  }>(),
  {
    size: 'md',
    required: false,
    disabled: false,
    error: null,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | number | boolean): void;
  (e: 'change', v: string | number | boolean): void;
  (e: 'focus'): void;
  (e: 'blur'): void;
}>();

// 產生穩定唯一 id
const localId = ref(`mradio-${Math.random().toString(36).slice(2, 9)}`);
const computedId = computed(() => props.id || localId.value);

const isChecked = computed(() => props.modelValue === props.value);

const describedById = computed(() =>
  props.error ? `${computedId.value}-error` : undefined
);

function onChange(e: Event) {
  // radio 被選中時回傳自己的 value
  emit('update:modelValue', props.value);
  emit('change', props.value);
}
function onFocus() {
  emit('focus');
}
function onBlur() {
  emit('blur');
}
function toggleBySpace() {
  if (!props.disabled && !isChecked.value) {
    emit('update:modelValue', props.value);
    emit('change', props.value);
  }
}
</script>

<template>
  <div
    class="mradio"
    :class="[
      `mradio--${size}`,
      { 'mradio--disabled': disabled, 'mradio--error': !!error },
    ]"
  >
    <input
      class="mradio__input sr-only"
      :id="computedId"
      :name="name"
      type="radio"
      :value="value"
      :checked="isChecked"
      :disabled="disabled"
      :required="required"
      :aria-invalid="!!error || undefined"
      :aria-describedby="describedById"
      @change="onChange"
      @focus="onFocus"
      @blur="onBlur"
      @keydown.space.prevent="toggleBySpace"
    />
    <label class="mradio__label" :for="computedId">
      <span class="mradio__dot" aria-hidden="true"></span>
      <span class="mradio__text">
        <slot>{{ label }}</slot>
      </span>
    </label>

    <!-- 錯誤訊息（若需要顯示在元件內） -->
    <p v-if="error" class="mradio__error-text" :id="describedById" role="alert">
      {{ error }}
    </p>
  </div>
</template>

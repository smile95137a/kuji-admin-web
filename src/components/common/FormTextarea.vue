<!-- src/components/common/FormTextarea.vue -->
<template>
  <div class="form-textarea" :class="sizeClass">
    <!-- 標題 -->
    <label
      v-if="!hideLabel"
      class="form-textarea__label"
      :for="id"
      :class="{ 'form-textarea__label--required': required }"
    >
      {{ label || '\u00A0' }}
      <span v-if="required" class="form-textarea__asterisk">*</span>
    </label>

    <!-- 控制列 -->
    <div class="form-textarea__control">
      <div
        class="form-textarea__field-wrap"
        :class="{
          'is-focus': isFocus,
          'is-error': !!error,
          'is-disabled': disabled,
          'is-readonly': readonly,
          'is-success': success,
        }"
      >
        <!-- 左側 addon -->
        <div
          v-if="$slots.addonLeft"
          class="form-textarea__addon form-textarea__addon--left"
        >
          <slot name="addonLeft" />
        </div>

        <!-- Textarea -->
        <textarea
          ref="textareaEl"
          class="form-textarea__field"
          :id="id"
          :name="name"
          :placeholder="placeholder"
          :value="modelValue"
          :disabled="disabled"
          :readonly="readonly"
          :required="required"
          :rows="rows"
          :maxlength="maxlength"
          :aria-required="required ? 'true' : 'false'"
          :aria-invalid="!!error ? 'true' : 'false'"
          @input="onInput"
          @focus="onFocus"
          @blur="onBlur"
        ></textarea>

        <!-- 右側 addon -->
        <div
          v-if="$slots.addonRight"
          class="form-textarea__addon form-textarea__addon--right"
        >
          <slot name="addonRight" />
        </div>
      </div>
    </div>

    <!-- 錯誤訊息 / 輔助文字 -->
    <span class="form-textarea__error" v-if="error">{{ error }}</span>
    <span class="form-textarea__help" v-else-if="help">{{ help }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';

type Size = 'sm' | 'md' | 'lg';

const props = withDefaults(
  defineProps<{
    modelValue: string | null;
    label?: string;
    id?: string;
    name?: string;
    placeholder?: string;
    error?: string;
    help?: string;
    required?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    success?: boolean;
    size?: Size;
    rows?: any;
    maxlength?: number;
    autofocus?: boolean;
    hideLabel?: boolean;
  }>(),
  {
    size: 'md',
    rows: 4,
    autofocus: false,
    hideLabel: false, // 預設顯示 label
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | null): void;
  (e: 'focus', ev: FocusEvent): void;
  (e: 'blur', ev: FocusEvent): void;
}>();

const textareaEl = ref<HTMLTextAreaElement | null>(null);
const isFocus = ref(false);

const sizeClass = computed(() => {
  return props.size === 'sm'
    ? 'form-textarea--sm'
    : props.size === 'lg'
      ? 'form-textarea--lg'
      : '';
});

function onInput(e: Event) {
  const val = (e.target as HTMLTextAreaElement).value;
  emit('update:modelValue', val);
}

function onFocus(ev: FocusEvent) {
  isFocus.value = true;
  emit('focus', ev);
}

function onBlur(ev: FocusEvent) {
  isFocus.value = false;
  emit('blur', ev);
}

onMounted(() => {
  if (props.autofocus) {
    requestAnimationFrame(() => textareaEl.value?.focus());
  }
});
</script>

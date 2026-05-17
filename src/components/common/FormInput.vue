<!-- src/components/common/FormInput.vue -->
<template>
  <div class="form-input" :class="sizeClass">
    <!-- 標題 -->
    <label
      v-if="showLabel"
      class="form-input__label"
      :for="id"
      :class="{ 'form-input__label--required': required }"
    >
      {{ label || '\u00A0' }}
    </label>

    <!-- 控制列：input + addonRight -->
    <div class="form-input__control">
      <!-- 外框 -->
      <div
        class="form-input__field-wrap"
        :class="{
          'is-focus': isFocus,
          'is-error': !!error,
          'is-disabled': disabled,
          'is-readonly': readonly,
          'is-success': success,
          'has-addon-left': !!$slots.addonLeft,
          'has-clear': showClearButton,
          'has-toggle': showToggle,
        }"
      >
        <!-- 左側 addon -->
        <div v-if="$slots.addonLeft" class="form-input__addon-left">
          <slot name="addonLeft" />
        </div>

        <input
          v-if="resolvedType !== 'file'"
          ref="inputEl"
          class="form-input__field"
          :id="id"
          :name="name"
          :type="resolvedType"
          :placeholder="placeholder"
          :value="modelValue"
          :disabled="disabled"
          :readonly="readonly"
          :maxlength="maxlength"
          :minlength="minlength"
          :autocomplete="autocomplete"
          :aria-required="required ? 'true' : 'false'"
          :aria-invalid="!!error ? 'true' : 'false'"
          @input="onInput"
          @click="onClick"
          @focus="onFocus"
          @blur="onBlur"
        />

        <input
          v-else
          ref="inputEl"
          class="form-input__field"
          :id="id"
          :name="name"
          type="file"
          :disabled="disabled"
          :required="required"
          :aria-required="required ? 'true' : 'false'"
          :aria-invalid="!!error ? 'true' : 'false'"
          @focus="onFocus"
          @blur="onBlur"
          @change="onFileChange"
        />

        <!-- 清除按鈕 -->
        <button
          v-if="showClearButton"
          type="button"
          class="form-input__clear"
          aria-label="清除"
          @click="onClear"
        >
          ×
        </button>

        <!-- 密碼顯示切換 -->
        <button
          v-if="showToggle"
          type="button"
          class="form-input__toggle"
          :aria-pressed="isReveal ? 'true' : 'false'"
          @click="isReveal = !isReveal"
        >
          <font-awesome-icon
            :icon="isReveal ? ['fas', 'eye-slash'] : ['fas', 'eye']"
            class="form-input__toggle-icon"
          />
        </button>
      </div>

      <!-- 右側 addon：獨立於 input 外框，會有 gap -->
      <slot name="addonRight" />
    </div>

    <!-- 錯誤訊息 / 輔助文字 -->
    <span class="form-input__error" v-if="error">{{ error }}</span>
    <span class="form-input__help" v-else-if="help">{{ help }}</span>

    <div
      v-if="resolvedType === 'file' && fileName"
      class="form-input__file-name"
    >
      已選擇檔案：{{ fileName }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';

type Size = 'sm' | 'md' | 'lg';

const props = withDefaults(
  defineProps<{
    modelValue?: any;
    label?: string;
    id?: string;
    name?: string;
    type?: string;
    placeholder?: string;
    error?: string;
    help?: string;
    required?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    success?: boolean;
    size?: Size;
    clearable?: boolean;
    togglePassword?: boolean;
    maxlength?: string | number;
    minlength?: string | number;
    autocomplete?: string;
    autofocus?: boolean;
    showLabel?: boolean;
  }>(),
  {
    modelValue: '',
    label: '',
    id: undefined,
    name: undefined,
    type: 'text',
    placeholder: '',
    error: '',
    help: '',
    required: false,
    disabled: false,
    readonly: false,
    success: false,
    size: 'md',
    clearable: false,
    togglePassword: false,
    maxlength: undefined,
    minlength: undefined,
    autocomplete: 'off',
    autofocus: false,
    showLabel: true,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | number | null): void;
  (e: 'focus', ev: FocusEvent): void;
  (e: 'blur', ev: FocusEvent): void;
  (e: 'clear'): void;
  (e: 'change', ev: Event): void;
}>();

const inputEl = ref<HTMLInputElement | null>(null);
const isFocus = ref(false);
const isReveal = ref(false);
const fileName = ref<string>('');

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'form-input--sm';
  if (props.size === 'lg') return 'form-input--lg';
  return '';
});

const showToggle = computed(
  () => props.togglePassword && props.type === 'password',
);

const resolvedType = computed(() => {
  if (showToggle.value) return isReveal.value ? 'text' : 'password';
  return props.type;
});

const showClearButton = computed(() => {
  return (
    props.clearable &&
    !props.disabled &&
    !props.readonly &&
    resolvedType.value !== 'file' &&
    (props.modelValue ?? '') !== ''
  );
});

const pickerTypes = new Set(['date', 'datetime-local', 'time', 'month', 'week']);

function openNativePicker() {
  const input = inputEl.value as (HTMLInputElement & { showPicker?: () => void }) | null;
  if (!input || props.disabled || props.readonly) return;
  if (!pickerTypes.has(String(resolvedType.value))) return;
  if (typeof input.showPicker === 'function') {
    try {
      input.showPicker();
    } catch {
      // ignore unsupported browsers
    }
  }
}

function onInput(e: Event) {
  const val = (e.target as HTMLInputElement).value;
  emit('update:modelValue', val);
}

function onClick() {
  openNativePicker();
}

function onFocus(ev: FocusEvent) {
  isFocus.value = true;
  openNativePicker();
  emit('focus', ev);
}

function onBlur(ev: FocusEvent) {
  isFocus.value = false;
  emit('blur', ev);
}

function onClear() {
  emit('update:modelValue', '');
  emit('clear');
  inputEl.value?.focus();
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];

  fileName.value = file?.name || '';
  emit('change', e);
}

onMounted(() => {
  if (props.autofocus) {
    requestAnimationFrame(() => inputEl.value?.focus());
  }
});
</script>

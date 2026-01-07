<!-- src/components/common/FormInput.vue -->
<template>
  <div class="form-input" :class="sizeClass">
    <!-- 標題 -->
    <label
      v-if="!hideLabel"
      class="form-input__label"
      :for="id"
      :class="{ 'form-input__label--required': required }"
    >
      {{ label || '\u00A0' }}
      <span v-if="required" class="form-input__asterisk">*</span>
    </label>

    <!-- 控制列 -->
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
        }"
      >
        <!-- 左側 addon -->
        <div
          v-if="$slots.addonLeft"
          class="form-input__addon form-input__addon--left"
        >
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
          :required="required"
          :maxlength="maxlength"
          :minlength="minlength"
          :autocomplete="autocomplete"
          :aria-required="required ? 'true' : 'false'"
          :aria-invalid="!!error ? 'true' : 'false'"
          @input="onInput"
          @focus="onFocus"
          @blur="onBlur"
        />

        <!-- ✅ 檔案輸入框 -->
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
          v-if="
            clearable &&
            !disabled &&
            !readonly &&
            resolvedType !== 'file' &&
            (modelValue ?? '') !== ''
          "
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

        <!-- 右側 addon -->
        <div
          v-if="$slots.addonRight"
          class="form-input__addon form-input__addon--right"
        >
          <slot name="addonRight" />
        </div>
      </div>
    </div>

    <!-- 錯誤訊息 / 輔助文字 -->
    <span class="form-input__error" v-if="error">{{ error }}</span>
    <span class="form-input__help" v-else-if="help">{{ help }}</span>

    <!-- ✅ 顯示檔案名稱 -->
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
    modelValue?: string | number | null;
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
    maxlength?: string;
    minlength?: string;
    autocomplete?: string;
    autofocus?: boolean;

    hideLabel?: boolean;
  }>(),
  {
    type: 'text',
    size: 'md',
    clearable: false,
    togglePassword: false,
    autocomplete: 'off',
    autofocus: false,
    hideLabel: false,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | number | null): void;
  (e: 'focus', ev: FocusEvent): void;
  (e: 'blur', ev: FocusEvent): void;
  (e: 'clear'): void;
  (e: 'change', ev: Event): void; // ✅ 新增 file input 專用事件
}>();

const inputEl = ref<HTMLInputElement | null>(null);
const isFocus = ref(false);
const isReveal = ref(false);
const fileName = ref<string>(''); // ✅ 用來顯示選擇的檔名

const sizeClass = computed(() => {
  return props.size === 'sm'
    ? 'form-input--sm'
    : props.size === 'lg'
    ? 'form-input--lg'
    : '';
});

const showToggle = computed(
  () => props.togglePassword && props.type === 'password'
);

const resolvedType = computed(() => {
  if (showToggle.value) return isReveal.value ? 'text' : 'password';
  return props.type;
});

function onInput(e: Event) {
  const val = (e.target as HTMLInputElement).value;
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

function onClear() {
  emit('update:modelValue', '');
  emit('clear');
  inputEl.value?.focus();
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  fileName.value = file?.name || '';
  emit('change', e); // ✅ 回傳整個 event 給父層
}

onMounted(() => {
  if (props.autofocus) {
    requestAnimationFrame(() => inputEl.value?.focus());
  }
});
</script>

<style scoped>
.form-input__file-name {
  margin-top: 4px;
  font-size: 0.875rem;
  color: #555;
}
</style>

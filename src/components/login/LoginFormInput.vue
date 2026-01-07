<!-- src/components/login/LoginFormInput.vue -->
<template>
  <div class="login-field">
    <label class="login-field__label">{{ label }}</label>

    <div class="login-field__input-box">
      <input
        class="login-field__input"
        :type="realType"
        v-model="value"
        v-bind="attrs"
        :placeholder="placeholder"
        :class="{ 'is-invalid': !!errors[name] }"
      />

      <!-- 密碼專用：顯示/隱藏按鈕 -->
      <button
        v-if="type === 'password'"
        type="button"
        class="login-field__toggle"
        @click="isVisible = !isVisible"
        aria-label="顯示或隱藏密碼"
      >
        <font-awesome-icon
          :icon="isVisible ? ['fas', 'eye-slash'] : ['fas', 'eye']"
        />
      </button>
    </div>

    <p class="login-field__error">{{ errors[name] }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useFormContext } from 'vee-validate';

const props = defineProps({
  name: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
});

const isVisible = ref(false);

const { defineField, errors } = useFormContext();
const [value, attrs] = defineField(props.name);

const realType = computed(() => {
  return props.type === 'password'
    ? isVisible.value
      ? 'text'
      : 'password'
    : props.type;
});
</script>

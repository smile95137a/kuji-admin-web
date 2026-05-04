<!-- src/components/login/LoginFormInput.vue -->
<template>
  <div class="login-field">
    <label class="login-field__label" :for="name">
      {{ label }}
    </label>

    <div class="login-field__input-box">
      <span v-if="icon" class="login-field__prefix-icon">
        <font-awesome-icon :icon="['fas', icon]" />
      </span>

      <input
        :id="name"
        class="login-field__input"
        :class="{
          'login-field__input--with-icon': !!icon,
          'login-field__input--password': type === 'password',
          'is-invalid': !!errors[name],
        }"
        :type="realType"
        v-model="value"
        v-bind="attrs"
        :placeholder="placeholder"
        autocomplete="off"
      />

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

    <p v-if="errors[name]" class="login-field__error">
      {{ errors[name] }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useFormContext } from 'vee-validate';

const props = withDefaults(
  defineProps<{
    name: string;
    label: string;
    type?: string;
    placeholder?: string;
    icon?: string;
  }>(),
  {
    type: 'text',
    placeholder: '',
    icon: '',
  },
);

const isVisible = ref(false);

const { defineField, errors } = useFormContext();
const [value, attrs] = defineField(props.name);

const realType = computed(() => {
  if (props.type !== 'password') return props.type;
  return isVisible.value ? 'text' : 'password';
});
</script>

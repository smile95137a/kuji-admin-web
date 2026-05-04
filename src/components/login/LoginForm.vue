<!-- src/components/login/LoginForm.vue -->
<template>
  <LoginFormInput
    name="username"
    label="使用者名稱"
    placeholder="請輸入使用者名稱"
    icon="user"
  />

  <LoginFormInput
    name="password"
    type="password"
    label="密碼"
    placeholder="請輸入密碼"
    icon="lock"
  />

  <button class="login-form__submit" type="submit">
    <span>登入系統</span>
    <font-awesome-icon :icon="['fas', 'arrow-right-to-bracket']" />
  </button>
</template>

<script setup lang="ts">
import LoginFormInput from '@/components/login/LoginFormInput.vue';
</script>

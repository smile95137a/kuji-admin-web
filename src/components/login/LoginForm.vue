<!-- src/components/login/LoginForm.vue -->
<template>
  <LoginFormInput
    name="username"
    label="使用者名稱"
    placeholder="請輸入使用者名稱"
  />

  <LoginFormInput name="password" type="password" label="密碼" />

  <button class="login-form__submit" type="submit">登入</button>
</template>

<script setup>
import LoginFormInput from '@/components/login/LoginFormInput.vue';
</script>

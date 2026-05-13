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

  <div class="login-form__aux-row">
    <RouterLink class="login-form__aux-link" to="/forgot-password">
      忘記密碼？
    </RouterLink>
  </div>

  <button class="login-form__submit" type="submit">
    <span>登入系統</span>
    <font-awesome-icon :icon="['fas', 'arrow-right-to-bracket']" />
  </button>
</template>

<script setup lang="ts">
import LoginFormInput from '@/components/login/LoginFormInput.vue';
import { RouterLink } from 'vue-router';
</script>

<style scoped lang="scss">
@use '@/assets/styles/base/tokens' as *;

.login-form__aux-row {
  display: flex;
  justify-content: flex-end;
  margin: -4px 0 18px;
}

.login-form__aux-link {
  color: $brand;
  font-size: 14px;
  font-weight: 700;
  text-decoration: underline;
}
</style>

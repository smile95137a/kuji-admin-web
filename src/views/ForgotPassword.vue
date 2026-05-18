<!-- src/views/ForgotPassword.vue -->
<template>
  <div class="login">
    <div class="login__bg-circle login__bg-circle--one" />
    <div class="login__bg-circle login__bg-circle--two" />

    <main class="login__main">
      <div class="login__container login__container--single">
        <section class="login__card forgot-password">
          <header class="login__header">
            <div class="login__header-title-box">
              <div class="login__header-icon">
                <font-awesome-icon :icon="['fas', 'key']" />
              </div>

              <div>
                <p class="login__header-kicker">Password Recovery</p>
                <h3 class="login__header-title">忘記密碼</h3>
                <p class="login__header-subtitle">
                  請輸入後台帳號 Email，系統會寄送一組臨時密碼到你的信箱。
                </p>
              </div>
            </div>
          </header>

          <div class="login__forms">
            <form
              class="login-form forgot-password__form"
              @submit.prevent="onSubmit"
            >
              <LoginFormInput
                name="email"
                type="email"
                label="帳號 Email"
                placeholder="請輸入帳號 Email"
                icon="envelope"
              />

              <div
                v-if="submitMessage"
                class="forgot-password__message forgot-password__message--success"
              >
                <font-awesome-icon :icon="['fas', 'circle-check']" />
                <span>{{ submitMessage }}</span>
              </div>

              <div
                v-if="submitError"
                class="forgot-password__message forgot-password__message--error"
              >
                <font-awesome-icon :icon="['fas', 'triangle-exclamation']" />
                <span>{{ submitError }}</span>
              </div>

              <button
                type="submit"
                class="login-form__submit"
                :disabled="isSubmitting"
              >
                <span>{{ isSubmitting ? '送出中…' : '送出申請' }}</span>
                <font-awesome-icon :icon="['fas', 'paper-plane']" />
              </button>

              <button
                type="button"
                class="forgot-password__back"
                @click="goLogin"
              >
                <font-awesome-icon :icon="['fas', 'arrow-left']" />
                <span>返回登入</span>
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import * as yup from 'yup';

import LoginFormInput from '@/components/login/LoginFormInput.vue';
import { forgotPassword } from '@/services/adminAuthService';

const router = useRouter();

const submitMessage = ref('');
const submitError = ref('');

const schema = yup.object({
  email: yup.string().required('Email 為必填').email('Email 格式不正確'),
});

const { handleSubmit, isSubmitting, resetForm } = useForm({
  validationSchema: schema,
  initialValues: {
    email: '',
  },
});

const goLogin = async () => {
  await router.replace('/login');
};

const onSubmit = handleSubmit(async (values) => {
  submitMessage.value = '';
  submitError.value = '';

  try {
    const res = await forgotPassword({
      email: values.email.trim(),
    });

    if (!res?.success) {
      submitError.value = res?.message ?? '送出失敗，請稍後再試';
      return;
    }

    submitMessage.value =
      '若此 Email 存在，系統會寄送臨時密碼到信箱，請留意收件匣與垃圾郵件。';

    resetForm();
  } catch (e: any) {
    submitError.value =
      e?.response?.data?.message ?? '目前無法送出申請，請稍後再試。';
  }
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as *;

.login__container--single {
  display: block;
  max-width: 560px;
}

.forgot-password {
  position: relative;

  &__form {
    gap: 18px;
  }

  &__message {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 13px 14px;
    border-radius: 14px;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.6;

    svg {
      flex: 0 0 auto;
      margin-top: 4px;
      font-size: 15px;
    }

    &--success {
      color: #195f3b;
      background: #eaf7ef;
      border: 1px solid #b7e0c6;
    }

    &--error {
      color: #9b2f23;
      background: #fff1ee;
      border: 1px solid #f1c3bb;
    }
  }

  &__back {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    width: 100%;
    min-height: 42px;
    padding: 10px 14px;
    border: 1px solid color.change($brand, $alpha: 0.22);
    border-radius: 9999px;
    background: color.change($brand, $alpha: 0.06);
    color: $brand;
    cursor: pointer;
    font-size: 14px;
    font-weight: 800;
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease,
      transform 0.15s ease;

    &:hover {
      border-color: color.change($brand, $alpha: 0.38);
      background: color.change($brand, $alpha: 0.1);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }
  }
}
</style>

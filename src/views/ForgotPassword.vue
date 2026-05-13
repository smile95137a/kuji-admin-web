<template>
  <div class="login">
    <div class="login__bg-circle login__bg-circle--one" />
    <div class="login__bg-circle login__bg-circle--two" />

    <main class="login__main">
      <div class="login__container login__container--single">
        <section class="login__card forgot-password">
          <div class="login__card-header">
            <h2>忘記密碼</h2>
            <p class="login__card-subtitle">
              請輸入後台帳號 Email，我們會寄送一組臨時密碼到你的信箱。
            </p>
          </div>

          <div class="login__forms">
            <form class="forgot-password__form" @submit.prevent="onSubmit">
              <div class="form-group">
                <label for="email">帳號 Email</label>
                <input
                  id="email"
                  v-model="email"
                  type="email"
                  placeholder="請輸入帳號 Email"
                  :class="['form-control', { 'is-invalid': emailError }]"
                />
                <div v-if="emailError" class="invalid-feedback">
                  {{ emailError }}
                </div>
              </div>

              <div
                v-if="submitMessage"
                class="forgot-password__message forgot-password__message--success"
              >
                {{ submitMessage }}
              </div>

              <div
                v-if="submitError"
                class="forgot-password__message forgot-password__message--error"
              >
                {{ submitError }}
              </div>

              <button
                type="submit"
                class="login-form__submit forgot-password__submit"
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
                返回登入
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
import { useField, useForm } from 'vee-validate';
import * as yup from 'yup';

import { forgotPassword } from '@/services/adminAuthService';

const router = useRouter();

const submitMessage = ref('');
const submitError = ref('');

const schema = yup.object({
  email: yup
    .string()
    .required('Email 為必填')
    .email('Email 格式不正確'),
});

const { handleSubmit, isSubmitting, resetForm } = useForm({
  validationSchema: schema,
  initialValues: {
    email: '',
  },
});

const { value: email, errorMessage: emailError } = useField<string>('email');

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
  padding: 40px 34px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow:
    0 24px 54px color.change($shadow-brand, $alpha: 0.16),
    inset 0 1px 0 color.change(#ffffff, $alpha: 0.68);

  &__form {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  &__message {
    padding: 12px 14px;
    border-radius: 14px;
    font-size: 14px;
    line-height: 1.6;

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

  &__submit {
    margin-top: 6px;
  }

  &__back {
    border: none;
    background: transparent;
    color: $brand;
    font-size: 14px;
    font-weight: 700;
    text-decoration: underline;
    cursor: pointer;
  }
}
</style>

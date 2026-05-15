<template>
  <div class="change-password">
    <div class="change-password__bg-circle change-password__bg-circle--one" />
    <div class="change-password__bg-circle change-password__bg-circle--two" />

    <main class="change-password__main">
      <div class="change-password__container">
        <LoginAside />

        <section class="change-password__card">
          <header class="change-password__header">
            <div class="change-password__header-title-box">
              <div class="change-password__header-icon">
                <font-awesome-icon :icon="['fas', 'key']" />
              </div>

              <div>
                <p class="change-password__header-kicker">First Login</p>
                <h3 class="change-password__header-title">首次登入修改密碼</h3>
                <p class="change-password__header-subtitle">
                  為確保帳號安全，請輸入初始密碼並設定新密碼後繼續使用。
                </p>
              </div>
            </div>
          </header>

          <div class="change-password__forms">
            <form class="change-password-form" @submit.prevent="onSubmit">
              <label class="change-password-field" for="oldPassword">
                <span class="change-password-field__label">目前密碼</span>

                <span class="change-password-field__input-box">
                  <font-awesome-icon
                    class="change-password-field__prefix-icon"
                    :icon="['fas', 'lock']"
                  />

                  <input
                    id="oldPassword"
                    v-model="oldPassword"
                    type="password"
                    class="change-password-field__input change-password-field__input--with-icon"
                    :class="{ 'is-invalid': oldPasswordError }"
                    placeholder="請輸入 Email 收到的初始密碼"
                    autocomplete="current-password"
                  />
                </span>

                <p class="change-password-field__error">
                  {{ oldPasswordError }}
                </p>
              </label>

              <label class="change-password-field" for="newPassword">
                <span class="change-password-field__label">新密碼</span>

                <span class="change-password-field__input-box">
                  <font-awesome-icon
                    class="change-password-field__prefix-icon"
                    :icon="['fas', 'shield-halved']"
                  />

                  <input
                    id="newPassword"
                    v-model="newPassword"
                    type="password"
                    class="change-password-field__input change-password-field__input--with-icon"
                    :class="{ 'is-invalid': newPasswordError }"
                    placeholder="請輸入新密碼，至少 8 碼"
                    autocomplete="new-password"
                  />
                </span>

                <p class="change-password-field__error">
                  {{ newPasswordError }}
                </p>
              </label>

              <label class="change-password-field" for="confirmPassword">
                <span class="change-password-field__label">確認新密碼</span>

                <span class="change-password-field__input-box">
                  <font-awesome-icon
                    class="change-password-field__prefix-icon"
                    :icon="['fas', 'check']"
                  />

                  <input
                    id="confirmPassword"
                    v-model="confirmPassword"
                    type="password"
                    class="change-password-field__input change-password-field__input--with-icon"
                    :class="{ 'is-invalid': confirmPasswordError }"
                    placeholder="請再次輸入新密碼"
                    autocomplete="new-password"
                  />
                </span>

                <p class="change-password-field__error">
                  {{ confirmPasswordError }}
                </p>
              </label>

              <div
                v-if="submitError"
                class="change-password-form__message change-password-form__message--danger"
              >
                <font-awesome-icon :icon="['fas', 'circle-exclamation']" />
                <span>{{ submitError }}</span>
              </div>

              <button
                class="change-password-form__submit"
                type="submit"
                :disabled="isSubmitting"
              >
                <span>{{ isSubmitting ? '處理中…' : '確認修改' }}</span>
                <font-awesome-icon :icon="['fas', 'arrow-right']" />
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

import LoginAside from '@/components/login/LoginAside.vue';

import { firstLoginChangePassword } from '@/services/adminAuthService';
import { useAuthStore } from '@/stores';

const router = useRouter();
const authStore = useAuthStore();

const schema = yup.object({
  oldPassword: yup.string().required('初始密碼為必填'),
  newPassword: yup
    .string()
    .required('新密碼為必填')
    .min(8, '密碼至少需要 8 個字元'),
  confirmPassword: yup
    .string()
    .required('確認密碼為必填')
    .oneOf([yup.ref('newPassword')], '兩次密碼不一致'),
});

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: schema,
  initialValues: {
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  },
});

const { value: oldPassword, errorMessage: oldPasswordError } =
  useField<string>('oldPassword');

const { value: newPassword, errorMessage: newPasswordError } =
  useField<string>('newPassword');

const { value: confirmPassword, errorMessage: confirmPasswordError } =
  useField<string>('confirmPassword');

const submitError = ref<string | null>(null);

const onSubmit = handleSubmit(async (values) => {
  submitError.value = null;

  try {
    const res = await firstLoginChangePassword({
      oldPassword: values.oldPassword,
      newPassword: values.newPassword,
      confirmPassword: values.confirmPassword,
    });

    if (res?.success) {
      authStore.setForceChangePassword(false);
      router.push('/home');
      return;
    }

    submitError.value = res?.message ?? '密碼修改失敗，請稍後再試';
  } catch (e: any) {
    submitError.value =
      e?.response?.data?.message ?? '密碼修改失敗，請聯絡系統管理員';
  }
});
</script>

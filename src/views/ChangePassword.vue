<template>
  <div class="login">
    <div class="login__main">
      <div class="login__container">
        <aside class="login__aside">
          <img src="@/assets/image/logo.png" alt="logo" class="login__logo" />
        </aside>
        <section class="login__card">
          <div class="login__card-header">
            <h2>首次登入 — 請修改密碼</h2>
            <p class="login__card-subtitle">為確保帳號安全，請設定新密碼後繼續使用。</p>
          </div>
          <div class="login__forms">
            <form @submit.prevent="onSubmit">
              <div class="form-group">
                <label for="currentPassword">目前密碼（初始密碼）</label>
                <input
                  id="currentPassword"
                  v-model="currentPassword"
                  type="password"
                  placeholder="請輸入目前的密碼"
                  :class="['form-control', { 'is-invalid': currentPasswordError }]"
                />
                <div v-if="currentPasswordError" class="invalid-feedback">{{ currentPasswordError }}</div>
              </div>

              <div class="form-group mt-3">
                <label for="newPassword">新密碼</label>
                <input
                  id="newPassword"
                  v-model="newPassword"
                  type="password"
                  placeholder="請輸入新密碼（至少 8 碼）"
                  :class="['form-control', { 'is-invalid': newPasswordError }]"
                />
                <div v-if="newPasswordError" class="invalid-feedback">{{ newPasswordError }}</div>
              </div>

              <div class="form-group mt-3">
                <label for="confirmPassword">確認新密碼</label>
                <input
                  id="confirmPassword"
                  v-model="confirmPassword"
                  type="password"
                  placeholder="請再次輸入新密碼"
                  :class="['form-control', { 'is-invalid': confirmPasswordError }]"
                />
                <div v-if="confirmPasswordError" class="invalid-feedback">{{ confirmPasswordError }}</div>
              </div>

              <div v-if="submitError" class="alert alert-danger mt-3">{{ submitError }}</div>

              <button type="submit" class="btn btn-primary w-100 mt-4" :disabled="isSubmitting">
                {{ isSubmitting ? '處理中…' : '確認修改' }}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useField, useForm } from 'vee-validate';
import * as yup from 'yup';
import { changeAdminUserPassword } from '@/services/adminUserService';
import { useAuthStore } from '@/stores';

const router = useRouter();
const authStore = useAuthStore();

const schema = yup.object({
  currentPassword: yup.string().required('目前密碼為必填'),
  newPassword: yup
    .string()
    .required('新密碼為必填')
    .min(8, '密碼至少需要 8 個字元'),
  confirmPassword: yup
    .string()
    .required('確認密碼為必填')
    .oneOf([yup.ref('newPassword')], '兩次密碼不一致'),
});

const { handleSubmit, isSubmitting } = useForm({ validationSchema: schema });

const { value: currentPassword, errorMessage: currentPasswordError } = useField<string>('currentPassword');
const { value: newPassword, errorMessage: newPasswordError } = useField<string>('newPassword');
const { value: confirmPassword, errorMessage: confirmPasswordError } = useField<string>('confirmPassword');

const submitError = ref<string | null>(null);

const onSubmit = handleSubmit(async (values) => {
  submitError.value = null;
  const userId = authStore.user?.id;
  if (!userId) {
    submitError.value = '無法取得用戶資訊，請重新登入';
    return;
  }
  try {
    const res = await changeAdminUserPassword(userId, {
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });

    if (res?.success) {
      authStore.setForceChangePassword(false);
      router.push('/home');
    } else {
      submitError.value = res?.message ?? '密碼修改失敗，請稍後再試';
    }
  } catch (e: any) {
    submitError.value = e?.response?.data?.message ?? '密碼修改失敗，請聯絡系統管理員';
  }
});
</script>

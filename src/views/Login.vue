<template>
  <div class="login">
    <div class="login__main">
      <div class="login__container">
        <LoginAside />
        <section class="login__card">
          <LoginCardHeader />
          <div class="login__forms">
            <form @submit.prevent="onSubmit">
              <LoginForm />
            </form>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import LoginAside from '@/components/login/LoginAside.vue';
import LoginForm from '@/components/login/LoginForm.vue';
import LoginCardHeader from '@/components/login/LoginCardHeader.vue';
import { useForm } from 'vee-validate';
import * as yup from 'yup';
import { useAuthStore } from '@/stores';
import { useRouter } from 'vue-router';
import { adminLogin } from '@/services/adminAuthService';
import { executeApi } from '@/utils/executeApiUtils';

const authStore = useAuthStore();
const router = useRouter();

const schema = yup.object({
  username: yup.string().required('使用者名稱為必填'),
  password: yup.string().required('密碼為必填'),
});

const { handleSubmit, setFieldError } = useForm({
  validationSchema: schema,
  initialValues: {
    username: 'admin@kuji.com',
    password: 'admin123',
  },
});

const onSubmit = handleSubmit(async (values) => {
  await executeApi({
    fn: () =>
      adminLogin({
        username: values.username,
        password: values.password,
      }),

    onSuccess: async (data: any) => {
      const accessToken = data?.token ?? data?.accessToken;
      const user = data?.adminUser ?? data?.user;
      const forceChangePassword = !!(
        data?.isFirstLogin ?? data?.forceChangePassword
      );

      if (!accessToken || !user) {
        setFieldError('password', '登入回傳資料異常，請聯絡系統管理員');
        return;
      }

      authStore.setAuthFromLogin?.(data);

      if (forceChangePassword) {
        router.push('/first-login/change-password');
      } else {
        router.push('/home');
      }
    },

    onFail: async (_data: any) => {
      setFieldError('password', '登入失敗，請確認帳號密碼');
    },
  });
});
</script>

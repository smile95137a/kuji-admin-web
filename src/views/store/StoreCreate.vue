<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useField, useForm } from 'vee-validate';
import * as yup from 'yup';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormInput from '@/components/common/FormInput.vue';

import { useDialogStore } from '@/stores';
import { createStore } from '@/services/adminStoreService';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

const router = useRouter();
const dialogStore = useDialogStore();

/* ==============================
 * Form schema
 * ============================== */
const includeOwner = ref(false);

const schema = yup.object({
  storeName: yup.string().required('店家名稱為必填'),
  shortDescription: yup.string().max(100, '簡短描述最多 100 字').optional(),
  phone: yup.string().optional(),
  email: yup
    .string()
    .email('Email 格式不正確')
    .optional()
    .transform((v) => v || undefined),
  ownerUsername: yup.string().when('$includeOwner', {
    is: true,
    then: (s) => s.required('帳號（Email）為必填').email('請輸入有效 Email'),
    otherwise: (s) => s.optional(),
  }),
  ownerPassword: yup.string().optional(),
});

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: schema,
  validateOnMount: false,
});

const { value: storeName, errorMessage: storeNameError } =
  useField<string>('storeName');
const { value: shortDescription } = useField<string>('shortDescription');
const { value: phone } = useField<string>('phone');
const { value: email } = useField<string>('email');
const { value: ownerUsername, errorMessage: ownerUsernameError } =
  useField<string>('ownerUsername');
const { value: ownerPassword } = useField<string>('ownerPassword');

/* ==============================
 * Submit
 * ============================== */
const onSubmit = handleSubmit(async (values) => {
  const req: Record<string, any> = {
    storeName: values.storeName,
    shortDescription: values.shortDescription || undefined,
    phone: values.phone || undefined,
    email: values.email || undefined,
  };

  if (includeOwner.value && values.ownerUsername) {
    req.owner = {
      username: values.ownerUsername,
      password: values.ownerPassword || undefined,
    };
  }

  try {
    const res = await createStore(req);
    if (res?.success !== false) {
      await openInfoDialog({
        title: '提示訊息',
        message: '店家已成功建立',
        iconType: 'success',
      });
      router.push({ name: 'StoreList' });
    } else {
      await openInfoDialog({
        title: '提示訊息',
        message: res?.message ?? '建立失敗，請重試',
        iconType: 'warning',
      });
    }
  } catch (e: any) {
    await openInfoDialog({
      title: '提示訊息',
      message: e?.response?.data?.message ?? '建立失敗，請聯絡系統管理員',
      iconType: 'warning',
    });
  }
});
</script>

<template>
  <MCard>
    <div class="flex align-center gap-x-12 m-b-16">
      <MButton
        variant="secondary"
        size="sm"
        @click="router.push({ name: 'StoreList' })"
        >← 返回</MButton
      >
      <p class="form__text form__text--title" style="margin: 0">新增店家</p>
    </div>

    <form @submit.prevent="onSubmit">
      <!-- ===== 基本資訊 ===== -->
      <div class="sc__section">
        <p class="sc__section-title">店家基本資訊</p>
        <div class="flex flex-wrap">
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="店家名稱"
              v-model="storeName"
              :error="storeNameError"
              placeholder="KUJI 官方商店"
              required
            />
          </div>
          <div class="w-50 w-md-100 p-6">
            <div class="sc__char-count-wrapper">
              <FormInput
                label="簡短描述（最多 100 字）"
                v-model="shortDescription"
                placeholder="專營一番賞、扭蛋精品"
              />
              <span
                class="sc__char-count"
                :class="{
                  'sc__char-count--over': (shortDescription?.length ?? 0) > 100,
                }"
              >
                {{ shortDescription?.length ?? 0 }} / 100
              </span>
            </div>
          </div>
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="聯絡電話"
              v-model="phone"
              placeholder="02-1234-5678"
            />
          </div>
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="聯絡 Email"
              v-model="email"
              type="email"
              placeholder="store@example.com"
            />
          </div>
        </div>
      </div>

      <!-- ===== 建立負責人帳號（可選） ===== -->
      <div class="sc__section">
        <div class="sc__owner-toggle">
          <input
            id="includeOwner"
            type="checkbox"
            v-model="includeOwner"
            class="sc__checkbox"
          />
          <label
            for="includeOwner"
            class="sc__section-title"
            style="cursor: pointer; margin: 0"
          >
            同步建立負責人帳號（可選）
          </label>
        </div>

        <div v-if="includeOwner" class="flex flex-wrap m-t-8">
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="帳號（Email）"
              v-model="ownerUsername"
              :error="ownerUsernameError"
              type="email"
              placeholder="owner@example.com"
              required
            />
          </div>
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="初始密碼（留空則系統自動產生）"
              v-model="ownerPassword"
              type="password"
              placeholder="（可選）"
            />
          </div>
        </div>
      </div>

      <!-- ===== Actions ===== -->
      <div class="flex justify-center gap-x-12 m-t-8">
        <MButton
          type="button"
          variant="secondary"
          @click="router.push({ name: 'StoreList' })"
        >
          取消
        </MButton>
        <MButton type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? '建立中...' : '建立店家' }}
        </MButton>
      </div>
    </form>
  </MCard>
</template>

<style scoped lang="scss">
.sc {
  &__section {
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid #e5e7eb;

    &:last-of-type {
      border-bottom: none;
    }
  }

  &__section-title {
    font-size: 15px;
    font-weight: 700;
    color: #374151;
    margin-bottom: 12px;
  }

  &__owner-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
  }

  &__checkbox {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: #6366f1;
  }

  &__char-count-wrapper {
    position: relative;
  }

  &__char-count {
    font-size: 12px;
    color: #6b7280;
    text-align: right;
    display: block;

    &--over {
      color: #dc2626;
      font-weight: 700;
    }
  }
}
</style>

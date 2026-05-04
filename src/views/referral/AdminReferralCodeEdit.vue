<template>
  <MCard>
    <form @submit.prevent="onSubmit">
      <p class="form__text form__text--title">
        推薦碼 {{ isEdit ? '編輯' : '新增' }}
      </p>

      <div class="flex flex-wrap">
        <!-- 推薦碼 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="推薦碼"
            v-model="code"
            :error="errors.code"
            :disabled="!isEdit"
            placeholder="系統自動生成"
          />
        </div>

        <!-- 指定店家 -->
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="指定店家"
            v-model="storeId"
            :options="storeOptions"
            :error="errors.storeId"
          />
        </div>

        <!-- 狀態 -->
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="狀態"
            v-model="enabled"
            :options="enabledOptions"
            :error="errors.enabled"
          />
        </div>

        <!-- 備註 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="備註（可不填）"
            v-model="remark"
            :error="errors.remark"
            placeholder="remark"
          />
        </div>
      </div>

      <!-- bottom button -->
      <div class="flex justify-center m-y-12 gap-x-12">
        <MButton type="submit">
          {{ isEdit ? '更新' : '新增' }}
        </MButton>

        <MButton type="button" class="mbtn--red" @click="router.back()">
          返回
        </MButton>
      </div>
    </form>
  </MCard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import * as yup from 'yup';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';

import { executeApi } from '@/utils/executeApiUtils';

import {
  getReferralCodeById,
  createReferralCode,
  updateReferralCode,
} from '@/services/adminReferralCodeService';
import { getStoreOptions, toSelectOptions } from '@/services/adminStoreService';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

/* Setup */
const route = useRoute();
const router = useRouter();
const isEdit = computed(() => Boolean(route.params.id));

const enabledOptions = [
  { label: '啟用', value: true },
  { label: '停用', value: false },
];

const storeOptions = ref<{ label: string; value: any }[]>([]);

/** schema */
const schema = yup.object({
  code: yup
    .string()
    .nullable()
    .test('referral-format', '格式需為 6–12 位大寫英數字（A-Z、0-9）', (v) => {
      if (!v) return true;
      return /^[A-Z0-9]{6,12}$/.test(v);
    }),
  storeId: yup.string().required('請選擇指定店家'),
  enabled: yup.boolean().required('請選擇狀態'),
  remark: yup.string().nullable(),
});

const { errors, handleSubmit, setValues, defineField } = useForm({
  validationSchema: schema,
  initialValues: {
    code: '',
    storeId: '',
    enabled: true,
    remark: '',
  },
});

const [code] = defineField('code');
const [storeId] = defineField('storeId');
const [enabled] = defineField('enabled');
const [remark] = defineField('remark');

/** 產生 6 碼大寫英文字母推薦碼 */
const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)],
  ).join('');
};

onMounted(async () => {
  // 載入店家選單
  await executeApi({
    fn: async () => getStoreOptions({ activeOnly: true }),
    onSuccess: (data: any[]) => {
      storeOptions.value = toSelectOptions(data ?? []);
    },
    showSuccessDialog: false,
  });

  if (!isEdit.value) {
    // 新增時自動產生推薦碼
    setValues({ code: generateCode(), storeId: '', enabled: true, remark: '' });
    return;
  }

  await executeApi({
    fn: async () => getReferralCodeById(route.params.id as string),
    onSuccess: (data) => {
      const d: any = data;
      setValues({
        code: d.code ?? '',
        storeId: d.storeId ? String(d.storeId) : '',
        enabled: d.enabled ?? true,
        remark: d.remark ?? '',
      });
    },
  });
});

const onSubmit = handleSubmit(async (values) => {
  const payload = {
    code: values.code,
    storeId: values.storeId,
    enabled: values.enabled,
    remark: values.remark || '',
  };

  if (!isEdit.value) {
    await executeApi({
      fn: async () => createReferralCode(payload),
      onSuccess: async () => {
        await openInfoDialog({
          title: '提示訊息',
          message: '新增成功',
          iconType: 'success',
        });
        router.push('/home/referral-codes');
      },
    });
  } else {
    await executeApi({
      fn: async () => updateReferralCode(route.params.id as string, payload),
      onSuccess: async () => {
        await openInfoDialog({
          title: '提示訊息',
          message: '更新成功',
          iconType: 'success',
        });
        router.push('/home/referral-codes');
      },
    });
  }
});
</script>

<style scoped></style>

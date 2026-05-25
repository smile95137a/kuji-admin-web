<!-- src/views/referral/AdminReferralCodeEdit.vue -->
<template>
  <MCard>
    <form class="admin-referral-code-form" @submit.prevent="onSubmit">
      <p class="form__text form__text--title">
        推薦碼 {{ isEdit ? '編輯' : '新增' }}
      </p>

      <!-- 基本資料 -->
      <FormSection title="基本資料">
        <div class="admin-referral-code-form__card">
          <div class="flex flex-wrap">
            <!-- 推薦碼 -->
            <div class="w-50 w-md-100 p-6">
              <FormInput
                label="推薦碼"
                v-model="code"
                :error="displayErrors.code"
                disabled
                placeholder="系統自動生成"
              />
            </div>

            <!-- 指定店家 -->
            <div class="w-50 w-md-100 p-6">
              <!-- 編輯模式：只顯示店家名稱，不可修改 -->
              <FormInput
                v-if="isEdit"
                label="指定店家"
                :modelValue="currentStoreName"
                disabled
              />
              <!-- 新增模式：下拉選單（已有推薦碼的店家不顯示） -->
              <FormSelect
                v-else
                label="指定店家"
                v-model="storeId"
                :options="storeOptions"
                :error="displayErrors.storeId"
                :showAll="true"
                allLabel="請選擇"
                :allValue="''"
                required
              />
            </div>
          </div>
        </div>
      </FormSection>

      <!-- 狀態設定 -->
      <FormSection title="狀態設定">
        <div class="admin-referral-code-form__card">
          <FormRadioTagGroup
            label="狀態"
            name="referral-code-enabled"
            id-prefix="referral-code-enabled"
            v-model="enabled"
            :options="enabledOptions"
            :error="displayErrors.enabled"
            required
          />
        </div>
      </FormSection>

      <!-- 備註 -->
      <FormSection title="備註">
        <FormTextarea
          v-model="remark"
          :error="displayErrors.remark"
          :maxlength="200"
          :rows="4"
          placeholder="可輸入備註說明"
        />
      </FormSection>

      <!-- bottom button -->
      <div class="flex justify-center m-y-12 gap-x-12 flex-wrap">
        <MButton type="submit">
          <font-awesome-icon icon="fa-floppy-disk" class="m-r-4" />
          {{ isEdit ? '更新' : '新增' }}
        </MButton>

        <MButton type="button" class="mbtn--gray" @click="navigateBack">
          <font-awesome-icon icon="fa-arrow-left" class="m-r-4" />
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
import FormSection from '@/components/common/FormSection.vue';
import FormRadioTagGroup from '@/components/common/FormRadioTagGroup.vue';
import FormTextarea from '@/components/common/FormTextarea.vue';

import { executeApi } from '@/utils/executeApiUtils';

import {
  getReferralCodeById,
  createReferralCode,
  updateReferralCode,
  getAllReferralCodes,
} from '@/services/adminReferralCodeService';

import { getStoreOptions, toSelectOptions } from '@/services/adminStoreService';
import { openInfoDialog } from '@/utils/dialog/infoDialog';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';

/* --------------------------------------
 * Setup
 * -------------------------------------- */
const route = useRoute();
const router = useRouter();

const isEdit = computed(() => Boolean(route.params.id));
const id = computed(() => String(route.params.id || ''));

const isSubmitted = ref(false);

const displayErrors = computed<Record<string, string | undefined>>(() => {
  if (!isSubmitted.value) return {};
  return errors.value;
});

type SelectOption = {
  label: string;
  value: any;
  disabled?: boolean;
};

const enabledOptions: SelectOption[] = [
  { label: '啟用', value: true },
  { label: '停用', value: false },
];

const storeOptions = ref<SelectOption[]>([]);
const currentStoreName = ref('');

/* --------------------------------------
 * Utils
 * -------------------------------------- */
const normalizeBoolean = (value: unknown) => {
  if (value === true || value === false) return value;

  const text = String(value ?? '')
    .trim()
    .toLowerCase();

  if (text === 'true' || text === '1') return true;
  if (text === 'false' || text === '0') return false;

  return true;
};

const normalizeStoreOptions = (res: any) => {
  const data = res?.data ?? res ?? [];
  return Array.isArray(data) ? data : [];
};

const ensureStoreOptionExists = (storeIdValue: string) => {
  if (!storeIdValue) return;

  const exists = storeOptions.value.some(
    (option) => String(option.value) === String(storeIdValue),
  );

  if (!exists) {
    storeOptions.value.unshift({
      label: '未命名店家',
      value: storeIdValue,
    });
  }
};

/** 產生 6 碼大寫英文字母推薦碼 */
const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join('');
};

/* --------------------------------------
 * Schema
 * -------------------------------------- */
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

  remark: yup.string().nullable().max(200, '備註最多 200 字'),
});

/* --------------------------------------
 * useForm
 * -------------------------------------- */
const { errors, handleSubmit, setValues, defineField } = useForm({
  validationSchema: schema,
  initialValues: {
    code: '',
    storeId: '',
    enabled: true,
    remark: '',
  },
  validateOnMount: false,
});

const [code] = defineField('code');
const [storeId] = defineField('storeId');
const [enabled] = defineField('enabled');
const [remark] = defineField('remark');

/* --------------------------------------
 * Load options / detail
 * -------------------------------------- */
const loadStoreOptions = async () => {
  // In edit mode we only show the store name as text — no need to load the full option list
  if (isEdit.value) return;

  // Fetch stores and existing codes in parallel
  let storeData: any[] = [];
  let occupiedStoreIds = new Set<string>();

  await executeApi({
    fn: async () => getStoreOptions({ activeOnly: true }),
    onSuccess: (res: any) => {
      storeData = normalizeStoreOptions(res);
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });

  // Fetch all existing referral codes to know which stores already have one
  await executeApi({
    fn: async () => getAllReferralCodes(),
    onSuccess: (res: any) => {
      const codes: any[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      codes.forEach((c: any) => {
        if (c.storeId) occupiedStoreIds.add(c.storeId);
      });
    },
    showSuccessDialog: false,
    showFailDialog: false,
    showCatchDialog: false,
  });

  // Filter out stores that already have a referral code
  storeOptions.value = toSelectOptions(storeData).filter(
    (opt) => !occupiedStoreIds.has(String(opt.value)),
  );
};

const loadDetail = async () => {
  if (!isEdit.value || !id.value) {
    setValues(
      {
        code: generateCode(),
        storeId: '',
        enabled: true,
        remark: '',
      },
      false,
    );

    return;
  }

  await executeApi({
    fn: async () => getReferralCodeById(id.value),
    onSuccess: (res: any) => {
      const data = res?.data ?? res;

      const nextStoreId = data?.storeId ? String(data.storeId) : '';
      currentStoreName.value = data?.storeName || '-';

      setValues(
        {
          code: data?.code ?? '',
          storeId: nextStoreId,
          enabled: normalizeBoolean(data?.isActive ?? data?.enabled),
          remark: data?.description ?? data?.remark ?? '',
        },
        false,
      );
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

/* --------------------------------------
 * Submit
 * -------------------------------------- */
const onSubmit = handleSubmit(
  async (values) => {
    isSubmitted.value = true;

    const ok = await openConfirmDialog({
      title: '儲存確認',
      message: `確定要${isEdit.value ? '更新' : '新增'}推薦碼嗎？`,
    });

    if (!ok) return;

    const payload = {
      code: String(values.code ?? '').trim(),
      storeId: values.storeId,
      isActive: normalizeBoolean(values.enabled),
      description: String(values.remark ?? '').trim(),
    };

    await executeApi({
      fn: async () => {
        if (isEdit.value) {
          return updateReferralCode(id.value, payload);
        }

        return createReferralCode(payload);
      },
      onSuccess: async () => {
        await openInfoDialog({
          title: '提示訊息',
          message: isEdit.value ? '更新成功' : '新增成功',
          iconType: 'success',
        });

        router.push('/home/referral-codes');
      },
      showSuccessDialog: false,
      showFailDialog: true,
      showCatchDialog: true,
    });
  },
  () => {
    isSubmitted.value = true;
  },
);

/* --------------------------------------
 * Navigation
 * -------------------------------------- */
const navigateBack = () => {
  router.push('/home/referral-codes');
};

/* --------------------------------------
 * Mounted
 * -------------------------------------- */
onMounted(async () => {
  await loadStoreOptions();
  await loadDetail();
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as *;

.admin-referral-code-form {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;

  &__card {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    padding: 14px;
    border: 1px solid color.mix($form-border, #fff, 72%);
    border-radius: 14px;
    background: $form-bg;
  }

  @media (max-width: 576px) {
    &__card {
      padding: 12px;
    }
  }
}
</style>

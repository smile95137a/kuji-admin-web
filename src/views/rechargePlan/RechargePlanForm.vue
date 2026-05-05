<!-- src/views/rechargePlan/RechargePlanForm.vue -->
<template>
  <MCard>
    <form class="recharge-plan-form" @submit.prevent="onSubmit">
      <p class="form__text form__text--title">
        {{ pageTitle }}
      </p>

      <!-- 基本資料 -->
      <FormSection title="基本資料">
        <div class="flex flex-wrap">
          <!-- 方案名稱 -->
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="方案名稱"
              v-model="name"
              :error="displayErrors.name"
              required
              maxlength="50"
              placeholder="例如：入門方案 / 限時活動"
              :disabled="isDetail"
            />
          </div>

          <!-- 方案說明 -->
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="方案說明"
              v-model="description"
              :error="displayErrors.description"
              maxlength="200"
              placeholder="例如：首次儲值推薦 / 新年特惠"
              :disabled="isDetail"
            />
          </div>

          <!-- 狀態 -->
          <div class="w-50 w-md-100 p-6">
            <FormRadioTagGroup
              label="狀態"
              name="recharge-plan-active"
              id-prefix="recharge-plan-active"
              v-model="isActive"
              :options="activeOptions"
              :error="displayErrors.isActive"
              required
              :disabled="isDetail"
            />
          </div>

          <!-- 方案類型 -->
          <div class="w-50 w-md-100 p-6">
            <FormRadioTagGroup
              label="方案類型"
              name="recharge-plan-promotional"
              id-prefix="recharge-plan-promotional"
              v-model="isPromotional"
              :options="promotionalOptions"
              :error="displayErrors.isPromotional"
              required
              :disabled="isDetail"
            />
          </div>
        </div>
      </FormSection>

      <!-- 金額設定 -->
      <FormSection title="金額設定">
        <div class="flex flex-wrap">
          <!-- 儲值金額 -->
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="儲值金額"
              type="number"
              v-model="amount"
              :error="displayErrors.amount"
              required
              placeholder="例如：1000"
              :disabled="isDetail"
            />
          </div>

          <!-- 獲得金幣 -->
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="獲得金幣"
              type="number"
              v-model="goldCoins"
              :error="displayErrors.goldCoins"
              required
              placeholder="例如：1000"
              :disabled="isDetail"
            />
          </div>

          <!-- 贈送紅利 -->
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="贈送紅利"
              type="number"
              v-model="bonusCoins"
              :error="displayErrors.bonusCoins"
              placeholder="預設 0"
              :disabled="isDetail"
            />
          </div>

          <!-- 顯示順序 -->
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="顯示順序"
              type="number"
              v-model="displayOrder"
              :error="displayErrors.displayOrder"
              placeholder="例如：1"
              :disabled="isDetail"
            />
          </div>
        </div>
      </FormSection>

      <!-- 活動時間 -->
      <FormSection v-if="isPromotional" title="活動時間">
        <div class="flex flex-wrap">
          <div class="w-100 p-6">
            <FormDateRangeField
              label="活動期間"
              type="datetime-local"
              v-model:start="startTime"
              v-model:end="endTime"
              :start-error="displayErrors.startTime"
              :end-error="displayErrors.endTime"
            />
          </div>
        </div>
      </FormSection>

      <!-- 系統資訊 -->
      <FormSection v-if="isDetail || isEdit" title="系統資訊">
        <div class="flex flex-wrap">
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="建立時間"
              :modelValue="formatDateTime(detail?.createdAt)"
              disabled
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="更新時間"
              :modelValue="formatDateTime(detail?.updatedAt)"
              disabled
            />
          </div>
        </div>
      </FormSection>

      <!-- bottom button -->
      <div class="flex justify-center m-y-12 gap-x-12 flex-wrap">
        <template v-if="!isDetail">
          <MButton type="submit">
            <font-awesome-icon icon="fa-floppy-disk" class="m-r-4" />
            {{ isEdit ? '更新' : '新增' }}
          </MButton>

          <MButton
            v-if="isEdit"
            type="button"
            class="mbtn--red"
            @click="doDelete"
          >
            <font-awesome-icon icon="fa-trash" class="m-r-4" />
            刪除
          </MButton>
        </template>

        <template v-else>
          <MButton type="button" @click="navigateToEdit"> 編輯 </MButton>
        </template>

        <MButton type="button" class="mbtn--gray" @click="navigateBack">
          <font-awesome-icon icon="fa-arrow-left" class="m-r-4" />
          返回
        </MButton>
      </div>
    </form>
  </MCard>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import * as yup from 'yup';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSection from '@/components/common/FormSection.vue';
import FormDateRangeField from '@/components/common/FormDateRangeField.vue';
import FormRadioTagGroup from '@/components/common/FormRadioTagGroup.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { useRechargePlanStore } from '@/stores/rechargePlan/useRechargePlanStore';

import {
  createRechargePlan,
  updateRechargePlan,
  getRechargePlanById,
  deleteRechargePlan,
} from '@/services/adminRechargePlanService';

import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

const route = useRoute();
const router = useRouter();
const rechargePlanStore = useRechargePlanStore();

const mode = computed<'add' | 'edit' | 'detail'>(() => {
  if (route.name === 'RechargePlanAdd') return 'add';
  if (route.name === 'RechargePlanEdit') return 'edit';
  return 'detail';
});

const isEdit = computed(() => mode.value === 'edit');
const isDetail = computed(() => mode.value === 'detail');
const id = computed(() => String(route.params.id || ''));

/** 是否已按過送出 */
const isSubmitted = ref(false);

/** 只有送出後才顯示錯誤 */
const displayErrors = computed<Record<string, string | undefined>>(() => {
  if (!isSubmitted.value) return {};
  return errors.value;
});

const pageTitle = computed(() => {
  if (mode.value === 'add') return '新增儲值方案';
  if (mode.value === 'edit') return '編輯儲值方案';
  return '儲值方案詳情';
});

type SelectOption = {
  label: string;
  value: string | number | boolean;
  disabled?: boolean;
};

const activeOptions: SelectOption[] = [
  { label: '啟用', value: true },
  { label: '停用', value: false },
];

const promotionalOptions: SelectOption[] = [
  { label: '一般方案', value: false },
  { label: '活動方案', value: true },
];

/* --------------------------------------
 * Date utils
 * -------------------------------------- */
const formatDateTime = (value?: string | null) => {
  const text = String(value ?? '').trim();
  if (!text) return '-';
  return text.replace('T', ' ');
};

/**
 * datetime-local => 後端 LocalDateTime 字串
 * input: 2026-01-09T12:30
 * output: 2026-01-09T12:30:00
 */
const normalizeToBackendLocalDateTime = (value?: string | null) => {
  const text = String(value ?? '').trim();

  if (!text) return null;
  if (text.length >= 19) return text.slice(0, 19);
  if (text.length === 16) return `${text}:00`;

  return text;
};

/**
 * 後端 LocalDateTime => datetime-local
 * input: 2026-01-08T17:36:03
 * output: 2026-01-08T17:36
 */
const normalizeToDatetimeLocalInput = (value?: string | null) => {
  const text = String(value ?? '').trim();
  if (!text) return '';
  return text.length >= 16 ? text.slice(0, 16) : text;
};

/* --------------------------------------
 * Schema
 * -------------------------------------- */
const schema = computed(() => {
  if (isDetail.value) {
    return yup.object({
      name: yup.string().nullable(),
      description: yup.string().nullable(),
      amount: yup.mixed().nullable(),
      goldCoins: yup.mixed().nullable(),
      bonusCoins: yup.mixed().nullable(),
      isActive: yup.mixed().nullable(),
      isPromotional: yup.mixed().nullable(),
      displayOrder: yup.mixed().nullable(),
      startTime: yup.string().nullable(),
      endTime: yup.string().nullable(),
    });
  }

  return yup.object({
    name: yup
      .string()
      .trim()
      .required('請輸入方案名稱')
      .max(50, '方案名稱最多50字'),

    description: yup.string().nullable().max(200, '方案說明最多200字'),

    amount: yup
      .number()
      .typeError('儲值金額必須為數字')
      .required('請輸入儲值金額')
      .min(1, '儲值金額必須大於 0'),

    goldCoins: yup
      .number()
      .typeError('獲得金幣必須為數字')
      .required('請輸入獲得金幣')
      .min(1, '獲得金幣必須大於 0'),

    bonusCoins: yup
      .number()
      .typeError('贈送紅利必須為數字')
      .min(0, '贈送紅利不可小於 0')
      .nullable()
      .transform((value, originalValue) =>
        originalValue === '' ||
        originalValue === null ||
        originalValue === undefined
          ? 0
          : value,
      ),

    isActive: yup.boolean().required('請選擇狀態'),

    isPromotional: yup.boolean().required('請選擇方案類型'),

    displayOrder: yup
      .number()
      .typeError('顯示順序必須為數字')
      .min(0, '顯示順序不可小於 0')
      .nullable()
      .transform((value, originalValue) =>
        originalValue === '' ||
        originalValue === null ||
        originalValue === undefined
          ? 0
          : value,
      ),

    startTime: yup
      .string()
      .nullable()
      .when('isPromotional', {
        is: true,
        then: (s) => s.required('請選擇活動開始時間'),
      }),

    endTime: yup
      .string()
      .nullable()
      .when('isPromotional', {
        is: true,
        then: (s) =>
          s
            .required('請選擇活動結束時間')
            .test(
              'endAfterStart',
              '活動結束時間必須晚於開始時間',
              function (endValue) {
                const start = this.parent.startTime;

                if (!start || !endValue) return true;

                return endValue > start;
              },
            ),
      }),
  });
});

/* --------------------------------------
 * useForm
 * -------------------------------------- */
const { errors, handleSubmit, setValues, defineField } = useForm({
  validationSchema: schema,
  initialValues: {
    name: '',
    description: '',
    amount: null as number | null,
    goldCoins: null as number | null,
    bonusCoins: 0,
    isActive: true,
    isPromotional: false,
    displayOrder: 0,
    startTime: '',
    endTime: '',
  },
  validateOnMount: false,
});

const [name] = defineField('name');
const [description] = defineField('description');
const [amount] = defineField('amount');
const [goldCoins] = defineField('goldCoins');
const [bonusCoins] = defineField('bonusCoins');
const [isActive] = defineField('isActive');
const [isPromotional] = defineField('isPromotional');
const [displayOrder] = defineField('displayOrder');
const [startTime] = defineField('startTime');
const [endTime] = defineField('endTime');

const detail = ref<any>(null);

/* --------------------------------------
 * Watch
 * -------------------------------------- */
watch(isPromotional, (value) => {
  if (value) return;

  startTime.value = '';
  endTime.value = '';
});

/* --------------------------------------
 * Load detail
 * -------------------------------------- */
const loadDetail = async () => {
  if (mode.value === 'add' || !id.value) return;

  await executeApi({
    fn: async () => getRechargePlanById(id.value),
    onSuccess: (res: any) => {
      const data = res?.data ?? res;

      detail.value = data;

      setValues(
        {
          name: data?.name ?? '',
          description: data?.description ?? '',
          amount: data?.amount ?? null,
          goldCoins: data?.goldCoins ?? null,
          bonusCoins: data?.bonusCoins ?? 0,
          isActive: data?.isActive ?? true,
          isPromotional: data?.isPromotional ?? false,
          displayOrder: data?.displayOrder ?? 0,
          startTime: normalizeToDatetimeLocalInput(data?.startTime),
          endTime: normalizeToDatetimeLocalInput(data?.endTime),
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

    if (isDetail.value) return;

    const ok = await openConfirmDialog({
      title: '儲存確認',
      message: isEdit.value
        ? '確定要更新儲值方案嗎？'
        : '確定要新增儲值方案嗎？',
    });

    if (!ok) return;

    const payload = {
      name: String(values.name ?? '').trim(),
      description: String(values.description ?? '').trim() || null,
      amount: Number(values.amount),
      goldCoins: Number(values.goldCoins),
      bonusCoins:
        values.bonusCoins === null || values.bonusCoins === undefined
          ? 0
          : Number(values.bonusCoins),
      isActive: Boolean(values.isActive),
      isPromotional: Boolean(values.isPromotional),
      displayOrder:
        values.displayOrder === null || values.displayOrder === undefined
          ? 0
          : Number(values.displayOrder),
      startTime: values.isPromotional
        ? normalizeToBackendLocalDateTime(values.startTime)
        : null,
      endTime: values.isPromotional
        ? normalizeToBackendLocalDateTime(values.endTime)
        : null,
    };

    await executeApi({
      fn: async () => {
        if (isEdit.value) {
          return updateRechargePlan(id.value, payload);
        }

        return createRechargePlan(payload);
      },
      onSuccess: async () => {
        await openInfoDialog({
          title: '提示訊息',
          message: isEdit.value ? '更新成功' : '新增成功',
          iconType: 'success',
        });

        rechargePlanStore.setShouldRefresh(true);
        router.push('/home/recharge-plan');
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
 * Delete
 * -------------------------------------- */
const doDelete = async () => {
  if (!id.value) return;

  const planName = String(detail.value?.name || name.value || id.value);

  const ok = await openConfirmDialog({
    title: '刪除確認',
    message: `確定要刪除儲值方案「${planName}」嗎？（刪除後無法復原）`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () => deleteRechargePlan(id.value),
    onSuccess: async () => {
      await openInfoDialog({
        title: '提示訊息',
        message: '刪除成功',
        iconType: 'success',
      });

      rechargePlanStore.setShouldRefresh(true);
      router.push('/home/recharge-plan');
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

/* --------------------------------------
 * Navigation
 * -------------------------------------- */
const navigateBack = () => {
  router.push('/home/recharge-plan');
};

const navigateToEdit = () => {
  if (!id.value) return;
  router.push(`/home/recharge-plan/edit/${id.value}`);
};

/* --------------------------------------
 * Mounted
 * -------------------------------------- */
onMounted(async () => {
  await loadDetail();
});
</script>

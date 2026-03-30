<!-- src/views/rechargePlan/RechargePlanForm.vue -->
<template>
  <MCard>
    <form @submit.prevent="onSubmit">
      <p class="form__text form__text--title">{{ pageTitle }}</p>

      <div class="flex flex-wrap">
        <!-- 名稱 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="方案名稱"
            v-model="name"
            :error="errors.name"
            required
            maxlength="50"
            placeholder="例如：入門方案 / 限時活動"
            :disabled="isDetail"
          />
        </div>

        <!-- 儲值金額 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="儲值金額（台幣）"
            type="number"
            v-model="amount"
            :error="errors.amount"
            required
            placeholder="例如：1000"
            :disabled="isDetail"
          />
        </div>

        <!-- 金幣 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="獲得金幣"
            type="number"
            v-model="goldCoins"
            :error="errors.goldCoins"
            required
            placeholder="例如：1000"
            :disabled="isDetail"
          />
        </div>

        <!-- 贈送紅利 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="贈送紅利（選填）"
            type="number"
            v-model="bonusCoins"
            :error="errors.bonusCoins"
            placeholder="預設 0"
            :disabled="isDetail"
          />
        </div>

        <!-- 描述 -->
        <div class="w-100 p-6">
          <FormInput
            label="方案說明（選填）"
            v-model="description"
            :error="errors.description"
            maxlength="200"
            placeholder="例如：首次儲值推薦 / 新年特惠"
            :disabled="isDetail"
          />
        </div>

        <!-- 顯示順序 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="顯示順序（選填）"
            type="number"
            v-model="displayOrder"
            :error="errors.displayOrder"
            placeholder="預設 0（數字越小越前面）"
            :disabled="isDetail"
          />
        </div>

        <!-- 是否啟用 -->
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="是否啟用"
            v-model="isActive"
            :options="activeOptions"
            :error="errors.isActive"
            required
            :disabled="isDetail"
          />
        </div>

        <!-- 是否活動方案 -->
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="是否活動方案"
            v-model="isPromotional"
            :options="promotionalOptions"
            :error="errors.isPromotional"
            required
            :disabled="isDetail"
          />
        </div>

        <!-- 活動開始/結束（只有活動方案才需要） -->
        <div class="w-50 w-md-100 p-6" v-if="isPromotional === true">
          <FormInput
            label="活動開始時間"
            type="datetime-local"
            v-model="startTime"
            :error="errors.startTime"
            required
            :disabled="isDetail"
          />
          <p class="form__text m-t-6" v-if="!isDetail">
            活動方案必填（格式由瀏覽器控制）
          </p>
        </div>

        <div class="w-50 w-md-100 p-6" v-if="isPromotional === true">
          <FormInput
            label="活動結束時間"
            type="datetime-local"
            v-model="endTime"
            :error="errors.endTime"
            required
            :disabled="isDetail"
          />
        </div>

        <!-- 檢視資訊 -->
        <template v-if="isDetail">
          <div class="w-100 p-6">
            <p class="form__text form__text--red">系統資訊（檢視）</p>
          </div>

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
        </template>
      </div>

      <!-- bottom button -->
      <div class="flex justify-center m-y-12 gap-x-12 flex-wrap">
        <template v-if="!isDetail">
          <MButton
            v-if="isDev"
            type="button"
            class="mbtn--gray"
            @click="fillMockData"
          >
            快速產生資料
          </MButton>

          <MButton type="submit">
            {{ mode === 'add' ? '新增' : '儲存' }}
          </MButton>

          <MButton
            v-if="mode === 'edit'"
            type="button"
            class="mbtn--red"
            @click="doDelete"
          >
            刪除
          </MButton>
        </template>

        <template v-else>
          <MButton type="button" class="mbtn--gray" @click="navigateToEdit">
            編輯
          </MButton>
        </template>

        <MButton type="button" class="mbtn--gray" @click="router.back()">
          返回
        </MButton>
      </div>
    </form>
  </MCard>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import * as yup from 'yup';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { useDialogStore } from '@/stores';

import {
  createRechargePlan,
  updateRechargePlan,
  getRechargePlanById,
  deleteRechargePlan,
} from '@/services/adminRechargePlanService';

/* Setup */
const route = useRoute();
const router = useRouter();
const dialogStore = useDialogStore();

const mode = computed<'add' | 'edit' | 'detail'>(() => {
  if (route.name === 'RechargePlanAdd') return 'add';
  if (route.name === 'RechargePlanEdit') return 'edit';
  return 'detail';
});

const isDetail = computed(() => mode.value === 'detail');
const id = computed(() => String(route.params.id || ''));

/* dev-only */
const isDev = import.meta.env.DEV;

/* page title */
const pageTitle = computed(() => {
  if (mode.value === 'add') return '新增儲值方案';
  if (mode.value === 'edit') return '編輯儲值方案';
  return '儲值方案詳情';
});

/* options */
type SelectOption = { label: string; value: any };
const activeOptions: SelectOption[] = [
  { label: '啟用', value: true },
  { label: '停用', value: false },
];
const promotionalOptions: SelectOption[] = [
  { label: '否', value: false },
  { label: '是（活動方案）', value: true },
];

/* helpers */
const formatDateTime = (v?: string) => (!v ? '-' : String(v).replace('T', ' '));

/**
 * datetime-local => 後端 LocalDateTime 字串
 * - input: "2026-01-09T12:30"
 * - output: "2026-01-09T12:30:00"
 */
const toLocalDateTime = (v: any) => {
  if (!v) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.length === 16 ? `${s}:00` : s; // 兼容已含秒的情況
};

/**
 * 後端 LocalDateTime => datetime-local
 * - input: "2026-01-08T17:36:03"
 * - output: "2026-01-08T17:36"
 */
const toDatetimeLocal = (v: any) => {
  if (!v) return '';
  const s = String(v);
  // 截到分鐘：YYYY-MM-DDTHH:mm
  return s.length >= 16 ? s.slice(0, 16) : s;
};

/* schema（依 DTO + 活動方案條件） */
const schema = computed(() => {
  // detail：不驗證
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
    name: yup.string().required('方案名稱不可為空'),
    description: yup.string().nullable(),
    amount: yup
      .number()
      .typeError('儲值金額必須為數字')
      .required('儲值金額不可為空')
      .min(1, '儲值金額必須大於 0'),
    goldCoins: yup
      .number()
      .typeError('獲得金幣必須為數字')
      .required('獲得金幣不可為空')
      .min(1, '獲得金幣必須大於 0'),
    bonusCoins: yup
      .number()
      .typeError('贈送紅利必須為數字')
      .min(0, '贈送紅利不可小於 0')
      .default(0)
      .nullable(),
    isActive: yup.boolean().required('是否啟用不可為空'),
    isPromotional: yup.boolean().required('是否活動方案不可為空'),
    displayOrder: yup
      .number()
      .typeError('顯示順序必須為數字')
      .min(0, '顯示順序不可小於 0')
      .default(0)
      .nullable(),
    startTime: yup
      .string()
      .nullable()
      .when('isPromotional', {
        is: true,
        then: (s) => s.required('活動開始時間必填'),
      }),
    endTime: yup
      .string()
      .nullable()
      .when('isPromotional', {
        is: true,
        then: (s) => s.required('活動結束時間必填'),
      }),
  });
});

/* useForm（defineField + v-model） */
const { errors, handleSubmit, setValues, defineField } = useForm({
  validationSchema: schema,
  initialValues: {
    name: '',
    description: '',
    amount: 0,
    goldCoins: 0,
    bonusCoins: 0,
    isActive: true,
    isPromotional: false,
    displayOrder: 0,
    startTime: '',
    endTime: '',
  },
});

/* defineField */
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

/* detail */
const detail = ref<any>(null);

const reloadDetail = async () => {
  if (!id.value) return;

  await executeApi({
    fn: async () => getRechargePlanById(id.value),
    onSuccess: (data) => {
      const d = (data as any)?.data ?? data;
      detail.value = d;

      setValues({
        name: d?.name ?? '',
        description: d?.description ?? '',
        amount: d?.amount ?? 0,
        goldCoins: d?.goldCoins ?? 0,
        bonusCoins: d?.bonusCoins ?? 0,
        isActive: d?.isActive ?? true,
        isPromotional: d?.isPromotional ?? false,
        displayOrder: d?.displayOrder ?? 0,
        startTime: toDatetimeLocal(d?.startTime),
        endTime: toDatetimeLocal(d?.endTime),
      });
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

onMounted(async () => {
  if (mode.value !== 'add') {
    await reloadDetail();
  }
});

/* mock */
const fillMockData = async () => {
  const ts = Date.now();
  setValues({
    name: `測試方案_${ts}`,
    description: 'dev 快速帶入的 mock 儲值方案',
    amount: 300,
    goldCoins: 300,
    bonusCoins: 50,
    isActive: true,
    isPromotional: true,
    displayOrder: 9,
    startTime: '2026-01-09T10:00',
    endTime: '2026-01-20T23:59',
  });
};

/* submit */
const onSubmit = handleSubmit(async (values) => {
  if (isDetail.value) return;

  const ok = await dialogStore.openConfirmDialog({
    title: mode.value === 'add' ? '新增確認' : '儲存確認',
    message:
      mode.value === 'add' ? '確定要新增儲值方案嗎？' : '確定要儲存修改嗎？',
  });
  if (!ok) return;

  await executeApi({
    fn: async () => {
      // DTO 對齊 + trim + null
      const payload = {
        name: values.name?.trim(),
        description: values.description?.trim() || null,
        amount: Number(values.amount),
        goldCoins: Number(values.goldCoins),
        bonusCoins: values.bonusCoins == null ? 0 : Number(values.bonusCoins),
        isActive: Boolean(values.isActive),
        isPromotional: Boolean(values.isPromotional),
        displayOrder:
          values.displayOrder == null ? 0 : Number(values.displayOrder),
        startTime: values.isPromotional
          ? toLocalDateTime(values.startTime)
          : null,
        endTime: values.isPromotional ? toLocalDateTime(values.endTime) : null,
      };

      if (mode.value === 'edit') {
        return updateRechargePlan(id.value, payload);
      }
      return createRechargePlan(payload);
    },
    onSuccess: async () => {
      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: mode.value === 'add' ? '新增成功' : '儲存成功',
        iconType: 'success',
      });
      router.push('/home/recharge-plan');
    },
    showSuccessDialog: false,
  });
});

/* navigation */
const navigateToEdit = () => {
  if (!id.value) return;
  router.push(`/home/recharge-plan/edit/${id.value}`);
};

/* delete */
const doDelete = async () => {
  if (!id.value) return;

  const planName = String((detail.value as any)?.name || id.value);
  const ok = await dialogStore.openConfirmDialog({
    title: '刪除確認',
    message: `確定要刪除儲值方案「${planName}」？（刪除後無法復原）`,
  });
  if (!ok) return;

  await executeApi({
    fn: async () => deleteRechargePlan(id.value),
    onSuccess: async () => {
      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '刪除成功',
        iconType: 'success',
      });
      router.push('/home/recharge-plan');
    },
    showSuccessDialog: false,
  });
};
</script>

<style scoped></style>

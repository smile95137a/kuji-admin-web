<!-- src/views/member/FrontendUserEdit.vue -->
<template>
  <MCard>
    <form @submit.prevent="onSubmit">
      <p class="form__text form__text--title">編輯會員</p>

      <div class="flex flex-wrap">
        <!-- ===== 系統資訊（只讀） ===== -->
        <div class="w-100 p-6">
          <p class="form__text form__text--red">系統資訊</p>
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormInput label="會員 ID" :modelValue="detail?.id || '-'" disabled />
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="登入方式"
            :modelValue="detail?.provider || '-'"
            disabled
          />
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="Email 驗證"
            :modelValue="detail?.emailVerified ? '已驗證' : '未驗證'"
            disabled
          />
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="最後登入"
            :modelValue="formatDateTime(detail?.lastLoginAt)"
            disabled
          />
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

        <!-- ===== 會員資料（可編輯：對齊 FrontendUserUpdateReq） ===== -->
        <div class="w-100 p-6">
          <p class="form__text form__text--red">會員資料（可編輯）</p>
        </div>

        <!-- email -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="Email"
            v-model="email"
            :error="errors.email"
            placeholder="user@example.com"
          />
        </div>

        <!-- nickname -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="暱稱"
            v-model="nickname"
            :error="errors.nickname"
            placeholder="例如：測試會員B"
          />
        </div>

        <!-- phoneNumber -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="手機號碼"
            v-model="phoneNumber"
            :error="errors.phoneNumber"
            placeholder="例如：0966666666"
          />
        </div>

        <!-- lineId -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="LINE ID"
            v-model="lineId"
            :error="errors.lineId"
            placeholder="例如：mylineid"
          />
        </div>

        <!-- avatar -->
        <div class="w-100 p-6">
          <FormInput
            label="頭像 URL"
            v-model="avatar"
            :error="errors.avatar"
            placeholder="https://..."
          />
        </div>

        <!-- ===== 收件資訊（地址先改唯讀） ===== -->
        <div class="w-100 p-6">
          <p class="form__text form__text--red">收件資訊（地址目前唯讀）</p>
        </div>

        <!-- recipientName -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="收件人姓名"
            v-model="recipientName"
            :error="errors.recipientName"
            placeholder="例如：王小明"
          />
        </div>

        <!-- recipientPhone -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="收件人電話"
            v-model="recipientPhone"
            :error="errors.recipientPhone"
            placeholder="例如：0912345678"
          />
        </div>

        <!-- city (readonly) -->
        <div class="w-50 w-md-100 p-6">
          <FormInput label="城市（唯讀）" :modelValue="city" disabled />
        </div>

        <!-- district (readonly) -->
        <div class="w-50 w-md-100 p-6">
          <FormInput label="區域（唯讀）" :modelValue="district" disabled />
        </div>

        <!-- addressDetail (readonly) -->
        <div class="w-100 p-6">
          <FormInput
            label="詳細地址（唯讀）"
            :modelValue="addressDetail"
            disabled
          />
        </div>

        <!-- ===== 發票資訊（可連動） ===== -->
        <div class="w-100 p-6">
          <p class="form__text form__text--red">發票資訊</p>
        </div>

        <!-- invoiceType -->
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="發票類型"
            v-model="invoiceType"
            :options="invoiceTypeOptions"
            :error="errors.invoiceType"
            :showAll="true"
            allLabel="不設定"
            :allValue="''"
          />
        </div>

        <!-- DUPLICATE -> invoiceEmail -->
        <div class="w-50 w-md-100 p-6" v-if="isInvoiceDuplicate">
          <FormInput
            label="發票 Email"
            v-model="invoiceEmail"
            :error="errors.invoiceEmail"
            placeholder="invoice@example.com"
            required
          />
        </div>

        <!-- CARRIER -> carrierCode -->
        <div class="w-50 w-md-100 p-6" v-if="isInvoiceCarrier">
          <FormInput
            label="載具條碼"
            v-model="carrierCode"
            :error="errors.carrierCode"
            placeholder="/ABCD1234"
            required
          />
        </div>

        <!-- TRIPLICATE -> taxId -->
        <div class="w-50 w-md-100 p-6" v-if="isInvoiceTriplicate">
          <FormInput
            label="統一編號（三聯式）"
            v-model="taxId"
            :error="errors.taxId"
            placeholder="8 碼，例如：12345678"
            maxlength="8"
            required
          />
        </div>

        <!-- TRIPLICATE -> companyName -->
        <div class="w-50 w-md-100 p-6" v-if="isInvoiceTriplicate">
          <FormInput
            label="公司名稱（三聯式）"
            v-model="companyName"
            :error="errors.companyName"
            placeholder="例如：測試股份有限公司"
            required
          />
        </div>

        <!-- DONATE hint -->
        <div class="w-100 p-6" v-if="isInvoiceDonate">
          <p class="form__text" style="opacity: 0.8">
            已選擇捐贈發票（不需要填寫 Email / 載具 / 統編資訊）
          </p>
        </div>
      </div>

      <!-- bottom button -->
      <div class="flex justify-center m-y-12 gap-x-12 flex-wrap">
        <MButton type="submit">儲存</MButton>

        <MButton type="button" class="mbtn--red" @click="goBack">返回</MButton>

        <!-- 管理員操作（不屬於 FrontendUserUpdateReq） -->
        <MButton type="button" :disabled="!canActivate" @click="activateOne">
          啟用
        </MButton>
        <MButton
          type="button"
          :disabled="!canDeactivate"
          @click="deactivateOne"
        >
          停用
        </MButton>
        <MButton type="button" :disabled="!canSuspend" @click="suspendOne">
          暫停
        </MButton>

        <MButton
          type="button"
          class="mbtn--red"
          :disabled="!canDelete"
          @click="deleteOne"
        >
          刪除
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
import FormSelect from '@/components/common/FormSelect.vue';

import { useDialogStore } from '@/stores';
import { executeApi } from '@/utils/executeApiUtils';

import {
  getFrontendUserById,
  updateFrontendUser,
  activateFrontendUser,
  deactivateFrontendUser,
  suspendFrontendUser,
  deleteFrontendUser,
} from '@/services/adminFrontendUserService';

interface SelectOption {
  label: string;
  value: any;
}

const route = useRoute();
const router = useRouter();
const dialogStore = useDialogStore();

const id = computed(() => String(route.params.id || ''));

const goBack = () => router.push('/home/member/list');

/* detail（只讀顯示來源） */
const detail = ref<any>(null);

const formatDateTime = (v?: string) => (!v ? '-' : String(v).replace('T', ' '));

/* 發票類型 options（req: DUPLICATE/TRIPLICATE/CARRIER/DONATE） */
const invoiceTypeOptions: SelectOption[] = [
  { label: '二聯式（DUPLICATE）', value: 'DUPLICATE' },
  { label: '三聯式（TRIPLICATE）', value: 'TRIPLICATE' },
  { label: '載具（CARRIER）', value: 'CARRIER' },
  { label: '捐贈（DONATE）', value: 'DONATE' },
];

/**
 * ✅ schema：對齊 FrontendUserUpdateReq
 * - 地址先唯讀：仍可顯示在畫面，但不送更新（payload 會排除 city/district/addressDetail）
 */
const schema = yup.object({
  email: yup.string().nullable().email('Email 格式不正確'),
  nickname: yup.string().nullable(),
  avatar: yup.string().nullable(),
  phoneNumber: yup.string().nullable(),
  lineId: yup.string().nullable(),

  recipientName: yup.string().nullable(),
  recipientPhone: yup.string().nullable(),

  // 這三個先唯讀，不做驗證（也不會送出）
  city: yup.string().nullable(),
  district: yup.string().nullable(),
  addressDetail: yup.string().nullable(),

  invoiceType: yup
    .string()
    .nullable()
    .transform((v, o) => (o === '' ? null : v))
    .oneOf(
      [null, 'DUPLICATE', 'TRIPLICATE', 'CARRIER', 'DONATE'],
      '發票類型不正確',
    ),

  invoiceEmail: yup
    .string()
    .nullable()
    .email('發票 Email 格式不正確')
    .when('invoiceType', {
      is: (v: any) => v === 'DUPLICATE',
      then: (s) => s.required('二聯式發票 Email 建議必填'),
      otherwise: (s) => s.notRequired(),
    }),

  carrierCode: yup
    .string()
    .nullable()
    .when('invoiceType', {
      is: (v: any) => v === 'CARRIER',
      then: (s) => s.required('選擇載具時，載具條碼必填'),
      otherwise: (s) => s.notRequired(),
    }),

  taxId: yup
    .string()
    .nullable()
    .transform((v, o) => (o === '' ? null : v))
    .when('invoiceType', {
      is: (v: any) => v === 'TRIPLICATE',
      then: (s) =>
        s
          .required('選擇三聯式時，統一編號必填')
          .matches(/^\d{8}$/, '統一編號需為 8 碼數字'),
      otherwise: (s) => s.notRequired(),
    }),

  companyName: yup
    .string()
    .nullable()
    .when('invoiceType', {
      is: (v: any) => v === 'TRIPLICATE',
      then: (s) => s.required('選擇三聯式時，公司名稱必填'),
      otherwise: (s) => s.notRequired(),
    }),
});

/* useForm */
const { errors, handleSubmit, setValues, defineField } = useForm({
  validationSchema: schema,
  initialValues: {
    email: '',
    nickname: '',
    avatar: '',
    phoneNumber: '',
    lineId: '',

    recipientName: '',
    recipientPhone: '',
    city: '',
    district: '',
    addressDetail: '',

    invoiceType: '', // ✅ 空字串 = 不設定
    invoiceEmail: '',
    carrierCode: '',
    taxId: '',
    companyName: '',
  },
});

/* defineField */
const [email] = defineField('email');
const [nickname] = defineField('nickname');
const [avatar] = defineField('avatar');
const [phoneNumber] = defineField('phoneNumber');
const [lineId] = defineField('lineId');

const [recipientName] = defineField('recipientName');
const [recipientPhone] = defineField('recipientPhone');
const [city] = defineField('city');
const [district] = defineField('district');
const [addressDetail] = defineField('addressDetail');

const [invoiceType] = defineField('invoiceType');
const [invoiceEmail] = defineField('invoiceEmail');
const [carrierCode] = defineField('carrierCode');
const [taxId] = defineField('taxId');
const [companyName] = defineField('companyName');

/* invoiceType 連動顯示 */
const isInvoiceDuplicate = computed(() => invoiceType.value === 'DUPLICATE');
const isInvoiceCarrier = computed(() => invoiceType.value === 'CARRIER');
const isInvoiceTriplicate = computed(() => invoiceType.value === 'TRIPLICATE');
const isInvoiceDonate = computed(() => invoiceType.value === 'DONATE');

/* invoiceType 連動：切換時清空不相關欄位，避免髒資料 */
watch(
  () => invoiceType.value,
  (t) => {
    const type = String(t || '').trim();

    if (!type) {
      invoiceEmail.value = '';
      carrierCode.value = '';
      taxId.value = '';
      companyName.value = '';
      return;
    }

    if (type === 'DUPLICATE') {
      carrierCode.value = '';
      taxId.value = '';
      companyName.value = '';
      return;
    }

    if (type === 'CARRIER') {
      invoiceEmail.value = '';
      taxId.value = '';
      companyName.value = '';
      return;
    }

    if (type === 'TRIPLICATE') {
      invoiceEmail.value = '';
      carrierCode.value = '';
      return;
    }

    if (type === 'DONATE') {
      invoiceEmail.value = '';
      carrierCode.value = '';
      taxId.value = '';
      companyName.value = '';
      return;
    }
  },
);

/* load detail */
const loadDetail = async () => {
  if (!id.value) return;

  await executeApi({
    fn: async () => getFrontendUserById(id.value),
    onSuccess: (res: any) => {
      const data = res?.data ?? res;
      detail.value = data;

      setValues({
        email: data?.email ?? '',
        nickname: data?.nickname ?? '',
        avatar: data?.avatar ?? '',
        phoneNumber: data?.phoneNumber ?? '',
        lineId: data?.lineId ?? '',

        recipientName: data?.recipientName ?? '',
        recipientPhone: data?.recipientPhone ?? '',
        city: data?.city ?? '',
        district: data?.district ?? '',
        addressDetail: data?.addressDetail ?? '',

        invoiceType: data?.invoiceType ?? '',
        invoiceEmail: data?.invoiceEmail ?? '',
        carrierCode: data?.carrierCode ?? '',
        taxId: data?.taxId ?? '',
        companyName: data?.companyName ?? '',
      });
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

/* 管理員操作按鈕 enabled（不屬於 update req，但保留） */
const canActivate = computed(
  () =>
    detail.value?.status &&
    detail.value.status !== 'ACTIVE' &&
    detail.value.status !== 'DELETED',
);
const canDeactivate = computed(() => detail.value?.status === 'ACTIVE');
const canSuspend = computed(
  () =>
    detail.value?.status &&
    detail.value.status !== 'SUSPENDED' &&
    detail.value.status !== 'DELETED',
);
const canDelete = computed(() => detail.value?.status !== 'DELETED');

/* submit (update) */
const onSubmit = handleSubmit(async (values) => {
  const ok = await dialogStore.openConfirmDialog({
    title: '儲存確認',
    message: '確定要儲存會員資料嗎？',
  });
  if (!ok) return;

  const toNull = (v: any) => {
    const s = String(v ?? '').trim();
    return s ? s : null;
  };

  const payload: any = {
    email: toNull(values.email),
    nickname: toNull(values.nickname),
    avatar: toNull(values.avatar),
    phoneNumber: toNull(values.phoneNumber),
    lineId: toNull(values.lineId),

    recipientName: toNull(values.recipientName),
    recipientPhone: toNull(values.recipientPhone),

    invoiceType: toNull(values.invoiceType),
    invoiceEmail: toNull(values.invoiceEmail),
    carrierCode: toNull(values.carrierCode),
    taxId: toNull(values.taxId),
    companyName: toNull(values.companyName),
  };

  /**
   * 你若希望「空值不更新」=> 刪 null
   * 但發票為了能清空，我們保留 null 送出
   * 其他欄位若你要不更新可刪掉（這裡我保守：只刪 email/nickname/... 的 null）
   */
  const keepNullKeys = new Set([
    'invoiceType',
    'invoiceEmail',
    'carrierCode',
    'taxId',
    'companyName',
  ]);

  Object.keys(payload).forEach((k) => {
    if (payload[k] === null && !keepNullKeys.has(k)) delete payload[k];
  });

  await executeApi({
    fn: async () => updateFrontendUser(id.value, payload),
    onSuccess: async () => {
      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '儲存成功',
        iconType: 'success',
      });
      await loadDetail();
    },
    showSuccessDialog: false,
  });
});

/* actions（管理員操作） */
const activateOne = async () => {
  const ok = await dialogStore.openConfirmDialog({
    title: '啟用確認',
    message: '確定要啟用此會員嗎？',
  });
  if (!ok) return;

  await executeApi({
    fn: async () => activateFrontendUser(id.value),
    onSuccess: async () => {
      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '已啟用',
        iconType: 'success',
      });
      await loadDetail();
    },
    showSuccessDialog: false,
  });
};

const deactivateOne = async () => {
  const ok = await dialogStore.openConfirmDialog({
    title: '停用確認',
    message: '確定要停用此會員嗎？',
  });
  if (!ok) return;

  await executeApi({
    fn: async () => deactivateFrontendUser(id.value),
    onSuccess: async () => {
      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '已停用',
        iconType: 'success',
      });
      await loadDetail();
    },
    showSuccessDialog: false,
  });
};

const suspendOne = async () => {
  const ok = await dialogStore.openConfirmDialog({
    title: '暫停確認',
    message: '確定要暫停此會員嗎？',
  });
  if (!ok) return;

  await executeApi({
    fn: async () => suspendFrontendUser(id.value),
    onSuccess: async () => {
      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '已暫停',
        iconType: 'success',
      });
      await loadDetail();
    },
    showSuccessDialog: false,
  });
};

const deleteOne = async () => {
  const ok = await dialogStore.openConfirmDialog({
    title: '刪除確認',
    message: '確定要刪除此會員嗎？（軟刪除）',
  });
  if (!ok) return;

  await executeApi({
    fn: async () => deleteFrontendUser(id.value),
    onSuccess: async () => {
      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '刪除成功',
        iconType: 'success',
      });
      goBack();
    },
    showSuccessDialog: false,
  });
};

onMounted(async () => {
  await loadDetail();
});
</script>

<style scoped></style>

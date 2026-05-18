<!-- src/views/member/FrontendUserEdit.vue -->
<template>
  <MCard>
    <form @submit.prevent="onSubmit">
      <p class="form__text form__text--title">
        {{ isAdmin ? '編輯會員' : '會員詳情' }}
      </p>

      <div v-if="!isAdmin" class="w-100 p-6">
        <p class="form__text" style="opacity: 0.8">
          目前帳號為唯讀檢視模式，僅管理員可編輯會員資料與狀態。
        </p>
      </div>

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
            label="帳號狀態"
            :modelValue="statusDisplayText"
            disabled
          />
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="金幣餘額"
            :modelValue="
              detail?.goldCoins !== undefined && detail?.goldCoins !== null
                ? String(detail.goldCoins)
                : '-'
            "
            disabled
          />
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="紅利餘額"
            :modelValue="
              detail?.bonusCoins !== undefined && detail?.bonusCoins !== null
                ? String(detail.bonusCoins)
                : '-'
            "
            disabled
          />
        </div>

        <!-- 鎖定資訊 -->
        <div class="w-50 w-md-100 p-6" v-if="isAccountLocked">
          <FormInput
            label="帳號鎖定至"
            :modelValue="formatDateTime(detail?.lockedUntil)"
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
          <p class="form__text form__text--red">
            {{ isAdmin ? '會員資料（可編輯）' : '會員資料（唯讀）' }}
          </p>
        </div>

        <!-- email -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="Email"
            v-model="email"
            :error="errors.email"
            :disabled="!isAdmin"
            placeholder="user@example.com"
          />
        </div>

        <!-- nickname -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="暱稱"
            v-model="nickname"
            :error="errors.nickname"
            :disabled="!isAdmin"
            placeholder="例如：測試會員B"
          />
        </div>

        <!-- phoneNumber -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="手機號碼"
            v-model="phoneNumber"
            :error="errors.phoneNumber"
            :disabled="!isAdmin"
            placeholder="例如：0966666666"
          />
        </div>

        <!-- lineId -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="LINE ID"
            v-model="lineId"
            :error="errors.lineId"
            :disabled="!isAdmin"
            placeholder="例如：mylineid"
          />
        </div>

        <!-- avatar -->
        <div class="w-100 p-6">
          <FormInput
            label="頭像 URL"
            v-model="avatar"
            :error="errors.avatar"
            :disabled="!isAdmin"
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
            :disabled="!isAdmin"
            placeholder="例如：王小明"
          />
        </div>

        <!-- recipientPhone -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="收件人電話"
            v-model="recipientPhone"
            :error="errors.recipientPhone"
            :disabled="!isAdmin"
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
            :disabled="!isAdmin"
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
            :disabled="!isAdmin"
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
            :disabled="!isAdmin"
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
            :disabled="!isAdmin"
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
            :disabled="!isAdmin"
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
        <MButton v-if="isAdmin" type="submit">儲存</MButton>

        <MButton type="button" class="mbtn--red" @click="goBack">返回</MButton>

        <!-- 管理員操作（不屬於 FrontendUserUpdateReq） -->
        <MButton
          v-if="isAdmin"
          type="button"
          :disabled="!canActivate"
          @click="activateOne"
        >
          啟用
        </MButton>
        <MButton
          v-if="isAdmin"
          type="button"
          :disabled="!canDeactivate"
          @click="deactivateOne"
        >
          停用
        </MButton>
        <MButton
          v-if="isAdmin"
          type="button"
          :disabled="!canSuspend"
          @click="suspendOne"
        >
          暫停
        </MButton>

        <!-- 解鎖（僅 ROLE_ADMIN 且帳號鎖定中） -->
        <MButton
          v-if="isAdmin && isAccountLocked"
          type="button"
          @click="unlockOne"
        >
          解鎖帳號
        </MButton>
      </div>
    </form>
  </MCard>

  <!-- ===== 點數管理 ===== -->
  <div v-if="false" class="m-t-12">
    <MCard>
      <p class="form__text form__text--title">點數管理</p>

      <!-- 錢包資訊 -->
      <div class="m-t-8">
        <p class="form__text form__text--red">點數餘額</p>
        <div v-if="walletLoading" class="m-t-8">載入中...</div>
        <div v-else-if="wallet" class="flex flex-wrap m-t-8">
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="點數餘額"
              :modelValue="String(wallet.balance ?? wallet.coinBalance ?? '-')"
              disabled
            />
          </div>
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="更新時間"
              :modelValue="formatDateTime(wallet.updatedAt)"
              disabled
            />
          </div>
        </div>
        <div v-else class="m-t-8">
          <p class="form__text" style="opacity: 0.6">無錢包資訊</p>
        </div>
      </div>

      <!-- 手動調整點數已移除（T-MEM-01）：餘額唯讀顯示即可 -->
    </MCard>
  </div>

  <!-- ===== 手動調整點數（僅 ROLE_ADMIN） ===== -->
  <div class="m-t-12" v-if="isAdmin">
    <MCard>
      <p class="form__text form__text--title">手動調整點數</p>

      <div class="flex flex-wrap m-t-8">
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="幣別"
            v-model="adjustCoinType"
            :options="coinTypeOptions"
          />
        </div>
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="調整方式"
            v-model="adjustDirection"
            :options="adjustDirectionOptions"
          />
        </div>
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="調整數量（正整數）"
            v-model="adjustAmount"
            type="number"
            :min="1"
            placeholder="例如：100"
          />
          <p
            v-if="adjustAmountError"
            class="form__text"
            style="
              color: var(--color-red, red);
              font-size: 12px;
              margin-top: 4px;
            "
          >
            {{ adjustAmountError }}
          </p>
        </div>
        <div class="w-100 p-6">
          <FormInput
            label="備註（必填）"
            v-model="adjustRemark"
            placeholder="請填寫調整原因"
          />
          <p
            v-if="adjustRemarkError"
            class="form__text"
            style="
              color: var(--color-red, red);
              font-size: 12px;
              margin-top: 4px;
            "
          >
            {{ adjustRemarkError }}
          </p>
        </div>
      </div>

      <div class="flex justify-center m-t-8">
        <MButton type="button" @click="submitCoinAdjust">送出調整</MButton>
      </div>
    </MCard>
  </div>

  <!-- ===== 登入記錄（僅 ROLE_ADMIN） ===== -->
  <div class="m-t-12" v-if="isAdmin">
    <MCard>
      <div class="flex items-center gap-x-12">
        <p class="form__text form__text--title">登入記錄</p>
        <MButton type="button" @click="loadLoginHistory">載入記錄</MButton>
      </div>

      <template v-if="loginHistoryLoading">
        <p class="form__text m-t-8">載入中...</p>
      </template>
      <template v-else-if="loginHistory.length > 0">
        <ReportTable
          class="m-t-12"
          :columns="loginHistoryColumns"
          :items="loginHistory"
          row-key="id"
          :useWidthClass="true"
        >
          <template #cell-loginTime="{ item }">
            <span>{{ formatDateTime(item.loginTime) }}</span>
          </template>
          <template #cell-status="{ item }">
            <span
              :style="item.status === 'SUCCESS' ? 'color:green' : 'color:red'"
            >
              {{ item.status }}
            </span>
          </template>
          <template #cell-failReason="{ item }">
            <span>{{ item.failReason || '-' }}</span>
          </template>
        </ReportTable>
      </template>
      <template v-else-if="loginHistoryLoaded">
        <p class="form__text m-t-8" style="opacity: 0.6">無登入記錄</p>
      </template>
    </MCard>
  </div>

  <!-- ===== 賞品盒 ===== -->
  <div v-if="false" class="m-t-12">
    <MCard>
      <p class="form__text form__text--title">賞品盒</p>

      <div class="flex flex-wrap m-t-8">
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="顯示模式"
            v-model="prizeBoxMode"
            :options="prizeBoxModeOptions"
          />
        </div>
      </div>
      <div class="flex justify-center m-t-8 gap-x-12">
        <MButton type="button" @click="loadPrizeBox">查詢賞品盒</MButton>
        <MButton type="button" variant="secondary" @click="resetPrizeBox"
          >清除</MButton
        >
      </div>

      <template v-if="prizeBoxList.length > 0">
        <ReportTable
          class="m-t-12"
          :columns="
            prizeBoxMode === 'summary'
              ? prizeBoxSummaryColumns
              : prizeBoxDetailColumns
          "
          :items="prizeBoxList"
          :row-key="prizeBoxMode === 'summary' ? 'storeId' : 'id'"
          :useWidthClass="true"
        >
          <template #cell-updatedAt="{ item }">
            <span>{{ formatDateTime(item.updatedAt) }}</span>
          </template>
          <template #cell-createdAt="{ item }">
            <span>{{ formatDateTime(item.createdAt) }}</span>
          </template>
        </ReportTable>
      </template>
      <template v-else-if="prizeBoxSearched">
        <p class="form__text m-t-8" style="opacity: 0.6">無賞品盒資料</p>
      </template>
    </MCard>
  </div>
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
import ReportTable from '@/components/common/ReportTable.vue';

import { useDialogStore, useAuthStore } from '@/stores';
import { executeApi } from '@/utils/executeApiUtils';

import {
  getFrontendUserById,
  updateFrontendUser,
  activateFrontendUser,
  deactivateFrontendUser,
  suspendFrontendUser,
  unlockFrontendUser,
  getLoginHistory,
  coinAdjust,
} from '@/services/adminFrontendUserService';
import { getUserWallet } from '@/services/adminWalletService';
import {
  getPrizeBoxByUserId,
  getPrizeBoxSummaryByStore,
} from '@/services/adminPrizeBoxService';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

interface SelectOption {
  label: string;
  value: any;
}

const route = useRoute();
const router = useRouter();
const dialogStore = useDialogStore();
const authStore = useAuthStore();

const id = computed(() => String(route.params.id || ''));

const goBack = () => router.push('/home/member/list');

/* detail（只讀顯示來源） */
const detail = ref<any>(null);

const formatDateTime = (v?: string) => (v ? String(v).replace('T', ' ') : '-');

/* 角色判斷 */
const isAdmin = computed(
  () =>
    Array.isArray(authStore.user?.roles) &&
    authStore.user.roles.includes('ROLE_ADMIN'),
);

/* 帳號狀態 */
const isAccountLocked = computed(() => {
  if (!detail.value?.lockedUntil) return false;
  return new Date(detail.value.lockedUntil) > new Date();
});

const statusDisplayText = computed(() => {
  const s = detail.value?.status;
  if (!s) return '-';
  if (s === 'ACTIVE') return '啟用';
  if (s === 'INACTIVE') return '停用';
  if (s === 'SUSPENDED') return '暫停';
  if (s === 'LOCKED') return '鎖定';
  return s;
});

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
    .when('invoiceType', (invoiceType: any, schema: any) =>
      invoiceType === 'DUPLICATE'
        ? schema.required('二聯式發票 Email 建議必填')
        : schema.notRequired(),
    ),

  carrierCode: yup
    .string()
    .nullable()
    .when('invoiceType', (invoiceType: any, schema: any) =>
      invoiceType === 'CARRIER'
        ? schema.required('選擇載具時，載具條碼必填')
        : schema.notRequired(),
    ),

  taxId: yup
    .string()
    .nullable()
    .transform((v, o) => (o === '' ? null : v))
    .when('invoiceType', (invoiceType: any, schema: any) =>
      invoiceType === 'TRIPLICATE'
        ? schema
            .required('選擇三聯式時，統一編號必填')
            .matches(/^\d{8}$/, '統一編號需為 8 碼數字')
        : schema.notRequired(),
    ),

  companyName: yup
    .string()
    .nullable()
    .when('invoiceType', (invoiceType: any, schema: any) =>
      invoiceType === 'TRIPLICATE'
        ? schema.required('選擇三聯式時，公司名稱必填')
        : schema.notRequired(),
    ),
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
  () => detail.value?.status && detail.value.status !== 'ACTIVE',
);
const canDeactivate = computed(() => detail.value?.status === 'ACTIVE');
const canSuspend = computed(
  () => detail.value?.status && detail.value.status !== 'SUSPENDED',
);

/* submit (update) */
const onSubmit = handleSubmit(async (values) => {
  if (!isAdmin.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '權限不足，僅管理員可編輯會員資料。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '儲存確認',
    message: '確定要儲存會員資料嗎？',
  });
  if (!ok) return;

  const toNull = (v: any) => {
    const s = String(v ?? '').trim();
    return s || null;
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
      await openInfoDialog({
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
  if (!isAdmin.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '權限不足，僅管理員可執行此操作。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '啟用確認',
    message: '確定要啟用此會員嗎？',
  });
  if (!ok) return;

  await executeApi({
    fn: async () => activateFrontendUser(id.value),
    onSuccess: async () => {
      await openInfoDialog({
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
  if (!isAdmin.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '權限不足，僅管理員可執行此操作。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '停用確認',
    message: '確定要停用此會員嗎？',
  });
  if (!ok) return;

  await executeApi({
    fn: async () => deactivateFrontendUser(id.value),
    onSuccess: async () => {
      await openInfoDialog({
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
  if (!isAdmin.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '權限不足，僅管理員可執行此操作。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '暫停確認',
    message: '確定要暫停此會員嗎？',
  });
  if (!ok) return;

  await executeApi({
    fn: async () => suspendFrontendUser(id.value),
    onSuccess: async () => {
      await openInfoDialog({
        title: '提示訊息',
        message: '已暫停',
        iconType: 'success',
      });
      await loadDetail();
    },
    showSuccessDialog: false,
  });
};

const unlockOne = async () => {
  if (!isAdmin.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '權限不足，僅管理員可執行此操作。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '解鎖確認',
    message: '確定要解除此會員的帳號鎖定嗎？解鎖後會員可立即嘗試登入。',
  });
  if (!ok) return;

  await executeApi({
    fn: async () => unlockFrontendUser(id.value),
    onSuccess: async () => {
      await openInfoDialog({
        title: '提示訊息',
        message: '帳號鎖定已解除',
        iconType: 'success',
      });
      await loadDetail();
    },
    showSuccessDialog: false,
  });
};

onMounted(async () => {
  await loadDetail();
});

const wallet = ref<any>(null);
const walletLoading = ref(false);

const loadWallet = async () => {
  if (!id.value) return;
  walletLoading.value = true;
  try {
    const res = await getUserWallet(id.value);
    wallet.value = (res as any)?.data ?? res;
  } catch {
    wallet.value = null;
  } finally {
    walletLoading.value = false;
  }
};

const prizeBoxMode = ref<'summary' | 'detail'>('summary');
const prizeBoxList = ref<any[]>([]);
const prizeBoxSearched = ref(false);
const prizeBoxModeOptions = [

/* ==============================
 * 點數 / 錢包（唯讀餘額）
 * ============================== */

/* ==============================
 * 賞品盒
 * ============================== */

  { label: '按店家分組（Summary）', value: 'summary' },
  { label: '明細（Detail）', value: 'detail' },
];

const prizeBoxSummaryColumns = [
  { field: 'storeName', label: '店家', width: 220 },
  { field: 'storeId', label: 'Store ID', width: 200 },
  { field: 'quantity', label: '數量', width: 100 },
  { field: 'updatedAt', label: '更新時間', width: 170 },
];

const prizeBoxDetailColumns = [
  { field: 'prizeName', label: '獎品名稱', width: 260 },
  { field: 'quantity', label: '數量', width: 100 },
  { field: 'createdAt', label: '建立時間', width: 170 },
];

const loadPrizeBox = async () => {
  prizeBoxSearched.value = true;
  try {
    const res =
      prizeBoxMode.value === 'summary'
        ? await getPrizeBoxSummaryByStore(id.value)
        : await getPrizeBoxByUserId(id.value);
    const data = (res as any)?.data ?? res;
    prizeBoxList.value = Array.isArray(data) ? data : [];
  } catch {
    prizeBoxList.value = [];
  }
};

const resetPrizeBox = () => {
  prizeBoxList.value = [];
  prizeBoxSearched.value = false;
};

/* ==============================
 * 手動調整點數（僅 ROLE_ADMIN）
 * ============================== */
const coinTypeOptions: SelectOption[] = [
  { label: '金幣（GOLD）', value: 'GOLD' },
  { label: '紅利（BONUS）', value: 'BONUS' },
];

const adjustDirectionOptions: SelectOption[] = [
  { label: '增加', value: 'ADD' },
  { label: '扣除', value: 'DEDUCT' },
];

const adjustCoinType = ref<'GOLD' | 'BONUS'>('GOLD');
const adjustDirection = ref<'ADD' | 'DEDUCT'>('ADD');
const adjustAmount = ref<string>('');
const adjustRemark = ref<string>('');
const adjustAmountError = ref<string>('');
const adjustRemarkError = ref<string>('');

const submitCoinAdjust = async () => {
  if (!isAdmin.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '權限不足，僅管理員可執行此操作。',
      iconType: 'warning',
    });
    return;
  }

  adjustAmountError.value = '';
  adjustRemarkError.value = '';

  const amount = Number(adjustAmount.value);
  if (!Number.isInteger(amount) || amount <= 0) {
    adjustAmountError.value = '請輸入正整數';
    return;
  }
  if (!adjustRemark.value.trim()) {
    adjustRemarkError.value = '備註為必填';
    return;
  }

  const currentBalance =
    adjustCoinType.value === 'GOLD'
      ? (detail.value?.goldCoins ?? 0)
      : (detail.value?.bonusCoins ?? 0);

  const expectedNew =
    adjustDirection.value === 'ADD'
      ? currentBalance + amount
      : currentBalance - amount;

  const coinLabel = adjustCoinType.value === 'GOLD' ? '金幣' : '紅利';
  const dirLabel = adjustDirection.value === 'ADD' ? '增加' : '扣除';

  const ok = await openConfirmDialog({
    title: '確認調整',
    message: `確定要對此會員${dirLabel} ${amount} ${coinLabel}？\n調整後預期餘額：${expectedNew} ${coinLabel}`,
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      coinAdjust(id.value, {
        coinType: adjustCoinType.value,
        direction: adjustDirection.value,
        amount,
        remark: adjustRemark.value.trim(),
      }),
    onSuccess: async (res: any) => {
      const newBalance =
        res?.data?.newBalance ?? res?.data?.balance ?? expectedNew;
      await openInfoDialog({
        title: '提示訊息',
        message: `調整成功！新餘額：${newBalance} ${coinLabel}`,
        iconType: 'success',
      });
      adjustAmount.value = '';
      adjustRemark.value = '';
      await loadDetail();
    },
    showSuccessDialog: false,
  });
};

/* ==============================
 * 登入記錄（僅 ROLE_ADMIN）
 * ============================== */
const loginHistory = ref<any[]>([]);
const loginHistoryLoading = ref(false);
const loginHistoryLoaded = ref(false);

const loginHistoryColumns = [
  { field: 'loginTime', label: '時間', width: 170 },
  { field: 'ipAddress', label: 'IP 位址', width: 140 },
  { field: 'deviceInfo', label: '裝置資訊', width: 220 },
  { field: 'loginMethod', label: '登入方式', width: 120 },
  { field: 'status', label: '結果', width: 100 },
  { field: 'failReason', label: '失敗原因', width: 180 },
];

const loadLoginHistory = async () => {
  if (!isAdmin.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '權限不足，僅管理員可查看登入記錄。',
      iconType: 'warning',
    });
    return;
  }

  if (!id.value) return;
  loginHistoryLoading.value = true;
  loginHistoryLoaded.value = false;
  try {
    const res = await getLoginHistory(id.value);
    const data = (res as any)?.data ?? res;
    loginHistory.value = Array.isArray(data) ? data : [];
  } catch {
    loginHistory.value = [];
  } finally {
    loginHistoryLoading.value = false;
    loginHistoryLoaded.value = true;
  }
};
</script>

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
      </div>
    </form>
  </MCard>

  <!-- ===== 點數管理 ===== -->
  <div class="m-t-12">
    <MCard>
      <p class="form__text form__text--title">點數管理</p>

      <!-- 錢包資訊 -->
      <div class="m-t-8">
        <p class="form__text form__text--red">點數餘額</p>
        <div v-if="walletLoading" class="m-t-8">載入中...</div>
        <div v-else-if="wallet" class="flex flex-wrap m-t-8">
          <div class="w-50 w-md-100 p-6">
            <FormInput label="點數餘額" :modelValue="String(wallet.balance ?? wallet.coinBalance ?? '-')" disabled />
          </div>
          <div class="w-50 w-md-100 p-6">
            <FormInput label="更新時間" :modelValue="formatDateTime(wallet.updatedAt)" disabled />
          </div>
        </div>
        <div v-else class="m-t-8">
          <p class="form__text" style="opacity:0.6">無錢包資訊</p>
        </div>
      </div>

      <!-- 手動調整點數 -->
      <div class="m-t-16">
        <p class="form__text form__text--red">手動調整點數</p>
        <div class="flex flex-wrap m-t-8">
          <div class="w-50 w-md-100 p-6">
            <FormSelect
              label="幣別"
              v-model="adjustCoinType"
              :options="coinTypeOptions"
            />
          </div>
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="調整金額（正數=加値；負數=扣除）"
              type="number"
              v-model="adjustAmount"
              placeholder="例如：100 或 -50"
            />
          </div>
          <div class="w-100 p-6">
            <FormInput
              label="原因（選填）"
              v-model="adjustReason"
              placeholder="例如：客服補償 / 华動加碼"
            />
          </div>
        </div>
        <div class="flex justify-center m-t-8">
          <MButton type="button" @click="submitAdjust">送出調整</MButton>
        </div>
      </div>
    </MCard>
  </div>

  <!-- ===== 交易紀錄 ===== -->
  <div class="m-t-12">
    <MCard>
      <p class="form__text form__text--title">交易紀錄</p>

      <div class="flex flex-wrap m-t-8">
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="幣別"
            v-model="txCoinType"
            :options="[{ label: '全部', value: '' }, ...coinTypeOptions]"
          />
        </div>
        <div class="w-50 w-md-100 p-6">
          <p class="form__text">交易日期</p>
          <div class="flex gap-x-12 m-t-4 items-center">
            <FormInput type="date" :showLabel="false" v-model="txDateStart" style="flex:1" />
            <span>~</span>
            <FormInput type="date" :showLabel="false" v-model="txDateEnd" style="flex:1" />
          </div>
        </div>
      </div>
      <div class="flex justify-center m-t-8 gap-x-12">
        <MButton type="button" @click="loadTransactions">查詢</MButton>
        <MButton type="button" variant="secondary" @click="resetTx">清除</MButton>
      </div>

      <template v-if="txList.length > 0">
        <ReportTable
          class="m-t-12"
          :columns="txColumns"
          :items="txList"
          row-key="id"
          :useWidthClass="true"
        >
          <template #cell-amount="{ item }">
            <span :style="{ color: Number(item.amount) >= 0 ? 'green' : 'red' }">
              {{ Number(item.amount) >= 0 ? '+' : '' }}{{ item.amount }}
            </span>
          </template>
          <template #cell-createdAt="{ item }">
            <span>{{ formatDateTime(item.createdAt) }}</span>
          </template>
        </ReportTable>
      </template>
      <template v-else-if="txSearched">
        <p class="form__text m-t-8" style="opacity:0.6">無交易紀錄</p>
      </template>
    </MCard>
  </div>

  <!-- ===== 賞品盒 ===== -->
  <div class="m-t-12">
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
        <MButton type="button" variant="secondary" @click="resetPrizeBox">清除</MButton>
      </div>

      <template v-if="prizeBoxList.length > 0">
        <ReportTable
          class="m-t-12"
          :columns="prizeBoxMode === 'summary' ? prizeBoxSummaryColumns : prizeBoxDetailColumns"
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
        <p class="form__text m-t-8" style="opacity:0.6">無賞品盒資料</p>
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

import { useDialogStore } from '@/stores';
import { executeApi } from '@/utils/executeApiUtils';

import {
  getFrontendUserById,
  updateFrontendUser,
  activateFrontendUser,
  deactivateFrontendUser,
  suspendFrontendUser,
} from '@/services/adminFrontendUserService';

import {
  getUserWallet,
  adjustWalletCoins,
  queryWalletTransactions,
} from '@/services/adminWalletService';

import {
  getPrizeBoxByUserId,
  getPrizeBoxSummaryByStore,
} from '@/services/adminPrizeBoxService';

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
    detail.value.status !== 'ACTIVE',
);
const canDeactivate = computed(() => detail.value?.status === 'ACTIVE');
const canSuspend = computed(
  () =>
    detail.value?.status &&
    detail.value.status !== 'SUSPENDED',
);

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

onMounted(async () => {
  await loadDetail();
  await loadWallet();
});

/* ==============================
 * 點數 / 錢包
 * ============================== */
const coinTypeOptions = [
  { label: '點數', value: 'COIN' },
  { label: '贈送點數', value: 'BONUS' },
];

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

const adjustCoinType = ref('COIN');
const adjustAmount = ref<string>('');
const adjustReason = ref('');

const submitAdjust = async () => {
  const amount = Number(adjustAmount.value);
  if (!Number.isFinite(amount) || amount === 0) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '金額必須是數字，且不可為 0（正數=加値；負數=扣除）',
      iconType: 'warning',
    });
    return;
  }

  const ok = await dialogStore.openConfirmDialog({
    title: '調整確認',
    message: `確定要調整點數？\n幣別：${adjustCoinType.value}\n金額：${amount}`,
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      adjustWalletCoins({
        userId: id.value,
        coinType: adjustCoinType.value,
        amount,
        reason: adjustReason.value.trim() || undefined,
      }),
    onSuccess: async () => {
      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '調整成功',
        iconType: 'success',
      });
      adjustAmount.value = '';
      adjustReason.value = '';
      await loadWallet();
    },
    showSuccessDialog: false,
  });
};

/* ==============================
 * 交易紀錄
 * ============================== */
const txCoinType = ref('');
const txDateStart = ref('');
const txDateEnd = ref('');
const txList = ref<any[]>([]);
const txSearched = ref(false);

const txColumns = [
  { field: 'coinType', label: '幣別', width: 100 },
  { field: 'type', label: '交易類型', width: 120 },
  { field: 'amount', label: '金額', width: 100 },
  { field: 'remark', label: '備註', width: 200 },
  { field: 'createdAt', label: '交易時間', width: 170 },
];

const loadTransactions = async () => {
  txSearched.value = true;
  try {
    const res = await queryWalletTransactions({
      condition: {
        userId: id.value,
        ...(txCoinType.value ? { coinType: txCoinType.value } : {}),
        ...(txDateStart.value ? { createdAtStart: txDateStart.value } : {}),
        ...(txDateEnd.value ? { createdAtEnd: txDateEnd.value } : {}),
      },
    });
    const data = (res as any)?.data ?? res;
    txList.value = Array.isArray(data) ? data : [];
  } catch {
    txList.value = [];
  }
};

const resetTx = () => {
  txCoinType.value = '';
  txDateStart.value = '';
  txDateEnd.value = '';
  txList.value = [];
  txSearched.value = false;
};

/* ==============================
 * 賞品盒
 * ============================== */
const prizeBoxMode = ref<'summary' | 'detail'>('summary');
const prizeBoxList = ref<any[]>([]);
const prizeBoxSearched = ref(false);

const prizeBoxModeOptions = [
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
</script>

<style scoped></style>

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

        <!-- ===== 可編輯欄位（對齊 FrontendUserUpdateReq） ===== -->
        <div class="w-100 p-6">
          <p class="form__text form__text--red">會員資料</p>
        </div>

        <!-- status -->
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="狀態"
            v-model="status"
            :options="statusOptions"
            :error="errors.status"
            required
          />
          <p class="form__text m-t-6" v-if="detail?.statusName">
            目前狀態名稱：{{ detail.statusName }}
          </p>
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

        <!-- avatar -->
        <div class="w-100 p-6">
          <FormInput
            label="頭像 URL"
            v-model="avatar"
            :error="errors.avatar"
            placeholder="https://..."
          />
        </div>

        <!-- coins (editable) -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="金幣餘額"
            type="number"
            v-model="goldCoins"
            :error="errors.goldCoins"
            placeholder="例如：2500"
          />
          <p class="form__text m-t-6">
            顯示：<NumberFormatter :number="goldCoins || 0" locale="zh-TW" />
          </p>
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="紅利幣餘額"
            type="number"
            v-model="bonusCoins"
            :error="errors.bonusCoins"
            placeholder="例如：300"
          />
          <p class="form__text m-t-6">
            顯示：<NumberFormatter :number="bonusCoins || 0" locale="zh-TW" />
          </p>
        </div>

        <!-- remark -->
        <div class="w-100 p-6">
          <FormInput
            label="備註（可選）"
            v-model="remark"
            :error="errors.remark"
            placeholder="可留空"
          />
        </div>
      </div>

      <!-- bottom button -->
      <div class="flex justify-center m-y-12 gap-x-12 flex-wrap">
        <MButton type="submit">儲存</MButton>

        <MButton type="button" class="mbtn--red" @click="goBack">返回</MButton>

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
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import * as yup from 'yup';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import NumberFormatter from '@/components/common/NumberFormatter.vue';

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

/* 下拉 */
const statusOptions = ref<SelectOption[]>([
  { label: 'ACTIVE', value: 'ACTIVE' },
  { label: 'INACTIVE', value: 'INACTIVE' },
  { label: 'SUSPENDED', value: 'SUSPENDED' },
  { label: 'DELETED', value: 'DELETED' },
]);

/* schema：對齊 FrontendUserUpdateReq（最基本約束） */
const schema = yup.object({
  email: yup.string().nullable().email('Email 格式不正確'),
  nickname: yup.string().nullable(),
  avatar: yup.string().nullable(),
  status: yup
    .string()
    .nullable()
    .oneOf(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'], '狀態不正確'),
  goldCoins: yup
    .number()
    .transform((v, o) => (o === '' || o === null || o === undefined ? null : v))
    .nullable()
    .min(0, '金幣不可為負數'),
  bonusCoins: yup
    .number()
    .transform((v, o) => (o === '' || o === null || o === undefined ? null : v))
    .nullable()
    .min(0, '紅利幣不可為負數'),
  phoneNumber: yup.string().nullable(),
  remark: yup.string().nullable(),
});

/* useForm */
const { errors, handleSubmit, setValues, defineField } = useForm({
  validationSchema: schema,
  initialValues: {
    email: '',
    nickname: '',
    avatar: '',
    status: 'ACTIVE',
    goldCoins: 0,
    bonusCoins: 0,
    phoneNumber: '',
    remark: '',
  },
});

const [email] = defineField('email');
const [nickname] = defineField('nickname');
const [avatar] = defineField('avatar');
const [status] = defineField('status');
const [goldCoins] = defineField('goldCoins');
const [bonusCoins] = defineField('bonusCoins');
const [phoneNumber] = defineField('phoneNumber');
const [remark] = defineField('remark');

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
        status: data?.status ?? 'ACTIVE',
        goldCoins: data?.goldCoins ?? 0,
        bonusCoins: data?.bonusCoins ?? 0,
        phoneNumber: data?.phoneNumber ?? '',
        remark: data?.remark ?? '',
      });
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

/* status buttons enabled */
const canActivate = computed(
  () =>
    detail.value?.status &&
    detail.value.status !== 'ACTIVE' &&
    detail.value.status !== 'DELETED'
);
const canDeactivate = computed(() => detail.value?.status === 'ACTIVE');
const canSuspend = computed(
  () =>
    detail.value?.status &&
    detail.value.status !== 'SUSPENDED' &&
    detail.value.status !== 'DELETED'
);
const canDelete = computed(() => detail.value?.status !== 'DELETED');

/* submit (update) */
const onSubmit = handleSubmit(async (values) => {
  const ok = await dialogStore.openConfirmDialog({
    title: '儲存確認',
    message: '確定要儲存會員資料嗎？',
  });
  if (!ok) return;

  // 對齊 FrontendUserUpdateReq
  const payload = {
    email: values.email || null,
    nickname: values.nickname || null,
    avatar: values.avatar || null,
    status: values.status || null,
    goldCoins:
      values.goldCoins === null || values.goldCoins === undefined
        ? null
        : Number(values.goldCoins),
    bonusCoins:
      values.bonusCoins === null || values.bonusCoins === undefined
        ? null
        : Number(values.bonusCoins),
    phoneNumber: values.phoneNumber || null,
    remark: values.remark || null,
  };

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

/* actions */
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

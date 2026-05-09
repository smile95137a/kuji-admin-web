<!-- src/views/adminUser/AdminUserForm.vue -->
<template>
  <MCard>
    <div class="admin-user-form__header">
      <FormTitle :title="pageTitle" />
    </div>

    <form class="admin-user-form" @submit.prevent="onSubmit">
      <Tabs :active-tab="activeTab" @update:active-tab="updateActiveTab">
        <template #headers="{ activeTab, setActiveTab }">
          <div
            v-for="tab in tabList"
            :key="tab.code"
            class="tab-button"
            :class="{ active: activeTab === tab.code }"
            @click="setActiveTab(tab.code)"
          >
            {{ tab.label }}
          </div>
        </template>

        <!-- 帳號資訊 -->
        <Tab name="account">
          <template v-if="!isDetail">
            <FormSection title="帳號資訊">
              <div class="admin-user-form__card">
                <div class="flex flex-wrap">
                  <div class="w-50 w-md-100 p-6">
                    <FormInput
                      label="Email（登入帳號）"
                      v-model="email"
                      :error="displayErrors.email"
                      required
                      maxlength="100"
                      placeholder="store@example.com"
                    />
                  </div>

                  <div class="w-50 w-md-100 p-6">
                    <FormInput
                      label="顯示名稱"
                      v-model="displayName"
                      :error="displayErrors.displayName"
                      required
                      maxlength="50"
                      placeholder="王小明 / 小編A"
                    />
                  </div>

                  <div class="w-50 w-md-100 p-6">
                    <FormInput
                      label="聯絡電話"
                      v-model="phone"
                      :error="displayErrors.phone"
                      maxlength="30"
                      placeholder="0912345678"
                    />
                  </div>

                  <div class="w-50 w-md-100 p-6">
                    <FormTextarea
                      label="備註"
                      v-model="remark"
                      :error="displayErrors.remark"
                      :maxlength="200"
                      :rows="4"
                      placeholder="可輸入內部備註"
                    />
                  </div>
                </div>
              </div>
            </FormSection>
          </template>
        </Tab>

        <!-- 新增負責人：店家資訊 -->
        <Tab v-if="mode === 'add-owner' && !isDetail" name="store">
          <div class="admin-user-form__layout">
            <div class="admin-user-form__left">
              <FormSection title="店家基本資料">
                <div class="admin-user-form__card">
                  <div class="flex flex-wrap">
                    <div class="w-50 w-md-100 p-6">
                      <FormInput
                        label="店家名稱"
                        v-model="storeName"
                        :error="displayErrors.storeName"
                        required
                        maxlength="100"
                        placeholder="KUJI 官方商店"
                      />
                    </div>

                    <div class="w-50 w-md-100 p-6">
                      <FormInput
                        label="店家短描述"
                        v-model="shortDescription"
                        :error="displayErrors.shortDescription"
                        required
                        maxlength="120"
                        placeholder="專營一番賞、扭蛋精品"
                      />
                    </div>

                    <div class="w-100 p-6">
                      <FormTextarea
                        label="店家詳細介紹"
                        v-model="longDescription"
                        :error="displayErrors.longDescription"
                        :maxlength="500"
                        :rows="6"
                        placeholder="可輸入店家詳細介紹"
                      />
                    </div>

                    <div class="w-50 w-md-100 p-6">
                      <FormInput
                        label="Logo URL"
                        v-model="logoUrl"
                        :error="displayErrors.logoUrl"
                        required
                        maxlength="500"
                        placeholder="https://.../logo.png"
                      />
                    </div>

                    <div class="w-50 w-md-100 p-6">
                      <FormInput
                        label="封面圖片 URL"
                        v-model="coverImageUrl"
                        :error="displayErrors.coverImageUrl"
                        maxlength="500"
                        placeholder="https://.../cover.jpg"
                      />
                    </div>
                  </div>
                </div>
              </FormSection>

              <FormSection title="店家聯絡資訊">
                <div class="admin-user-form__card">
                  <div class="flex flex-wrap">
                    <div class="w-50 w-md-100 p-6">
                      <FormInput
                        label="店家聯絡 Email"
                        v-model="storeEmail"
                        :error="displayErrors.storeEmail"
                        required
                        maxlength="100"
                        placeholder="shop@example.com"
                      />
                    </div>

                    <div class="w-50 w-md-100 p-6">
                      <FormInput
                        label="店家聯絡電話"
                        v-model="storePhone"
                        :error="displayErrors.storePhone"
                        required
                        maxlength="30"
                        placeholder="02-1234-5678"
                      />
                    </div>

                    <div class="w-100 p-6">
                      <FormInput
                        label="店家地址"
                        v-model="storeAddress"
                        :error="displayErrors.storeAddress"
                        required
                        maxlength="200"
                        placeholder="台北市…（無實體店可填「無」）"
                      />
                    </div>

                    <div class="w-50 w-md-100 p-6">
                      <FormInput
                        label="營業時間"
                        v-model="businessHours"
                        :error="displayErrors.businessHours"
                        required
                        maxlength="100"
                        placeholder="每日 10:00~22:00"
                      />
                    </div>
                  </div>
                </div>
              </FormSection>
            </div>

            <div class="admin-user-form__right">
              <FormSection title="社群資訊">
                <div class="admin-user-form__card">
                  <div class="flex flex-wrap">
                    <div class="w-100 p-6">
                      <FormInput
                        label="Facebook 連結"
                        v-model="facebookUrl"
                        :error="displayErrors.facebookUrl"
                        maxlength="500"
                        placeholder="https://facebook.com/..."
                      />
                    </div>

                    <div class="w-100 p-6">
                      <FormInput
                        label="Instagram 連結"
                        v-model="instagramUrl"
                        :error="displayErrors.instagramUrl"
                        maxlength="500"
                        placeholder="https://instagram.com/..."
                      />
                    </div>

                    <div class="w-100 p-6">
                      <FormInput
                        label="LINE ID"
                        v-model="lineId"
                        :error="displayErrors.lineId"
                        maxlength="100"
                        placeholder="kuji_official"
                      />
                    </div>
                  </div>

                  <div class="admin-user-form__info-box">
                    建立負責人時，會同時建立一間店家並將此帳號綁定為店家負責人。
                  </div>
                </div>
              </FormSection>
            </div>
          </div>
        </Tab>

        <!-- 新增編輯：關聯店家 -->
        <Tab v-if="mode === 'add-editor' && !isDetail" name="stores">
          <FormSection title="關聯店家">
            <div class="admin-user-form__card">
              <div class="admin-user-form__store-panel">
                <div class="admin-user-form__store-head">
                  <p class="admin-user-form__store-title">可管理店家</p>
                  <span class="admin-user-form__store-badge">
                    至少選擇一間
                  </span>
                </div>

                <FormCheckTagGroup
                  label="關聯店家"
                  name="admin-user-store-ids"
                  id-prefix="admin-user-store"
                  v-model="storeIds"
                  :options="storeOptions"
                  :error="displayErrors.storeIds"
                  hideLabel
                />

                <p v-if="!storeOptions.length" class="admin-user-form__empty">
                  目前沒有可選擇的店家。
                </p>
              </div>
            </div>
          </FormSection>
        </Tab>

        <!-- 詳情 -->
        <Tab v-if="isDetail" name="detail">
          <div class="admin-user-form__layout">
            <div class="admin-user-form__left">
              <FormSection title="帳號資訊">
                <div class="admin-user-form__card">
                  <div class="flex flex-wrap">
                    <div class="w-50 w-md-100 p-6">
                      <FormInput
                        label="帳號"
                        :modelValue="detail?.username || detail?.email || '-'"
                        disabled
                      />
                    </div>

                    <div class="w-50 w-md-100 p-6">
                      <FormInput
                        label="顯示名稱"
                        :modelValue="detail?.displayName || '-'"
                        disabled
                      />
                    </div>

                    <div class="w-50 w-md-100 p-6">
                      <FormInput
                        label="Email"
                        :modelValue="detail?.email || '-'"
                        disabled
                      />
                    </div>

                    <div class="w-50 w-md-100 p-6">
                      <FormInput
                        label="聯絡電話"
                        :modelValue="detail?.phone || '-'"
                        disabled
                      />
                    </div>

                    <div class="w-50 w-md-100 p-6">
                      <FormInput
                        label="狀態"
                        :modelValue="statusText(detail)"
                        disabled
                      />
                    </div>

                    <div class="w-50 w-md-100 p-6">
                      <FormInput
                        label="角色"
                        :modelValue="roleText(detail)"
                        disabled
                      />
                    </div>

                    <div class="w-100 p-6">
                      <FormTextarea
                        label="備註"
                        :modelValue="detail?.remark || ''"
                        disabled
                        :rows="4"
                        placeholder="-"
                      />
                    </div>
                  </div>
                </div>
              </FormSection>
            </div>

            <div class="admin-user-form__right">
              <FormSection title="系統資訊">
                <div class="admin-user-form__card">
                  <div class="admin-user-form__detail-list">
                    <div class="admin-user-form__detail-item">
                      <span class="admin-user-form__detail-label">店家</span>
                      <span class="admin-user-form__detail-value">
                        {{ storeText(detail) }}
                      </span>
                    </div>

                    <div class="admin-user-form__detail-item">
                      <span class="admin-user-form__detail-label">
                        最後登入
                      </span>
                      <span class="admin-user-form__detail-value">
                        <DateFormatter
                          v-if="detail?.lastLoginAt"
                          :date="detail.lastLoginAt"
                          format="YYYY-MM-DD HH:mm:ss"
                        />
                        <template v-else>-</template>
                      </span>
                    </div>

                    <div class="admin-user-form__detail-item">
                      <span class="admin-user-form__detail-label">
                        建立時間
                      </span>
                      <span class="admin-user-form__detail-value">
                        <DateFormatter
                          v-if="detail?.createdAt"
                          :date="detail.createdAt"
                          format="YYYY-MM-DD HH:mm:ss"
                        />
                        <template v-else>-</template>
                      </span>
                    </div>

                    <div class="admin-user-form__detail-item">
                      <span class="admin-user-form__detail-label">
                        更新時間
                      </span>
                      <span class="admin-user-form__detail-value">
                        <DateFormatter
                          v-if="detail?.updatedAt"
                          :date="detail.updatedAt"
                          format="YYYY-MM-DD HH:mm:ss"
                        />
                        <template v-else>-</template>
                      </span>
                    </div>
                  </div>
                </div>
              </FormSection>
            </div>
          </div>
        </Tab>
      </Tabs>

      <div class="flex justify-end m-y-8 gap-x-12 flex-wrap">
        <template v-if="!isDetail">
          <MButton
            v-if="mode === 'add-owner' && activeTab === 'account'"
            type="button"
            @click="goNextTab"
          >
            下一步
          </MButton>

          <MButton
            v-if="mode === 'add-owner' && activeTab === 'store'"
            type="button"
            class="mbtn--gray"
            @click="activeTab = 'account'"
          >
            上一步
          </MButton>

          <MButton type="submit">
            <font-awesome-icon icon="fa-floppy-disk" class="m-r-4" />
            {{ submitButtonText }}
          </MButton>

          <MButton type="button" class="mbtn--gray" @click="resetFormValues">
            清除
          </MButton>
        </template>

        <template v-else>
          <MButton
            type="button"
            :disabled="isActive(detail)"
            @click="doActivate"
          >
            啟用
          </MButton>

          <MButton
            type="button"
            :disabled="!isActive(detail)"
            @click="doDeactivate"
          >
            停用
          </MButton>

          <MButton type="button" class="mbtn--gray" @click="doResetPassword">
            重設密碼
          </MButton>

          <MButton type="button" class="mbtn--red" @click="doDelete">
            刪除
          </MButton>
        </template>

        <MButton type="button" class="mbtn--gray" @click="goBack">
          <font-awesome-icon icon="fa-arrow-left" class="m-r-4" />
          返回
        </MButton>
      </div>
    </form>
  </MCard>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import * as yup from 'yup';

import Tabs from '@/components/common/Tabs.vue';
import Tab from '@/components/common/Tab.vue';
import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormTitle from '@/components/common/FormTitle.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormTextarea from '@/components/common/FormTextarea.vue';
import FormSection from '@/components/common/FormSection.vue';
import FormCheckTagGroup from '@/components/common/FormCheckTagGroup.vue';
import DateFormatter from '@/components/common/DateFormatter.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { openInfoDialog } from '@/utils/dialog/infoDialog';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';

import {
  createStoreOwner,
  createStoreEditor,
  getAdminUserById,
  activateAdminUser,
  deactivateAdminUser,
  resetAdminUserPassword,
  deleteAdminUser,
} from '@/services/adminUserService';

import { getStoreOptions } from '@/services/adminStoreService';

type AdminUserMode = 'add-owner' | 'add-editor' | 'detail';

interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
  description?: string;
}

const LIST_PATH = '/home/admin-users';

const route = useRoute();
const router = useRouter();

const isDev = import.meta.env.DEV;

const routeAction = computed(() => String(route.params.action || ''));

const mode = computed<AdminUserMode>(() => {
  if (routeAction.value === 'add-owner') return 'add-owner';
  if (routeAction.value === 'add-editor') return 'add-editor';
  if (routeAction.value === 'detail') return 'detail';

  return 'detail';
});

const isValidAction = computed(() =>
  ['add-owner', 'add-editor', 'detail'].includes(routeAction.value),
);

const isDetail = computed(() => mode.value === 'detail');
const userId = computed(() => String(route.params.id || ''));

const pageTitle = computed(() => {
  if (mode.value === 'add-owner') return '新增店家負責人帳號';
  if (mode.value === 'add-editor') return '新增店家編輯帳號';

  return '帳號詳情';
});

const submitButtonText = computed(() => {
  if (mode.value === 'add-owner') return '建立負責人';
  if (mode.value === 'add-editor') return '建立編輯';

  return '送出';
});

/* ==============================
 * Tabs
 * ============================== */
const activeTab = ref('account');

const tabList = computed(() => {
  if (isDetail.value) {
    return [{ code: 'detail', label: '帳號詳情' }];
  }

  if (mode.value === 'add-owner') {
    return [
      { code: 'account', label: '帳號資訊' },
      { code: 'store', label: '店家資訊' },
    ];
  }

  return [
    { code: 'account', label: '帳號資訊' },
    { code: 'stores', label: '關聯店家' },
  ];
});

const updateActiveTab = (value: string) => {
  activeTab.value = value;
};

const fieldTabMap: Record<string, string> = {
  email: 'account',
  displayName: 'account',
  phone: 'account',
  remark: 'account',

  storeIds: 'stores',

  storeName: 'store',
  shortDescription: 'store',
  longDescription: 'store',
  logoUrl: 'store',
  coverImageUrl: 'store',
  storeEmail: 'store',
  storePhone: 'store',
  storeAddress: 'store',
  businessHours: 'store',
  facebookUrl: 'store',
  instagramUrl: 'store',
  lineId: 'store',
};

const jumpToErrorTab = (errorMap: Record<string, any>) => {
  const firstField = Object.keys(errorMap || {})[0];
  if (!firstField) return;

  activeTab.value = fieldTabMap[firstField] || 'account';
};

const goNextTab = () => {
  if (mode.value === 'add-owner') {
    activeTab.value = 'store';
    return;
  }

  if (mode.value === 'add-editor') {
    activeTab.value = 'stores';
  }
};

/* ==============================
 * Store options
 * ============================== */
const storeOptions = ref<SelectOption[]>([]);

const normalizeStoreOptions = (res: any) => {
  const data = res?.data ?? res ?? [];
  return Array.isArray(data) ? data : [];
};

const mapEnumOptionsToSelect = (list: any[] = []): SelectOption[] => {
  return list.map((item) => ({
    label:
      item?.label ??
      item?.storeName ??
      item?.name ??
      item?.title ??
      String(item?.value ?? item?.id ?? ''),
    value: item?.value ?? item?.id ?? item?.storeId ?? '',
    ...(item?.description ? { description: item.description } : {}),
  }));
};

const loadStoreOptions = async () => {
  await executeApi({
    fn: async () => getStoreOptions({ activeOnly: true }),
    onSuccess: (res: any) => {
      storeOptions.value = mapEnumOptionsToSelect(normalizeStoreOptions(res));
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

/* ==============================
 * Form
 * ============================== */
const isSubmitted = ref(false);

const displayErrors = computed<Record<string, string | undefined>>(() => {
  if (!isSubmitted.value) return {};
  return errors.value;
});

const initialValues = {
  email: '',
  displayName: '',
  phone: '',
  remark: '',

  storeIds: [] as string[],

  storeName: '',
  shortDescription: '',
  longDescription: '',
  logoUrl: '',
  coverImageUrl: '',
  storeEmail: '',
  storePhone: '',
  storeAddress: '',
  businessHours: '',
  facebookUrl: '',
  instagramUrl: '',
  lineId: '',
};

const schema = computed(() => {
  if (isDetail.value) {
    return yup.object({
      email: yup.string().nullable(),
      displayName: yup.string().nullable(),
      phone: yup.string().nullable(),
      remark: yup.string().nullable(),

      storeIds: yup.array().nullable(),

      storeName: yup.string().nullable(),
      shortDescription: yup.string().nullable(),
      longDescription: yup.string().nullable(),
      logoUrl: yup.string().nullable(),
      coverImageUrl: yup.string().nullable(),
      storeEmail: yup.string().nullable(),
      storePhone: yup.string().nullable(),
      storeAddress: yup.string().nullable(),
      businessHours: yup.string().nullable(),
      facebookUrl: yup.string().nullable(),
      instagramUrl: yup.string().nullable(),
      lineId: yup.string().nullable(),
    });
  }

  const common = {
    email: yup
      .string()
      .trim()
      .required('Email 不可為空')
      .email('Email 格式不正確')
      .max(100, 'Email 最多 100 字'),

    displayName: yup
      .string()
      .trim()
      .required('顯示名稱不可為空')
      .max(50, '顯示名稱最多 50 字'),

    phone: yup.string().nullable().max(30, '聯絡電話最多 30 字'),

    remark: yup.string().nullable().max(200, '備註最多 200 字'),
  };

  if (mode.value === 'add-editor') {
    return yup.object({
      ...common,

      storeIds: yup.array().of(yup.string()).min(1, '請至少選擇一間店家'),

      storeName: yup.string().nullable(),
      shortDescription: yup.string().nullable(),
      longDescription: yup.string().nullable(),
      logoUrl: yup.string().nullable(),
      coverImageUrl: yup.string().nullable(),
      storeEmail: yup.string().nullable(),
      storePhone: yup.string().nullable(),
      storeAddress: yup.string().nullable(),
      businessHours: yup.string().nullable(),
      facebookUrl: yup.string().nullable(),
      instagramUrl: yup.string().nullable(),
      lineId: yup.string().nullable(),
    });
  }

  return yup.object({
    ...common,

    storeName: yup
      .string()
      .trim()
      .required('店家名稱不可為空')
      .max(100, '店家名稱最多 100 字'),

    shortDescription: yup
      .string()
      .trim()
      .required('店家短描述不可為空')
      .max(120, '店家短描述最多 120 字'),

    longDescription: yup
      .string()
      .nullable()
      .max(500, '店家詳細介紹最多 500 字'),

    logoUrl: yup
      .string()
      .trim()
      .required('Logo URL 不可為空')
      .max(500, 'Logo URL 最多 500 字'),

    coverImageUrl: yup.string().nullable().max(500, '封面圖片 URL 最多 500 字'),

    storeEmail: yup
      .string()
      .trim()
      .required('店家聯絡 Email 不可為空')
      .email('Email 格式不正確')
      .max(100, '店家聯絡 Email 最多 100 字'),

    storePhone: yup
      .string()
      .trim()
      .required('店家聯絡電話不可為空')
      .max(30, '店家聯絡電話最多 30 字'),

    storeAddress: yup
      .string()
      .trim()
      .required('店家地址不可為空')
      .max(200, '店家地址最多 200 字'),

    businessHours: yup
      .string()
      .trim()
      .required('營業時間不可為空')
      .max(100, '營業時間最多 100 字'),

    facebookUrl: yup.string().nullable().max(500, 'Facebook 連結最多 500 字'),

    instagramUrl: yup.string().nullable().max(500, 'Instagram 連結最多 500 字'),

    lineId: yup.string().nullable().max(100, 'LINE ID 最多 100 字'),

    storeIds: yup.array().nullable(),
  });
});

const { errors, handleSubmit, setValues, resetForm, defineField } = useForm({
  validationSchema: schema,
  initialValues,
  validateOnMount: false,
});

const [email] = defineField('email');
const [displayName] = defineField('displayName');
const [phone] = defineField('phone');
const [remark] = defineField('remark');

const [storeIds] = defineField('storeIds');

const [storeName] = defineField('storeName');
const [shortDescription] = defineField('shortDescription');
const [longDescription] = defineField('longDescription');
const [logoUrl] = defineField('logoUrl');
const [coverImageUrl] = defineField('coverImageUrl');
const [storeEmail] = defineField('storeEmail');
const [storePhone] = defineField('storePhone');
const [storeAddress] = defineField('storeAddress');
const [businessHours] = defineField('businessHours');
const [facebookUrl] = defineField('facebookUrl');
const [instagramUrl] = defineField('instagramUrl');
const [lineId] = defineField('lineId');

/* ==============================
 * Detail
 * ============================== */
const detail = ref<any>(null);

const roleText = (user: any) => {
  const roles = user?.roles;

  if (!Array.isArray(roles) || roles.length === 0) return '-';

  return roles
    .map((role: any) => role?.name || role?.code)
    .filter(Boolean)
    .join(', ');
};

const storeText = (user: any) => {
  const stores = user?.stores;

  if (!Array.isArray(stores) || stores.length === 0) return '-';

  return stores
    .map((store: any) => {
      const name = store?.storeName || store?.name || store?.id || '';
      const roleType = store?.roleType ? `（${store.roleType}）` : '';

      return `${name}${roleType}`;
    })
    .filter(Boolean)
    .join('、');
};

const statusText = (user: any) => {
  const status = user?.status;

  if (status === 'ACTIVE') return '啟用';
  if (status === 'INACTIVE') return '停用';
  if (status === 'DELETED') return '已刪除';

  return status ? String(status) : '-';
};

const isActive = (user: any) => user?.status === 'ACTIVE';

const reloadDetail = async () => {
  if (!isDetail.value || !userId.value) return;

  await executeApi({
    fn: async () => getAdminUserById(userId.value),
    onSuccess: (res: any) => {
      const data = res?.data ?? res;

      detail.value = data;

      setValues(
        {
          email: data?.email ?? '',
          displayName: data?.displayName ?? '',
          phone: data?.phone ?? '',
          remark: data?.remark ?? '',
          storeIds: [],

          storeName: '',
          shortDescription: '',
          longDescription: '',
          logoUrl: '',
          coverImageUrl: '',
          storeEmail: '',
          storePhone: '',
          storeAddress: '',
          businessHours: '',
          facebookUrl: '',
          instagramUrl: '',
          lineId: '',
        },
        false,
      );
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

/* ==============================
 * Helpers
 * ============================== */
const emptyToNull = (value: any) => {
  const text = String(value ?? '').trim();

  return text ? text : null;
};

const normalizeText = (value: any) => String(value ?? '').trim();

const buildOwnerPayload = (values: any) => ({
  email: normalizeText(values.email),
  displayName: normalizeText(values.displayName),
  phone: emptyToNull(values.phone),
  remark: emptyToNull(values.remark),

  storeName: normalizeText(values.storeName),
  shortDescription: normalizeText(values.shortDescription),
  longDescription: emptyToNull(values.longDescription),
  logoUrl: normalizeText(values.logoUrl),
  coverImageUrl: emptyToNull(values.coverImageUrl),

  storeEmail: normalizeText(values.storeEmail),
  storePhone: normalizeText(values.storePhone),
  storeAddress: normalizeText(values.storeAddress),
  businessHours: normalizeText(values.businessHours),

  facebookUrl: emptyToNull(values.facebookUrl),
  instagramUrl: emptyToNull(values.instagramUrl),
  lineId: emptyToNull(values.lineId),
});

const buildEditorPayload = (values: any) => ({
  storeIds: Array.isArray(values.storeIds) ? values.storeIds : [],
  email: normalizeText(values.email),
  displayName: normalizeText(values.displayName),
  phone: emptyToNull(values.phone),
  remark: emptyToNull(values.remark),
});

/* ==============================
 * Submit
 * ============================== */
const onSubmit = handleSubmit(
  async (values) => {
    isSubmitted.value = true;

    if (isDetail.value) return;

    const ok = await openConfirmDialog({
      title: '儲存確認',
      message:
        mode.value === 'add-owner'
          ? '確定要建立店家負責人帳號嗎？'
          : '確定要建立店家編輯帳號嗎？',
    });

    if (!ok) return;

    await executeApi({
      fn: async () => {
        if (mode.value === 'add-owner') {
          return createStoreOwner(buildOwnerPayload(values));
        }

        return createStoreEditor(buildEditorPayload(values));
      },
      onSuccess: async () => {
        await openInfoDialog({
          title: '提示訊息',
          message:
            mode.value === 'add-owner'
              ? `建立店家負責人成功，初始密碼已發送至 ${values.email}`
              : `建立店家編輯成功，初始密碼已發送至 ${values.email}`,
          iconType: 'success',
        });

        router.push(LIST_PATH);
      },
      showSuccessDialog: false,
      showFailDialog: true,
      showCatchDialog: true,
    });
  },
  (ctx) => {
    isSubmitted.value = true;
    jumpToErrorTab(ctx.errors || {});
  },
);

/* ==============================
 * Detail actions
 * ============================== */
const doActivate = async () => {
  if (!userId.value) return;

  const ok = await openConfirmDialog({
    title: '啟用確認',
    message: '確定要啟用此帳號嗎？',
  });

  if (!ok) return;

  await executeApi({
    fn: async () => activateAdminUser(userId.value),
    onSuccess: async () => {
      await openInfoDialog({
        title: '提示訊息',
        message: '啟用成功',
        iconType: 'success',
      });

      await reloadDetail();
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

const doDeactivate = async () => {
  if (!userId.value) return;

  const ok = await openConfirmDialog({
    title: '停用確認',
    message: '確定要停用此帳號嗎？',
  });

  if (!ok) return;

  await executeApi({
    fn: async () => deactivateAdminUser(userId.value),
    onSuccess: async () => {
      await openInfoDialog({
        title: '提示訊息',
        message: '停用成功',
        iconType: 'success',
      });

      await reloadDetail();
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

const doResetPassword = async () => {
  if (!userId.value) return;

  const ok = await openConfirmDialog({
    title: '重設密碼確認',
    message: '確定要重設此帳號密碼嗎？',
  });

  if (!ok) return;

  await executeApi<{ newPassword?: string }>({
    fn: async () => resetAdminUserPassword(userId.value),
    onSuccess: async (res: any) => {
      const data = res?.data ?? res;
      const extra = data?.newPassword
        ? `（臨時密碼：${data.newPassword}，請告知用戶）`
        : '';

      await openInfoDialog({
        title: '重設成功',
        message: `密碼已重設，新密碼已發送至用戶 Email。${extra}`,
        iconType: 'success',
      });
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

const doDelete = async () => {
  if (!userId.value) return;

  const ok = await openConfirmDialog({
    title: '刪除確認',
    message: '確定要刪除此帳號嗎？（刪除後無法復原）',
  });

  if (!ok) return;

  await executeApi({
    fn: async () => deleteAdminUser(userId.value),
    onSuccess: async () => {
      await openInfoDialog({
        title: '提示訊息',
        message: '刪除成功',
        iconType: 'success',
      });

      router.push(LIST_PATH);
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

/* ==============================
 * Reset / Navigation
 * ============================== */
const resetFormValues = async () => {
  if (isDetail.value) {
    await reloadDetail();
    activeTab.value = 'detail';
    return;
  }

  resetForm({
    values: {
      ...initialValues,
      storeIds: [],
    },
  });

  activeTab.value = 'account';
  isSubmitted.value = false;
};

const goBack = () => {
  router.push(LIST_PATH);
};

/* ==============================
 * Init
 * ============================== */
const initPage = async () => {
  if (!isValidAction.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '無效的操作模式',
      iconType: 'warning',
    });

    router.push(LIST_PATH);
    return;
  }

  if (isDetail.value && !userId.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '查無帳號資料',
      iconType: 'warning',
    });

    router.push(LIST_PATH);
    return;
  }

  detail.value = null;
  isSubmitted.value = false;

  if (mode.value === 'add-editor') {
    activeTab.value = 'account';
    await loadStoreOptions();
    return;
  }

  if (mode.value === 'add-owner') {
    activeTab.value = 'account';
    return;
  }

  activeTab.value = 'detail';
  await reloadDetail();
};

onMounted(async () => {
  await initPage();
});

watch(
  () => [route.params.action, route.params.id],
  async () => {
    await initPage();
  },
);
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as *;

.admin-user-form {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 4px;
  }

  &__layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 440px);
    gap: 18px;
    align-items: flex-start;
    width: 100%;
    max-width: 100%;
  }

  &__left,
  &__right {
    min-width: 0;
    width: 100%;
  }

  &__card {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    padding: 14px;
    border: 1px solid color.mix($form-border, #fff, 72%);
    border-radius: 14px;
    background: $form-bg;
  }

  &__info-box {
    margin: 8px 6px 4px;
    padding: 10px 14px;
    border-left: 4px solid $brand;
    border-radius: $form-radius;
    background: color.mix($brand-light, #fff, 35%);
    color: $brand-dark;
    font-size: 13px;
    line-height: 1.5;
  }

  &__store-panel {
    width: 100%;
    min-width: 0;
  }

  &__store-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-width: 0;
    margin-bottom: 12px;
  }

  &__store-title {
    margin: 0;
    color: $form-text;
    font-size: 14px;
    font-weight: 800;
    line-height: 1.4;
    word-break: break-word;
  }

  &__store-badge {
    flex: 0 0 auto;
    padding: 4px 10px;
    border-radius: 999px;
    background: color.mix($brand-light, #fff, 15%);
    color: $brand;
    font-size: 12px;
    font-weight: 800;
    line-height: 1.4;
  }

  &__empty {
    margin: 10px 0 0;
    color: $form-muted;
    font-size: 13px;
    line-height: 1.5;
  }

  &__detail-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__detail-item {
    display: grid;
    grid-template-columns: 92px minmax(0, 1fr);
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid color.mix($form-border, #fff, 72%);
    border-radius: 12px;
    background: #fff;
  }

  &__detail-label {
    color: $form-muted;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.5;
  }

  &__detail-value {
    min-width: 0;
    color: $form-text;
    font-size: 13px;
    line-height: 1.5;
    word-break: break-word;
  }

  @media (max-width: 1180px) {
    &__layout {
      grid-template-columns: 1fr;
    }

    &__right {
      position: static;
    }
  }

  @media (max-width: 576px) {
    &__header {
      align-items: flex-start;
      flex-direction: column;
    }

    &__card {
      padding: 12px;
    }

    &__store-head {
      align-items: flex-start;
      flex-direction: column;
    }

    &__store-badge {
      max-width: 100%;
      white-space: normal;
      word-break: break-word;
    }

    &__detail-item {
      grid-template-columns: 1fr;
    }
  }
}
</style>

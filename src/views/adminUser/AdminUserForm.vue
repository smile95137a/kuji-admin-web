<!-- src/views/adminUser/AdminUserForm.vue -->
<template>
  <MCard>
    <form @submit.prevent="onSubmit">
      <p class="form__text form__text--title">{{ pageTitle }}</p>

      <!-- Step indicator for add-owner -->
      <div v-if="mode === 'add-owner' && !isDetail" class="adminUser__steps">
        <div
          class="adminUser__step"
          :class="{
            'adminUser__step--active': currentStep === 1,
            'adminUser__step--done': currentStep > 1,
          }"
        >
          <span class="adminUser__stepNum">1</span>
          <span>帳號資訊</span>
        </div>
        <div class="adminUser__stepDivider">→</div>
        <div
          class="adminUser__step"
          :class="{ 'adminUser__step--active': currentStep === 2 }"
        >
          <span class="adminUser__stepNum">2</span>
          <span>店家資訊</span>
        </div>
      </div>

      <div class="flex flex-wrap">
        <!-- ===================== 帳號資訊 (Step 1 for add-owner; always for others) ===================== -->
        <template v-if="currentStep === 1 || mode !== 'add-owner' || isDetail">
          <div class="w-100 p-6">
            <p class="form__text form__text--red">帳號資訊</p>
          </div>

          <!-- Email -->
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="Email（登入帳號）"
              v-model="email"
              :error="errors.email"
              placeholder="store@example.com"
              :disabled="isDetail"
            />
          </div>

          <!-- 顯示名稱 -->
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="顯示名稱"
              v-model="displayName"
              :error="errors.displayName"
              placeholder="王小明 / 小編A"
              :disabled="isDetail"
            />
          </div>

          <!-- 電話 -->
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="聯絡電話（可選）"
              v-model="phone"
              :error="errors.phone"
              placeholder="0912345678"
              :disabled="isDetail"
            />
          </div>

          <!-- 備註 -->
          <div class="w-50 w-md-100 p-6" v-if="!isDetail">
            <FormInput
              label="備註（可選）"
              v-model="remark"
              :error="errors.remark"
              placeholder="可留空"
            />
          </div>

          <!-- ===================== add-editor: 店家 checkbox 列表 ===================== -->
          <div
            class="w-100 w-md-100 p-6"
            v-if="mode === 'add-editor' && !isDetail"
          >
            <p class="form__text">
              關聯店家（可多選，至少一間）<span class="form__text--red">
                *</span
              >
            </p>
            <div class="adminUser__storeCheckboxList">
              <label
                v-for="store in storeOptions"
                :key="store.value"
                class="adminUser__storeCheckbox"
              >
                <input
                  type="checkbox"
                  :value="store.value"
                  v-model="storeIds"
                />
                <span>{{ store.label }}</span>
              </label>
            </div>
            <p class="error-text m-t-4" v-if="errors.storeIds">
              {{ errors.storeIds }}
            </p>
          </div>
        </template>

        <!-- ===================== add-owner: 店家資訊 (Step 2) ===================== -->
        <template v-if="mode === 'add-owner' && !isDetail && currentStep === 2">
          <div class="w-100 p-6">
            <p class="form__text form__text--red">店家資訊</p>
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="店家名稱"
              v-model="storeName"
              :error="errors.storeName"
              placeholder="KUJI 官方商店"
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="店家短描述（列表用）"
              v-model="shortDescription"
              :error="errors.shortDescription"
              placeholder="專營一番賞、扭蛋精品"
            />
          </div>

          <div class="w-100 p-6">
            <FormInput
              label="店家詳細介紹（可選）"
              type="textarea"
              v-model="longDescription"
              :error="errors.longDescription"
              placeholder="可留空"
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="Logo URL"
              v-model="logoUrl"
              :error="errors.logoUrl"
              placeholder="https://.../logo.png"
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="封面圖片 URL（可選）"
              v-model="coverImageUrl"
              :error="errors.coverImageUrl"
              placeholder="https://.../cover.jpg"
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="店家聯絡 Email"
              v-model="storeEmail"
              :error="errors.storeEmail"
              placeholder="shop@example.com"
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="店家聯絡電話"
              v-model="storePhone"
              :error="errors.storePhone"
              placeholder="02-1234-5678"
            />
          </div>

          <div class="w-100 p-6">
            <FormInput
              label="店家地址（無實體店可填「無」）"
              v-model="storeAddress"
              :error="errors.storeAddress"
              placeholder="台北市…（或填 無）"
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="營業時間"
              v-model="businessHours"
              :error="errors.businessHours"
              placeholder="每日 10:00~22:00"
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="Facebook 連結（可選）"
              v-model="facebookUrl"
              :error="errors.facebookUrl"
              placeholder="https://facebook.com/..."
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="Instagram 連結（可選）"
              v-model="instagramUrl"
              :error="errors.instagramUrl"
              placeholder="https://instagram.com/..."
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="LINE ID（可選）"
              v-model="lineId"
              :error="errors.lineId"
              placeholder="kuji_official"
            />
          </div>
        </template>

        <!-- ===================== detail 區 ===================== -->
        <template v-if="isDetail">
          <div class="w-100 p-6">
            <p class="form__text form__text--red">帳號資訊（檢視）</p>
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="帳號"
              :modelValue="detail?.username || '-'"
              disabled
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput label="狀態" :modelValue="statusText(detail)" disabled />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput label="角色" :modelValue="roleText(detail)" disabled />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput label="店家" :modelValue="storeText(detail)" disabled />
          </div>

          <!-- ✅ 日期改用 DateFormatter（不再用 formatDateTime） -->
          <div class="w-50 w-md-100 p-6">
            <p class="form__text">最後登入</p>
            <DateFormatter
              v-if="detail?.lastLoginAt"
              :date="detail.lastLoginAt"
              format="YYYY-MM-DD HH:mm:ss"
            />
            <span v-else>-</span>
          </div>

          <div class="w-50 w-md-100 p-6">
            <p class="form__text">建立時間</p>
            <DateFormatter
              v-if="detail?.createdAt"
              :date="detail.createdAt"
              format="YYYY-MM-DD HH:mm:ss"
            />
            <span v-else>-</span>
          </div>
        </template>
      </div>

      <!-- bottom button -->
      <div class="flex justify-center m-y-12 gap-x-12 flex-wrap">
        <template v-if="!isDetail">
          <MButton type="button" class="mbtn--gray" @click="fillMockData">
            快速產生資料
          </MButton>

          <template v-if="mode === 'add-owner'">
            <MButton
              v-if="currentStep === 1"
              type="button"
              @click="currentStep = 2"
              >下一步</MButton
            >
            <template v-if="currentStep === 2">
              <MButton type="button" class="mbtn--gray" @click="currentStep = 1"
                >上一步</MButton
              >
              <MButton type="submit">建立負責人</MButton>
            </template>
          </template>
          <MButton v-else type="submit">建立編輯</MButton>
        </template>

        <template v-else>
          <MButton :disabled="isActive(detail)" @click="doActivate"
            >啟用</MButton
          >
          <MButton :disabled="!isActive(detail)" @click="doDeactivate"
            >停用</MButton
          >
          <MButton @click="doResetPassword">重設密碼</MButton>
          <MButton class="mbtn--red" @click="doDelete">刪除</MButton>
        </template>

        <MButton type="button" class="mbtn--red" @click="router.back()"
          >返回</MButton
        >
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
import DateFormatter from '@/components/common/DateFormatter.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { useDialogStore } from '@/stores';

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
import { openInfoDialog } from '@/utils/dialog/infoDialog';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';

interface SelectOption {
  label: string;
  value: any;
  description?: string;
}

/* Setup */
const route = useRoute();
const router = useRouter();
const dialogStore = useDialogStore();

const mode = computed<'add-owner' | 'add-editor' | 'detail'>(() => {
  if (route.name === 'AdminUserAddOwner') return 'add-owner';
  if (route.name === 'AdminUserAddEditor') return 'add-editor';
  return 'detail';
});
const isDetail = computed(() => mode.value === 'detail');
const currentStep = ref(1);
const userId = computed(() => String(route.params.id || ''));

const pageTitle = computed(() => {
  if (mode.value === 'add-owner') return '新增店家負責人帳號';
  if (mode.value === 'add-editor') return '新增店家編輯帳號';
  return '帳號詳情';
});

/* 店家選項 */
const storeOptions = ref<SelectOption[]>([]);

const mapEnumOptionsToSelect = (list: any[] = []): SelectOption[] =>
  list.map((x) => ({
    label: x?.label ?? '',
    value: x?.value ?? '',
    ...(x?.description ? { description: x.description } : {}),
  }));

const loadStoreOptions = async () => {
  await executeApi<any[]>({
    fn: async () => getStoreOptions({ activeOnly: true }),
    onSuccess: (data) => {
      storeOptions.value = mapEnumOptionsToSelect(
        Array.isArray(data) ? data : [],
      );
    },
  });
};

/* schema */
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

  if (mode.value === 'add-editor') {
    return yup.object({
      storeIds: yup.array().of(yup.string()).min(1, '請至少選擇一間店家'),
      email: yup.string().required('Email 不可為空').email('Email 格式不正確'),
      displayName: yup.string().required('顯示名稱不可為空'),
      phone: yup.string().nullable(),
      remark: yup.string().nullable(),

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
    email: yup.string().required('Email 不可為空').email('Email 格式不正確'),
    displayName: yup.string().required('顯示名稱不可為空'),
    phone: yup.string().nullable(),
    remark: yup.string().nullable(),

    storeName: yup.string().required('店家名稱不可為空'),
    shortDescription: yup.string().required('店家短描述不可為空'),
    longDescription: yup.string().nullable(),
    logoUrl: yup.string().required('Logo URL 不可為空'),
    coverImageUrl: yup.string().nullable(),

    storeEmail: yup
      .string()
      .required('店家聯絡 Email 不可為空')
      .email('Email 格式不正確'),
    storePhone: yup.string().required('店家聯絡電話不可為空'),
    storeAddress: yup.string().required('店家地址不可為空'),
    businessHours: yup.string().required('營業時間不可為空'),

    facebookUrl: yup.string().nullable(),
    instagramUrl: yup.string().nullable(),
    lineId: yup.string().nullable(),

    storeIds: yup.array().nullable(),
  });
});

/* useForm */
const { errors, handleSubmit, setValues, defineField } = useForm({
  validationSchema: schema,
  initialValues: {
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
  },
});

/* defineField */
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

/* detail */
const detail = ref<any>(null);

const roleText = (u: any) => {
  const roles = u?.roles;
  if (!Array.isArray(roles) || roles.length === 0) return '-';
  return roles
    .map((r: any) => r?.name || r?.code)
    .filter(Boolean)
    .join(', ');
};

const storeText = (u: any) => {
  const stores = u?.stores;
  if (!Array.isArray(stores) || stores.length === 0) return '-';
  return stores
    .map((s: any) => {
      const name = s?.storeName || s?.id || '';
      const roleType = s?.roleType ? `(${s.roleType})` : '';
      return `${name}${roleType}`;
    })
    .filter(Boolean)
    .join(', ');
};

const statusText = (u: any) => {
  const s = u?.status;
  if (!s) return '-';
  return s === 'ACTIVE' ? '啟用' : s === 'INACTIVE' ? '停用' : String(s);
};

const isActive = (u: any) => u?.status === 'ACTIVE';

const reloadDetail = async () => {
  if (!isDetail.value || !userId.value) return;

  await executeApi({
    fn: async () => getAdminUserById(userId.value),
    onSuccess: (data) => {
      const d = (data as any)?.data ?? data;
      detail.value = d;

      setValues({
        email: d?.email ?? '',
        displayName: d?.displayName ?? '',
        phone: d?.phone ?? '',
        remark: d?.remark ?? '',
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
      });
    },
  });
};

onMounted(async () => {
  if (mode.value === 'add-editor') await loadStoreOptions();
  if (isDetail.value) await reloadDetail();
});

/* mock */
const fillMockData = async () => {
  const ts = Date.now();

  if (mode.value === 'add-owner') {
    setValues({
      email: `owner_${ts}@example.com`,
      displayName: `店家老闆_${ts}`,
      phone: '0912345678',
      remark: '測試建立店家負責人',

      storeName: `KUJI 測試商店_${ts}`,
      shortDescription: '專營一番賞、扭蛋精品',
      longDescription: '店家詳細介紹（可留空）',
      logoUrl: 'https://picsum.photos/seed/logo/300/300',
      coverImageUrl: 'https://picsum.photos/seed/cover/1200/600',
      storeEmail: `shop_${ts}@example.com`,
      storePhone: '02-1234-5678',
      storeAddress: '無',
      businessHours: '每日 10:00~22:00',
      facebookUrl: '',
      instagramUrl: '',
      lineId: '',
      storeIds: [],
    });
  } else {
    const firstStoreId =
      storeOptions.value.find((o) => o.value)?.value || 'STORE_ID_HERE';
    setValues({
      email: `editor_${ts}@example.com`,
      displayName: `店家小編_${ts}`,
      phone: '0912345678',
      remark: '測試建立店家編輯',
      storeIds: [firstStoreId],

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
    });
  }

  await openInfoDialog({
    title: '提示訊息',
    message: '已帶入測試資料',
    iconType: 'success',
  });
};

/* submit */
const onSubmit = handleSubmit(async (values) => {
  if (isDetail.value) return;

  if (mode.value === 'add-owner') {
    await executeApi({
      fn: async () =>
        createStoreOwner({
          email: values.email,
          displayName: values.displayName,
          phone: values.phone || null,
          remark: values.remark || null,

          storeName: values.storeName,
          shortDescription: values.shortDescription,
          longDescription: values.longDescription || null,
          logoUrl: values.logoUrl,
          coverImageUrl: values.coverImageUrl || null,

          storeEmail: values.storeEmail,
          storePhone: values.storePhone,
          storeAddress: values.storeAddress,
          businessHours: values.businessHours,

          facebookUrl: values.facebookUrl || null,
          instagramUrl: values.instagramUrl || null,
          lineId: values.lineId || null,
        }),
      onSuccess: async () => {
        await openInfoDialog({
          title: '提示訊息',
          message: '建立店家負責人成功',
          iconType: 'success',
        });
        router.push('/home/admin-users');
      },
    });
    return;
  }

  await executeApi({
    fn: async () =>
      createStoreEditor({
        storeIds: values.storeIds,
        email: values.email,
        displayName: values.displayName,
        phone: values.phone || null,
        remark: values.remark || null,
      }),
    onSuccess: async () => {
      await openInfoDialog({
        title: '提示訊息',
        message: '建立店家編輯成功',
        iconType: 'success',
      });
      router.push('/home/admin-users');
    },
  });
});

/* detail actions */
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
  });
};

const doResetPassword = async () => {
  if (!userId.value) return;

  const ok = await openConfirmDialog({
    title: '重設密碼確認',
    message: '確定要重設此帳號密碼嗎？',
  });
  if (!ok) return;

  await executeApi<{ newPassword: string }>({
    fn: async () => resetAdminUserPassword(userId.value),
    onSuccess: async (data) => {
      await openInfoDialog({
        title: '新密碼',
        message: `新密碼：${data?.newPassword || '-'}`,
        iconType: 'success',
      });
    },
    showSuccessDialog: false,
  });
};

const doDelete = async () => {
  if (!userId.value) return;

  const ok = await openConfirmDialog({
    title: '刪除確認',
    message: '確定要刪除此帳號嗎？（後端為軟刪除＝停用）',
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
      router.push('/home/admin-users');
    },
  });
};
</script>

<style scoped>
.adminUser__steps {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}
.adminUser__step {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
}
.adminUser__step--active {
  color: #6366f1;
  font-weight: 600;
}
.adminUser__step--done {
  color: #10b981;
}
.adminUser__stepNum {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid currentColor;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
.adminUser__stepDivider {
  color: #d1d5db;
}
.adminUser__storeCheckboxList {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  min-height: 40px;
}
.adminUser__storeCheckbox {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #f9fafb;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
.adminUser__storeCheckbox input {
  cursor: pointer;
}
</style>

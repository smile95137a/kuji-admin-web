<!-- src/views/store/StoreEdit.vue -->
<template>
  <!-- STORE_EDITOR readonly banner -->
  <div v-if="isEditorRole" class="se__readonly-banner">
    您的角色無法編輯店家資訊（唯讀模式）
  </div>

  <MCard>
    <div class="flex align-center gap-x-12 m-b-16">
      <MButton variant="secondary" size="sm" @click="goBack">← 返回</MButton>
      <p class="form__text form__text--title" style="margin: 0">
        {{ isProfileMode ? '店家資訊管理' : '編輯店家資訊' }}
      </p>
    </div>

    <template v-if="loading">
      <p class="se__loading">載入中...</p>
    </template>

    <template v-else>
      <form @submit.prevent="submitForm">
        <!-- ===== 基本資訊 ===== -->
        <div class="se__section">
          <p class="se__section-title">基本資訊</p>
          <div class="flex flex-wrap">
            <div class="w-50 w-md-100 p-6">
              <FormInput
                label="店家名稱"
                v-model="form.name"
                :error="errors.name"
                placeholder="KUJI 官方商店"
                :disabled="isEditorRole"
                required
              />
            </div>
            <div class="w-50 w-md-100 p-6">
              <div class="se__char-count-wrapper">
                <FormInput
                  label="簡短描述"
                  v-model="form.shortDescription"
                  :error="errors.shortDescription"
                  placeholder="專營一番賞、扭蛋精品（最多 100 字）"
                  :disabled="isEditorRole"
                  required
                />
                <span
                  class="se__char-count"
                  :class="{
                    'se__char-count--over':
                      (form.shortDescription?.length ?? 0) > 100,
                  }"
                >
                  {{ form.shortDescription?.length ?? 0 }} / 100
                </span>
              </div>
            </div>
            <div class="w-100 p-6">
              <label class="form__label">完整描述（可選）</label>
              <textarea
                v-model="form.longDescription"
                class="se__textarea"
                placeholder="輸入店家完整介紹..."
                rows="5"
                :disabled="isEditorRole"
              />
            </div>
            <div class="w-50 w-md-100 p-6">
              <FormInput
                label="招商推薦碼"
                v-model="form.referralCode"
                placeholder="輸入推薦碼後自動綁定推薦店家"
                :disabled="!isAdmin || isEditorRole || Boolean(form.activatedAt)"
              />
              <p class="se__hint m-t-4">
                {{
                  form.activatedAt
                    ? '店家已啟用成功，推薦來源已鎖定'
                    : '僅 Admin 可在啟用前調整推薦來源'
                }}
              </p>
            </div>
            <div class="w-50 w-md-100 p-6">
              <FormInput
                label="推薦來源店家"
                :modelValue="form.referrerStoreName || '-'"
                disabled
              />
            </div>
            <div class="w-50 w-md-100 p-6">
              <FormInput
                label="啟用成功時間"
                :modelValue="formatDateTime(form.activatedAt)"
                disabled
              />
            </div>
          </div>
        </div>

        <!-- ===== 媒體上傳 ===== -->
        <div class="se__section">
          <p class="se__section-title">媒體圖片</p>
          <div class="flex flex-wrap">
            <!-- Logo -->
            <div class="w-50 w-md-100 p-6">
              <p class="form__label">
                店家 Logo（建議尺寸 200×200px，最大 5MB）
              </p>
              <div class="se__upload-box" v-if="!isEditorRole">
                <img
                  v-if="form.logoUrl"
                  :src="form.logoUrl"
                  alt="logo preview"
                  class="se__upload-preview se__upload-preview--circle"
                />
                <label class="se__upload-label">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    class="se__upload-input"
                    @change="onLogoChange"
                  />
                  <MButton
                    type="button"
                    size="sm"
                    variant="secondary"
                    @click.prevent
                  >
                    {{ form.logoUrl ? '更換 Logo' : '上傳 Logo' }}
                  </MButton>
                </label>
                <span v-if="logoUploading" class="se__upload-hint"
                  >上傳中...</span
                >
                <span v-if="logoError" class="se__upload-error">{{
                  logoError
                }}</span>
              </div>
              <div v-else>
                <img
                  v-if="form.logoUrl"
                  :src="form.logoUrl"
                  alt="logo"
                  class="se__upload-preview se__upload-preview--circle"
                />
                <span v-else>-</span>
              </div>
            </div>

            <!-- Cover Image -->
            <div class="w-50 w-md-100 p-6">
              <p class="form__label">
                封面圖片（建議尺寸 1200×400px，最大 5MB）
              </p>
              <div class="se__upload-box" v-if="!isEditorRole">
                <img
                  v-if="form.coverImageUrl"
                  :src="form.coverImageUrl"
                  alt="cover preview"
                  class="se__upload-preview"
                />
                <label class="se__upload-label">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    class="se__upload-input"
                    @change="onCoverChange"
                  />
                  <MButton
                    type="button"
                    size="sm"
                    variant="secondary"
                    @click.prevent
                  >
                    {{ form.coverImageUrl ? '更換封面' : '上傳封面' }}
                  </MButton>
                </label>
                <span v-if="coverUploading" class="se__upload-hint"
                  >上傳中...</span
                >
                <span v-if="coverError" class="se__upload-error">{{
                  coverError
                }}</span>
              </div>
              <div v-else>
                <img
                  v-if="form.coverImageUrl"
                  :src="form.coverImageUrl"
                  alt="cover"
                  class="se__upload-preview"
                />
                <span v-else>-</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== 聯絡資訊 ===== -->
        <div class="se__section">
          <p class="se__section-title">聯絡資訊</p>
          <div class="flex flex-wrap">
            <div class="w-50 w-md-100 p-6">
              <FormInput
                label="店家 Email"
                v-model="form.email"
                :error="errors.email"
                placeholder="store@example.com"
                type="email"
                :disabled="isEditorRole"
              />
            </div>
            <div class="w-50 w-md-100 p-6">
              <FormInput
                label="店家電話"
                v-model="form.phone"
                :error="errors.phone"
                placeholder="02-12345678"
                :disabled="isEditorRole"
              />
            </div>
            <div class="w-100 p-6">
              <FormInput
                label="店家地址"
                v-model="form.address"
                :error="errors.address"
                placeholder="台北市..."
                :disabled="isEditorRole"
              />
            </div>
          </div>
        </div>

        <!-- ===== 社群連結 ===== -->
        <div class="se__section">
          <p class="se__section-title">社群連結</p>
          <div class="flex flex-wrap">
            <div class="w-50 w-md-100 p-6">
              <FormInput
                label="Facebook 頁面連結"
                v-model="form.facebookUrl"
                :error="errors.facebookUrl"
                placeholder="https://facebook.com/..."
                :disabled="isEditorRole"
              />
            </div>
            <div class="w-50 w-md-100 p-6">
              <FormInput
                label="Instagram 主頁連結"
                v-model="form.instagramUrl"
                :error="errors.instagramUrl"
                placeholder="https://instagram.com/..."
                :disabled="isEditorRole"
              />
            </div>
          </div>
        </div>

        <!-- ===== 營業時間 ===== -->
        <div class="se__section">
          <p class="se__section-title">營業時間</p>
          <div class="se__hours-grid">
            <div v-for="day in weekdays" :key="day.key" class="se__hours-row">
              <span class="se__hours-label">{{ day.label }}</span>
              <label class="se__hours-rest">
                <input
                  type="checkbox"
                  v-model="restDays[day.key]"
                  :disabled="isEditorRole"
                  @change="onRestToggle(day.key)"
                />
                休息
              </label>
              <input
                class="se__hours-input"
                v-model="businessHoursInput[day.key]"
                placeholder="10:00-21:00"
                :disabled="isEditorRole || restDays[day.key]"
              />
            </div>
          </div>
        </div>

        <!-- ===== Actions ===== -->
        <div class="flex justify-center gap-x-12 m-t-16" v-if="!isEditorRole">
          <MButton type="submit" :loading="saving">儲存變更</MButton>
          <MButton type="button" variant="secondary" @click="goBack"
            >取消</MButton
          >
        </div>
      </form>
    </template>
  </MCard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormInput from '@/components/common/FormInput.vue';

import { useDialogStore, useAuthStore } from '@/stores';
import { api } from '@/services/FrontAPI';
import { getStoreById, updateStore } from '@/services/adminStoreService';
import { openInfoDialog } from '@/utils/dialog/infoDialog';
import { formatDateTime as formatDateTimeUtil } from '@/utils/DateUtils';

/* ==============================
 * Router / Auth
 * ============================== */
const route = useRoute();
const router = useRouter();
const dialogStore = useDialogStore();
const authStore = useAuthStore();

const isProfileMode = computed(() => route.name === 'StoreProfile');
const isEditorRole = computed(() =>
  (authStore.user?.roles ?? []).includes('ROLE_STORE_EDITOR'),
);
const isAdmin = computed(() =>
  (authStore.user?.roles ?? []).includes('ROLE_ADMIN'),
);

const storeId = computed((): string => {
  if (isProfileMode.value) {
    return authStore.user?.storeId ?? authStore.user?.stores?.[0]?.id ?? '';
  }
  return String(route.params.id ?? '');
});

/* ==============================
 * Form state
 * ============================== */
const loading = ref(false);
const saving = ref(false);
const form = ref<any>({
  name: '',
  shortDescription: '',
  longDescription: '',
  logoUrl: '',
  coverImageUrl: '',
  email: '',
  phone: '',
  address: '',
  facebookUrl: '',
  instagramUrl: '',
  referralCode: '',
  referrerStoreName: '',
  activatedAt: '',
});

const errors = ref<Record<string, string>>({});

/* ==============================
 * Weekdays
 * ============================== */
const weekdays = [
  { key: 'mon', label: '週一' },
  { key: 'tue', label: '週二' },
  { key: 'wed', label: '週三' },
  { key: 'thu', label: '週四' },
  { key: 'fri', label: '週五' },
  { key: 'sat', label: '週六' },
  { key: 'sun', label: '週日' },
];

const businessHoursInput = ref<Record<string, string>>({
  mon: '',
  tue: '',
  wed: '',
  thu: '',
  fri: '',
  sat: '',
  sun: '',
});
const restDays = ref<Record<string, boolean>>({
  mon: false,
  tue: false,
  wed: false,
  thu: false,
  fri: false,
  sat: false,
  sun: false,
});

function onRestToggle(key: string) {
  if (restDays.value[key]) {
    businessHoursInput.value[key] = '';
  }
}

function parseBusinessHours(bh: Record<string, string> | null | undefined) {
  if (!bh) return;
  weekdays.forEach(({ key }) => {
    const val = bh[key] ?? '';
    if (val === '休息') {
      restDays.value[key] = true;
      businessHoursInput.value[key] = '';
    } else {
      restDays.value[key] = false;
      businessHoursInput.value[key] = val;
    }
  });
}

function buildBusinessHours(): Record<string, string> {
  const result: Record<string, string> = {};
  weekdays.forEach(({ key }) => {
    result[key] = restDays.value[key]
      ? '休息'
      : businessHoursInput.value[key] || '';
  });
  return result;
}

/* ==============================
 * Image upload
 * ============================== */
const logoUploading = ref(false);
const coverUploading = ref(false);
const logoError = ref('');
const coverError = ref('');

async function uploadImage(
  file: File,
  type: 'store-logo' | 'store-cover',
): Promise<string> {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('圖片大小不能超過 5MB');
  }
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post(`/admin/upload/${type}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return (res.data as any)?.imageUrl ?? (res.data as any)?.data?.imageUrl ?? '';
}

async function onLogoChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  logoError.value = '';
  logoUploading.value = true;
  try {
    form.value.logoUrl = await uploadImage(file, 'store-logo');
  } catch (err: any) {
    logoError.value = err?.message ?? '上傳失敗，請重試';
  } finally {
    logoUploading.value = false;
  }
}

async function onCoverChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  coverError.value = '';
  coverUploading.value = true;
  try {
    form.value.coverImageUrl = await uploadImage(file, 'store-cover');
  } catch (err: any) {
    coverError.value = err?.message ?? '上傳失敗，請重試';
  } finally {
    coverUploading.value = false;
  }
}

/* ==============================
 * Validation
 * ============================== */
function validate(): boolean {
  const e: Record<string, string> = {};
  if (!form.value.name?.trim()) e.name = '店家名稱為必填';
  if (!form.value.shortDescription?.trim())
    e.shortDescription = '簡短描述為必填';
  if ((form.value.shortDescription?.length ?? 0) > 100)
    e.shortDescription = '簡短描述最多 100 字';
  if (form.value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email))
    e.email = 'Email 格式不正確';
  if (form.value.facebookUrl && !/^https?:\/\//.test(form.value.facebookUrl))
    e.facebookUrl = '請輸入有效的 URL（以 https:// 開頭）';
  if (form.value.instagramUrl && !/^https?:\/\//.test(form.value.instagramUrl))
    e.instagramUrl = '請輸入有效的 URL（以 https:// 開頭）';
  errors.value = e;
  return Object.keys(e).length === 0;
}

function formatDateTime(val: any): string {
  if (!val) return '-';
  return formatDateTimeUtil(val, 'YYYY/MM/DD HH:mm:ss') || String(val);
}

/* ==============================
 * Load
 * ============================== */
const loadStore = async () => {
  if (!storeId.value) return;
  loading.value = true;
  try {
    const res = await getStoreById(storeId.value);
    const d = (res as any)?.data ?? res;
    Object.assign(form.value, {
      name: d.storeName ?? d.name ?? '',
      shortDescription: d.shortDescription ?? '',
      longDescription: d.longDescription ?? '',
      logoUrl: d.logoUrl ?? '',
      coverImageUrl: d.coverImageUrl ?? '',
      email: d.email ?? '',
      phone: d.phone ?? '',
      address: d.address ?? '',
      facebookUrl: d.facebookUrl ?? '',
      instagramUrl: d.instagramUrl ?? '',
      referralCode: d.referralCode ?? '',
      referrerStoreName: d.referrerStoreName ?? '',
      activatedAt: d.activatedAt ?? '',
    });
    parseBusinessHours(d.businessHours);
  } catch {
    openInfoDialog({
      title: '提示訊息',
      message: '載入店家資料失敗',
      iconType: 'warning',
    });
  } finally {
    loading.value = false;
  }
};

/* ==============================
 * Save
 * ============================== */
const submitForm = async () => {
  if (isEditorRole.value) return;
  if (!validate()) return;

  saving.value = true;
  try {
    await updateStore(storeId.value, {
      ...form.value,
      storeName: form.value.name,
      businessHours: buildBusinessHours(),
    });
    await openInfoDialog({
      title: '提示訊息',
      message: '店家資訊已更新',
      iconType: 'success',
    });
  } catch {
    openInfoDialog({
      title: '提示訊息',
      message: '儲存失敗，請重試',
      iconType: 'warning',
    });
  } finally {
    saving.value = false;
  }
};

/* ==============================
 * Navigation
 * ============================== */
const goBack = () => {
  if (isProfileMode.value) {
    router.push({ name: 'StoreDetail', params: { id: storeId.value } });
  } else {
    router.push({ name: 'StoreDetail', params: { id: storeId.value } });
  }
};

/* ==============================
 * Lifecycle
 * ============================== */
onMounted(loadStore);
</script>

<style scoped lang="scss">
.se {
  &__loading {
    padding: 24px;
    text-align: center;
    color: #6b7280;
  }

  &__readonly-banner {
    background: #fff7ed;
    border: 1px solid #fed7aa;
    color: #9a3412;
    font-size: 14px;
    font-weight: 600;
    padding: 12px 20px;
    border-radius: 6px;
    margin-bottom: 12px;
    text-align: center;
  }

  &__section {
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid #e5e7eb;
  }

  &__section-title {
    font-size: 15px;
    font-weight: 700;
    color: #374151;
    margin-bottom: 12px;
  }

  &__textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    box-sizing: border-box;
    resize: vertical;

    &:focus {
      outline: none;
      border-color: #6366f1;
    }

    &:disabled {
      background: #f9fafb;
      color: #9ca3af;
    }
  }

  &__char-count-wrapper {
    position: relative;
  }

  &__char-count {
    font-size: 12px;
    color: #6b7280;
    text-align: right;
    display: block;

    &--over {
      color: #dc2626;
      font-weight: 700;
    }
  }

  &__hint {
    font-size: 12px;
    color: #6b7280;
    line-height: 1.5;
  }

  /* Image upload */
  &__upload-box {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__upload-preview {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid #e5e7eb;

    &--circle {
      border-radius: 50%;
    }
  }

  &__upload-label {
    cursor: pointer;
  }

  &__upload-input {
    display: none;
  }

  &__upload-hint {
    font-size: 13px;
    color: #6b7280;
  }

  &__upload-error {
    font-size: 13px;
    color: #dc2626;
  }

  /* Business hours */
  &__hours-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 520px;
  }

  &__hours-row {
    display: grid;
    grid-template-columns: 48px 72px 1fr;
    align-items: center;
    gap: 12px;
  }

  &__hours-label {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }

  &__hours-rest {
    font-size: 13px;
    color: #6b7280;
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }

  &__hours-input {
    padding: 6px 10px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 13px;

    &:disabled {
      background: #f3f4f6;
      color: #9ca3af;
    }

    &:focus {
      outline: none;
      border-color: #6366f1;
    }
  }
}
</style>

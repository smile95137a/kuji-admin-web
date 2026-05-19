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
                      :required="!isEdit"
                      :disabled="isEdit"
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
        <Tab v-if="isOwnerFormMode && !isDetail" name="store">
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

                    <div class="w-100 p-6">
                      <BusinessHoursStructuredEditor
                        v-model="businessHoursStructured"
                        :error="displayErrors.businessHoursStructured"
                      />
                    </div>
                  </div>
                </div>
              </FormSection>
            </div>

            <div class="admin-user-form__right">
              <FormSection title="店家 Logo">
                <div class="admin-user-form__image-card">
                  <div class="admin-user-form__image-main-block">
                    <div class="admin-user-form__image-main-wrap">
                      <button
                        type="button"
                        class="admin-user-form__image-upload admin-user-form__image-upload--logo"
                        :class="{
                          'admin-user-form__image-upload--empty':
                            !logoImagePreview,
                        }"
                        :disabled="logoUploading || logoCropping"
                        @click="triggerLogoUpload"
                      >
                        <img
                          v-if="logoImagePreview"
                          :src="logoImagePreview"
                          alt="店家 Logo 預覽"
                          class="admin-user-form__image"
                        />

                        <div v-else class="admin-user-form__empty-image">
                          <font-awesome-icon :icon="['fas', 'image']" />
                          <span>點擊上傳店家 Logo</span>
                          <small>建議比例 1:1</small>
                        </div>
                      </button>

                      <button
                        v-if="logoUrl"
                        type="button"
                        class="admin-user-form__image-remove"
                        :disabled="logoUploading || logoCropping"
                        aria-label="清除 Logo"
                        @click.stop="clearLogoImage"
                      >
                        <font-awesome-icon
                          :icon="['fas', 'xmark']"
                          class="admin-user-form__image-remove-icon"
                        />
                      </button>
                    </div>

                    <p v-if="displayErrors.logoUrl" class="error-text m-t-8">
                      {{ displayErrors.logoUrl }}
                    </p>

                    <p class="admin-user-form__image-hint">
                      圖片會自動裁切成 1:1，適合店家頭像與清單 Logo 使用。
                    </p>
                  </div>

                  <input
                    ref="logoFileInput"
                    class="admin-user-form__hidden-input"
                    type="file"
                    accept="image/*"
                    :disabled="logoUploading || logoCropping"
                    @change="onLogoFileChange"
                  />
                </div>
              </FormSection>

              <FormSection title="店家封面圖片">
                <div class="admin-user-form__image-card">
                  <div class="admin-user-form__image-main-block">
                    <div class="admin-user-form__image-main-wrap">
                      <button
                        type="button"
                        class="admin-user-form__image-upload"
                        :class="{
                          'admin-user-form__image-upload--empty':
                            !coverImagePreview,
                        }"
                        :disabled="coverUploading || coverCropping"
                        @click="triggerCoverUpload"
                      >
                        <img
                          v-if="coverImagePreview"
                          :src="coverImagePreview"
                          alt="店家封面預覽"
                          class="admin-user-form__image"
                        />

                        <div v-else class="admin-user-form__empty-image">
                          <font-awesome-icon :icon="['fas', 'image']" />
                          <span>點擊上傳店家封面圖片</span>
                          <small>建議比例 16:9</small>
                        </div>
                      </button>

                      <button
                        v-if="coverImageUrl"
                        type="button"
                        class="admin-user-form__image-remove"
                        :disabled="coverUploading || coverCropping"
                        aria-label="清除封面圖片"
                        @click.stop="clearCoverImage"
                      >
                        <font-awesome-icon
                          :icon="['fas', 'xmark']"
                          class="admin-user-form__image-remove-icon"
                        />
                      </button>
                    </div>

                    <p
                      v-if="displayErrors.coverImageUrl"
                      class="error-text m-t-8"
                    >
                      {{ displayErrors.coverImageUrl }}
                    </p>

                    <p class="admin-user-form__image-hint">
                      圖片會自動裁切成 16:9，適合店家列表與詳情頁封面使用。
                    </p>
                  </div>

                  <input
                    ref="coverFileInput"
                    class="admin-user-form__hidden-input"
                    type="file"
                    accept="image/*"
                    :disabled="coverUploading || coverCropping"
                    @change="onCoverFileChange"
                  />
                </div>
              </FormSection>

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
        <Tab v-if="isEditorFormMode && !isDetail" name="stores">
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
              <FormSection v-if="detailStore" title="店家資訊">
                <div class="admin-user-form__card">
                  <div class="admin-user-form__detail-list">
                    <div class="admin-user-form__detail-item">
                      <span class="admin-user-form__detail-label">店家名稱</span>
                      <span class="admin-user-form__detail-value">
                        {{ detailStore?.storeName || '-' }}
                      </span>
                    </div>

                    <div class="admin-user-form__detail-item">
                      <span class="admin-user-form__detail-label">商品數</span>
                      <span class="admin-user-form__detail-value">
                        {{ detailProductCountText }}
                      </span>
                    </div>

                    <div class="admin-user-form__detail-item">
                      <span class="admin-user-form__detail-label">店家狀態</span>
                      <span class="admin-user-form__detail-value">
                        {{ detailStoreStatusText }}
                      </span>
                    </div>

                    <div class="admin-user-form__detail-item">
                      <span class="admin-user-form__detail-label">店家電話</span>
                      <span class="admin-user-form__detail-value">
                        {{ detailStore?.phone || '-' }}
                      </span>
                    </div>

                    <div class="admin-user-form__detail-item">
                      <span class="admin-user-form__detail-label">店家 Email</span>
                      <span class="admin-user-form__detail-value">
                        {{ detailStore?.email || '-' }}
                      </span>
                    </div>

                    <div class="admin-user-form__detail-item">
                      <span class="admin-user-form__detail-label">店家地址</span>
                      <span class="admin-user-form__detail-value">
                        {{ detailStore?.address || '-' }}
                      </span>
                    </div>

                    <div class="admin-user-form__detail-item">
                      <span class="admin-user-form__detail-label">短描述</span>
                      <span class="admin-user-form__detail-value">
                        {{ detailStore?.shortDescription || '-' }}
                      </span>
                    </div>

                    <div class="admin-user-form__detail-item">
                      <span class="admin-user-form__detail-label">社群連結</span>
                      <span class="admin-user-form__detail-value">
                        {{
                          [
                            detailStore?.facebookUrl,
                            detailStore?.instagramUrl,
                            detailStore?.lineId,
                          ]
                            .filter(Boolean)
                            .join(' / ') || '-'
                        }}
                      </span>
                    </div>

                    <div class="admin-user-form__detail-item">
                      <span class="admin-user-form__detail-label">營業時間</span>
                      <span class="admin-user-form__detail-value">
                        {{ detailBusinessHoursLines.join('\n') }}
                      </span>
                    </div>
                  </div>
                </div>
              </FormSection>

              <FormSection v-if="detailStore" title="小編名單">
                <div class="admin-user-form__card">
                  <div v-if="detailEditors.length" class="admin-user-form__detail-list">
                    <div
                      v-for="editor in detailEditors"
                      :key="editor.id"
                      class="admin-user-form__detail-item"
                    >
                      <span class="admin-user-form__detail-label">
                        {{ editor.displayName || editor.email || editor.id }}
                      </span>
                      <span class="admin-user-form__detail-value">
                        {{ [editor.email, editor.phone].filter(Boolean).join(' / ') || '-' }}
                      </span>
                    </div>
                  </div>

                  <p v-else class="admin-user-form__empty">目前沒有綁定小編。</p>
                </div>
              </FormSection>

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
            v-if="isOwnerFormMode && activeTab === 'account'"
            type="button"
            @click="goNextTab"
          >
            下一步
          </MButton>

          <MButton
            v-if="isOwnerFormMode && activeTab === 'store'"
            type="button"
            class="mbtn--gray"
            @click="activeTab = 'account'"
          >
            上一步
          </MButton>

          <MButton type="submit" :disabled="isImageProcessing">
            <font-awesome-icon icon="fa-floppy-disk" class="m-r-4" />
            {{ submitButtonText }}
          </MButton>

          <MButton type="button" class="mbtn--gray" @click="resetFormValues">
            清除
          </MButton>
        </template>

        <template v-else>
          <MButton type="button" @click="goToEdit">
            編輯
          </MButton>

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
import BusinessHoursStructuredEditor from '@/components/store/BusinessHoursStructuredEditor.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { openInfoDialog } from '@/utils/dialog/infoDialog';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openImageCropDialog } from '@/utils/dialog/openImageCropDialog';

import {
  createStoreOwner,
  createStoreEditor,
  getAdminUserById,
  getAdminUsersByStore,
  updateAdminUser,
  activateAdminUser,
  deactivateAdminUser,
  resetAdminUserPassword,
  deleteAdminUser,
} from '@/services/adminUserService';

import { getStoreOptions, getStoreById, updateStore } from '@/services/adminStoreService';
import {
  uploadStoreCoverImage,
  uploadStoreLogoImage,
} from '@/services/adminUploadService';

type AdminUserMode =
  | 'add-owner'
  | 'add-editor'
  | 'edit-owner'
  | 'edit-editor'
  | 'detail';

interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
  description?: string;
}

type WeekDay = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

interface BusinessHourSchedule {
  day: WeekDay;
  open?: string;
  close?: string;
  closed: boolean;
}

interface BusinessHoursStructured {
  schedules: BusinessHourSchedule[];
  exceptions?: Array<Record<string, any>>;
  tz?: string;
}

const LIST_PATH = '/home/admin-users';

const route = useRoute();
const router = useRouter();

const routeAction = computed(() => String(route.params.action || ''));

const mode = computed<AdminUserMode>(() => {
  if (routeAction.value === 'add-owner') return 'add-owner';
  if (routeAction.value === 'add-editor') return 'add-editor';
  if (routeAction.value === 'edit-owner') return 'edit-owner';
  if (routeAction.value === 'edit-editor') return 'edit-editor';
  if (routeAction.value === 'detail') return 'detail';

  return 'detail';
});

const isValidAction = computed(() =>
  ['add-owner', 'add-editor', 'edit-owner', 'edit-editor', 'detail'].includes(
    routeAction.value,
  ),
);

const isDetail = computed(() => mode.value === 'detail');
const isEdit = computed(() =>
  ['edit-owner', 'edit-editor'].includes(mode.value),
);
const isOwnerFormMode = computed(() =>
  ['add-owner', 'edit-owner'].includes(mode.value),
);
const isEditorFormMode = computed(() =>
  ['add-editor', 'edit-editor'].includes(mode.value),
);
const userId = computed(() => String(route.params.id || ''));

const pageTitle = computed(() => {
  if (mode.value === 'add-owner') return '新增店家負責人帳號';
  if (mode.value === 'add-editor') return '新增店家編輯帳號';
  if (mode.value === 'edit-owner') return '編輯店家負責人帳號';
  if (mode.value === 'edit-editor') return '編輯店家編輯帳號';

  return '帳號詳情';
});

const submitButtonText = computed(() => {
  if (mode.value === 'add-owner') return '建立負責人';
  if (mode.value === 'add-editor') return '建立編輯';
  if (mode.value === 'edit-owner') return '更新負責人';
  if (mode.value === 'edit-editor') return '更新編輯';

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

  if (isOwnerFormMode.value) {
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
  businessHoursStructured: 'store',
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
  if (isOwnerFormMode.value) {
    activeTab.value = 'store';
    return;
  }

  if (isEditorFormMode.value) {
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

const weekDays: WeekDay[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const createDefaultBusinessHoursStructured = (): BusinessHoursStructured => ({
  schedules: weekDays.map((day) => ({
    day,
    open: ['MON', 'TUE', 'WED', 'THU', 'FRI'].includes(day) ? '10:00' : '',
    close: ['MON', 'TUE', 'WED', 'THU', 'FRI'].includes(day) ? '18:00' : '',
    closed: ['SAT', 'SUN'].includes(day),
  })),
  exceptions: [],
  tz: 'Asia/Taipei',
});

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const normalizeBusinessHoursStructured = (
  value: any,
): BusinessHoursStructured => {
  const fallback = createDefaultBusinessHoursStructured();
  const source = value && typeof value === 'object' ? value : fallback;
  const scheduleMap = new Map<WeekDay, Partial<BusinessHourSchedule>>(
    (Array.isArray(source.schedules) ? source.schedules : []).map((item: any) => [
      item?.day as WeekDay,
      item as Partial<BusinessHourSchedule>,
    ]),
  );

  return {
    schedules: weekDays.map((day) => {
      const existing = scheduleMap.get(day);
      return {
        day,
        open: existing?.open ?? '',
        close: existing?.close ?? '',
        closed: existing?.closed ?? false,
      };
    }),
    exceptions: Array.isArray(source.exceptions) ? source.exceptions : [],
    tz: String(source.tz || 'Asia/Taipei').trim() || 'Asia/Taipei',
  };
};

const serializeBusinessHoursStructured = (
  value: any,
): BusinessHoursStructured => {
  const normalized = normalizeBusinessHoursStructured(value);

  return {
    ...normalized,
    schedules: normalized.schedules.map((schedule) => ({
      ...schedule,
      open: schedule.closed ? null : normalizeText(schedule.open) || null,
      close: schedule.closed ? null : normalizeText(schedule.close) || null,
    })),
    exceptions: (normalized.exceptions || []).map((item: any) => ({
      ...item,
      open: normalizeText(item?.open) || null,
      close: normalizeText(item?.close) || null,
    })),
  };
};

const hasValidBusinessHoursStructured = (value: any) => {
  const normalized = normalizeBusinessHoursStructured(value);

  return normalized.schedules.every((schedule) => {
    if (schedule.closed) return true;
    return (
      timePattern.test(String(schedule.open ?? '')) &&
      timePattern.test(String(schedule.close ?? ''))
    );
  });
};

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
  businessHoursStructured: createDefaultBusinessHoursStructured(),
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
      businessHoursStructured: yup.mixed().nullable(),
      facebookUrl: yup.string().nullable(),
      instagramUrl: yup.string().nullable(),
      lineId: yup.string().nullable(),
    });
  }

  const common = {
    email: isEdit.value
      ? yup.string().nullable()
      : yup
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

  if (isEditorFormMode.value) {
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
      businessHoursStructured: yup.mixed().nullable(),
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
      .required('請上傳店家 Logo')
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

    businessHoursStructured: yup
      .mixed<BusinessHoursStructured>()
      .required('營業時間不可為空')
      .test(
        'business-hours-structured',
        '請填完整的開始與結束時間',
        hasValidBusinessHoursStructured,
      ),

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
const [businessHoursStructured] = defineField('businessHoursStructured');
const [facebookUrl] = defineField('facebookUrl');
const [instagramUrl] = defineField('instagramUrl');
const [lineId] = defineField('lineId');

/* ==============================
 * Image upload
 * ============================== */
const logoFileInput = ref<HTMLInputElement | null>(null);
const coverFileInput = ref<HTMLInputElement | null>(null);

const logoImagePreview = ref('');
const coverImagePreview = ref('');

const logoUploading = ref(false);
const logoCropping = ref(false);
const coverUploading = ref(false);
const coverCropping = ref(false);

const isImageProcessing = computed(
  () =>
    logoUploading.value ||
    logoCropping.value ||
    coverUploading.value ||
    coverCropping.value,
);

const triggerLogoUpload = () => {
  if (logoUploading.value || logoCropping.value) return;
  logoFileInput.value?.click();
};

const triggerCoverUpload = () => {
  if (coverUploading.value || coverCropping.value) return;
  coverFileInput.value?.click();
};

const onLogoFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  input.value = '';

  if (!file) return;

  await handleSelectedLogoFile(file);
};

const onCoverFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  input.value = '';

  if (!file) return;

  await handleSelectedCoverFile(file);
};

const clearLogoImage = () => {
  logoUrl.value = '';
  logoImagePreview.value = '';
};

const clearCoverImage = () => {
  coverImageUrl.value = '';
  coverImagePreview.value = '';
};

const validateImageFile = async (file: File) => {
  const maxSize = 5 * 1024 * 1024;

  if (file.size > maxSize) {
    return '圖片大小不可超過 5MB';
  }

  if (!file.type.startsWith('image/')) {
    return '請選擇圖片檔案';
  }

  return '';
};

const handleSelectedLogoFile = async (file: File) => {
  const errorMessage = await validateImageFile(file);

  if (errorMessage) {
    await openInfoDialog({
      title: '提示訊息',
      message: errorMessage,
      iconType: 'warning',
    });

    return;
  }

  const objectUrl = URL.createObjectURL(file);
  const baseName = file.name.replace(/\.(png|jpg|jpeg|webp)$/i, '');
  const croppedFileName = `${baseName}-logo-cropped.jpg`;

  try {
    logoCropping.value = true;

    const croppedFile = await openImageCropDialog({
      src: objectUrl,
      title: '裁切店家 Logo',
      hint: '請裁切成 1:1 正方形圖片',
      aspectRatio: 1,
      outputWidth: 600,
      mimeType: 'image/jpeg',
      quality: 0.9,
      fileName: croppedFileName,
    });

    if (!croppedFile) return;

    await uploadCroppedLogoImage(croppedFile);
  } finally {
    logoCropping.value = false;
    URL.revokeObjectURL(objectUrl);
  }
};

const handleSelectedCoverFile = async (file: File) => {
  const errorMessage = await validateImageFile(file);

  if (errorMessage) {
    await openInfoDialog({
      title: '提示訊息',
      message: errorMessage,
      iconType: 'warning',
    });

    return;
  }

  const objectUrl = URL.createObjectURL(file);
  const baseName = file.name.replace(/\.(png|jpg|jpeg|webp)$/i, '');
  const croppedFileName = `${baseName}-cover-cropped.jpg`;

  try {
    coverCropping.value = true;

    const croppedFile = await openImageCropDialog({
      src: objectUrl,
      title: '裁切店家封面圖片',
      hint: '請裁切成 16:9 圖片比例',
      aspectRatio: 16 / 9,
      outputWidth: 1200,
      mimeType: 'image/jpeg',
      quality: 0.9,
      fileName: croppedFileName,
    });

    if (!croppedFile) return;

    await uploadCroppedCoverImage(croppedFile);
  } finally {
    coverCropping.value = false;
    URL.revokeObjectURL(objectUrl);
  }
};

const uploadCroppedLogoImage = async (file: File) => {
  logoUploading.value = true;

  await executeApi<{ imageUrl: string }>({
    fn: async () => uploadStoreLogoImage(file),
    onSuccess: async (res: any) => {
      const url = res?.imageUrl || res?.data?.imageUrl || '';

      if (!url) {
        await openInfoDialog({
          title: '提示訊息',
          message: '上傳成功但未取得 imageUrl，請檢查後端回傳格式',
          iconType: 'warning',
        });

        return;
      }

      logoUrl.value = url;
      logoImagePreview.value = url;

      await openInfoDialog({
        title: '提示訊息',
        message: 'Logo 上傳成功',
        iconType: 'success',
      });
    },
    onFinally: async () => {
      logoUploading.value = false;
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

const uploadCroppedCoverImage = async (file: File) => {
  coverUploading.value = true;

  await executeApi<{ imageUrl: string }>({
    fn: async () => uploadStoreCoverImage(file),
    onSuccess: async (res: any) => {
      const url = res?.imageUrl || res?.data?.imageUrl || '';

      if (!url) {
        await openInfoDialog({
          title: '提示訊息',
          message: '上傳成功但未取得 imageUrl，請檢查後端回傳格式',
          iconType: 'warning',
        });

        return;
      }

      coverImageUrl.value = url;
      coverImagePreview.value = url;

      await openInfoDialog({
        title: '提示訊息',
        message: '封面圖片上傳成功',
        iconType: 'success',
      });
    },
    onFinally: async () => {
      coverUploading.value = false;
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

/* ==============================
 * Detail
 * ============================== */
const detail = ref<any>(null);
const editableStoreId = ref('');
const detailStore = ref<any>(null);
const detailEditors = ref<any[]>([]);

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

const detailStoreStatusText = computed(() => {
  const status = detailStore.value?.status;
  if (status === 'ACTIVE') return '啟用';
  if (status === 'INACTIVE') return '停用';
  return status ? String(status) : '-';
});

const detailProductCountText = computed(() => {
  const count = Number(detailStore.value?.productCount ?? 0);
  return Number.isFinite(count) ? String(count) : '0';
});

const detailBusinessHoursLines = computed(() => {
  const source = detailStore.value?.businessHoursStructured;
  const schedules = Array.isArray(source?.schedules) ? source.schedules : [];
  const labels: Record<string, string> = {
    MON: '週一',
    TUE: '週二',
    WED: '週三',
    THU: '週四',
    FRI: '週五',
    SAT: '週六',
    SUN: '週日',
  };

  if (!schedules.length) {
    const text = String(detailStore.value?.businessHours ?? '').trim();
    return text ? [text] : ['-'];
  }

  return ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => {
    const item = schedules.find((schedule: any) => schedule?.day === day);
    if (!item || item.closed) return `${labels[day]}：公休`;
    return `${labels[day]}：${item.open || '-'} - ${item.close || '-'}`;
  });
});

const reloadDetail = async () => {
  if ((!isDetail.value && !isEdit.value) || !userId.value) return;

  await executeApi({
    fn: async () => getAdminUserById(userId.value),
    onSuccess: async (res: any) => {
      const data = res?.data ?? res;

      detail.value = data;
      editableStoreId.value = '';
      detailStore.value = null;
      detailEditors.value = [];

      const currentStoreIds = Array.isArray(data?.stores)
        ? data.stores
            .map((store: any) => String(store?.id || '').trim())
            .filter(Boolean)
        : [];

      const isOwnerRole = Array.isArray(data?.roles)
        ? data.roles.some((role: any) => role?.code === 'ROLE_STORE_OWNER')
        : false;

      setValues(
        {
          email: data?.email ?? '',
          displayName: data?.displayName ?? '',
          phone: data?.phone ?? '',
          remark: data?.remark ?? '',
          storeIds: currentStoreIds,

          storeName: '',
          shortDescription: '',
          longDescription: '',
          logoUrl: '',
          coverImageUrl: '',
          storeEmail: '',
          storePhone: '',
          storeAddress: '',
          businessHoursStructured: createDefaultBusinessHoursStructured(),
          facebookUrl: '',
          instagramUrl: '',
          lineId: '',
        },
        false,
      );

      logoImagePreview.value = '';
      coverImagePreview.value = '';

      if (currentStoreIds.length > 0) {
        const storeRes = await getStoreById(currentStoreIds[0]);
        const storeData = storeRes?.data ?? storeRes;
        detailStore.value = storeData;
        editableStoreId.value = String(storeData?.id ?? currentStoreIds[0]);
        logoImagePreview.value = storeData?.logoUrl ?? '';
        coverImagePreview.value = storeData?.coverImageUrl ?? '';

        const editorsRes = await getAdminUsersByStore(currentStoreIds[0]);
        const editorItems = Array.isArray(editorsRes?.data)
          ? editorsRes.data
          : Array.isArray(editorsRes)
            ? editorsRes
            : [];
        detailEditors.value = editorItems.filter((item: any) =>
          Array.isArray(item?.roles)
            ? item.roles.some((role: any) => role?.code === 'ROLE_STORE_EDITOR')
            : false,
        );

        if (isOwnerRole) {
        setValues(
          {
            email: data?.email ?? '',
            displayName: data?.displayName ?? '',
            phone: data?.phone ?? '',
            remark: data?.remark ?? '',
            storeIds: currentStoreIds,
            storeName: storeData?.storeName ?? '',
            shortDescription: storeData?.shortDescription ?? '',
            longDescription: storeData?.longDescription ?? '',
            logoUrl: storeData?.logoUrl ?? '',
            coverImageUrl: storeData?.coverImageUrl ?? '',
            storeEmail: storeData?.email ?? '',
            storePhone: storeData?.phone ?? '',
            storeAddress: storeData?.address ?? '',
            businessHoursStructured: normalizeBusinessHoursStructured(
              storeData?.businessHoursStructured,
            ),
            facebookUrl: storeData?.facebookUrl ?? '',
            instagramUrl: storeData?.instagramUrl ?? '',
            lineId: storeData?.lineId ?? '',
          },
          false,
        );
        }
      }
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

const buildAccountPayload = (values: any) => ({
  displayName: normalizeText(values.displayName),
  phone: emptyToNull(values.phone),
  remark: emptyToNull(values.remark),
});

const buildStorePayload = (values: any) => ({
  storeName: normalizeText(values.storeName),
  shortDescription: normalizeText(values.shortDescription),
  longDescription: emptyToNull(values.longDescription),
  logoUrl: normalizeText(values.logoUrl),
  coverImageUrl: emptyToNull(values.coverImageUrl),
  email: normalizeText(values.storeEmail),
  phone: normalizeText(values.storePhone),
  address: normalizeText(values.storeAddress),
  businessHoursStructured: serializeBusinessHoursStructured(
    values.businessHoursStructured,
  ),
  facebookUrl: emptyToNull(values.facebookUrl),
  instagramUrl: emptyToNull(values.instagramUrl),
  lineId: emptyToNull(values.lineId),
});

const buildOwnerPayload = (values: any) => ({
  email: normalizeText(values.email),
  ...buildAccountPayload(values),
  storeName: normalizeText(values.storeName),
  shortDescription: normalizeText(values.shortDescription),
  longDescription: emptyToNull(values.longDescription),
  logoUrl: normalizeText(values.logoUrl),
  coverImageUrl: emptyToNull(values.coverImageUrl),
  storeEmail: normalizeText(values.storeEmail),
  storePhone: normalizeText(values.storePhone),
  storeAddress: normalizeText(values.storeAddress),
  businessHoursStructured: serializeBusinessHoursStructured(
    values.businessHoursStructured,
  ),
  facebookUrl: emptyToNull(values.facebookUrl),
  instagramUrl: emptyToNull(values.instagramUrl),
  lineId: emptyToNull(values.lineId),
});

const buildEditorPayload = (values: any) => ({
  storeIds: Array.isArray(values.storeIds) ? values.storeIds : [],
  email: normalizeText(values.email),
  ...buildAccountPayload(values),
});

/* ==============================
 * Submit
 * ============================== */
const onSubmit = handleSubmit(
  async (values) => {
    isSubmitted.value = true;

    if (isDetail.value) return;

    if (isImageProcessing.value) {
      await openInfoDialog({
        title: '提示訊息',
        message: logoCropping.value
          ? 'Logo 裁切中，請先完成裁切再送出'
          : logoUploading.value
            ? 'Logo 上傳中，請稍後再送出'
            : coverCropping.value
              ? '封面圖片裁切中，請先完成裁切再送出'
              : '封面圖片上傳中，請稍後再送出',
        iconType: 'warning',
      });

      return;
    }

    const ok = await openConfirmDialog({
      title: '儲存確認',
      message:
        mode.value === 'add-owner'
          ? '確定要建立店家負責人帳號嗎？'
          : mode.value === 'add-editor'
            ? '確定要建立店家編輯帳號嗎？'
            : mode.value === 'edit-owner'
              ? '確定要更新店家負責人資料嗎？'
              : '確定要更新店家編輯資料嗎？',
    });

    if (!ok) return;

    await executeApi({
      fn: async () => {
        if (mode.value === 'add-owner') {
          return createStoreOwner(buildOwnerPayload(values));
        }

        if (mode.value === 'add-editor') {
          return createStoreEditor(buildEditorPayload(values));
        }

        if (!userId.value) {
          throw new Error('缺少使用者 ID');
        }

        if (mode.value === 'edit-owner') {
          if (!editableStoreId.value) {
            throw new Error('缺少店家 ID');
          }

          await updateAdminUser(userId.value, buildAccountPayload(values));
          return updateStore(editableStoreId.value, buildStorePayload(values));
        }

        return updateAdminUser(userId.value, {
          ...buildAccountPayload(values),
          storeIds: Array.isArray(values.storeIds) ? values.storeIds : [],
        });
      },
      onSuccess: async () => {
        await openInfoDialog({
          title: '提示訊息',
          message:
            mode.value === 'add-owner'
              ? `建立店家負責人成功，初始密碼已發送至 ${values.email}`
              : mode.value === 'add-editor'
                ? `建立店家編輯成功，初始密碼已發送至 ${values.email}`
                : mode.value === 'edit-owner'
                  ? '店家負責人資料已更新'
                  : '店家編輯資料已更新',
          iconType: 'success',
        });

        if (isEdit.value && userId.value) {
          router.push(`/home/admin-users/form/detail/${userId.value}`);
          return;
        }

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
    onSuccess: async () => {
      await openInfoDialog({
        title: '重設成功',
        message: '密碼已重設，臨時密碼已發送至用戶 Email。',
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
const goToEdit = () => {
  if (!detail.value?.id) return;

  const roles = Array.isArray(detail.value?.roles) ? detail.value.roles : [];
  const hasOwnerRole = roles.some((role: any) => role?.code === 'ROLE_STORE_OWNER');
  const action = hasOwnerRole ? 'edit-owner' : 'edit-editor';

  router.push(`/home/admin-users/form/${action}/${detail.value.id}`);
};

const resetFormValues = async () => {
  if (isDetail.value || isEdit.value) {
    await reloadDetail();
    activeTab.value = isDetail.value ? 'detail' : 'account';
    return;
  }

  resetForm({
    values: {
      ...initialValues,
      storeIds: [],
    },
  });

  logoImagePreview.value = '';
  coverImagePreview.value = '';
  activeTab.value = 'account';
  isSubmitted.value = false;
};

const goBack = () => {
  if (isEdit.value && userId.value) {
    router.push(`/home/admin-users/form/detail/${userId.value}`);
    return;
  }

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

  if ((isDetail.value || isEdit.value) && !userId.value) {
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
  logoImagePreview.value = '';
  coverImagePreview.value = '';

  if (isEditorFormMode.value) {
    activeTab.value = 'account';
    await loadStoreOptions();
    if (isEdit.value) {
      await reloadDetail();
    }
    return;
  }

  if (isOwnerFormMode.value) {
    activeTab.value = 'account';
    if (isEdit.value) {
      await reloadDetail();
    }
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

  &__card,
  &__image-card {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    padding: 14px;
    border: 1px solid color.mix($form-border, #fff, 72%);
    border-radius: 14px;
    background: $form-bg;
  }

  &__image-card {
    overflow: hidden;
  }

  &__image-main-block {
    width: 100%;
    min-width: 0;
  }

  &__image-main-wrap {
    position: relative;
    width: 100%;
    min-width: 0;
  }

  &__image-upload {
    position: relative;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border: 1px dashed $form-border;
    border-radius: 14px;
    background: color.mix($form-border, #fff, 28%);
    cursor: pointer;
    padding: 0;
    line-height: 0;
    transition:
      border-color 0.15s ease,
      background-color 0.15s ease,
      transform 0.12s ease;

    &:hover:not(:disabled) {
      border-color: $brand;
      background: $brand-light;
    }

    &:active:not(:disabled) {
      transform: scale(0.995);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.65;
    }

    &--empty {
      align-items: center;
      justify-content: center;
      line-height: normal;
    }

    &--logo {
      max-width: 220px;
      aspect-ratio: 1 / 1;
      margin: 0 auto;
    }
  }

  &__image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  &__empty-image {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    padding: 12px;
    color: $form-muted;
    text-align: center;

    svg {
      color: $brand;
      font-size: 26px;
      opacity: 0.85;
    }

    span {
      color: $form-text;
      font-size: 13px;
      font-weight: 700;
    }

    small {
      color: $form-muted;
      font-size: 12px;
      line-height: 1.4;
    }
  }

  &__image-remove {
    position: absolute;
    top: -8px;
    right: -8px;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: 0;
    border-radius: 999px;
    background: $danger;
    color: #fff;
    cursor: pointer;
    box-shadow: 0 6px 16px rgba($ink-900, 0.18);
    transition:
      background-color 0.12s ease,
      transform 0.12s ease,
      opacity 0.12s ease;

    &:hover {
      background: color.adjust($danger, $lightness: -6%);
      transform: scale(1.06);
    }

    &:active {
      background: color.adjust($danger, $lightness: -12%);
      transform: scale(0.96);
    }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      transform: none;
    }
  }

  &__image-hint {
    margin: 10px 0 0;
    color: $form-muted;
    font-size: 12px;
    line-height: 1.5;
  }

  &__hidden-input {
    display: none;
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
    white-space: pre-line;
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

    &__card,
    &__image-card {
      padding: 12px;
    }

    &__image-remove {
      top: 8px;
      right: 8px;
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

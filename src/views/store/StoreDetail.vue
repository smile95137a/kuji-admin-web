<!-- src/views/store/StoreDetail.vue -->
<template>
  <!-- Disabled warning banner -->
  <div
    v-if="detail && isDisabled"
    class="sd__disabled-banner"
  >
    ⚠️ 此店家已停用。重新啟用後，商品與廣告需手動重新上架。
  </div>

  <MCard>
    <!-- Top: back + actions -->
    <div class="flex align-center justify-between gap-x-12 m-b-16 flex-wrap">
      <div class="flex align-center gap-x-12">
        <MButton variant="secondary" size="sm" @click="goBack">← 返回列表</MButton>
        <p class="form__text form__text--title" style="margin: 0">店家詳情</p>
      </div>
      <div class="flex gap-x-8" v-if="detail">
        <MButton size="sm" @click="navigateToEdit">編輯店家資訊</MButton>
        <MButton
          v-if="!isDisabled"
          size="sm"
          class="mbtn--red"
          @click="openDisable"
        >
          停用
        </MButton>
        <MButton v-else size="sm" variant="secondary" @click="openEnable">
          啟用
        </MButton>
      </div>
    </div>

    <!-- Loading -->
    <template v-if="loading">
      <p class="sd__loading">載入中...</p>
    </template>

    <template v-else-if="loadError">
      <p class="sd__error">{{ loadError }}</p>
    </template>

    <template v-else-if="detail">
      <!-- Cover image -->
      <div v-if="detail.coverImageUrl" class="sd__cover-wrap">
        <img :src="detail.coverImageUrl" alt="封面圖片" class="sd__cover" />
      </div>

      <!-- ===== 基本資訊 ===== -->
      <div class="sd__section">
        <div class="flex align-center gap-x-12 m-b-12">
          <img
            v-if="detail.logoUrl"
            :src="detail.logoUrl"
            alt="Logo"
            class="sd__logo"
          />
          <div
            v-else
            class="sd__logo sd__logo--placeholder"
          >
            {{ (detail.name || '?').charAt(0) }}
          </div>
          <div>
            <p class="sd__store-name">{{ detail.name }}</p>
            <span :class="['sd__badge', statusBadgeClass(detail.status)]">
              {{ statusLabel(detail.status) }}
            </span>
          </div>
        </div>

        <div class="sd__grid">
          <div class="sd__kv sd__kv--full" v-if="detail.shortDescription">
            <span class="sd__k">簡短描述</span>
            <span class="sd__v">{{ detail.shortDescription }}</span>
          </div>
          <div class="sd__kv sd__kv--full" v-if="detail.longDescription">
            <span class="sd__k">完整描述</span>
            <div class="sd__v" v-html="detail.longDescription" />
          </div>
        </div>
      </div>

      <!-- ===== 聯絡資訊 ===== -->
      <div class="sd__section">
        <p class="sd__section-title">聯絡資訊</p>
        <div class="sd__grid">
          <div class="sd__kv" v-if="detail.email">
            <span class="sd__k">Email</span>
            <span class="sd__v">{{ detail.email }}</span>
          </div>
          <div class="sd__kv" v-if="detail.phone">
            <span class="sd__k">電話</span>
            <span class="sd__v">{{ detail.phone }}</span>
          </div>
          <div class="sd__kv sd__kv--full" v-if="detail.address">
            <span class="sd__k">地址</span>
            <span class="sd__v">{{ detail.address }}</span>
          </div>
        </div>

        <!-- Social links -->
        <div class="sd__social" v-if="detail.facebookUrl || detail.instagramUrl">
          <a
            v-if="detail.facebookUrl"
            :href="detail.facebookUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="sd__social-link"
          >
            <i class="fa-brands fa-facebook" /> Facebook
          </a>
          <a
            v-if="detail.instagramUrl"
            :href="detail.instagramUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="sd__social-link"
          >
            <i class="fa-brands fa-instagram" /> Instagram
          </a>
        </div>
      </div>

      <!-- ===== 營業時間 ===== -->
      <div class="sd__section" v-if="detail.businessHours">
        <p class="sd__section-title">營業時間</p>
        <div class="sd__hours-grid">
          <div v-for="day in weekdays" :key="day.key" class="sd__hours-row">
            <span class="sd__hours-label">{{ day.label }}</span>
            <span class="sd__hours-value">
              {{ detail.businessHours[day.key] || '-' }}
            </span>
          </div>
        </div>
      </div>

      <!-- ===== 店家管理員（Admin only）===== -->
      <div class="sd__section" v-if="isAdmin && detail.owner">
        <p class="sd__section-title">店家管理員</p>
        <div class="sd__grid">
          <div class="sd__kv">
            <span class="sd__k">顯示名稱</span>
            <span class="sd__v">{{ detail.owner.displayName || '-' }}</span>
          </div>
          <div class="sd__kv">
            <span class="sd__k">Email</span>
            <span
              class="sd__v clickable"
              @click="navigateToOwner"
            >
              {{ detail.owner.email || '-' }}
            </span>
          </div>
        </div>
      </div>

      <!-- ===== 商品概覽 ===== -->
      <div class="sd__section">
        <p class="sd__section-title">關聯商品</p>
        <p class="sd__v">
          共
          <span class="clickable" @click="goToProducts">
            {{ detail.productCount ?? 0 }}
          </span>
          件商品
        </p>
      </div>
    </template>
  </MCard>

  <!-- Disable Modal -->
  <StoreDisableModal
    :isOpen="disableModalOpen"
    :storeName="detail?.name ?? ''"
    :loading="actionLoading"
    @confirm="submitDisable"
    @cancel="disableModalOpen = false"
  />

  <!-- Enable Modal -->
  <StoreEnableModal
    :isOpen="enableModalOpen"
    :storeName="detail?.name ?? ''"
    :loading="actionLoading"
    @confirm="submitEnable"
    @cancel="enableModalOpen = false"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';

import StoreDisableModal from './StoreDisableModal.vue';
import StoreEnableModal from './StoreEnableModal.vue';

import { useDialogStore, useAuthStore } from '@/stores';
import {
  getStoreById,
  updateStoreStatus,
} from '@/services/adminStoreService';

/* ==============================
 * Router / Auth
 * ============================== */
const route = useRoute();
const router = useRouter();
const dialogStore = useDialogStore();
const authStore = useAuthStore();

const isAdmin = computed(() =>
  (authStore.user?.roles ?? []).includes('ROLE_ADMIN'),
);

/* ==============================
 * State
 * ============================== */
const loading = ref(false);
const loadError = ref('');
const detail = ref<any>(null);
const actionLoading = ref(false);

const isDisabled = computed(() => {
  const s = detail.value?.status;
  return s === 'DISABLED' || s === 'INACTIVE';
});

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

/* ==============================
 * Helpers
 * ============================== */
function statusLabel(s: string): string {
  if (s === 'ENABLED' || s === 'ACTIVE') return '啟用';
  if (s === 'DISABLED' || s === 'INACTIVE') return '停用';
  return s ?? '-';
}

function statusBadgeClass(s: string): string {
  if (s === 'ENABLED' || s === 'ACTIVE') return 'sd__badge--green';
  return 'sd__badge--gray';
}

/* ==============================
 * Load
 * ============================== */
const loadDetail = async () => {
  const id = String(route.params.id ?? '');
  if (!id) { loadError.value = '無效的店家 ID'; return; }

  loading.value = true;
  loadError.value = '';
  try {
    const res = await getStoreById(id);
    detail.value = (res as any)?.data ?? res;
  } catch (e: any) {
    const status = e?.response?.status;
    loadError.value =
      status === 403 ? '無權限存取此店家' :
      status === 404 ? '店家不存在' :
      '載入失敗，請重試';
  } finally {
    loading.value = false;
  }
};

/* ==============================
 * Navigation
 * ============================== */
const goBack = () => router.push({ name: 'StoreList' });

const navigateToEdit = () =>
  router.push({ name: 'StoreEdit', params: { id: route.params.id } });

const navigateToOwner = () => {
  if (detail.value?.owner?.id) {
    router.push({ path: `/home/admin-user/${detail.value.owner.id}` });
  }
};

const goToProducts = () =>
  router.push({ path: '/home/lottery-with-prizes', query: { storeId: route.params.id } });

/* ==============================
 * Disable / Enable
 * ============================== */
const disableModalOpen = ref(false);
const enableModalOpen = ref(false);

const openDisable = () => { disableModalOpen.value = true; };
const openEnable = () => { enableModalOpen.value = true; };

const submitDisable = async () => {
  actionLoading.value = true;
  try {
    await updateStoreStatus(String(route.params.id), 'INACTIVE');
    detail.value.status = 'DISABLED';
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '店家已停用',
      iconType: 'success',
    });
    disableModalOpen.value = false;
  } catch {
    dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '停用失敗，請重試',
      iconType: 'warning',
    });
  } finally {
    actionLoading.value = false;
  }
};

const submitEnable = async () => {
  actionLoading.value = true;
  try {
    await updateStoreStatus(String(route.params.id), 'ACTIVE');
    detail.value.status = 'ENABLED';
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '店家已啟用，請提醒管理員手動重新上架商品',
      iconType: 'success',
    });
    enableModalOpen.value = false;
  } catch {
    dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '啟用失敗，請重試',
      iconType: 'warning',
    });
  } finally {
    actionLoading.value = false;
  }
};

/* ==============================
 * Lifecycle
 * ============================== */
onMounted(loadDetail);
</script>

<style scoped lang="scss">
.sd {
  &__loading,
  &__error {
    padding: 24px;
    text-align: center;
    color: #6b7280;
  }

  &__error { color: #ef4444; }

  &__disabled-banner {
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

  &__cover-wrap {
    margin-bottom: 16px;
  }

  &__cover {
    width: 100%;
    max-height: 280px;
    object-fit: cover;
    border-radius: 8px;
  }

  &__logo {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #e5e7eb;
    flex-shrink: 0;

    &--placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e5e7eb;
      font-size: 24px;
      font-weight: 700;
      color: #6b7280;
    }
  }

  &__store-name {
    font-size: 20px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 4px;
  }

  &__badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;

    &--green { background: #dcfce7; color: #14532d; }
    &--gray  { background: #f3f4f6; color: #6b7280; }
  }

  &__section {
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid #e5e7eb;

    &:last-child {
      border-bottom: none;
    }
  }

  &__section-title {
    font-size: 15px;
    font-weight: 700;
    color: #374151;
    margin-bottom: 12px;
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 16px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  &__kv {
    display: grid;
    grid-template-columns: 80px 1fr;
    gap: 8px;

    &--full { grid-column: 1 / -1; }
  }

  &__k {
    color: #6b7280;
    font-size: 13px;
    padding-top: 2px;
  }

  &__v {
    font-size: 13px;
    word-break: break-word;
  }

  &__social {
    display: flex;
    gap: 12px;
    margin-top: 10px;
    flex-wrap: wrap;
  }

  &__social-link {
    font-size: 13px;
    color: #6366f1;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 4px;

    &:hover { text-decoration: underline; }
  }

  &__hours-grid {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-width: 360px;
  }

  &__hours-row {
    display: grid;
    grid-template-columns: 48px 1fr;
    gap: 12px;
    align-items: center;
  }

  &__hours-label {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }

  &__hours-value {
    font-size: 13px;
    color: #6b7280;
  }
}
</style>

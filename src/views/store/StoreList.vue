<!-- src/views/store/StoreList.vue -->
<template>
  <MCard>
    <form @submit.prevent="doSearch">
      <FormTitle title="店家管理" />

      <div class="flex flex-wrap">
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="關鍵字（店家名稱）"
            v-model="keyword"
            placeholder="輸入關鍵字"
          />
        </div>
        <div class="w-25 w-md-50 w-sm-100 p-6">
          <FormSelect
            label="狀態"
            v-model="filterStatus"
            :options="statusOptions"
            :showAll="true"
            allLabel="全部"
            :allValue="''"
          />
        </div>
      </div>

      <div class="flex justify-center m-y-8 gap-x-12">
        <MButton type="submit">查詢</MButton>
        <MButton type="button" class="mbtn--gray" @click="resetFilters"
          >清除</MButton
        >
      </div>
    </form>
  </MCard>

  <div class="m-t-12">
    <MCard>
      <template v-if="loading">
        <p class="sl__loading">載入中...</p>
      </template>

      <template v-else-if="!hasData">
        <NoData
          message="尚無店家資料，請至「帳號管理」建立第一位店家管理員以自動建立店家。"
        />
      </template>

      <template v-else>
        <ReportTable
          class="m-t-12"
          :columns="columns"
          :items="currentPageItems"
          row-key="id"
          :useWidthClass="true"
          :sort-key="sortKey"
          :sort-order="sortOrder"
          @sort="handleSort"
        >
          <!-- Logo -->
          <template #cell-logo="{ item }">
            <div class="sl__logo">
              <img
                v-if="item.logoUrl"
                :src="item.logoUrl"
                :alt="item.name"
                class="sl__logo-img"
              />
              <div v-else class="sl__logo-placeholder">
                {{ (item.name || '?').charAt(0) }}
              </div>
            </div>
          </template>

          <!-- 店家名稱 -->
          <template #cell-name="{ item }">
            <span class="clickable" @click="navigateToDetail(item)">
              {{ item.storeName || item.name || '-' }}
            </span>
          </template>

          <template #cell-referrerStoreName="{ item }">
            <span>{{ item.referrerStoreName || '-' }}</span>
          </template>

          <template #cell-referralCode="{ item }">
            <span>{{ item.referralCode || '-' }}</span>
          </template>

          <!-- 商品數量 -->
          <template #cell-productCount="{ item }">
            <span class="clickable" @click="goToProducts(item)">
              {{ item.productCount ?? 0 }}
            </span>
          </template>

          <!-- 狀態 -->
          <template #cell-status="{ item }">
            <span :class="['sl__badge', statusBadgeClass(item.status)]">
              {{ statusLabel(item.status) }}
            </span>
          </template>

          <!-- 建立時間 -->
          <template #cell-createdAt="{ item }">
            <span>{{ formatDateTime(item.createdAt) }}</span>
          </template>

          <template #cell-activatedAt="{ item }">
            <span>{{ formatDateTime(item.activatedAt) }}</span>
          </template>

          <!-- 操作 -->
          <template #cell-actions="{ item }">
            <div class="flex gap-x-8 flex-wrap">
              <MButton size="sm" @click="navigateToDetail(item)">詳情</MButton>
              <MButton
                size="sm"
                variant="secondary"
                @click="navigateToEdit(item)"
              >
                編輯
              </MButton>
              <MButton
                v-if="item.status === 'ENABLED' || item.status === 'ACTIVE'"
                size="sm"
                class="mbtn--red"
                @click="openDisable(item)"
              >
                停用
              </MButton>
              <MButton
                v-else
                size="sm"
                variant="secondary"
                @click="openEnable(item)"
              >
                啟用
              </MButton>
            </div>
          </template>
        </ReportTable>

        <div class="flex justify-center m-t-12">
          <Pagination
            :totalPages="totalPages"
            :renderPaginationNums="renderPaginationNums"
            :currentPage="currentPage"
            :nextPage="nextPage"
            :previousPage="previousPage"
            :goToPage="goToPage"
            :pageLimitSize="pageLimitSize"
            :totalItems="list.length"
            @update:pageLimitSize="pageLimitSize = $event"
          />
        </div>
      </template>
    </MCard>
  </div>

  <!-- Disable Modal -->
  <StoreDisableModal
    :isOpen="disableModalOpen"
    :storeName="targetStore?.name ?? ''"
    :loading="actionLoading"
    @confirm="submitDisable"
    @cancel="closeDisableModal"
  />

  <!-- Enable Modal -->
  <StoreEnableModal
    :isOpen="enableModalOpen"
    :storeName="targetStore?.name ?? ''"
    :loading="actionLoading"
    @confirm="submitEnable"
    @cancel="enableModalOpen = false"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { usePagination } from '@/hook/usePagination';
import { useSearchPage } from '@/hook/useSearchPage';
import { compareByKeySmart } from '@/utils/sortUtils';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import NoData from '@/components/common/NoData.vue';
import Pagination from '@/components/common/Pagination.vue';
import ReportTable from '@/components/common/ReportTable.vue';
import FormTitle from '@/components/common/FormTitle.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';

import StoreDisableModal from './StoreDisableModal.vue';
import StoreEnableModal from './StoreEnableModal.vue';

import { useDialogStore } from '@/stores';
import { queryStores, updateStoreStatus } from '@/services/adminStoreService';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

/* ==============================
 * Router / Stores
 * ============================== */
const router = useRouter();
const dialogStore = useDialogStore();

/* ==============================
 * Filter state
 * ============================== */
const keyword = ref('');
const filterStatus = ref('');

const statusOptions = [
  { label: '啟用', value: 'ACTIVE' },
  { label: '停用', value: 'INACTIVE' },
];

/* ==============================
 * List hook
 * ============================== */
const loading = ref(false);
const { list, hasData, query } = useSearchPage({ useLocalList: true });

const doSearch = async () => {
  loading.value = true;
  try {
    const condition: any = {};
    if (keyword.value.trim()) condition.keyword = keyword.value.trim();
    if (filterStatus.value) condition.status = filterStatus.value;

    await query(async () => {
      const res = await queryStores(
        Object.keys(condition).length ? { condition } : undefined,
      );
      const d = (res as any)?.data ?? res;
      if (Array.isArray(d)) return d;
      if (Array.isArray((d as any)?.list)) return (d as any).list;
      return [];
    });
    goToPage(1);
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  keyword.value = '';
  filterStatus.value = '';
  doSearch();
};

/* ==============================
 * Sorting
 * ============================== */
const sortKey = ref('');
const sortOrder = ref<'asc' | 'desc' | ''>('');

const handleSort = ({ key, order }: any) => {
  sortKey.value = key;
  sortOrder.value = order;
  goToPage(1);
};

const sortedList = computed(() => {
  if (!sortKey.value || !sortOrder.value) return list.value;
  const arr = [...list.value];
  arr.sort((a: any, b: any) =>
    compareByKeySmart(a, b, sortKey.value, sortOrder.value as 'asc' | 'desc', {
      type: 'auto',
      mode: 'big5',
      locale: 'zh-TW',
    }),
  );
  return arr;
});

/* ==============================
 * Pagination
 * ============================== */
const pageLimitSize = ref(20);
const {
  totalPages,
  currentPageItems,
  renderPaginationNums,
  currentPage,
  nextPage,
  previousPage,
  goToPage,
} = usePagination(sortedList, pageLimitSize);

/* ==============================
 * Table columns
 * ============================== */
const columns = [
  { field: 'logo', label: 'Logo', width: 70 },
  { field: 'name', label: '店家名稱', width: 200, sortable: true },
  { field: 'referrerStoreName', label: '推薦來源店家', width: 180 },
  { field: 'referralCode', label: '推薦碼', width: 140 },
  { field: 'shortDescription', label: '簡短描述', width: 240 },
  { field: 'ownerEmail', label: '管理員 Email', width: 200, sortable: true },
  { field: 'productCount', label: '商品數量', width: 100, sortable: true },
  { field: 'status', label: '狀態', width: 100, sortable: true },
  { field: 'activatedAt', label: '啟用成功時間', width: 170, sortable: true },
  { field: 'createdAt', label: '建立時間', width: 170, sortable: true },
  { field: 'actions', label: '操作', width: 260 },
];

/* ==============================
 * Helpers
 * ============================== */
function formatDateTime(val: any): string {
  if (!val) return '-';
  try {
    return new Date(val).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return String(val);
  }
}

function statusLabel(s: string): string {
  if (s === 'ENABLED' || s === 'ACTIVE') return '啟用';
  if (s === 'DISABLED' || s === 'INACTIVE') return '停用';
  return s ?? '-';
}

function statusBadgeClass(s: string): string {
  if (s === 'ENABLED' || s === 'ACTIVE') return 'sl__badge--green';
  return 'sl__badge--gray';
}

/* ==============================
 * Navigation
 * ============================== */
const navigateToDetail = (item: any) => {
  router.push({ name: 'StoreDetail', params: { id: item.id } });
};
const navigateToEdit = (item: any) => {
  router.push({ name: 'StoreEdit', params: { id: item.id } });
};
const goToProducts = (item: any) => {
  router.push({
    path: '/home/lottery-with-prizes',
    query: { storeId: item.id },
  });
};

/* ==============================
 * Disable / Enable flow
 * ============================== */
const targetStore = ref<any>(null);
const disableModalOpen = ref(false);
const enableModalOpen = ref(false);
const actionLoading = ref(false);

const openDisable = (item: any) => {
  targetStore.value = item;
  disableModalOpen.value = true;
};

const closeDisableModal = () => {
  disableModalOpen.value = false;
  targetStore.value = null;
};

const submitDisable = async () => {
  if (!targetStore.value) return;
  actionLoading.value = true;
  try {
    await updateStoreStatus(targetStore.value.id, 'INACTIVE');
    targetStore.value.status = 'INACTIVE';
    await openInfoDialog({
      title: '提示訊息',
      message: '店家已停用',
      iconType: 'success',
    });
    closeDisableModal();
  } catch {
    openInfoDialog({
      title: '提示訊息',
      message: '停用失敗，請重試',
      iconType: 'warning',
    });
  } finally {
    actionLoading.value = false;
  }
};

const openEnable = (item: any) => {
  targetStore.value = item;
  enableModalOpen.value = true;
};

const submitEnable = async () => {
  if (!targetStore.value) return;
  actionLoading.value = true;
  try {
    await updateStoreStatus(targetStore.value.id, 'ACTIVE');
    targetStore.value.status = 'ACTIVE';
    await openInfoDialog({
      title: '提示訊息',
      message: '店家已啟用，請提醒管理員手動重新上架商品',
      iconType: 'success',
    });
    enableModalOpen.value = false;
    targetStore.value = null;
  } catch {
    openInfoDialog({
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
onMounted(doSearch);
</script>

<style scoped lang="scss">
.sl {
  &__loading {
    padding: 24px;
    text-align: center;
    color: #6b7280;
  }

  &__logo {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__logo-img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }

  &__logo-placeholder {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 700;
    color: #6b7280;
  }

  &__badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;

    &--green {
      background: #dcfce7;
      color: #14532d;
    }

    &--gray {
      background: #f3f4f6;
      color: #6b7280;
    }
  }
}
</style>

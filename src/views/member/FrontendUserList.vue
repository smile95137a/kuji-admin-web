<!-- src/views/member/FrontendUserList.vue -->
<template>
  <MCard>
    <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
      <FormTitle title="會員列表" />

      <FrontendUserSearchForm
        :status-options="statusOptions"
        :provider-options="providerOptions"
      />

      <div class="flex justify-center m-y-8">
        <MButton type="submit">
          <font-awesome-icon icon="fa-magnifying-glass" class="m-r-4" />
          查詢
        </MButton>
      </div>
    </Form>
  </MCard>

  <div class="m-t-12">
    <MCard>
      <div class="flex justify-end gap-x-12 flex-wrap">
        <MButton v-if="isAdmin" :disabled="!canActivate" @click="activateSelected"
          >啟用</MButton
        >
        <MButton v-if="isAdmin" :disabled="!canDeactivate" @click="deactivateSelected"
          >停用</MButton
        >
        <MButton v-if="isAdmin" :disabled="!canSuspend" @click="suspendSelected">暫停</MButton>
      </div>

      <template v-if="!hasData">
        <NoData :message="noDataMessage" />
      </template>

      <template v-else>
        <ReportTable
          class="m-t-12"
          :columns="columns"
          :items="currentPageItems"
          row-key="id"
          :selectable="isAdmin"
          selection-type="checkbox"
          :show-select-all="isAdmin"
          v-model:selected="selectedIds"
          :useWidthClass="true"
          :sort-key="sortKey"
          :sort-order="sortOrder"
          @sort="handleSort"
        >
          <template #cell-name="{ item }">
            <span class="clickable" @click="navigateToEdit(item)">
              {{ item.name || item.nickname || '-' }}
            </span>
          </template>

          <template #cell-provider="{ item }">
            <span>{{ providerText(item.provider) }}</span>
          </template>

          <template #cell-goldCoins="{ item }">
            <NumberFormatter
              v-if="
                item.goldCoins !== null &&
                item.goldCoins !== undefined &&
                item.goldCoins !== ''
              "
              :number="item.goldCoins"
              locale="zh-TW"
            />
            <span v-else>-</span>
          </template>

          <template #cell-bonusCoins="{ item }">
            <NumberFormatter
              v-if="
                item.bonusCoins !== null &&
                item.bonusCoins !== undefined &&
                item.bonusCoins !== ''
              "
              :number="item.bonusCoins"
              locale="zh-TW"
            />
            <span v-else>-</span>
          </template>

          <template #cell-statusName="{ item }">
            <span :class="statusBadgeClass(item.status)">
              {{ item.statusName || statusText(item.status) }}
            </span>
          </template>

          <template #cell-createdAt="{ item }">
            <DateFormatter
              :date="item.createdAt"
              format="YYYY-MM-DD HH:mm:ss"
            />
          </template>

          <template #cell-lastLoginAt="{ item }">
            <span v-if="item.lastLoginAt">
              <DateFormatter
                :date="item.lastLoginAt"
                format="YYYY-MM-DD HH:mm:ss"
              />
            </span>
            <span v-else>從未登入</span>
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
            @update:pageLimitSize="handlePageLimitSizeChange"
          />
        </div>
      </template>
    </MCard>
  </div>
</template>

<script setup lang="ts">
/* ==============================
 * Imports
 * ============================== */
import { ref, computed, onMounted, nextTick } from 'vue';
import { Form, type FormContext } from 'vee-validate';
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
import NumberFormatter from '@/components/common/NumberFormatter.vue';
import DateFormatter from '@/components/common/DateFormatter.vue';

import FrontendUserSearchForm from '@/components/member/FrontendUserSearchForm.vue';
import { useDialogStore, useAuthStore } from '@/stores';
import { executeApi } from '@/utils/executeApiUtils';

import {
  queryFrontendUsers,
  activateFrontendUser,
  deactivateFrontendUser,
  suspendFrontendUser,
} from '@/services/adminFrontendUserService';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

/* ==============================
 * Types
 * ============================== */
interface SelectOption {
  label: string;
  value: any;
}

/* ==============================
 * Router
 * ============================== */
const router = useRouter();
const dialogStore = useDialogStore();
const authStore = useAuthStore();

const isAdmin = computed(
  () =>
    Array.isArray(authStore.user?.roles) &&
    authStore.user.roles.includes('ROLE_ADMIN'),
);

/* ==============================
 * Form & InitValues（對齊 FrontendUserCondition）
 * ============================== */
const formRef = ref<FormContext | null>(null);

const initValues = ref<any>({
  email: '',
  nickname: '',
  phone: '',
  status: '',
  provider: '',
  goldCoinsMin: '',
  goldCoinsMax: '',
});

/* ==============================
 * Search Hook
 * ============================== */
const { list, hasData, isSearch, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

/* ==============================
 * Options
 * ============================== */
const statusOptions = ref<SelectOption[]>([
  { label: '全部', value: '' },
  { label: 'ACTIVE（啟用）', value: 'ACTIVE' },
  { label: 'INACTIVE（停用）', value: 'INACTIVE' },
  { label: 'SUSPENDED（暫停）', value: 'SUSPENDED' },
]);

const providerOptions = ref<SelectOption[]>([
  { label: '全部', value: '' },
  { label: 'EMAIL', value: 'EMAIL' },
  { label: 'GOOGLE', value: 'GOOGLE' },
]);

const loadSelectOptions = async () => {
  await nextTick();
};

/* ==============================
 * Utils
 * ============================== */
const statusText = (status?: string) => {
  switch (status) {
    case 'ACTIVE':
      return '啟用';
    case 'INACTIVE':
    case 'DEACTIVATED':
      return '停用';
    case 'SUSPENDED':
      return '暫停';
    case 'LOCKED':
      return '鎖定';
    default:
      return '-';
  }
};

const statusBadgeClass = (status?: string) => {
  if (status === 'ACTIVE') return 'badge badge--green';
  if (status === 'INACTIVE' || status === 'DEACTIVATED') {
    return 'badge badge--gray';
  }
  if (status === 'SUSPENDED') return 'badge badge--orange';
  if (status === 'LOCKED') return 'badge badge--red';

  return 'badge badge--gray';
};

const providerText = (provider?: string) => {
  if (provider === 'LOCAL') {
    return '本地';
  }
  if (provider === 'EMAIL') {
    return 'Email';
  }
  if (provider === 'GOOGLE') {
    return 'Google';
  }
  if (provider === 'FACEBOOK') {
    return 'Facebook';
  }
  if (provider === 'LINE') {
    return 'LINE';
  }
  return provider ? String(provider) : '-';
};

/* ==============================
 * Sorting
 * ============================== */
const sortKey = ref('');
const sortOrder = ref<'asc' | 'desc' | ''>('asc');

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
const pageLimitSize = ref(10);

const {
  totalPages,
  currentPageItems,
  renderPaginationNums,
  currentPage,
  nextPage,
  previousPage,
  goToPage,
} = usePagination(sortedList, pageLimitSize);

const handlePageLimitSizeChange = (value: number) => {
  pageLimitSize.value = value;
  goToPage(1);
};

/* ==============================
 * Columns（依 condition + 常見回傳欄位）
 * ============================== */
const columns = [
  { field: 'name', label: '姓名/暱稱', width: 200, sortable: true },
  { field: 'email', label: 'Email', width: 240, sortable: true },
  { field: 'provider', label: '登入方式', width: 120, sortable: true },
  { field: 'goldCoins', label: '金幣', width: 120, sortable: true },
  { field: 'bonusCoins', label: '紅利', width: 120, sortable: true },
  { field: 'statusName', label: '狀態', width: 120, sortable: true },
  { field: 'createdAt', label: '建立時間', width: 170, sortable: true },
  { field: 'lastLoginAt', label: '上次登入', width: 170, sortable: true },
];

/* ==============================
 * Query（對齊 QueryReq<FrontendUserCondition>）
 * ============================== */
const onSubmit = async (values: any) => {
  const req = {
    condition: {
      email: values.email || null,
      nickname: values.nickname || null,
      phone: values.phone || null,
      status: values.status || null,
      provider: values.provider || null,
      goldCoinsMin:
        values.goldCoinsMin === '' ||
        values.goldCoinsMin === null ||
        values.goldCoinsMin === undefined
          ? null
          : Number(values.goldCoinsMin),
      goldCoinsMax:
        values.goldCoinsMax === '' ||
        values.goldCoinsMax === null ||
        values.goldCoinsMax === undefined
          ? null
          : Number(values.goldCoinsMax),
    },
            sortBy: 'createdAt',
            sortOrder: 'DESC',
  };

  await query(() => queryFrontendUsers(req));
  goToPage(1);
  isSearch.value = true;
};

/* ==============================
 * Selection / Bulk Actions
 * ============================== */
const selectedIds = ref<string[]>([]);

const selectedRows = computed(() =>
  list.value.filter((row: any) => selectedIds.value.includes(row.id)),
);

const canActivateRow = (row: any) => row?.status && row.status !== 'ACTIVE';
const canDeactivateRow = (row: any) => row?.status === 'ACTIVE';
const canSuspendRow = (row: any) => row?.status && row.status !== 'SUSPENDED';

const canActivate = computed(
  () =>
    selectedRows.value.length > 0 && selectedRows.value.every(canActivateRow),
);

const canDeactivate = computed(
  () =>
    selectedRows.value.length > 0 && selectedRows.value.every(canDeactivateRow),
);

const canSuspend = computed(
  () =>
    selectedRows.value.length > 0 && selectedRows.value.every(canSuspendRow),
);

const refresh = async () => {
  const values = formRef.value?.values || initValues.value;

  await onSubmit(values);
  selectedIds.value = [];
};

const activateSelected = async () => {
  if (!isAdmin.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '權限不足，僅管理員可執行此操作。',
      iconType: 'warning',
    });
    return;
  }

  if (!canActivate.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '選中的會員需為非 ACTIVE 才能啟用。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '啟用確認',
    message: `確定要啟用選中的 ${selectedIds.value.length} 位會員嗎？`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(
        selectedIds.value.map((id) => activateFrontendUser(id)),
      ),
    onSuccess: async (results: any[]) => {
      const okCount = results.filter(
        (item) => item.status === 'fulfilled',
      ).length;
      const failCount = results.length - okCount;

      await openInfoDialog({
        title: '提示訊息',
        message:
          failCount > 0
            ? `啟用完成：成功 ${okCount}、失敗 ${failCount}`
            : `啟用完成：成功 ${okCount}`,
        iconType: failCount > 0 ? 'warning' : 'success',
      });

      await refresh();
    },
    showSuccessDialog: false,
  });
};

const deactivateSelected = async () => {
  if (!isAdmin.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '權限不足，僅管理員可執行此操作。',
      iconType: 'warning',
    });
    return;
  }

  if (!canDeactivate.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '只有 ACTIVE 的會員才能停用。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '停用確認',
    message: `確定要停用選中的 ${selectedIds.value.length} 位會員嗎？`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(
        selectedIds.value.map((id) => deactivateFrontendUser(id)),
      ),
    onSuccess: async (results: any[]) => {
      const okCount = results.filter(
        (item) => item.status === 'fulfilled',
      ).length;
      const failCount = results.length - okCount;

      await openInfoDialog({
        title: '提示訊息',
        message:
          failCount > 0
            ? `停用完成：成功 ${okCount}、失敗 ${failCount}`
            : `停用完成：成功 ${okCount}`,
        iconType: failCount > 0 ? 'warning' : 'success',
      });

      await refresh();
    },
    showSuccessDialog: false,
  });
};

const suspendSelected = async () => {
  if (!isAdmin.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '權限不足，僅管理員可執行此操作。',
      iconType: 'warning',
    });
    return;
  }

  if (!canSuspend.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '選中的會員需為非 SUSPENDED 才能暫停。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '暫停確認',
    message: `確定要暫停選中的 ${selectedIds.value.length} 位會員嗎？`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(
        selectedIds.value.map((id) => suspendFrontendUser(id)),
      ),
    onSuccess: async (results: any[]) => {
      const okCount = results.filter(
        (item) => item.status === 'fulfilled',
      ).length;
      const failCount = results.length - okCount;

      await openInfoDialog({
        title: '提示訊息',
        message:
          failCount > 0
            ? `暫停完成：成功 ${okCount}、失敗 ${failCount}`
            : `暫停完成：成功 ${okCount}`,
        iconType: failCount > 0 ? 'warning' : 'success',
      });

      await refresh();
    },
    showSuccessDialog: false,
  });
};

/* ==============================
 * Navigation
 * ============================== */
const navigateToEdit = (item: any) => {
  router.push(`/home/member/edit/${item.id}`);
};

/* ==============================
 * Lifecycle
 * ============================== */
onMounted(async () => {
  await loadSelectOptions();
  await onSubmit(initValues.value);
  isSearch.value = true;
});
</script>

<!-- src/views/adminUser/AdminUserList.vue -->
<template>
  <MCard>
    <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
      <FormTitle title="帳號管理" />

      <AdminUserSearchForm
        :status-options="statusOptions"
        :store-options="storeOptions"
        :role-code-options="roleCodeOptions"
      />

      <div class="flex justify-center m-y-8 gap-x-12 flex-wrap">
        <MButton type="submit">
          <font-awesome-icon icon="fa-magnifying-glass" class="m-r-4" />
          查詢
        </MButton>

        <MButton type="button" class="mbtn--gray" @click="resetFilters">
          <font-awesome-icon icon="fa-rotate-left" class="m-r-4" />
          清除
        </MButton>
      </div>
    </Form>
  </MCard>

  <div class="m-t-12">
    <MCard>
      <div class="flex justify-end gap-x-12 flex-wrap">
        <MButton @click="navigateToAddOwner">
          <font-awesome-icon icon="fa-user-plus" class="m-r-4" />
          新增店家負責人
        </MButton>

        <MButton @click="navigateToAddEditor">
          <font-awesome-icon icon="fa-user-pen" class="m-r-4" />
          新增店家編輯
        </MButton>

        <MButton :disabled="!canActivate" @click="doActivateSelected">
          <font-awesome-icon icon="fa-circle-check" class="m-r-4" />
          啟用
        </MButton>

        <MButton :disabled="!canDeactivate" @click="doDeactivateSelected">
          <font-awesome-icon icon="fa-ban" class="m-r-4" />
          停用
        </MButton>

        <MButton
          class="mbtn--red"
          :disabled="!canDelete"
          @click="doDeleteSelected"
        >
          <font-awesome-icon icon="fa-trash" class="m-r-4" />
          刪除
        </MButton>
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
          selectable
          selection-type="checkbox"
          :show-select-all="true"
          v-model:selected="selectedIds"
          :useWidthClass="true"
          :sort-key="sortKey"
          :sort-order="sortOrder"
          @sort="handleSort"
        >
          <!-- Email / 帳號 -->
          <template #cell-email="{ item }">
            <span class="clickable" @click="navigateToDetail(item)">
              {{ item.email || item.username || '-' }}
            </span>
          </template>

          <!-- 顯示名稱 -->
          <template #cell-displayName="{ item }">
            <span>{{ item.displayName || '-' }}</span>
          </template>

          <!-- 狀態 -->
          <template #cell-status="{ item }">
            <span :class="statusBadgeClass(item)">
              {{ statusText(item) }}
            </span>
          </template>

          <!-- 角色 -->
          <template #cell-roles="{ item }">
            <span class="aul__text-ellipsis">
              {{ roleText(item) }}
            </span>
          </template>

          <!-- 店家 -->
          <template #cell-stores="{ item }">
            <span class="aul__text-ellipsis">
              {{ storeText(item) }}
            </span>
          </template>

          <!-- 最後登入 -->
          <template #cell-lastLoginAt="{ item }">
            <DateFormatter
              :date="item.lastLoginAt"
              format="YYYY-MM-DD HH:mm:ss"
            />
          </template>

          <!-- 建立時間 -->
          <template #cell-createdAt="{ item }">
            <DateFormatter
              :date="item.createdAt"
              format="YYYY-MM-DD HH:mm:ss"
            />
          </template>

          <!-- 操作 -->
          <template #cell-actions="{ item }">
            <div class="flex gap-x-8 flex-wrap">
              <MButton size="sm" @click="navigateToDetail(item)">
                <font-awesome-icon icon="fa-circle-info" class="m-r-4" />
                詳情
              </MButton>

              <MButton size="sm" @click="doResetPassword(item)">
                <font-awesome-icon icon="fa-key" class="m-r-4" />
                重設密碼
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
            @update:pageLimitSize="handlePageLimitSizeChange"
          />
        </div>
      </template>
    </MCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Form, FormContext } from 'vee-validate';
import * as yup from 'yup';

import { usePagination } from '@/hook/usePagination';
import { useSearchPage } from '@/hook/useSearchPage';
import { compareByKeySmart } from '@/utils/sortUtils';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import NoData from '@/components/common/NoData.vue';
import Pagination from '@/components/common/Pagination.vue';
import ReportTable from '@/components/common/ReportTable.vue';
import FormTitle from '@/components/common/FormTitle.vue';
import DateFormatter from '@/components/common/DateFormatter.vue';

import AdminUserSearchForm from '@/components/adminUser/AdminUserSearchForm.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { useDialogStore, useAuthStore } from '@/stores';
import { useAdminUserStore } from '@/stores/adminUser/useAdminUserStore';

import {
  queryAdminUsers,
  activateAdminUser,
  deactivateAdminUser,
  deleteAdminUser,
  resetAdminUserPassword,
} from '@/services/adminUserService';

import { getStoreOptions } from '@/services/adminStoreService';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

interface SelectOption {
  label: string;
  value: any;
  description?: string;
}

const router = useRouter();
const dialogStore = useDialogStore();
const authStore = useAuthStore();
const adminUserStore = useAdminUserStore();

const currentUserId = computed(
  () => authStore.user?.id ?? authStore.user?.userId ?? '',
);

/* --------------------------------------
 * Form
 * -------------------------------------- */
const formRef = ref<FormContext | null>(null);

const initValues = ref({
  keyword: '',
  status: '',
  storeId: '',
  roleCode: '',
});

const schema = yup.object({
  keyword: yup.string().nullable(),
  status: yup.string().nullable(),
  storeId: yup.string().nullable(),
  roleCode: yup.string().nullable(),
});

/* --------------------------------------
 * Search Hook
 * -------------------------------------- */
const { list, hasData, isSearch, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

/* --------------------------------------
 * Options
 * -------------------------------------- */
const storeOptions = ref<SelectOption[]>([]);

const statusOptions = ref<SelectOption[]>([
  { label: '啟用', value: 'ACTIVE' },
  { label: '停用', value: 'INACTIVE' },
  { label: '待審核', value: 'PENDING' },
]);

const roleCodeOptions = ref<SelectOption[]>([
  { label: '系統管理員', value: 'ROLE_ADMIN' },
  { label: '店家負責人', value: 'ROLE_STORE_OWNER' },
  { label: '店家編輯', value: 'ROLE_STORE_EDITOR' },
]);

const mapEnumOptionsToSelect = (arr: any[] = []): SelectOption[] =>
  arr.map((item) => ({
    label: item?.label ?? item?.storeName ?? item?.name ?? '',
    value: item?.value ?? item?.id ?? '',
    ...(item?.description ? { description: item.description } : {}),
  }));

const loadStoreOptions = async () => {
  await executeApi<any[]>({
    fn: async () => getStoreOptions({ activeOnly: true }),
    onSuccess: (res: any) => {
      const data = res?.data ?? res ?? [];
      const arr = Array.isArray(data) ? data : [];

      storeOptions.value = mapEnumOptionsToSelect(arr);
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

/* --------------------------------------
 * Helpers
 * -------------------------------------- */
const statusText = (user: any) => {
  const status = user?.status;

  if (status === 'ACTIVE') return '啟用';
  if (status === 'INACTIVE') return '停用';
  if (status === 'PENDING') return '待審核';

  return status || '-';
};

const statusBadgeClass = (user: any) => {
  const status = user?.status;

  if (status === 'ACTIVE') return 'badge badge--green';
  if (status === 'INACTIVE') return 'badge badge--gray';
  if (status === 'PENDING') return 'badge badge--orange';

  return 'badge badge--gray';
};

const ROLE_LABEL: Record<string, string> = {
  ROLE_ADMIN: '系統管理員',
  ROLE_STORE_OWNER: '店家負責人',
  ROLE_STORE_EDITOR: '店家編輯',
};

const roleText = (user: any) => {
  const roles = user?.roles;

  if (!Array.isArray(roles) || roles.length === 0) return '-';

  return roles
    .map((role: any) => {
      const code =
        typeof role === 'string' ? role : (role?.code ?? role?.name ?? '');

      return ROLE_LABEL[code] || code;
    })
    .filter(Boolean)
    .join(', ');
};

const storeText = (user: any) => {
  const stores = user?.stores;

  if (!Array.isArray(stores) || stores.length === 0) return '-';

  return stores
    .map((store: any) => {
      const name = store?.storeName || store?.name || store?.id || '';
      const roleType = store?.roleType ? `(${store.roleType})` : '';

      return `${name}${roleType}`;
    })
    .filter(Boolean)
    .join(', ');
};

/* --------------------------------------
 * Sorting
 * -------------------------------------- */
const sortKey = ref('');
const sortOrder = ref<'asc' | 'desc' | ''>('asc');

const handleSort = ({
  key,
  order,
}: {
  key: string;
  order: 'asc' | 'desc' | '';
}) => {
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

/* --------------------------------------
 * Pagination
 * -------------------------------------- */
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

/* --------------------------------------
 * Columns
 * -------------------------------------- */
const columns = [
  { field: 'email', label: 'Email/帳號', width: 220, sortable: true },
  { field: 'displayName', label: '顯示名稱', width: 160, sortable: true },
  { field: 'roles', label: '角色', width: 220 },
  { field: 'stores', label: '店家', width: 220 },
  { field: 'status', label: '狀態', width: 110, sortable: true },
  { field: 'lastLoginAt', label: '最後登入', width: 170, sortable: true },
  { field: 'createdAt', label: '建立時間', width: 170, sortable: true },
  { field: 'actions', label: '操作', width: 240 },
];

/* --------------------------------------
 * Query
 * -------------------------------------- */
const normalizeCondition = (values: any) => {
  const condition = { ...(values ?? {}) };

  Object.keys(condition).forEach((key) => {
    if (
      condition[key] === '' ||
      condition[key] === null ||
      condition[key] === undefined
    ) {
      delete condition[key];
    }
  });

  return condition;
};

const onSubmit = async (values: any) => {
  const condition = {
    keyword: values.keyword ?? '',
    status: values.status ?? '',
    storeId: values.storeId ?? '',
    roleCode: values.roleCode ?? '',
  };

  const cleanCondition = normalizeCondition(condition);

  await query(async () => {
    const res = await queryAdminUsers({ condition: cleanCondition });
    const data = (res as any)?.data ?? res;

    if (Array.isArray(data)) return data;
    if (Array.isArray((data as any)?.list)) return (data as any).list;
    if (Array.isArray((res as any)?.list)) return (res as any).list;

    return [];
  });

  adminUserStore.setSearchCondition(condition);
  selectedIds.value = [];
  goToPage(1);
  isSearch.value = true;
};

const resetFilters = async () => {
  const values = {
    keyword: '',
    status: '',
    storeId: '',
    roleCode: '',
  };

  formRef.value?.setValues(values);
  await onSubmit(values);
};

const refresh = async () => {
  const values = formRef.value?.values || initValues.value;
  await onSubmit(values);
};

/* --------------------------------------
 * Selection & Bulk actions
 * -------------------------------------- */
const selectedIds = ref<string[]>([]);

watch(
  selectedIds,
  (value) => {
    adminUserStore.setSelectedIds([...value]);
  },
  { deep: true },
);

const selectedRows = computed(() =>
  list.value.filter((user: any) => selectedIds.value.includes(user.id)),
);

const canActivate = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every((user: any) => user?.status === 'INACTIVE'),
);

const canDeactivate = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every(
      (user: any) =>
        user?.status === 'ACTIVE' &&
        String(user?.id) !== String(currentUserId.value),
    ),
);

const canDelete = computed(() => selectedRows.value.length > 0);

const doActivateSelected = async () => {
  if (!canActivate.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '只有「停用(INACTIVE)」的帳號才能啟用。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '啟用確認',
    message: `確定要啟用選中的 ${selectedIds.value.length} 筆帳號嗎？`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(selectedIds.value.map((id) => activateAdminUser(id))),
    onSuccess: async (results: PromiseSettledResult<any>[]) => {
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

      selectedIds.value = [];
      adminUserStore.clearSelectedIds();
      await refresh();
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

const doDeactivateSelected = async () => {
  const selfIncluded = selectedRows.value.some(
    (user: any) => String(user?.id) === String(currentUserId.value),
  );

  if (selfIncluded) {
    await openInfoDialog({
      title: '提示訊息',
      message: '不可停用自己的帳號。',
      iconType: 'warning',
    });
    return;
  }

  if (!canDeactivate.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '只有「啟用(ACTIVE)」的帳號才能停用。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '停用確認',
    message: `確定要停用選中的 ${selectedIds.value.length} 筆帳號嗎？`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(
        selectedIds.value.map((id) => deactivateAdminUser(id)),
      ),
    onSuccess: async (results: PromiseSettledResult<any>[]) => {
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

      selectedIds.value = [];
      adminUserStore.clearSelectedIds();
      await refresh();
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

const doDeleteSelected = async () => {
  if (!canDelete.value) return;

  const ok = await openConfirmDialog({
    title: '刪除確認',
    message: `確定要刪除選中的 ${selectedIds.value.length} 筆帳號嗎？（後端為軟刪除＝停用）`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(selectedIds.value.map((id) => deleteAdminUser(id))),
    onSuccess: async (results: PromiseSettledResult<any>[]) => {
      const okCount = results.filter(
        (item) => item.status === 'fulfilled',
      ).length;
      const failCount = results.length - okCount;

      await openInfoDialog({
        title: '提示訊息',
        message:
          failCount > 0
            ? `刪除完成：成功 ${okCount}、失敗 ${failCount}`
            : `刪除完成：成功 ${okCount}`,
        iconType: failCount > 0 ? 'warning' : 'success',
      });

      selectedIds.value = [];
      adminUserStore.clearSelectedIds();
      await refresh();
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

const doResetPassword = async (item: any) => {
  const userId = item?.id;

  if (!userId) return;

  const ok = await openConfirmDialog({
    title: '重設密碼確認',
    message: '確定要重設此帳號密碼嗎？',
  });

  if (!ok) return;

  await executeApi<{ newPassword: string }>({
    fn: async () => resetAdminUserPassword(userId),

    onSuccess: async (data) => {
      await openInfoDialog({
        title: '重設成功',
        message: `密碼已重設，新密碼已發送至用戶 Email。${data?.newPassword ? `（臨時密碼：${data.newPassword}，請告知用戶）` : ''}`,
        iconType: 'success',
      });
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

/* --------------------------------------
 * Save state / Navigation
 * -------------------------------------- */
const saveListState = () => {
  adminUserStore.setList([...list.value]);
  adminUserStore.setSearchCondition(formRef.value?.values || initValues.value);
  adminUserStore.setSort(sortKey.value, sortOrder.value);
  adminUserStore.setCurrentPage(currentPage.value);
  adminUserStore.setPageLimitSize(pageLimitSize.value);
  adminUserStore.setSelectedIds([...selectedIds.value]);
};

const navigateToDetail = (item: any) => {
  if (!item?.id) return;

  saveListState();
  router.push(`/home/admin-users/${item.id}`);
};

const navigateToAddOwner = () => {
  saveListState();
  router.push('/home/admin-users/add-owner');
};

const navigateToAddEditor = () => {
  saveListState();
  router.push('/home/admin-users/add-editor');
};

/* --------------------------------------
 * Lifecycle
 * -------------------------------------- */
onMounted(async () => {
  await loadStoreOptions();

  if (adminUserStore.list.length > 0 && !adminUserStore.shouldRefresh) {
    list.value = [...adminUserStore.list];
    initValues.value = { ...adminUserStore.searchCondition };

    await nextTick();
    formRef.value?.setValues(adminUserStore.searchCondition);

    sortKey.value = adminUserStore.sortKey || '';
    sortOrder.value = adminUserStore.sortOrder || 'asc';
    pageLimitSize.value = adminUserStore.pageLimitSize;
    selectedIds.value = [...adminUserStore.selectedIds];

    await nextTick();
    goToPage(adminUserStore.currentPage);

    isSearch.value = true;
    adminUserStore.resetAll();
    return;
  }

  const condition = adminUserStore.shouldRefresh
    ? { ...adminUserStore.searchCondition }
    : { ...initValues.value };

  initValues.value = { ...condition };

  await nextTick();
  formRef.value?.setValues(condition);

  await onSubmit(condition);
  adminUserStore.resetAll();
});
</script>

<style scoped lang="scss">
.aul {
  &__text-ellipsis {
    display: inline-block;
    max-width: 200px;
    overflow: hidden;
    vertical-align: middle;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>

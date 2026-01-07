<!-- src/views/adminUsers/AdminUserList.vue -->
<template>
  <MCard>
    <Form
      ref="formRef"
      :initial-values="initValues"
      @submit="onSubmit"
      v-slot="{ values, setFieldValue }"
    >
      <FormTitle title="後台帳號管理" />

      <div class="flex flex-wrap">
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="關鍵字"
            :modelValue="values.keyword"
            @update:modelValue="setFieldValue('keyword', $event)"
            placeholder="email / username / 顯示名稱 / 電話 / 店家"
          />
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="角色"
            :modelValue="values.role"
            @update:modelValue="setFieldValue('role', $event)"
            :options="roleOptions"
            :showAll="true"
            allLabel="全部"
            :allValue="''"
          />
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="狀態"
            :modelValue="values.status"
            @update:modelValue="setFieldValue('status', $event)"
            :options="statusOptions"
            :showAll="true"
            allLabel="全部"
            :allValue="''"
          />
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="店家 ID（可選）"
            :modelValue="values.storeId"
            @update:modelValue="setFieldValue('storeId', $event)"
            placeholder="想只看某店家帳號就輸入 storeId"
          />
        </div>
      </div>

      <div class="flex justify-center m-y-8">
        <MButton type="submit">查詢</MButton>
      </div>
    </Form>
  </MCard>

  <div class="m-t-12">
    <MCard>
      <div class="flex justify-end gap-x-12 flex-wrap">
        <MButton @click="navigateToAddOwner">新增店家負責人</MButton>
        <MButton @click="navigateToAddEditor">新增店家編輯</MButton>

        <MButton :disabled="!canActivate" @click="activateSelected">
          啟用
        </MButton>

        <MButton :disabled="!canDeactivate" @click="deactivateSelected">
          停用
        </MButton>

        <MButton :disabled="!canResetPwd" @click="resetPasswordSelected">
          重設密碼
        </MButton>

        <MButton
          class="mbtn--red"
          :disabled="!canDelete"
          @click="deleteSelected"
        >
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
          @sort="handleSort"
        >
          <template #cell-email="{ item }">
            <span class="clickable" @click="navigateToDetail(item.id)">
              {{ item.email || '-' }}
            </span>
          </template>

          <template #cell-displayName="{ item }">
            <span>{{ item.displayName || '-' }}</span>
          </template>

          <template #cell-phone="{ item }">
            <span>{{ item.phone || '-' }}</span>
          </template>

          <template #cell-rolesText="{ item }">
            <span>{{ roleText(item) }}</span>
          </template>

          <template #cell-storesText="{ item }">
            <span>{{ storeText(item) }}</span>
          </template>

          <template #cell-statusText="{ item }">
            <span>{{ statusText(item) }}</span>
          </template>

          <template #cell-lastLoginAt="{ item }">
            <span>{{ formatDateTime(item.lastLoginAt) }}</span>
          </template>

          <template #cell-createdAt="{ item }">
            <span>{{ formatDateTime(item.createdAt) }}</span>
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
</template>

<script setup lang="ts">
/* ==============================
 * Imports
 * ============================== */
import { ref, computed, onMounted, nextTick } from 'vue';
import { Form, FormContext } from 'vee-validate';
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

import { useDialogStore } from '@/stores';
import { executeApi } from '@/utils/executeApiUtils';
import { useAdminUserStore } from '@/stores/adminUser/useAdminUserStore';

import {
  activateAdminUser,
  deactivateAdminUser,
  deleteAdminUser,
  getAdminUsersByStore,
  getAllAdminUsers,
  resetAdminUserPassword,
} from '@/services/adminUserService';

/* ==============================
 * Router / Store
 * ============================== */
const router = useRouter();
const dialogStore = useDialogStore();
const adminUserStore = useAdminUserStore();

/* ==============================
 * Form & InitValues
 * ============================== */
const formRef = ref<FormContext | null>(null);

const initValues = ref<any>({
  keyword: '',
  role: '', // ROLE_ADMIN / ROLE_STORE_OWNER / ROLE_STORE_EDITOR
  status: '', // ACTIVE / INACTIVE
  storeId: '',
});

/* ==============================
 * Search Hook (local list)
 * ============================== */
const { list, hasData, isSearch, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

/* ==============================
 * Select Options
 * ============================== */
const roleOptions = ref<SelectOption[]>([
  { label: '全部', value: '' },
  { label: '系統管理員 (ROLE_ADMIN)', value: 'ROLE_ADMIN' },
  { label: '店家負責人 (ROLE_STORE_OWNER)', value: 'ROLE_STORE_OWNER' },
  { label: '店家編輯 (ROLE_STORE_EDITOR)', value: 'ROLE_STORE_EDITOR' },
]);

const statusOptions = ref<SelectOption[]>([
  { label: '全部', value: '' },
  { label: '啟用 (ACTIVE)', value: 'ACTIVE' },
  { label: '停用 (INACTIVE)', value: 'INACTIVE' },
]);

const loadSelectOptions = async () => {
  await nextTick();
};

/* ==============================
 * Utils
 * ============================== */
const formatDateTime = (v?: string) => {
  if (!v) return '-';
  return String(v).replace('T', ' ');
};

const statusText = (u: any) => {
  const s = u?.status;
  if (!s) return '-';
  return s === 'ACTIVE' ? '啟用' : s === 'INACTIVE' ? '停用' : String(s);
};

const isActiveUser = (u: any) => u?.status === 'ACTIVE';

const roleText = (u: any) => {
  const roles = u?.roles;
  if (!Array.isArray(roles) || roles.length === 0) return '-';
  // 顯示「name」，如果沒 name 才 fallback code
  return roles
    .map((r: any) => r?.name || r?.code)
    .filter(Boolean)
    .join(', ');
};

const roleCodes = (u: any): string[] => {
  const roles = u?.roles;
  if (!Array.isArray(roles)) return [];
  return roles.map((r: any) => r?.code).filter(Boolean);
};

const storeText = (u: any) => {
  const stores = u?.stores;
  if (!Array.isArray(stores) || stores.length === 0) return '-';
  // ex: "KUJI 測試商店(OWNER), 其他店(EDITOR)"
  return stores
    .map((s: any) => {
      const name = s?.storeName || s?.id || '';
      const roleType = s?.roleType ? `(${s.roleType})` : '';
      return `${name}${roleType}`;
    })
    .filter(Boolean)
    .join(', ');
};

const storeNames = (u: any): string[] => {
  const stores = u?.stores;
  if (!Array.isArray(stores)) return [];
  return stores.map((s: any) => s?.storeName).filter(Boolean);
};

/* ==============================
 * Query（後端沒條件查詢 → 前端篩選）
 * ============================== */
const filterRows = (rows: any[], cond: any) => {
  const keyword = String(cond?.keyword || '')
    .trim()
    .toLowerCase();
  const role = String(cond?.role || '').trim(); // ROLE_*
  const status = String(cond?.status || '').trim(); // ACTIVE/INACTIVE
  const storeId = String(cond?.storeId || '').trim();

  return (rows || []).filter((r) => {
    const hitKeyword =
      !keyword ||
      String(r?.email || '')
        .toLowerCase()
        .includes(keyword) ||
      String(r?.username || '')
        .toLowerCase()
        .includes(keyword) ||
      String(r?.displayName || '')
        .toLowerCase()
        .includes(keyword) ||
      String(r?.phone || '')
        .toLowerCase()
        .includes(keyword) ||
      storeNames(r).some((n) => String(n).toLowerCase().includes(keyword));

    const hitRole = !role || roleCodes(r).includes(role);

    const hitStatus =
      !status || (status === 'ACTIVE' ? isActiveUser(r) : !isActiveUser(r));

    const hitStore =
      !storeId ||
      (Array.isArray(r?.stores) &&
        r.stores.some((s: any) => String(s?.id || '') === storeId));

    return hitKeyword && hitRole && hitStatus && hitStore;
  });
};

const doQuery = async (condition: any) => {
  adminUserStore.setSearchCondition(condition);

  await query(async () => {
    if (condition?.storeId) {
      const res = await getAdminUsersByStore(condition.storeId);
      return (res as any)?.data ?? res;
    }
    const res = await getAllAdminUsers();
    return (res as any)?.data ?? res;
  });

  list.value = filterRows(list.value, condition);
};

const onSubmit = async (values: any) => {
  await doQuery(values);
  goToPage(1);
  selectedIds.value = [];
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
    })
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

/* ==============================
 * Columns（✅ 改成對齊你回傳的 AdminUserRes）
 * 注意：ReportTable 如果是用 field 做取值，roles/stores 是陣列會不好看，所以我用 rolesText/storesText/statusText 三個虛擬欄位
 * ============================== */
const columns = [
  { field: 'email', label: 'Email', width: 220, sortable: true },
  { field: 'displayName', label: '顯示名稱', width: 140, sortable: true },
  { field: 'phone', label: '電話', width: 120, sortable: true },
  { field: 'rolesText', label: '角色', width: 160 },
  { field: 'storesText', label: '店家', width: 220 },
  { field: 'statusText', label: '狀態', width: 90, sortable: true },
  { field: 'lastLoginAt', label: '最後登入', width: 160, sortable: true },
  { field: 'createdAt', label: '建立時間', width: 160, sortable: true },
];

/* ==============================
 * Selection / Bulk Actions
 * ============================== */
const selectedIds = ref<string[]>([]);

const selectedRows = computed(() =>
  list.value.filter((row: any) => selectedIds.value.includes(row.id))
);

const canActivate = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every((r) => !isActiveUser(r))
);

const canDeactivate = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every((r) => isActiveUser(r))
);

const canResetPwd = computed(() => selectedRows.value.length === 1);
const canDelete = computed(() => selectedRows.value.length > 0);

const refresh = async () => {
  const values = formRef.value?.values || initValues.value;
  await onSubmit(values);
};

const activateSelected = async () => {
  if (!canActivate.value) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '只能對「停用」帳號執行啟用。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await dialogStore.openConfirmDialog({
    title: '啟用確認',
    message: `確定要啟用選中的 ${selectedIds.value.length} 筆帳號嗎？`,
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(selectedIds.value.map((id) => activateAdminUser(id))),
    onSuccess: async (results: any[]) => {
      const okCount = results.filter((x) => x.status === 'fulfilled').length;
      const failCount = results.length - okCount;

      await dialogStore.openInfoDialog({
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
  if (!canDeactivate.value) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '只能對「啟用」帳號執行停用。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await dialogStore.openConfirmDialog({
    title: '停用確認',
    message: `確定要停用選中的 ${selectedIds.value.length} 筆帳號嗎？`,
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(
        selectedIds.value.map((id) => deactivateAdminUser(id))
      ),
    onSuccess: async (results: any[]) => {
      const okCount = results.filter((x) => x.status === 'fulfilled').length;
      const failCount = results.length - okCount;

      await dialogStore.openInfoDialog({
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

const resetPasswordSelected = async () => {
  if (!canResetPwd.value) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '重設密碼一次只能選 1 筆。',
      iconType: 'warning',
    });
    return;
  }

  const user = selectedRows.value[0];

  const ok = await dialogStore.openConfirmDialog({
    title: '重設密碼確認',
    message: `確定要重設「${user.email}」的密碼嗎？`,
  });
  if (!ok) return;

  await executeApi<{ newPassword: string }>({
    fn: async () => resetAdminUserPassword(user.id),
    onSuccess: async (data) => {
      await dialogStore.openInfoDialog({
        title: '新密碼',
        message: `新密碼：${data?.newPassword || '-'}`,
        iconType: 'success',
      });

      await refresh();
    },
    showSuccessDialog: false,
  });
};

const deleteSelected = async () => {
  if (!canDelete.value) return;

  const ok = await dialogStore.openConfirmDialog({
    title: '刪除確認',
    message: `確定要刪除選中的 ${selectedIds.value.length} 筆帳號嗎？（後端為軟刪除＝停用）`,
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(selectedIds.value.map((id) => deleteAdminUser(id))),
    onSuccess: async (results: any[]) => {
      const okCount = results.filter((x) => x.status === 'fulfilled').length;
      const failCount = results.length - okCount;

      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message:
          failCount > 0
            ? `刪除完成：成功 ${okCount}、失敗 ${failCount}`
            : `刪除完成：成功 ${okCount}`,
        iconType: failCount > 0 ? 'warning' : 'success',
      });

      await refresh();
    },
    showSuccessDialog: false,
  });
};

/* ==============================
 * Navigation（新增/編輯 → 暫存）
 * ============================== */
const stashStateAndGo = (path: string) => {
  adminUserStore.setList([...list.value]);
  adminUserStore.setSearchCondition(formRef.value?.values || {});
  adminUserStore.setSort(sortKey.value, sortOrder.value);
  adminUserStore.setCurrentPage(currentPage.value);
  adminUserStore.setPageLimitSize(pageLimitSize.value);
  router.push(path);
};

const navigateToDetail = (id: string) =>
  stashStateAndGo(`/home/admin-users/edit/${id}`);
const navigateToAddOwner = () => stashStateAndGo('/home/admin-users/add-owner');
const navigateToAddEditor = () =>
  stashStateAndGo('/home/admin-users/add-editor');

/* ==============================
 * Lifecycle（回來 → 還原）
 * ============================== */
onMounted(async () => {
  await loadSelectOptions();

  if (adminUserStore.list?.length > 0) {
    list.value = [...adminUserStore.list];

    initValues.value = { ...adminUserStore.searchCondition };
    if (formRef.value) {
      formRef.value.setValues(adminUserStore.searchCondition);
    }

    sortKey.value = adminUserStore.sortKey;
    sortOrder.value = (adminUserStore.sortOrder as any) || 'asc';
    pageLimitSize.value = adminUserStore.pageLimitSize;

    isSearch.value = true;
    await nextTick();
    goToPage(adminUserStore.currentPage);

    adminUserStore.resetAll();
    return;
  }

  await onSubmit(initValues.value);
});
</script>

<style scoped></style>

<template>
  <MCard>
    <form @submit.prevent="onSubmit">
      <p class="form__text form__text--title">帳號列表</p>

      <div class="flex flex-wrap">
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="關鍵字（Email / 顯示名稱）"
            v-model="keyword"
            :error="errors.keyword"
            placeholder="輸入關鍵字"
          />
        </div>

        <div class="w-25 w-md-50 w-sm-100 p-6">
          <FormSelect
            label="狀態"
            v-model="status"
            :options="statusOptions"
            :error="errors.status"
            :showAll="true"
            allLabel="全部"
            :allValue="''"
          />
        </div>

        <div class="w-25 w-md-50 w-sm-100 p-6">
          <FormSelect
            label="店家"
            v-model="storeId"
            :options="storeOptions"
            :error="errors.storeId"
            :showAll="true"
            allLabel="全部"
            :allValue="''"
          />
        </div>

        <div class="w-25 w-md-50 w-sm-100 p-6">
          <FormSelect
            label="角色"
            v-model="roleCode"
            :options="roleCodeOptions"
            :error="errors.roleCode"
            :showAll="true"
            allLabel="全部"
            :allValue="''"
          />
        </div>
      </div>

      <div class="flex justify-center m-y-8 gap-x-12 flex-wrap">
        <MButton type="submit">查詢</MButton>
        <MButton type="button" class="mbtn--gray" @click="resetFilters"
          >清除</MButton
        >
      </div>
    </form>
  </MCard>

  <div class="m-t-12">
    <MCard>
      <div class="flex justify-end gap-x-12 flex-wrap">
        <MButton @click="navigateToAddOwner">新增店家負責人</MButton>
        <MButton @click="navigateToAddEditor">新增店家編輯</MButton>

        <MButton :disabled="!canActivate" @click="doActivateSelected"
          >啟用</MButton
        >
        <MButton :disabled="!canDeactivate" @click="doDeactivateSelected"
          >停用</MButton
        >
        <MButton
          class="mbtn--red"
          :disabled="!canDelete"
          @click="doDeleteSelected"
          >刪除</MButton
        >
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
          <template #cell-email="{ item }">
            <span class="clickable" @click="navigateToDetail(item)">
              {{ item.email || item.username || '-' }}
            </span>
          </template>

          <template #cell-status="{ item }">
            <span :class="statusBadgeClass(item)">{{ statusText(item) }}</span>
          </template>

          <template #cell-roles="{ item }">
            <span>{{ roleText(item) }}</span>
          </template>

          <template #cell-stores="{ item }">
            <span>{{ storeText(item) }}</span>
          </template>

          <template #cell-lastLoginAt="{ item }">
            <DateFormatter
              v-if="item.lastLoginAt"
              :date="item.lastLoginAt"
              format="YYYY-MM-DD HH:mm:ss"
            />
            <span v-else>-</span>
          </template>

          <template #cell-createdAt="{ item }">
            <DateFormatter
              v-if="item.createdAt"
              :date="item.createdAt"
              format="YYYY-MM-DD HH:mm:ss"
            />
            <span v-else>-</span>
          </template>

          <template #cell-actions="{ item }">
            <div class="flex gap-x-8">
              <MButton size="sm" @click="navigateToDetail(item)">詳情</MButton>
              <MButton size="sm" @click="doResetPassword(item)"
                >重設密碼</MButton
              >
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
            :totalItems="filteredList.length"
            @update:pageLimitSize="pageLimitSize = $event"
          />
        </div>
      </template>
    </MCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import * as yup from 'yup';

import { usePagination } from '@/hook/usePagination';
import { useSearchPage } from '@/hook/useSearchPage';
import { compareByKeySmart } from '@/utils/sortUtils';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import NoData from '@/components/common/NoData.vue';
import Pagination from '@/components/common/Pagination.vue';
import ReportTable from '@/components/common/ReportTable.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import DateFormatter from '@/components/common/DateFormatter.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { useDialogStore, useAuthStore } from '@/stores';

import {
  getAllAdminUsers,
  queryAdminUsers,
  activateAdminUser,
  deactivateAdminUser,
  deleteAdminUser,
  resetAdminUserPassword,
} from '@/services/adminUserService';

import { getStoreOptions } from '@/services/adminStoreService';

interface SelectOption {
  label: string;
  value: any;
  description?: string;
}

const router = useRouter();
const dialogStore = useDialogStore();
const authStore = useAuthStore();
const currentUserId = computed(() => authStore.user?.id ?? authStore.user?.userId ?? '');

/* list hook */
const { list, hasData, isSearch, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

/* store options */
const storeOptions = ref<SelectOption[]>([]);

const mapEnumOptionsToSelect = (arr: any[] = []): SelectOption[] =>
  arr.map((x) => ({
    label: x?.label ?? '',
    value: x?.value ?? '',
    ...(x?.description ? { description: x.description } : {}),
  }));

const loadStoreOptions = async () => {
  await executeApi<any[]>({
    fn: async () => getStoreOptions({ activeOnly: true }),
    onSuccess: (data) => {
      storeOptions.value = mapEnumOptionsToSelect(
        Array.isArray(data) ? data : []
      );
    },
  });
};

/* search schema */
const schema = yup.object({
  keyword: yup.string().nullable(),
  status: yup.string().nullable(),
  storeId: yup.string().nullable(),
  roleCode: yup.string().nullable(),
});

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

const { errors, handleSubmit, setValues, defineField } = useForm({
  validationSchema: schema,
  initialValues: {
    keyword: '',
    status: '',
    storeId: '',
    roleCode: '',
  },
});

const [keyword] = defineField('keyword');
const [status] = defineField('status');
const [storeId] = defineField('storeId');
const [roleCode] = defineField('roleCode');

const resetFilters = async () => {
  setValues({ keyword: '', status: '', storeId: '', roleCode: '' });
  await onSubmit();
};

/* helpers */
const statusText = (u: any) => {
  const s = u?.status;
  if (!s) return '-';
  if (s === 'ACTIVE') return '啟用';
  if (s === 'INACTIVE') return '停用';
  if (s === 'PENDING') return '待審核';
  return String(s);
};

const statusBadgeClass = (u: any) => {
  const s = u?.status;
  if (s === 'ACTIVE') return 'badge badge--green';
  if (s === 'INACTIVE') return 'badge badge--gray';
  if (s === 'PENDING') return 'badge badge--orange';
  return 'badge badge--gray';
};

const ROLE_LABEL: Record<string, string> = {
  ROLE_ADMIN: '系統管理員',
  ROLE_STORE_OWNER: '店家負責人',
  ROLE_STORE_EDITOR: '店家編輯',
};

const roleText = (u: any) => {
  const roles = u?.roles;
  if (!Array.isArray(roles) || roles.length === 0) return '-';
  return roles
    .map((r: any) => {
      const code = typeof r === 'string' ? r : (r?.code ?? r?.name ?? '');
      return ROLE_LABEL[code] || code;
    })
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

/* filtered list — now handled server-side via queryAdminUsers */
const filteredList = computed(() => list.value ?? []);

/* sorting */
const sortKey = ref('');
const sortOrder = ref<'asc' | 'desc' | ''>('asc');

const handleSort = ({ key, order }: any) => {
  sortKey.value = key;
  sortOrder.value = order;
  goToPage(1);
};

const sortedList = computed(() => {
  if (!sortKey.value || !sortOrder.value) return filteredList.value;
  const arr = [...filteredList.value];
  arr.sort((a: any, b: any) =>
    compareByKeySmart(a, b, sortKey.value, sortOrder.value as 'asc' | 'desc', {
      type: 'auto',
      mode: 'big5',
      locale: 'zh-TW',
    })
  );
  return arr;
});

/* pagination */
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

/* columns */
const columns = [
  { field: 'email', label: 'Email/帳號', width: 220, sortable: true },
  { field: 'displayName', label: '顯示名稱', width: 160, sortable: true },
  { field: 'roles', label: '角色', width: 220 },
  { field: 'stores', label: '店家', width: 220 },
  { field: 'status', label: '狀態', width: 110, sortable: true },
  { field: 'lastLoginAt', label: '最後登入', width: 170, sortable: true },
  { field: 'createdAt', label: '建立時間', width: 170, sortable: true },
  { field: 'actions', label: '操作', width: 220 },
];

/* load list */
const fetchList = async () => {
  const condition = {
    keyword: keyword.value?.trim() || undefined,
    status: status.value?.trim() || undefined,
    storeId: storeId.value?.trim() || undefined,
    roleCode: roleCode.value?.trim() || undefined,
  };
  await query(() => queryAdminUsers({ condition }));
  goToPage(1);
};

const onSubmit = handleSubmit(async () => {
  await fetchList();
  isSearch.value = true;
});

/* selection & bulk actions */
const selectedIds = ref<string[]>([]);
const selectedRows = computed(() =>
  (list.value || []).filter((x: any) => selectedIds.value.includes(x.id))
);

const canActivate = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every((u: any) => u?.status === 'INACTIVE')
);

const canDeactivate = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every(
      (u: any) =>
        u?.status === 'ACTIVE' && String(u?.id) !== String(currentUserId.value)
    )
);

const canDelete = computed(() => selectedRows.value.length > 0);

const doActivateSelected = async () => {
  if (!canActivate.value) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '只有「停用(INACTIVE)」的帳號才能啟用。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await dialogStore.openConfirmDialog({
    title: '啟用確認',
    message: '確定要啟用選中的帳號嗎？',
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

      selectedIds.value = [];
      await fetchList();
    },
    showSuccessDialog: false,
  });
};

const doDeactivateSelected = async () => {
  const selfIncluded = selectedRows.value.some(
    (u: any) => String(u?.id) === String(currentUserId.value)
  );
  if (selfIncluded) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '不可停用自己的帳號。',
      iconType: 'warning',
    });
    return;
  }

  if (!canDeactivate.value) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '只有「啟用(ACTIVE)」的帳號才能停用。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await dialogStore.openConfirmDialog({
    title: '停用確認',
    message: '確定要停用選中的帳號嗎？',
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

      selectedIds.value = [];
      await fetchList();
    },
    showSuccessDialog: false,
  });
};

const doDeleteSelected = async () => {
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

      selectedIds.value = [];
      await fetchList();
    },
    showSuccessDialog: false,
  });
};

const doResetPassword = async (item: any) => {
  const userId = item?.id;
  if (!userId) return;

  const ok = await dialogStore.openConfirmDialog({
    title: '重設密碼確認',
    message: '確定要重設此帳號密碼嗎？',
  });
  if (!ok) return;

  await executeApi<{ newPassword: string }>({
    fn: async () => resetAdminUserPassword(userId),
    onSuccess: async (data) => {
      await dialogStore.openInfoDialog({
        title: '新密碼',
        message: `新密碼：${data?.newPassword || '-'}`,
        iconType: 'success',
      });
    },
    showSuccessDialog: false,
  });
};

/* navigation */
const navigateToDetail = (item: any) =>
  router.push(`/home/admin-users/${item.id}`);
const navigateToAddOwner = () => router.push('/home/admin-users/add-owner');
const navigateToAddEditor = () => router.push('/home/admin-users/add-editor');

onMounted(async () => {
  await loadStoreOptions();
  await fetchList();
  isSearch.value = true;
});
</script>

<style scoped></style>

<!-- src/views/referral/AdminReferralCodeList.vue -->
<template>
  <MCard>
    <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
      <FormTitle title="推薦碼管理" />

      <ReferralCodeSearchForm
        :scope-options="scopeOptions"
        :enabled-options="enabledOptions"
        :store-options="storeOptions"
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
      <div class="referral-code-list__toolbar">
        <MButton @click="navigateToAdd">
          <font-awesome-icon icon="fa-plus" class="m-r-4" />
          新增
        </MButton>

        <MButton
          class="mbtn--red"
          :disabled="!canDelete"
          @click="deleteSelected"
        >
          <font-awesome-icon icon="fa-trash" class="m-r-4" />
          刪除
        </MButton>

        <MButton :disabled="!canDisable" @click="disableSelected">
          <font-awesome-icon icon="fa-ban" class="m-r-4" />
          停用
        </MButton>

        <MButton :disabled="!canEnable" @click="enableSelected">
          <font-awesome-icon icon="fa-circle-check" class="m-r-4" />
          啟用
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
          <template #cell-code="{ item }">
            <div class="referral-code-list__code-cell">
              <span class="clickable" @click="navigateToEdit(item.id)">
                {{ item.code || '-' }}
              </span>

              <button
                v-if="item.code"
                type="button"
                class="referral-code-list__copy-btn"
                title="複製推薦碼"
                @click.stop="copyCode(item.code)"
              >
                <font-awesome-icon icon="fa-copy" />
              </button>
            </div>
          </template>

          <template #cell-enabled="{ item }">
            <span :class="enabledBadgeClass(item.enabled)">
              {{ enabledText(item.enabled) }}
            </span>
          </template>

          <template #cell-createdAt="{ item }">
            <span>{{ formatDateTime(item.createdAt) }}</span>
          </template>

          <template #cell-updatedAt="{ item }">
            <span>{{ formatDateTime(item.updatedAt) }}</span>
          </template>

          <template #cell-actions="{ item }">
            <div class="referral-code-list__actions">
              <MButton size="sm" @click="openRecords(item)">
                <font-awesome-icon icon="fa-clock-rotate-left" class="m-r-4" />
                使用記錄
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
            :totalItems="sortedList.length"
            @update:pageLimitSize="handlePageLimitSizeChange"
          />
        </div>
      </template>
    </MCard>
  </div>

  <!-- 複製推薦碼 Toast -->
  <div v-if="copyToast" class="referral-code-list__toast">
    {{ copyToast }}
  </div>

  <!-- 使用記錄 Dialog -->
  <Dialog
    :isOpen="recordsOpen"
    customClass="dialog--records"
    @close="closeRecordsDialog"
  >
    <div class="referral-code-records">
      <div class="referral-code-records__head">
        <div>
          <p class="referral-code-records__title">
            使用記錄 - {{ currentRow?.code || '-' }}
          </p>
          <p class="referral-code-records__sub">
            查看此推薦碼的使用者、訂單與使用時間。
          </p>
        </div>

        <MButton class="mbtn--gray" @click="closeRecordsDialog"> 關閉 </MButton>
      </div>

      <NoData v-if="records.length === 0" message="尚無使用記錄" />

      <ReportTable
        v-else
        :columns="recordColumns"
        :items="records"
        row-key="id"
        :useWidthClass="true"
      >
        <template #cell-createdAt="{ item }">
          <span>{{ formatDateTime(item.createdAt) }}</span>
        </template>
      </ReportTable>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
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
import Dialog from '@/components/common/Dialog.vue';

import ReferralCodeSearchForm from '@/components/referralCode/ReferralCodeSearchForm.vue';

import { executeApi } from '@/utils/executeApiUtils';

import {
  getAllReferralCodes,
  getMyStoreReferralCodes,
  getReferralCodesByStoreId,
  updateReferralCode,
  deleteReferralCode,
  getReferralCodeRecords,
} from '@/services/adminReferralCodeService';
import { getStoreOptions, toSelectOptions } from '@/services/adminStoreService';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

interface SelectOption {
  label: string;
  value: any;
}

const router = useRouter();

/* ==============================
 * Form
 * ============================== */
const formRef = ref<FormContext | null>(null);

const initValues = ref({
  scope: 'MY_STORE',
  storeId: '',
  codeKeyword: '',
  enabled: '',
});

/* ==============================
 * Search Hook
 * ============================== */
const { list, hasData, isSearch, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

/* ==============================
 * Select Options
 * ============================== */
const scopeOptions = ref<SelectOption[]>([
  { label: '我的店家', value: 'MY_STORE' },
  { label: '指定店家', value: 'STORE' },
  { label: '全部（Admin）', value: 'ALL' },
]);

const enabledOptions = ref<SelectOption[]>([
  { label: '全部', value: '' },
  { label: '啟用', value: true },
  { label: '停用', value: false },
]);

const storeOptions = ref<SelectOption[]>([]);

const loadSelectOptions = async () => {
  await executeApi({
    fn: async () => getStoreOptions({ activeOnly: true }),
    onSuccess: (data: any) => {
      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];

      storeOptions.value = toSelectOptions(list);
    },
    showSuccessDialog: false,
  });
};

/* ==============================
 * Utils
 * ============================== */
const formatDateTime = (v?: string) => {
  if (!v) return '-';

  return String(v).replace('T', ' ');
};

const enabledText = (v: any) =>
  v === true ? '啟用' : v === false ? '停用' : '-';

const enabledBadgeClass = (v: any) => {
  if (v === true) return 'badge badge--green';
  if (v === false) return 'badge badge--gray';

  return 'badge badge--gray';
};

/* ==============================
 * Sorting / Filter
 * ============================== */
const sortKey = ref('');
const sortOrder = ref<'asc' | 'desc' | ''>('asc');

const handleSort = ({ key, order }: any) => {
  sortKey.value = key;
  sortOrder.value = order;
  goToPage(1);
};

const filteredList = computed(() => {
  const values = (formRef.value?.values || initValues.value) as any;

  const kw = String(values.codeKeyword || '').trim();
  const enabled = values.enabled;

  return list.value.filter((row: any) => {
    const passKw = !kw ? true : String(row.code || '').includes(kw);
    const passEnabled =
      enabled === '' ? true : Boolean(row.enabled) === Boolean(enabled);

    return passKw && passEnabled;
  });
});

const sortedList = computed(() => {
  if (!sortKey.value || !sortOrder.value) return filteredList.value;

  const arr = [...filteredList.value];

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
 * Table Columns
 * ============================== */
const columns = [
  { field: 'code', label: '推薦碼', width: 220, sortable: true },
  { field: 'storeId', label: '店家ID', width: 220, sortable: true },
  { field: 'enabled', label: '狀態', width: 110, sortable: true },
  { field: 'usageCount', label: '使用次數', width: 110, sortable: true },
  { field: 'updatedAt', label: '更新時間', width: 160, sortable: true },
  { field: 'createdAt', label: '建立時間', width: 160, sortable: true },
  { field: 'actions', label: '操作', width: 140 },
];

const recordColumns = [
  { field: 'id', label: 'ID', width: 220 },
  { field: 'userId', label: '使用者ID', width: 220 },
  { field: 'orderId', label: '訂單ID', width: 220 },
  { field: 'createdAt', label: '使用時間', width: 160 },
];

/* ==============================
 * Query
 * ============================== */
const onSubmit = async (values: any) => {
  await query(async () => {
    if (values.scope === 'ALL') {
      return await getAllReferralCodes();
    }

    if (values.scope === 'STORE') {
      if (!values.storeId) return { success: true, data: [] } as any;

      return await getReferralCodesByStoreId(values.storeId);
    }

    return await getMyStoreReferralCodes();
  });

  goToPage(1);
  selectedIds.value = [];
  isSearch.value = true;
};

/* ==============================
 * Selection / Bulk Actions
 * ============================== */
const selectedIds = ref<string[]>([]);

const selectedRows = computed(() =>
  list.value.filter((row: any) => selectedIds.value.includes(row.id)),
);

const canEnable = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every((r: any) => r.enabled === false),
);

const canDisable = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every((r: any) => r.enabled === true),
);

const canDelete = computed(() => selectedRows.value.length > 0);

const refresh = async () => {
  const values = formRef.value?.values || initValues.value;

  await onSubmit(values);
};

const enableSelected = async () => {
  if (!canEnable.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '只有「停用」的推薦碼才能啟用。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '啟用確認',
    message: `確定要啟用選中的 ${selectedIds.value.length} 筆推薦碼嗎？`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(
        selectedRows.value.map((row: any) =>
          updateReferralCode(row.id, { enabled: true }),
        ),
      ),
    onSuccess: async (results: any[]) => {
      const okCount = results.filter((x) => x.status === 'fulfilled').length;
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

const disableSelected = async () => {
  if (!canDisable.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '只有「啟用」的推薦碼才能停用。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '停用確認',
    message: `確定要停用選中的 ${selectedIds.value.length} 筆推薦碼嗎？`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(
        selectedRows.value.map((row: any) =>
          updateReferralCode(row.id, { enabled: false }),
        ),
      ),
    onSuccess: async (results: any[]) => {
      const okCount = results.filter((x) => x.status === 'fulfilled').length;
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

const deleteSelected = async () => {
  if (!canDelete.value) return;

  const ok = await openConfirmDialog({
    title: '刪除確認',
    message: `確定要刪除選中的 ${selectedIds.value.length} 筆推薦碼嗎？（刪除後無法復原）`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(selectedIds.value.map((id) => deleteReferralCode(id))),
    onSuccess: async (results: any[]) => {
      const okCount = results.filter((x) => x.status === 'fulfilled').length;
      const failCount = results.length - okCount;

      await openInfoDialog({
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
 * Navigation
 * ============================== */
const navigateToEdit = (id: string) => {
  router.push(`/home/referral-codes/edit/${id}`);
};

const navigateToAdd = () => {
  router.push('/home/referral-codes/add');
};

/* ==============================
 * Clipboard Copy
 * ============================== */
const copyToast = ref('');
const copyToastTimer = ref<ReturnType<typeof setTimeout> | null>(null);

const copyCode = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code);
    copyToast.value = `已複製「${code}」到剪貼板`;
  } catch {
    copyToast.value = '複製失敗，請手動複製';
  }

  if (copyToastTimer.value) clearTimeout(copyToastTimer.value);

  copyToastTimer.value = setTimeout(() => {
    copyToast.value = '';
  }, 2000);
};

/* ==============================
 * Records Dialog
 * ============================== */
const recordsOpen = ref(false);
const currentRow = ref<any>(null);
const records = ref<any[]>([]);

const closeRecordsDialog = () => {
  recordsOpen.value = false;
  currentRow.value = null;
  records.value = [];
};

const openRecords = async (row: any) => {
  currentRow.value = row;
  recordsOpen.value = true;
  records.value = [];

  await executeApi({
    fn: async () => getReferralCodeRecords(row.id),
    onSuccess: (data: any) => {
      records.value = Array.isArray(data) ? data : [];
    },
    showSuccessDialog: false,
  });
};

/* ==============================
 * Lifecycle
 * ============================== */
onMounted(async () => {
  await loadSelectOptions();
  await onSubmit(initValues.value);
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as tokens;

.referral-code-list {
  &__toolbar {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__code-cell {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  &__copy-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 999px;
    background: color.mix(tokens.$brand-light, #fff, 25%);
    color: tokens.$brand-dark;
    cursor: pointer;
    font-size: 12px;
    transition:
      opacity 0.15s,
      transform 0.15s;

    &:hover {
      opacity: 0.8;
      transform: translateY(-1px);
    }
  }

  &__actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    z-index: 9999;
    padding: 8px 20px;
    border-radius: 20px;
    background: #1f2937;
    color: #fff;
    font-size: 13px;
    pointer-events: none;
    transform: translateX(-50%);
  }
}

.referral-code-records {
  padding: 16px;

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }

  &__title {
    margin: 0;
    color: tokens.$form-text;
    font-size: 16px;
    font-weight: 800;
    line-height: 1.4;
  }

  &__sub {
    margin: 4px 0 0;
    color: tokens.$form-muted;
    font-size: 13px;
    line-height: 1.5;
  }
}

@media (max-width: 640px) {
  .referral-code-list {
    &__toolbar {
      justify-content: flex-start;
    }
  }

  .referral-code-records {
    &__head {
      flex-direction: column;
    }
  }
}
</style>

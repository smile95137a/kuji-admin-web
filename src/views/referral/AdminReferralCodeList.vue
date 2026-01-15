<template>
  <MCard>
    <Form
      ref="formRef"
      :initial-values="initValues"
      @submit="onSubmit"
      v-slot="{ values, setFieldValue }"
    >
      <FormTitle title="推薦碼管理" />

      <div class="flex flex-wrap">
        <!-- 查詢範圍 -->
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="查詢範圍"
            :modelValue="values.scope"
            @update:modelValue="setFieldValue('scope', $event)"
            :options="scopeOptions"
          />
        </div>

        <!-- storeId（指定店家用） -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="店家 ID（指定店家用）"
            :modelValue="values.storeId"
            @update:modelValue="setFieldValue('storeId', $event)"
            placeholder="輸入 storeId"
            :disabled="values.scope !== 'STORE'"
          />
        </div>

        <!-- code 關鍵字（前端過濾） -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="推薦碼關鍵字（前端過濾）"
            :modelValue="values.codeKeyword"
            @update:modelValue="setFieldValue('codeKeyword', $event)"
            placeholder="輸入推薦碼關鍵字"
          />
        </div>

        <!-- 狀態（enabled） -->
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="狀態"
            :modelValue="values.enabled"
            @update:modelValue="setFieldValue('enabled', $event)"
            :options="enabledOptions"
            :showAll="true"
            allLabel="全部"
            :allValue="''"
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
        <MButton @click="navigateToAdd">新增</MButton>

        <MButton
          class="mbtn--red"
          :disabled="!canDelete"
          @click="deleteSelected"
        >
          刪除
        </MButton>

        <MButton :disabled="!canDisable" @click="disableSelected">停用</MButton>
        <MButton :disabled="!canEnable" @click="enableSelected">啟用</MButton>
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
            <span class="clickable" @click="navigateToEdit(item.id)">
              {{ item.code || '-' }}
            </span>
          </template>

          <template #cell-enabled="{ item }">
            <span>{{ enabledText(item.enabled) }}</span>
          </template>

          <template #cell-createdAt="{ item }">
            <span>{{ formatDateTime(item.createdAt) }}</span>
          </template>

          <template #cell-updatedAt="{ item }">
            <span>{{ formatDateTime(item.updatedAt) }}</span>
          </template>

          <template #cell-actions="{ item }">
            <div class="flex gap-x-8 flex-wrap">
              <MButton size="sm" @click="openRecords(item)">使用記錄</MButton>
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
            @update:pageLimitSize="pageLimitSize = $event"
          />
        </div>
      </template>
    </MCard>
  </div>

  <!-- 使用記錄 Dialog -->
  <Dialog
    :isOpen="recordsOpen"
    :customClass="'dialog--records'"
    @close="recordsOpen = false"
  >
    <div class="p-12">
      <div class="flex justify-between items-center m-b-12">
        <p class="form__text form__text--title">
          使用記錄 - {{ currentRow?.code || '-' }}
        </p>
        <MButton class="mbtn--gray" @click="recordsOpen = false">關閉</MButton>
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
import Dialog from '@/components/common/Dialog.vue';

import { useDialogStore } from '@/stores';
import { executeApi } from '@/utils/executeApiUtils';

import {
  getAllReferralCodes,
  getMyStoreReferralCodes,
  getReferralCodesByStoreId,
  updateReferralCode,
  deleteReferralCode,
  getReferralCodeRecords,
} from '@/services/adminReferralCodeService';

/* ==============================
 * Router / Store
 * ============================== */
const router = useRouter();
const dialogStore = useDialogStore();

/* ==============================
 * Form & InitValues
 * ============================== */
const formRef = ref<FormContext | null>(null);

const initValues = ref<any>({
  scope: 'MY_STORE', // MY_STORE | STORE | ALL
  storeId: '',
  codeKeyword: '',
  enabled: '', // '' | true | false
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
const scopeOptions = ref([
  { label: '我的店家', value: 'MY_STORE' },
  { label: '指定店家', value: 'STORE' },
  { label: '全部（Admin）', value: 'ALL' },
]);

const enabledOptions = ref([
  { label: '全部', value: '' },
  { label: '啟用', value: true },
  { label: '停用', value: false },
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

const enabledText = (v: any) =>
  v === true ? '啟用' : v === false ? '停用' : '-';

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
    // scope 決定打哪支 API（後端沒有條件查詢就用這種方式）
    if (values.scope === 'ALL') {
      return await getAllReferralCodes();
    }
    if (values.scope === 'STORE') {
      // 不填就回空（避免打錯）
      if (!values.storeId) return { success: true, data: [] } as any;
      return await getReferralCodesByStoreId(values.storeId);
    }
    // MY_STORE
    return await getMyStoreReferralCodes();
  });

  goToPage(1);
  selectedIds.value = [];
};

/* ==============================
 * Selection / Bulk Actions
 * ============================== */
const selectedIds = ref<string[]>([]);

const selectedRows = computed(() =>
  list.value.filter((row: any) => selectedIds.value.includes(row.id))
);

const canEnable = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every((r: any) => r.enabled === false)
);

const canDisable = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every((r: any) => r.enabled === true)
);

const canDelete = computed(() => selectedRows.value.length > 0);

const refresh = async () => {
  const values = formRef.value?.values || initValues.value;
  await onSubmit(values);
};

const enableSelected = async () => {
  if (!canEnable.value) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '只有「停用」的推薦碼才能啟用。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await dialogStore.openConfirmDialog({
    title: '啟用確認',
    message: `確定要啟用選中的 ${selectedIds.value.length} 筆推薦碼嗎？`,
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(
        selectedRows.value.map((row: any) =>
          updateReferralCode(row.id, { enabled: true })
        )
      ),
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

const disableSelected = async () => {
  if (!canDisable.value) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '只有「啟用」的推薦碼才能停用。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await dialogStore.openConfirmDialog({
    title: '停用確認',
    message: `確定要停用選中的 ${selectedIds.value.length} 筆推薦碼嗎？`,
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(
        selectedRows.value.map((row: any) =>
          updateReferralCode(row.id, { enabled: false })
        )
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

const deleteSelected = async () => {
  if (!canDelete.value) return;

  const ok = await dialogStore.openConfirmDialog({
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
 * Navigation
 * ============================== */
const navigateToEdit = (id: string) =>
  router.push(`/home/referral-codes/edit/${id}`);
const navigateToAdd = () => router.push('/home/referral-codes/add');

/* ==============================
 * Records Dialog
 * ============================== */
const recordsOpen = ref(false);
const currentRow = ref<any>(null);
const records = ref<any[]>([]);

const openRecords = async (row: any) => {
  currentRow.value = row;
  recordsOpen.value = true;
  records.value = [];

  await executeApi({
    fn: async () => getReferralCodeRecords(row.id),
    onSuccess: (data: any) => {
      records.value = data || [];
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

<style scoped></style>

<!-- src/views/prizeBox/AdminPrizeBox.vue -->
<template>
  <MCard>
    <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
      <FormTitle title="賞品盒管理" />

      <AdminPrizeBoxSearchForm />

      <div class="flex justify-center m-y-8 gap-x-12 flex-wrap">
        <MButton type="submit">查詢</MButton>

        <MButton type="button" variant="secondary" @click="resetAll">
          清除
        </MButton>
      </div>
    </Form>
  </MCard>

  <div class="m-t-12">
    <MCard>
      <template v-if="!hasData">
        <NoData :message="noDataMessage" />
      </template>

      <template v-else>
        <ReportTable
          class="m-t-12"
          :columns="columns"
          :items="currentPageItems"
          :row-key="rowKey"
          :useWidthClass="true"
          :sort-key="sortKey"
          :sort-order="sortOrder"
          @sort="handleSort"
        >
          <!-- summary: 店家名稱 -->
          <template v-if="mode === 'summary'" #cell-storeName="{ item }">
            <span>{{ item.storeName || item.storeId || '-' }}</span>
          </template>

          <!-- detail: 商品名稱 -->
          <template v-if="mode === 'detail'" #cell-prizeName="{ item }">
            <span>{{ item.prizeName || item.productName || '-' }}</span>
          </template>

          <template #cell-quantity="{ item }">
            <span>{{ item.quantity ?? item.count ?? 0 }}</span>
          </template>

          <template #cell-updatedAt="{ item }">
            <span>{{ formatDateTime(item.updatedAt) }}</span>
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
import { ref, computed } from 'vue';
import { Form, FormContext } from 'vee-validate';

import { usePagination } from '@/hook/usePagination';
import { useSearchPage } from '@/hook/useSearchPage';
import { compareByKeySmart } from '@/utils/sortUtils';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import NoData from '@/components/common/NoData.vue';
import Pagination from '@/components/common/Pagination.vue';
import ReportTable from '@/components/common/ReportTable.vue';
import FormTitle from '@/components/common/FormTitle.vue';

import AdminPrizeBoxSearchForm from '@/components/prizeBox/AdminPrizeBoxSearchForm.vue';

import { executeApi } from '@/utils/executeApiUtils';
import {
  getPrizeBoxByUserId,
  getPrizeBoxSummaryByStore,
} from '@/services/adminPrizeBoxService';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

/* ==============================
 * Form
 * ============================== */
const formRef = ref<FormContext | null>(null);

const initValues = ref<any>({
  userId: '',
  mode: 'summary',
});

/* ==============================
 * Search Hook
 * ============================== */
const { list, hasData, isSearch, noDataMessage } = useSearchPage({
  useLocalList: true,
});

/* ==============================
 * Mode
 * ============================== */
const mode = computed<'summary' | 'detail'>(() => {
  const value = String(formRef.value?.values?.mode || initValues.value.mode);
  return value === 'detail' ? 'detail' : 'summary';
});

/* ==============================
 * Utils
 * ============================== */
const formatDateTime = (value?: string) => {
  if (!value) return '-';
  return String(value).replace('T', ' ');
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
 * Table config
 * ============================== */
const rowKey = computed(() => (mode.value === 'summary' ? 'storeId' : 'id'));

const columns = computed(() => {
  if (mode.value === 'summary') {
    return [
      { field: 'storeName', label: '店家', width: 60, sortable: true },
      { field: 'storeId', label: 'Store ID', width: 60, sortable: true },
      { field: 'quantity', label: '數量', width: 60, sortable: true },
      { field: 'updatedAt', label: '更新時間', width: 60, sortable: true },
    ];
  }

  return [
    { field: 'prizeName', label: '獎品/商品', width: 60, sortable: true },
    { field: 'storeName', label: '店家', width: 60, sortable: true },
    { field: 'quantity', label: '數量', width: 60, sortable: true },
    { field: 'createdAt', label: '建立時間', width: 60, sortable: true },
    { field: 'updatedAt', label: '更新時間', width: 60, sortable: true },
  ];
});

/* ==============================
 * Submit
 * ============================== */
const onSubmit = async (values: any) => {
  const userId = String(values?.userId || '').trim();
  const currentMode = String(values?.mode || 'summary');

  if (!userId) {
    await openInfoDialog({
      title: '提示訊息',
      message: '請先選擇會員',
      iconType: 'warning',
    });
    return;
  }

  await executeApi({
    fn: async () => {
      return currentMode === 'detail'
        ? getPrizeBoxByUserId(userId)
        : getPrizeBoxSummaryByStore(userId);
    },
    onSuccess: async (res: any) => {
      const data = res?.data ?? res ?? [];

      list.value = Array.isArray(data) ? data : [];
      isSearch.value = true;
      goToPage(1);

      if (list.value.length === 0) {
        await openInfoDialog({
          title: '提示訊息',
          message: '查無資料',
          iconType: 'warning',
        });
      }
    },
    showSuccessDialog: false,
  });
};

const resetAll = () => {
  formRef.value?.resetForm?.({
    values: {
      userId: '',
      mode: 'summary',
    },
  });

  list.value = [];
  isSearch.value = false;
  sortKey.value = '';
  sortOrder.value = 'asc';
  pageLimitSize.value = 10;
  goToPage(1);
};
</script>

<style scoped></style>

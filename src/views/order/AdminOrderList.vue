<!-- src/views/order/AdminOrderList.vue -->
<template>
  <MCard>
    <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
      <FormTitle title="訂單管理" />

      <AdminOrderSearchForm :status-options="statusOptions" />

      <div class="flex justify-center m-y-8">
        <MButton type="submit">查詢</MButton>
      </div>
    </Form>
  </MCard>

  <div class="m-t-12">
    <MCard>
      <div class="flex justify-end gap-x-12 flex-wrap">
        <MButton :disabled="!canPrepare" @click="prepareSelected">
          準備出貨
        </MButton>

        <MButton :disabled="!canComplete" @click="completeSelected">
          完成
        </MButton>

        <MButton
          class="mbtn--red"
          :disabled="!canCancel"
          @click="openCancelDialog('bulk')"
        >
          取消
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
          <!-- 訂單編號 -->
          <template #cell-orderNo="{ item }">
            <span class="clickable" @click="navigateToDetail(item)">
              {{ item.orderNo || item.id || '-' }}
            </span>
          </template>

          <!-- 玩家 -->
          <template #cell-user="{ item }">
            <span>
              {{ item.userNickname || '-' }}
              <template v-if="item.userEmail"> / {{ item.userEmail }}</template>
            </span>
          </template>

          <!-- 店家 -->
          <template #cell-store="{ item }">
            <span>{{ item.storeName || item.storeId || '-' }}</span>
          </template>

          <!-- 取件資訊 -->
          <template #cell-recipient="{ item }">
            <span>
              {{ item.recipientName || '-' }}
              <template v-if="item.recipientPhone">
                / {{ item.recipientPhone }}</template
              >
            </span>
          </template>

          <!-- 配送方式 -->
          <template #cell-shippingMethodName="{ item }">
            <span>{{
              item.shippingMethodName || item.shippingMethod || '-'
            }}</span>
          </template>

          <!-- 狀態 -->
          <template #cell-shippingStatusName="{ item }">
            <span>{{
              item.shippingStatusName || statusText(item.shippingStatus)
            }}</span>
          </template>

          <!-- 獎品數量 -->
          <template #cell-prizeCount="{ item }">
            <span>{{ item.prizeCount ?? item.totalItems ?? '-' }}</span>
          </template>

          <!-- 金額 -->
          <template #cell-totalAmount="{ item }">
            <span>{{ formatMoney(item.totalAmount) }}</span>
          </template>

          <!-- 建立時間 -->
          <template #cell-createdAt="{ item }">
            <span>{{ formatDateTime(item.createdAt) }}</span>
          </template>

          <!-- 操作 -->
          <template #cell-actions="{ item }">
            <div class="flex gap-x-8 flex-wrap">
              <MButton size="sm" @click="navigateToDetail(item)">明細</MButton>

              <MButton
                size="sm"
                variant="secondary"
                :disabled="!canPrepareRow(item)"
                @click="prepareOne(item)"
              >
                準備出貨
              </MButton>

              <MButton
                size="sm"
                variant="secondary"
                :disabled="!canShipRow(item)"
                @click="openShipDialog(item)"
              >
                出貨
              </MButton>

              <MButton
                size="sm"
                variant="secondary"
                :disabled="!canCompleteRow(item)"
                @click="completeOne(item)"
              >
                完成
              </MButton>

              <MButton
                size="sm"
                variant="danger"
                :disabled="!canCancelRow(item)"
                @click="openCancelDialog('single', item)"
              >
                取消
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

  <!-- 出貨 Dialog -->
  <Dialog
    :isOpen="shipOpen"
    customClass="dialog--orderShip"
    @close="closeShipDialog"
  >
    <div class="orderActionDialog">
      <p class="orderActionDialog__title">訂單出貨</p>

      <div class="orderActionDialog__form">
        <FormInput
          label="物流單號"
          v-model="shipTrackingNo"
          :error="shipTrackingNoError"
          placeholder="請輸入物流單號"
          required
        />

        <FormInput
          label="備註（可選）"
          v-model="shipRemark"
          :error="shipRemarkError"
          placeholder="例如：超商取貨 / 指定時段 / 其他備註"
        />

        <div class="flex justify-center gap-x-12 m-t-12">
          <MButton @click="submitShip">確認出貨</MButton>
          <MButton variant="secondary" @click="closeShipDialog">取消</MButton>
        </div>
      </div>
    </div>
  </Dialog>

  <!-- 取消 Dialog（單筆/多筆共用） -->
  <Dialog
    :isOpen="cancelOpen"
    customClass="dialog--orderCancel"
    @close="closeCancelDialog"
  >
    <div class="orderActionDialog">
      <p class="orderActionDialog__title">取消訂單</p>
      <p class="orderActionDialog__warning">取消訂單後，賞品盒將回到可領取狀態。此操作無法復原。</p>

      <div class="orderActionDialog__form">
        <FormInput
          label="取消原因"
          v-model="cancelReason"
          :error="cancelReasonError"
          placeholder="請輸入取消原因"
          required
        />

        <div class="flex justify-center gap-x-12 m-t-12">
          <MButton class="mbtn--red" @click="submitCancel">確認取消</MButton>
          <MButton variant="secondary" @click="closeCancelDialog">返回</MButton>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
/* ==============================
 * Imports
 * ============================== */
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { Form, FormContext } from 'vee-validate';

import { usePagination } from '@/hook/usePagination';
import { useSearchPage } from '@/hook/useSearchPage';
import { compareByKeySmart } from '@/utils/sortUtils';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import NoData from '@/components/common/NoData.vue';
import Pagination from '@/components/common/Pagination.vue';
import ReportTable from '@/components/common/ReportTable.vue';
import Dialog from '@/components/common/Dialog.vue';
import FormTitle from '@/components/common/FormTitle.vue';
import FormInput from '@/components/common/FormInput.vue';

import AdminOrderSearchForm from '@/components/order/AdminOrderSearchForm.vue';

import { useDialogStore, useAuthStore } from '@/stores';
import { executeApi } from '@/utils/executeApiUtils';

import {
  queryOrders,
  prepareShipping,
  shipOrder,
  completeOrder,
  cancelOrderWithReason,
} from '@/services/adminOrderService';

/* ==============================
 * Types
 * ============================== */
interface SelectOption {
  label: string;
  value: any;
}

/* ==============================
 * Store
 * ============================== */
const router = useRouter();
const dialogStore = useDialogStore();
const authStore = useAuthStore();

const isAdmin = computed(() =>
  (authStore.user?.roles ?? []).includes('ROLE_ADMIN'),
);

/* ==============================
 * Form & InitValues (對應 OrderCondition)
 * ============================== */
const formRef = ref<FormContext | null>(null);

const initValues = ref<any>({
  orderNo: '',
  userKeyword: '',
  shippingMethod: '',
  shippingStatus: '',
  recipientName: '',
  recipientPhone: '',
});

/* ==============================
 * Search Hook (local list)
 * ============================== */
const { list, hasData, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

/* ==============================
 * Select Options
 * ============================== */
const statusOptions = ref<SelectOption[]>([
  { label: '全部', value: '' },
  { label: '待處理(PENDING)', value: 'PENDING' },
  { label: '備貨中(PREPARING)', value: 'PREPARING' },
  { label: '已出貨(SHIPPED)', value: 'SHIPPED' },
  { label: '已完成(COMPLETED)', value: 'COMPLETED' },
  { label: '已取消(CANCELLED)', value: 'CANCELLED' },
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

const formatMoney = (n: any) => {
  const num = Number(n);
  if (Number.isNaN(num)) return n ?? '-';
  return num.toLocaleString('zh-TW');
};

/** 後備 status 文案（通常你會有 shippingStatusName） */
const statusText = (status?: string) =>
  status === 'PENDING'
    ? '待處理'
    : status === 'PREPARING'
      ? '備貨中'
      : status === 'SHIPPED'
        ? '已出貨'
        : status === 'COMPLETED'
          ? '已完成'
          : status === 'CANCELLED'
            ? '已取消'
            : '-';

/** 取訂單 id：避免欄位名不同 */
const getOrderId = (row: any) => {
  if (!row) return '';
  return String(row.id || row.orderId || '').trim();
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

/* ==============================
 * Table Columns (依你的 res)
 * ============================== */
const columns = computed(() => {
  const base = [
    { field: 'orderNo', label: '訂單編號', width: 180, sortable: true },
    { field: 'user', label: '玩家', width: 240, sortable: true },
    ...(isAdmin.value
      ? [{ field: 'store', label: '店家', width: 180, sortable: true }]
      : []),
    { field: 'recipient', label: '收件人', width: 200, sortable: true },
    { field: 'shippingMethodName', label: '配送方式', width: 150, sortable: true },
    { field: 'shippingStatusName', label: '狀態', width: 130, sortable: true },
    { field: 'prizeCount', label: '獎品數量', width: 100, sortable: true },
    { field: 'totalAmount', label: '金額', width: 110, sortable: true },
    { field: 'createdAt', label: '建立時間', width: 170, sortable: true },
    { field: 'actions', label: '操作', width: 420 },
  ];
  return base;
});

/* ==============================
 * Submit (Query)
 * ============================== */
const onSubmit = async (values: any) => {
  const condition: any = { ...values };

  // 清除空值
  Object.keys(condition).forEach((k) => {
    if (
      condition[k] === '' ||
      condition[k] === null ||
      condition[k] === undefined
    ) {
      delete condition[k];
    }
  });

  const req = Object.keys(condition).length > 0 ? { condition } : null;

  await query(async () => {
    const res = await queryOrders(req ?? undefined);
    const d = (res as any)?.data ?? res;

    // 兼容回傳：List / { list } / { data: list }
    if (Array.isArray(d)) return d;
    if (Array.isArray((d as any)?.list)) return (d as any).list;
    if (Array.isArray((res as any)?.list)) return (res as any).list;
    return [];
  });

  goToPage(1);
  selectedIds.value = [];
};

/* ==============================
 * Selection / Bulk Actions
 * ============================== */
const selectedIds = ref<string[]>([]);

const selectedRows = computed(() =>
  list.value.filter((row: any) => selectedIds.value.includes(String(row.id))),
);

const canPrepareRow = (row?: any) =>
  String(row?.shippingStatus ?? row?.status ?? '') === 'PENDING';

const canShipRow = (row?: any) =>
  String(row?.shippingStatus ?? row?.status ?? '') === 'PREPARING';

const canCompleteRow = (row?: any) =>
  String(row?.shippingStatus ?? row?.status ?? '') === 'SHIPPED';

const canCancelRow = (row?: any) =>
  String(row?.shippingStatus ?? row?.status ?? '') === 'PENDING';

const canPrepare = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every((r: any) => canPrepareRow(r)),
);

const canComplete = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every((r: any) => canCompleteRow(r)),
);

const canCancel = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every((r: any) => canCancelRow(r)),
);

const refresh = async () => {
  const values = formRef.value?.values || initValues.value;
  await onSubmit(values);
};

/* ==============================
 * Detail Navigation
 * ============================== */
const navigateToDetail = (item: any) => {
  const orderId = getOrderId(item);
  if (!orderId) return;
  router.push({ name: 'AdminOrderDetail', params: { orderId } });
};

/* ==============================
 * Actions - Prepare / Complete
 * ============================== */
const prepareOne = async (row: any) => {
  if (!canPrepareRow(row)) return;

  const ok = await dialogStore.openConfirmDialog({
    title: '準備出貨確認',
    message: '確定要將訂單更新為「準備出貨」嗎？',
  });
  if (!ok) return;

  await executeApi({
    fn: async () => prepareShipping(getOrderId(row)),
    onSuccess: async () => {
      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '已更新為準備出貨',
        iconType: 'success',
      });
      await refresh();
    },
    showSuccessDialog: false,
  });
};

const prepareSelected = async () => {
  if (!canPrepare.value) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '只有「待處理」的訂單才能準備出貨。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await dialogStore.openConfirmDialog({
    title: '準備出貨確認',
    message: `確定要將選中的 ${selectedIds.value.length} 筆訂單更新為「準備出貨」嗎？`,
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(
        selectedRows.value.map((r: any) => prepareShipping(getOrderId(r))),
      ),
    onSuccess: async (results: any[]) => {
      const okCount = results.filter((x) => x.status === 'fulfilled').length;
      const failCount = results.length - okCount;

      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message:
          failCount > 0
            ? `準備出貨完成：成功 ${okCount}、失敗 ${failCount}`
            : `準備出貨完成：成功 ${okCount}`,
        iconType: failCount > 0 ? 'warning' : 'success',
      });

      await refresh();
    },
    showSuccessDialog: false,
  });
};

const completeOne = async (row: any) => {
  if (!canCompleteRow(row)) return;

  const ok = await dialogStore.openConfirmDialog({
    title: '完成訂單確認',
    message: '確定要將訂單標記為「完成」嗎？',
  });
  if (!ok) return;

  await executeApi({
    fn: async () => completeOrder(getOrderId(row)),
    onSuccess: async () => {
      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '已完成訂單',
        iconType: 'success',
      });
      await refresh();
    },
    showSuccessDialog: false,
  });
};

const completeSelected = async () => {
  if (!canComplete.value) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '只有「已出貨」的訂單才能完成。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await dialogStore.openConfirmDialog({
    title: '完成訂單確認',
    message: `確定要將選中的 ${selectedIds.value.length} 筆訂單標記為「完成」嗎？`,
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(
        selectedRows.value.map((r: any) => completeOrder(getOrderId(r))),
      ),
    onSuccess: async (results: any[]) => {
      const okCount = results.filter((x) => x.status === 'fulfilled').length;
      const failCount = results.length - okCount;

      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message:
          failCount > 0
            ? `完成訂單：成功 ${okCount}、失敗 ${failCount}`
            : `完成訂單：成功 ${okCount}`,
        iconType: failCount > 0 ? 'warning' : 'success',
      });

      await refresh();
    },
    showSuccessDialog: false,
  });
};

/* ==============================
 * Ship Dialog (trackingNo + remark)
 * ============================== */
const shipOpen = ref(false);
const shipOrderId = ref<string>('');
const shipTrackingNo = ref('');
const shipTrackingNoError = ref('');

const shipRemark = ref('');
const shipRemarkError = ref('');

const openShipDialog = (row: any) => {
  if (!canShipRow(row)) return;

  shipOrderId.value = getOrderId(row);
  shipTrackingNo.value = row?.trackingNo || '';
  shipTrackingNoError.value = '';

  shipRemark.value = '';
  shipRemarkError.value = '';

  shipOpen.value = true;
};

const closeShipDialog = () => {
  shipOpen.value = false;
  shipOrderId.value = '';
  shipTrackingNo.value = '';
  shipTrackingNoError.value = '';

  shipRemark.value = '';
  shipRemarkError.value = '';
};

const submitShip = async () => {
  const trackingNo = shipTrackingNo.value?.trim();
  if (!trackingNo) {
    shipTrackingNoError.value = '請輸入物流單號';
    return;
  }

  const ok = await dialogStore.openConfirmDialog({
    title: '出貨確認',
    message: '確定要送出出貨資訊嗎？',
  });
  if (!ok) return;

  const payload: any = { trackingNo };
  const remark = shipRemark.value?.trim();
  if (remark) payload.remark = remark;

  await executeApi({
    fn: async () => shipOrder(shipOrderId.value, payload),
    onSuccess: async () => {
      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '已出貨',
        iconType: 'success',
      });
      closeShipDialog();
      await refresh();
    },
    showSuccessDialog: false,
  });
};

/* ==============================
 * Cancel Dialog (reason)
 * ============================== */
const cancelOpen = ref(false);
const cancelMode = ref<'single' | 'bulk'>('single');
const cancelOrderId = ref<string>('');
const cancelReason = ref('');
const cancelReasonError = ref('');

const openCancelDialog = (mode: 'single' | 'bulk', row?: any) => {
  cancelMode.value = mode;
  cancelOrderId.value = mode === 'single' ? getOrderId(row) : '';
  cancelReason.value = '';
  cancelReasonError.value = '';
  cancelOpen.value = true;
};

const closeCancelDialog = () => {
  cancelOpen.value = false;
  cancelMode.value = 'single';
  cancelOrderId.value = '';
  cancelReason.value = '';
  cancelReasonError.value = '';
};

const submitCancel = async () => {
  if (!cancelReason.value?.trim()) {
    cancelReasonError.value = '請輸入取消原因';
    return;
  }

  if (cancelMode.value === 'bulk' && !canCancel.value) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '只有「待處理」的訂單才能取消。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await dialogStore.openConfirmDialog({
    title: '取消確認',
    message:
      cancelMode.value === 'bulk'
        ? `取消訂單後，賞品盒將回到可領取狀態。確定取消選中的 ${selectedIds.value.length} 筆訂單？`
        : '取消訂單後，賞品盒將回到可領取狀態。確定取消？',
  });
  if (!ok) return;

  const reason = cancelReason.value.trim();

  await executeApi({
    fn: async () => {
      if (cancelMode.value === 'single') {
        return cancelOrderWithReason(cancelOrderId.value, reason);
      }
      return Promise.allSettled(
        selectedRows.value.map((r: any) =>
          cancelOrderWithReason(getOrderId(r), reason),
        ),
      );
    },
    onSuccess: async (results: any) => {
      if (!Array.isArray(results)) {
        await dialogStore.openInfoDialog({
          title: '提示訊息',
          message: '已取消訂單',
          iconType: 'success',
        });
        closeCancelDialog();
        await refresh();
        return;
      }

      const okCount = results.filter((x) => x.status === 'fulfilled').length;
      const failCount = results.length - okCount;

      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message:
          failCount > 0
            ? `取消完成：成功 ${okCount}、失敗 ${failCount}`
            : `取消完成：成功 ${okCount}`,
        iconType: failCount > 0 ? 'warning' : 'success',
      });

      closeCancelDialog();
      await refresh();
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
.orderActionDialog {
  padding: 16px;

  &__title {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  &__warning {
    font-size: 13px;
    color: #d97706;
    margin-bottom: 12px;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}
</style>

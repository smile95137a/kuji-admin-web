<!-- src/views/order/AdminOrderList.vue -->
<template>
  <MCard>
    <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
      <FormTitle title="訂單管理" />

      <AdminOrderSearchForm :status-options="statusOptions" />

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
        <MButton :disabled="!canPrepare" @click="prepareSelected">
          <font-awesome-icon icon="fa-box-open" class="m-r-4" />
          準備出貨
        </MButton>

        <MButton :disabled="!canComplete" @click="completeSelected">
          <font-awesome-icon icon="fa-circle-check" class="m-r-4" />
          完成
        </MButton>

        <MButton
          class="mbtn--red"
          :disabled="!canCancel"
          @click="openCancelDialog('bulk')"
        >
          <font-awesome-icon icon="fa-ban" class="m-r-4" />
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
              <template v-if="item.userEmail">
                / {{ item.userEmail }}
              </template>
            </span>
          </template>

          <!-- 店家 -->
          <template #cell-store="{ item }">
            <span>{{ item.storeName || item.storeId || '-' }}</span>
          </template>

          <!-- 收件人 -->
          <template #cell-recipient="{ item }">
            <span>
              {{ item.recipientName || '-' }}
              <template v-if="item.recipientPhone">
                / {{ item.recipientPhone }}
              </template>
            </span>
          </template>

          <!-- 配送方式 -->
          <template #cell-shippingMethodName="{ item }">
            <span>
              {{
                item.shippingMethodName ||
                shippingMethodText(item.shippingMethod)
              }}
            </span>
          </template>

          <!-- 狀態 -->
          <template #cell-shippingStatusName="{ item }">
            <span :class="statusBadgeClass(item.shippingStatus)">
              {{ item.shippingStatusName || statusText(item.shippingStatus) }}
            </span>
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
                明細
              </MButton>

              <MButton
                size="sm"
                variant="secondary"
                :disabled="!canPrepareRow(item)"
                @click="prepareOne(item)"
              >
                <font-awesome-icon icon="fa-box-open" class="m-r-4" />
                準備出貨
              </MButton>

              <MButton
                size="sm"
                variant="secondary"
                :disabled="!canShipRow(item)"
                @click="openShipDialog(item)"
              >
                <font-awesome-icon icon="fa-truck-fast" class="m-r-4" />
                出貨
              </MButton>

              <MButton
                size="sm"
                variant="secondary"
                :disabled="!canCompleteRow(item)"
                @click="completeOne(item)"
              >
                <font-awesome-icon icon="fa-circle-check" class="m-r-4" />
                完成
              </MButton>

              <MButton
                size="sm"
                variant="danger"
                :disabled="!canCancelRow(item)"
                @click="openCancelDialog('single', item)"
              >
                <font-awesome-icon icon="fa-ban" class="m-r-4" />
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
            @update:pageLimitSize="handlePageLimitSizeChange"
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
    <div class="order-action-dialog">
      <p class="order-action-dialog__title">
        <font-awesome-icon icon="fa-truck-fast" class="m-r-6" />
        訂單出貨
      </p>

      <div class="order-action-dialog__form">
        <FormInput
          label="物流單號"
          v-model="shipTrackingNo"
          :error="shipTrackingNoError"
          placeholder="請輸入物流單號"
          required
        />

        <FormInput
          label="備註"
          v-model="shipRemark"
          :error="shipRemarkError"
          placeholder="例如：超商取貨 / 指定時段 / 其他備註"
        />

        <div class="flex justify-center gap-x-12 m-t-12">
          <MButton @click="submitShip">
            <font-awesome-icon icon="fa-floppy-disk" class="m-r-4" />
            確認出貨
          </MButton>

          <MButton variant="secondary" @click="closeShipDialog"> 取消 </MButton>
        </div>
      </div>
    </div>
  </Dialog>

  <!-- 取消 Dialog -->
  <Dialog
    :isOpen="cancelOpen"
    customClass="dialog--orderCancel"
    @close="closeCancelDialog"
  >
    <div class="order-action-dialog">
      <p class="order-action-dialog__title">
        <font-awesome-icon icon="fa-ban" class="m-r-6" />
        取消訂單
      </p>

      <p class="order-action-dialog__warning">
        取消訂單後，賞品盒將回到可領取狀態。此操作無法復原。
      </p>

      <div class="order-action-dialog__form">
        <FormInput
          label="取消原因"
          v-model="cancelReason"
          :error="cancelReasonError"
          placeholder="請輸入取消原因"
          required
        />

        <div class="flex justify-center gap-x-12 m-t-12">
          <MButton class="mbtn--red" @click="submitCancel"> 確認取消 </MButton>

          <MButton variant="secondary" @click="closeCancelDialog">
            返回
          </MButton>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Form, type FormContext } from 'vee-validate';

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
import DateFormatter from '@/components/common/DateFormatter.vue';

import AdminOrderSearchForm from '@/components/order/AdminOrderSearchForm.vue';

import { useAuthStore } from '@/stores';
import { useAdminOrderStore } from '@/stores/order/useAdminOrderStore';
import { executeApi } from '@/utils/executeApiUtils';

import {
  queryOrders,
  prepareShipping,
  shipOrder,
  completeOrder,
  cancelOrderWithReason,
} from '@/services/adminOrderService';

import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

interface SelectOption {
  label: string;
  value: any;
}

const router = useRouter();
const authStore = useAuthStore();
const adminOrderStore = useAdminOrderStore();

const isAdmin = computed(() =>
  (authStore.user?.roles ?? []).includes('ROLE_ADMIN'),
);

/* --------------------------------------
 * Form
 * -------------------------------------- */
const formRef = ref<FormContext | null>(null);

const initValues = ref({
  orderNo: '',
  userKeyword: '',
  shippingMethod: '',
  shippingStatus: '',
  recipientName: '',
  recipientPhone: '',
});

/* --------------------------------------
 * Search Hook
 * -------------------------------------- */
const { list, hasData, isSearch, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

/* --------------------------------------
 * Select Options
 * -------------------------------------- */
const statusOptions = ref<SelectOption[]>([
  { label: '待處理(PENDING)', value: 'PENDING' },
  { label: '備貨中(PREPARING)', value: 'PREPARING' },
  { label: '已出貨(SHIPPED)', value: 'SHIPPED' },
  { label: '已完成(COMPLETED)', value: 'COMPLETED' },
  { label: '已取消(CANCELLED)', value: 'CANCELLED' },
]);

const loadSelectOptions = async () => {
  await nextTick();
};

/* --------------------------------------
 * Utils
 * -------------------------------------- */
const formatMoney = (value: any) => {
  const num = Number(value);

  if (Number.isNaN(num)) return value ?? '-';

  return num.toLocaleString('zh-TW');
};

const statusText = (status?: string) => {
  if (status === 'PENDING') return '待處理';
  if (status === 'PREPARING') return '備貨中';
  if (status === 'SHIPPED') return '已出貨';
  if (status === 'COMPLETED') return '已完成';
  if (status === 'CANCELLED') return '已取消';

  return '-';
};

const statusBadgeClass = (status?: string) => {
  if (status === 'PENDING') return 'badge badge--blue';
  if (status === 'PREPARING') return 'badge badge--orange';
  if (status === 'SHIPPED') return 'badge badge--purple';
  if (status === 'COMPLETED') return 'badge badge--green';
  if (status === 'CANCELLED') return 'badge badge--gray';

  return 'badge badge--gray';
};

const shippingMethodText = (value?: string) => {
  if (value === 'HOME_DELIVERY') return '宅配';
  if (value === 'CONVENIENCE_STORE') return '超商取貨';

  return value || '-';
};

const getOrderId = (row: any) => {
  if (!row) return '';

  return String(row.id || row.orderId || '').trim();
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
 * 每個欄位寬度都設為 50
 * -------------------------------------- */
const columns = computed(() => [
  { field: 'orderNo', label: '訂單編號', width: 50, sortable: true },
  { field: 'user', label: '玩家', width: 50, sortable: true },
  ...(isAdmin.value
    ? [{ field: 'store', label: '店家', width: 50, sortable: true }]
    : []),
  { field: 'recipient', label: '收件人', width: 50, sortable: true },
  {
    field: 'shippingMethodName',
    label: '配送方式',
    width: 50,
    sortable: true,
  },
  {
    field: 'shippingStatusName',
    label: '狀態',
    width: 50,
    sortable: true,
  },
  { field: 'prizeCount', label: '獎品數量', width: 50, sortable: true },
  { field: 'totalAmount', label: '金額', width: 50, sortable: true },
  { field: 'createdAt', label: '建立時間', width: 50, sortable: true },
  { field: 'actions', label: '操作', width: 50 },
]);

/* --------------------------------------
 * Submit Query
 * -------------------------------------- */
const normalizeCondition = (values: any) => {
  const condition: any = { ...(values ?? {}) };

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
    orderNo: values.orderNo ?? '',
    userKeyword: values.userKeyword ?? '',
    shippingMethod: values.shippingMethod ?? '',
    shippingStatus: values.shippingStatus ?? '',
    recipientName: values.recipientName ?? '',
    recipientPhone: values.recipientPhone ?? '',
  };

  const cleanCondition = normalizeCondition(condition);
  const req =
    Object.keys(cleanCondition).length > 0
      ? { condition: cleanCondition }
      : undefined;

  await query(async () => {
    const res = await queryOrders(req);
    const data = (res as any)?.data ?? res;

    if (Array.isArray(data)) return data;
    if (Array.isArray((data as any)?.list)) return (data as any).list;
    if (Array.isArray((res as any)?.list)) return (res as any).list;

    return [];
  });

  adminOrderStore.setSearchCondition(condition);
  selectedIds.value = [];
  goToPage(1);
  isSearch.value = true;
};

const refresh = async () => {
  const values = formRef.value?.values || initValues.value;

  await onSubmit(values);
};

/* --------------------------------------
 * Selection / Bulk Actions
 * -------------------------------------- */
const selectedIds = ref<string[]>([]);

watch(
  selectedIds,
  (value) => {
    adminOrderStore.setSelectedIds([...value]);
  },
  { deep: true },
);

const selectedRows = computed(() =>
  list.value.filter((row: any) =>
    selectedIds.value.includes(String(row.id || row.orderId)),
  ),
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
    selectedRows.value.every((row: any) => canPrepareRow(row)),
);

const canComplete = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every((row: any) => canCompleteRow(row)),
);

const canCancel = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every((row: any) => canCancelRow(row)),
);

/* --------------------------------------
 * Save state / Detail Navigation
 * -------------------------------------- */
const saveListState = () => {
  adminOrderStore.setList([...list.value]);
  adminOrderStore.setSearchCondition(formRef.value?.values || initValues.value);
  adminOrderStore.setSort(sortKey.value, sortOrder.value);
  adminOrderStore.setCurrentPage(currentPage.value);
  adminOrderStore.setPageLimitSize(pageLimitSize.value);
  adminOrderStore.setSelectedIds([...selectedIds.value]);
};

const navigateToDetail = (item: any) => {
  const orderId = getOrderId(item);

  if (!orderId) return;

  saveListState();
  router.push({ name: 'AdminOrderDetail', params: { orderId } });
};

/* --------------------------------------
 * Prepare / Complete
 * -------------------------------------- */
const prepareOne = async (row: any) => {
  if (!canPrepareRow(row)) return;

  const ok = await openConfirmDialog({
    title: '準備出貨確認',
    message: '確定要將訂單更新為「準備出貨」嗎？',
  });

  if (!ok) return;

  await executeApi({
    fn: async () => prepareShipping(getOrderId(row)),
    onSuccess: async () => {
      await openInfoDialog({
        title: '提示訊息',
        message: '已更新為準備出貨',
        iconType: 'success',
      });

      await refresh();
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

const prepareSelected = async () => {
  if (!canPrepare.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '只有「待處理」的訂單才能準備出貨。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '準備出貨確認',
    message: `確定要將選中的 ${selectedIds.value.length} 筆訂單更新為「準備出貨」嗎？`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(
        selectedRows.value.map((row: any) => prepareShipping(getOrderId(row))),
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
            ? `準備出貨完成：成功 ${okCount}、失敗 ${failCount}`
            : `準備出貨完成：成功 ${okCount}`,
        iconType: failCount > 0 ? 'warning' : 'success',
      });

      await refresh();
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

const completeOne = async (row: any) => {
  if (!canCompleteRow(row)) return;

  const ok = await openConfirmDialog({
    title: '完成訂單確認',
    message: '確定要將訂單標記為「完成」嗎？',
  });

  if (!ok) return;

  await executeApi({
    fn: async () => completeOrder(getOrderId(row)),
    onSuccess: async () => {
      await openInfoDialog({
        title: '提示訊息',
        message: '已完成訂單',
        iconType: 'success',
      });

      await refresh();
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

const completeSelected = async () => {
  if (!canComplete.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '只有「已出貨」的訂單才能完成。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '完成訂單確認',
    message: `確定要將選中的 ${selectedIds.value.length} 筆訂單標記為「完成」嗎？`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(
        selectedRows.value.map((row: any) => completeOrder(getOrderId(row))),
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
            ? `完成訂單：成功 ${okCount}、失敗 ${failCount}`
            : `完成訂單：成功 ${okCount}`,
        iconType: failCount > 0 ? 'warning' : 'success',
      });

      await refresh();
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

/* --------------------------------------
 * Ship Dialog
 * -------------------------------------- */
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

  const ok = await openConfirmDialog({
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
      await openInfoDialog({
        title: '提示訊息',
        message: '已出貨',
        iconType: 'success',
      });

      closeShipDialog();
      await refresh();
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

/* --------------------------------------
 * Cancel Dialog
 * -------------------------------------- */
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
  const reason = cancelReason.value?.trim();

  if (!reason) {
    cancelReasonError.value = '請輸入取消原因';
    return;
  }

  if (cancelMode.value === 'bulk' && !canCancel.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '只有「待處理」的訂單才能取消。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '取消確認',
    message:
      cancelMode.value === 'bulk'
        ? `取消訂單後，賞品盒將回到可領取狀態。確定取消選中的 ${selectedIds.value.length} 筆訂單？`
        : '取消訂單後，賞品盒將回到可領取狀態。確定取消？',
  });

  if (!ok) return;

  await executeApi({
    fn: async () => {
      if (cancelMode.value === 'single') {
        return cancelOrderWithReason(cancelOrderId.value, reason);
      }

      return Promise.allSettled(
        selectedRows.value.map((row: any) =>
          cancelOrderWithReason(getOrderId(row), reason),
        ),
      );
    },
    onSuccess: async (results: any) => {
      if (!Array.isArray(results)) {
        await openInfoDialog({
          title: '提示訊息',
          message: '已取消訂單',
          iconType: 'success',
        });

        closeCancelDialog();
        await refresh();
        return;
      }

      const okCount = results.filter(
        (item: any) => item.status === 'fulfilled',
      ).length;
      const failCount = results.length - okCount;

      await openInfoDialog({
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
    showFailDialog: true,
    showCatchDialog: true,
  });
};

/* --------------------------------------
 * Lifecycle
 * -------------------------------------- */
onMounted(async () => {
  await loadSelectOptions();

  if (adminOrderStore.list.length > 0 && !adminOrderStore.shouldRefresh) {
    list.value = [...adminOrderStore.list];
    initValues.value = { ...adminOrderStore.searchCondition };

    await nextTick();
    formRef.value?.setValues(adminOrderStore.searchCondition);

    sortKey.value = adminOrderStore.sortKey || '';
    sortOrder.value = adminOrderStore.sortOrder || 'asc';
    pageLimitSize.value = adminOrderStore.pageLimitSize;
    selectedIds.value = [...adminOrderStore.selectedIds];

    await nextTick();
    goToPage(adminOrderStore.currentPage);

    isSearch.value = true;
    adminOrderStore.resetAll();
    return;
  }

  const condition = adminOrderStore.shouldRefresh
    ? { ...adminOrderStore.searchCondition }
    : { ...initValues.value };

  initValues.value = { ...condition };

  await nextTick();
  formRef.value?.setValues(condition);

  await onSubmit(condition);
  adminOrderStore.resetAll();
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as tokens;

.order-action-dialog {
  padding: 16px;

  &__title {
    margin: 0 0 8px;
    color: tokens.$form-text;
    font-size: 16px;
    font-weight: 700;
    line-height: 1.4;
  }

  &__warning {
    margin: 0 0 12px;
    padding: 10px 12px;
    border-left: 4px solid tokens.$brand;
    border-radius: tokens.$form-radius;
    background: color.mix(tokens.$brand-light, #fff, 35%);
    color: tokens.$brand-dark;
    font-size: 13px;
    line-height: 1.5;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}
</style>

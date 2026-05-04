<!-- src/views/order/AdminOrderDetail.vue -->
<template>
  <MCard>
    <!-- 頂部：返回 + 標題 -->
    <div class="flex align-center gap-x-12 m-b-16">
      <MButton variant="secondary" size="sm" @click="goBack">
        ← 返回列表
      </MButton>
      <p class="form__text form__text--title" style="margin: 0">訂單詳情</p>
    </div>

    <!-- 載入中 -->
    <template v-if="loading">
      <p class="od__loading">載入中...</p>
    </template>

    <!-- 錯誤 -->
    <template v-else-if="loadError">
      <p class="od__error">{{ loadError }}</p>
    </template>

    <template v-else-if="detail">
      <!-- ========== 基本資訊卡 ========== -->
      <div class="od__section">
        <p class="od__section-title">訂單資訊</p>
        <div class="od__grid">
          <div class="od__kv">
            <span class="od__k">訂單編號</span>
            <span class="od__v">{{ detail.orderNo || detail.id || '-' }}</span>
          </div>
          <div class="od__kv">
            <span class="od__k">建立時間</span>
            <span class="od__v">{{ formatDateTime(detail.createdAt) }}</span>
          </div>
          <div class="od__kv">
            <span class="od__k">出貨狀態</span>
            <span class="od__v">
              <span :class="['od__badge', statusBadgeClass(detail.shippingStatus)]">
                {{ detail.shippingStatusName || statusLabel(detail.shippingStatus) }}
              </span>
            </span>
          </div>
          <div class="od__kv" v-if="detail.storeName || detail.storeId">
            <span class="od__k">店家</span>
            <span class="od__v">{{ detail.storeName || detail.storeId }}</span>
          </div>
        </div>
      </div>

      <!-- ========== 玩家資訊 ========== -->
      <div class="od__section">
        <p class="od__section-title">玩家資訊</p>
        <div class="od__grid">
          <div class="od__kv">
            <span class="od__k">暱稱</span>
            <span class="od__v">{{ detail.player?.nickname || detail.userNickname || '-' }}</span>
          </div>
          <div class="od__kv">
            <span class="od__k">Email</span>
            <span class="od__v">{{ detail.player?.email || detail.userEmail || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- ========== 配送資訊 ========== -->
      <div class="od__section">
        <p class="od__section-title">配送資訊</p>
        <template v-if="shippingMethod === 'CVS'">
          <div class="od__grid">
            <div class="od__kv">
              <span class="od__k">配送方式</span>
              <span class="od__v">🏪 超商取貨</span>
            </div>
            <div class="od__kv">
              <span class="od__k">超商類型</span>
              <span class="od__v">{{ shippingInfo?.cvsType || '-' }}</span>
            </div>
            <div class="od__kv">
              <span class="od__k">門市名稱</span>
              <span class="od__v">{{ shippingInfo?.storeName || '-' }}</span>
            </div>
            <div class="od__kv">
              <span class="od__k">門市代碼</span>
              <span class="od__v">{{ shippingInfo?.storeCode || '-' }}</span>
            </div>
            <div class="od__kv od__kv--full">
              <span class="od__k">地址</span>
              <span class="od__v">{{ shippingInfo?.address || '-' }}</span>
            </div>
          </div>
        </template>
        <template v-else-if="shippingMethod === 'HOME_DELIVERY'">
          <div class="od__grid">
            <div class="od__kv">
              <span class="od__k">配送方式</span>
              <span class="od__v">🚚 宅配到府</span>
            </div>
            <div class="od__kv">
              <span class="od__k">收件人</span>
              <span class="od__v">{{ shippingInfo?.recipientName || detail.recipientName || '-' }}</span>
            </div>
            <div class="od__kv">
              <span class="od__k">聯絡電話</span>
              <span class="od__v">{{ shippingInfo?.recipientPhone || detail.recipientPhone || '-' }}</span>
            </div>
            <div class="od__kv od__kv--full">
              <span class="od__k">收件地址</span>
              <span class="od__v">{{ detail.recipientAddress || shippingInfo?.address || '-' }}</span>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="od__grid">
            <div class="od__kv">
              <span class="od__k">配送方式</span>
              <span class="od__v">{{ detail.shippingMethodName || shippingMethod || '-' }}</span>
            </div>
            <div class="od__kv">
              <span class="od__k">收件人</span>
              <span class="od__v">{{ detail.recipientName || '-' }}</span>
            </div>
            <div class="od__kv">
              <span class="od__k">聯絡電話</span>
              <span class="od__v">{{ detail.recipientPhone || '-' }}</span>
            </div>
            <div class="od__kv">
              <span class="od__k">物流單號</span>
              <span class="od__v">{{ detail.trackingNo || '-' }}</span>
            </div>
          </div>
        </template>
      </div>

      <!-- ========== 付款資訊 ========== -->
      <div class="od__section">
        <p class="od__section-title">付款資訊</p>
        <div class="od__grid">
          <div class="od__kv">
            <span class="od__k">付款方式</span>
            <span class="od__v">{{ detail.paymentMethod || '-' }}</span>
          </div>
          <div class="od__kv">
            <span class="od__k">付款狀態</span>
            <span class="od__v">
              <span :class="['od__badge', statusBadgeClass(detail.paymentStatus)]">
                {{ detail.paymentStatusName || statusLabel(detail.paymentStatus) }}
              </span>
            </span>
          </div>
        </div>
      </div>

      <!-- ========== 金額明細 ========== -->
      <div class="od__section">
        <p class="od__section-title">金額明細</p>
        <div class="od__grid">
          <div class="od__kv">
            <span class="od__k">小計</span>
            <span class="od__v">NT$ {{ detail.subtotal ?? 0 }}</span>
          </div>
          <div class="od__kv">
            <span class="od__k">運費</span>
            <span class="od__v">NT$ {{ detail.shippingFee ?? 0 }}</span>
          </div>
          <div class="od__kv">
            <span class="od__k">折扣</span>
            <span class="od__v">- NT$ {{ detail.discount ?? 0 }}</span>
          </div>
          <div class="od__kv">
            <span class="od__k">合計</span>
            <span class="od__v" style="font-weight: 700; color: #111827">NT$ {{ detail.totalAmount ?? 0 }}</span>
          </div>
        </div>
      </div>

      <!-- ========== 獎品列表 ========== -->
      <div class="od__section">
        <p class="od__section-title">獎品列表（共 {{ prizeCount }} 件）</p>
        <template v-if="prizes && prizes.length > 0">
          <div class="od__prize-table-wrap">
            <table class="od__prize-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>商品</th>
                  <th>獎品名稱</th>
                  <th>等級</th>
                  <th>時間</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(prize, idx) in prizes" :key="prize.id || idx">
                  <td>{{ idx + 1 }}</td>
                  <td>{{ prize.lotteryTitle || '-' }}</td>
                  <td>{{ prize.prizeName || prize.name || '-' }}</td>
                  <td>{{ prize.prizeLevel || prize.level || '-' }}</td>
                  <td>{{ formatDateTime(prize.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
        <template v-else>
          <p class="od__empty">無獎品資料</p>
        </template>
      </div>

      <!-- ========== 狀態歷程 ========== -->
      <div class="od__section">
        <p class="od__section-title">狀態歷程</p>
        <template v-if="statusHistory && statusHistory.length > 0">
          <div class="od__timeline">
            <div
              v-for="(entry, idx) in statusHistory"
              :key="idx"
              class="od__timeline-item"
            >
              <div class="od__timeline-dot" :class="statusBadgeClass(entry.toStatus ?? entry.status)" />
              <div class="od__timeline-content">
                <span class="od__timeline-status">{{ entry.toStatusLabel || statusLabel(entry.toStatus ?? entry.status) }}</span>
                <span class="od__timeline-meta">
                  {{ entry.operatorType === 'USER' ? '會員操作' : entry.operatorType === 'ADMIN' ? '管理員' : entry.operator?.displayName || entry.operator?.email || '系統' }}
                  ·
                  {{ formatDateTime(entry.createdAt ?? entry.timestamp) }}
                </span>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <p class="od__empty">無歷程記錄</p>
        </template>
      </div>

      <!-- ========== 操作區 ========== -->
      <div class="od__section od__actions">
        <!-- 下一步狀態按鈕 -->
        <template v-if="detail.shippingStatus === 'PENDING'">
          <MButton :loading="actionLoading" @click="doPrepare">
            開始準備
          </MButton>
        </template>
        <template v-else-if="detail.shippingStatus === 'PREPARING'">
          <MButton :loading="actionLoading" @click="openShipModal">
            標記已出貨
          </MButton>
        </template>
        <template v-else-if="detail.shippingStatus === 'SHIPPED'">
          <MButton :loading="actionLoading" @click="doComplete">
            確認完成
          </MButton>
        </template>

        <!-- 取消按鈕 -->
        <MButton
          v-if="canCancel"
          variant="danger"
          :disabled="actionLoading"
          @click="cancelModalOpen = true"
          :title="!canCancel ? '已出貨訂單無法取消' : ''"
        >
          取消訂單
        </MButton>
      </div>
    </template>
  </MCard>

  <!-- ========== 出貨 Modal ========== -->
  <Dialog
    :isOpen="shipModalOpen"
    customClass="dialog--orderShip"
    @close="closeShipModal"
  >
    <div class="od__modal-body">
      <p class="od__modal-title">標記已出貨</p>
      <div class="od__modal-form">
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
          placeholder="例如：超商取貨 / 指定時段"
        />
        <div class="flex justify-center gap-x-12 m-t-12">
          <MButton :loading="actionLoading" @click="submitShip">確認出貨</MButton>
          <MButton variant="secondary" @click="closeShipModal">取消</MButton>
        </div>
      </div>
    </div>
  </Dialog>

  <!-- ========== 取消訂單 Modal ========== -->
  <Dialog
    :isOpen="cancelModalOpen"
    customClass="dialog--orderCancel"
    @close="cancelModalOpen = false"
  >
    <div class="od__modal-body">
      <p class="od__modal-title">取消訂單</p>
      <p class="od__modal-warning">
        取消訂單後，賞品盒將回到可領取狀態。此操作無法復原。
      </p>
      <div class="od__modal-form">
        <FormInput
          label="取消原因"
          type="textarea"
          v-model="cancelReason"
          :error="cancelReasonError"
          placeholder="請輸入取消原因（最多 200 字）"
          :maxlength="200"
          required
        />
        <div class="flex justify-center gap-x-12 m-t-12">
          <MButton class="mbtn--red" :loading="actionLoading" @click="submitCancel">
            確認取消
          </MButton>
          <MButton variant="secondary" @click="cancelModalOpen = false">返回</MButton>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import Dialog from '@/components/common/Dialog.vue';
import FormInput from '@/components/common/FormInput.vue';

import { useDialogStore } from '@/stores';
import {
  getOrderDetail,
  prepareShipping,
  shipOrder,
  completeOrder,
  updateOrderStatus,
  cancelOrderWithReason,
} from '@/services/adminOrderService';

const route = useRoute();
const router = useRouter();
const dialogStore = useDialogStore();

/* ==============================
 * State
 * ============================== */
const loading = ref(false);
const loadError = ref('');
const detail = ref<any>(null);
const actionLoading = ref(false);

/* ==============================
 * Derived fields
 * ============================== */
const shippingInfo = computed(() => detail.value?.shippingInfo ?? null);
const shippingMethod = computed(
  () => detail.value?.shippingMethod ?? shippingInfo.value?.method ?? '',
);
const prizes = computed<any[]>(
  () => detail.value?.items ?? detail.value?.prizes ?? [],
);
const prizeCount = computed(
  () =>
    detail.value?.prizeCount ??
    prizes.value.length ??
    0,
);
const statusHistory = computed<any[]>(
  () => [...(detail.value?.statusHistory ?? [])].reverse(),
);
const canCancel = computed(() =>
  ['PENDING', 'PREPARING'].includes(detail.value?.shippingStatus ?? detail.value?.status ?? ''),
);

/* ==============================
 * Format helpers
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
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return String(val);
  }
}

const STATUS_LABEL: Record<string, string> = {
  PAYMENT_PENDING: '待付款',
  PENDING: '待出貨',
  PREPARING: '準備中',
  SHIPPED: '已出貨',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};
function statusLabel(s: string): string {
  return STATUS_LABEL[s] ?? s ?? '-';
}

const STATUS_BADGE: Record<string, string> = {
  PAYMENT_PENDING: 'od__badge--yellow',
  PENDING: 'od__badge--yellow',
  PREPARING: 'od__badge--blue',
  SHIPPED: 'od__badge--purple',
  COMPLETED: 'od__badge--green',
  CANCELLED: 'od__badge--gray',
};
function statusBadgeClass(s: string): string {
  return STATUS_BADGE[s] ?? 'od__badge--gray';
}

/* ==============================
 * Load detail
 * ============================== */
const loadDetail = async () => {
  const orderId = String(route.params.orderId ?? '');
  if (!orderId) {
    loadError.value = '無效的訂單 ID';
    return;
  }

  loading.value = true;
  loadError.value = '';
  try {
    const res = await getOrderDetail(orderId);
    detail.value = (res as any)?.data ?? res;
  } catch (e: any) {
    const status = e?.response?.status;
    if (status === 403) {
      loadError.value = '無權限存取此訂單';
    } else if (status === 404) {
      loadError.value = '訂單不存在';
    } else {
      loadError.value = '載入訂單詳情失敗，請重試';
    }
  } finally {
    loading.value = false;
  }
};

/* ==============================
 * Navigation
 * ============================== */
const goBack = () => {
  router.push({ name: 'AdminOrderList' });
};

/* ==============================
 * 422 handler
 * ============================== */
function handle422(e: any): boolean {
  if (axios.isAxiosError(e) && e.response?.status === 422) {
    const errorCode = e.response.data?.errorCode;
    if (errorCode === 'INVALID_STATUS_TRANSITION') {
      dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '此狀態無法執行該操作',
        iconType: 'warning',
      });
    } else {
      dialogStore.openInfoDialog({
        title: '提示訊息',
        message: e.response.data?.message ?? '操作失敗，請重試',
        iconType: 'warning',
      });
    }
    return true;
  }
  return false;
}

/* ==============================
 * Actions - Prepare
 * ============================== */
const doPrepare = async () => {
  const ok = await dialogStore.openConfirmDialog({
    title: '準備出貨確認',
    message: '確定要將訂單更新為「準備中」嗎？',
  });
  if (!ok) return;

  actionLoading.value = true;
  try {
    await prepareShipping(String(route.params.orderId));
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '訂單狀態已更新',
      iconType: 'success',
    });
    await loadDetail();
  } catch (e: any) {
    if (!handle422(e)) {
      dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '狀態更新失敗，請重試',
        iconType: 'warning',
      });
    }
  } finally {
    actionLoading.value = false;
  }
};

/* ==============================
 * Actions - Ship
 * ============================== */
const shipModalOpen = ref(false);
const shipTrackingNo = ref('');
const shipTrackingNoError = ref('');
const shipRemark = ref('');

const openShipModal = () => {
  shipTrackingNo.value = '';
  shipTrackingNoError.value = '';
  shipRemark.value = '';
  shipModalOpen.value = true;
};

const closeShipModal = () => {
  shipModalOpen.value = false;
  shipTrackingNo.value = '';
  shipTrackingNoError.value = '';
  shipRemark.value = '';
};

const submitShip = async () => {
  const trackingNo = shipTrackingNo.value?.trim();
  if (!trackingNo) {
    shipTrackingNoError.value = '請輸入物流單號';
    return;
  }
  shipTrackingNoError.value = '';

  const ok = await dialogStore.openConfirmDialog({
    title: '出貨確認',
    message: '確定要送出出貨資訊嗎？',
  });
  if (!ok) return;

  actionLoading.value = true;
  try {
    const payload: any = { trackingNo };
    const remark = shipRemark.value?.trim();
    if (remark) payload.remark = remark;

    await shipOrder(String(route.params.orderId), payload);
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '訂單狀態已更新',
      iconType: 'success',
    });
    closeShipModal();
    await loadDetail();
  } catch (e: any) {
    if (!handle422(e)) {
      dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '出貨失敗，請重試',
        iconType: 'warning',
      });
    }
  } finally {
    actionLoading.value = false;
  }
};

/* ==============================
 * Actions - Complete
 * ============================== */
const doComplete = async () => {
  const ok = await dialogStore.openConfirmDialog({
    title: '完成訂單確認',
    message: '確定要將訂單標記為「已完成」嗎？',
  });
  if (!ok) return;

  actionLoading.value = true;
  try {
    await completeOrder(String(route.params.orderId));
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '訂單狀態已更新',
      iconType: 'success',
    });
    await loadDetail();
  } catch (e: any) {
    if (!handle422(e)) {
      dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '狀態更新失敗，請重試',
        iconType: 'warning',
      });
    }
  } finally {
    actionLoading.value = false;
  }
};

/* ==============================
 * Actions - Cancel
 * ============================== */
const cancelModalOpen = ref(false);
const cancelReason = ref('');
const cancelReasonError = ref('');

const submitCancel = async () => {
  const reason = cancelReason.value?.trim();
  if (!reason) {
    cancelReasonError.value = '請填寫取消原因';
    return;
  }
  cancelReasonError.value = '';

  const ok = await dialogStore.openConfirmDialog({
    title: '取消確認',
    message: '取消訂單後，賞品盒將回到可領取狀態。確定取消？',
  });
  if (!ok) return;

  actionLoading.value = true;
  try {
    await cancelOrderWithReason(String(route.params.orderId), reason);
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '訂單已取消',
      iconType: 'success',
    });
    cancelModalOpen.value = false;
    cancelReason.value = '';
    await loadDetail();
  } catch (e: any) {
    if (!handle422(e)) {
      dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '取消失敗，請重試',
        iconType: 'warning',
      });
    }
  } finally {
    actionLoading.value = false;
  }
};

/* ==============================
 * Lifecycle
 * ============================== */
onMounted(loadDetail);
</script>

<style scoped lang="scss">
.od {
  &__loading,
  &__error,
  &__empty {
    padding: 24px 0;
    text-align: center;
    color: #6b7280;
    font-size: 14px;
  }

  &__error {
    color: #ef4444;
  }

  &__section {
    margin-bottom: 24px;

    & + & {
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
    }
  }

  &__section-title {
    font-size: 15px;
    font-weight: 700;
    color: #374151;
    margin-bottom: 12px;
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 16px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  &__kv {
    display: grid;
    grid-template-columns: 96px 1fr;
    gap: 8px;
    align-items: start;

    &--full {
      grid-column: 1 / -1;
    }
  }

  &__k {
    color: #6b7280;
    font-size: 13px;
    padding-top: 2px;
  }

  &__v {
    font-size: 13px;
    word-break: break-word;
  }

  &__badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;

    &--yellow {
      background: #fef9c3;
      color: #854d0e;
    }

    &--blue {
      background: #dbeafe;
      color: #1e40af;
    }

    &--purple {
      background: #ede9fe;
      color: #5b21b6;
    }

    &--green {
      background: #dcfce7;
      color: #14532d;
    }

    &--gray {
      background: #f3f4f6;
      color: #6b7280;
    }
  }

  /* Prize table */
  &__prize-table-wrap {
    overflow-x: auto;
    max-height: 360px;
    overflow-y: auto;
  }

  &__prize-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;

    th,
    td {
      border: 1px solid #e5e7eb;
      padding: 8px 10px;
      text-align: left;
    }

    th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
    }
  }

  &__prize-img {
    width: 48px;
    height: 48px;
    object-fit: cover;
    border-radius: 4px;
  }

  /* Timeline */
  &__timeline {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__timeline-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  &__timeline-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-top: 3px;
    flex-shrink: 0;
    background: #9ca3af;

    &.od__badge--yellow { background: #fbbf24; }
    &.od__badge--blue   { background: #3b82f6; }
    &.od__badge--purple { background: #7c3aed; }
    &.od__badge--green  { background: #22c55e; }
    &.od__badge--gray   { background: #9ca3af; }
  }

  &__timeline-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__timeline-status {
    font-size: 13px;
    font-weight: 600;
    color: #374151;
  }

  &__timeline-meta {
    font-size: 12px;
    color: #9ca3af;
  }

  /* Actions */
  &__actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    border-top: 1px solid #e5e7eb;
    padding-top: 20px;
  }

  /* Modal */
  &__modal-body {
    padding: 16px;
  }

  &__modal-title {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 12px;
  }

  &__modal-warning {
    font-size: 13px;
    color: #ef4444;
    margin-bottom: 12px;
    padding: 8px 12px;
    background: #fef2f2;
    border-radius: 6px;
    border: 1px solid #fecaca;
  }

  &__modal-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}
</style>

<!-- src/views/order/AdminOrderDetail.vue -->
<template>
  <div class="admin-order-detail">
    <MCard>
      <!-- 頂部 -->
      <div class="admin-order-detail__header">
        <div class="admin-order-detail__header-main">
          <MButton variant="secondary" size="sm" @click="goBack">
            <font-awesome-icon icon="fa-arrow-left" class="m-r-4" />
            返回列表
          </MButton>

          <div class="admin-order-detail__title-block">
            <p class="admin-order-detail__title">訂單詳情</p>
            <p class="admin-order-detail__subtitle">
              查看訂單基本資料、物流配送、付款金額、獎品明細與狀態紀錄
            </p>
          </div>
        </div>

        <template v-if="detail">
          <span
            :class="[
              'admin-order-detail__summary-pill',
              statusBadgeClass(detail.shippingStatus),
            ]"
          >
            {{
              detail.shippingStatusName || statusLabel(detail.shippingStatus)
            }}
          </span>
        </template>
      </div>

      <!-- 載入中 -->
      <template v-if="loading">
        <div class="admin-order-detail__state">
          <p class="admin-order-detail__state-text">載入中...</p>
        </div>
      </template>

      <!-- 錯誤 -->
      <template v-else-if="loadError">
        <div class="admin-order-detail__state admin-order-detail__state--error">
          <p class="admin-order-detail__state-text">{{ loadError }}</p>
        </div>
      </template>

      <template v-else-if="detail">
        <!-- 摘要卡 -->
        <div class="admin-order-detail__summary-card">
          <div class="admin-order-detail__summary-content">
            <div class="admin-order-detail__summary-item">
              <span class="admin-order-detail__summary-label">訂單編號</span>
              <span class="admin-order-detail__summary-value">
                {{ detail.orderNo || detail.id || '-' }}
              </span>
            </div>

            <div class="admin-order-detail__summary-item">
              <span class="admin-order-detail__summary-label">建立時間</span>
              <span class="admin-order-detail__summary-value">
                {{ formatDateTime(detail.createdAt) }}
              </span>
            </div>

            <div class="admin-order-detail__summary-item">
              <span class="admin-order-detail__summary-label">合計金額</span>
              <span
                class="admin-order-detail__summary-value admin-order-detail__summary-value--money"
              >
                NT$ {{ formatMoney(detail.totalAmount ?? 0) }}
              </span>
            </div>

            <div class="admin-order-detail__summary-item">
              <span class="admin-order-detail__summary-label">獎品數量</span>
              <span class="admin-order-detail__summary-value">
                {{ prizeCount }} 件
              </span>
            </div>
          </div>
        </div>

        <!-- 主要資訊 -->
        <div class="admin-order-detail__layout">
          <div class="admin-order-detail__main">
            <!-- 訂單資訊 -->
            <section class="admin-order-detail__section">
              <div class="admin-order-detail__section-head">
                <p class="admin-order-detail__section-title">訂單資訊</p>
                <span class="admin-order-detail__section-badge">Order</span>
              </div>

              <div class="admin-order-detail__card">
                <div class="admin-order-detail__grid">
                  <div class="admin-order-detail__field">
                    <span class="admin-order-detail__field-label">
                      訂單編號
                    </span>
                    <span class="admin-order-detail__field-value">
                      {{ detail.orderNo || detail.id || '-' }}
                    </span>
                  </div>

                  <div class="admin-order-detail__field">
                    <span class="admin-order-detail__field-label">
                      建立時間
                    </span>
                    <span class="admin-order-detail__field-value">
                      {{ formatDateTime(detail.createdAt) }}
                    </span>
                  </div>

                  <div class="admin-order-detail__field">
                    <span class="admin-order-detail__field-label">
                      出貨狀態
                    </span>
                    <span class="admin-order-detail__field-value">
                      <span
                        :class="[
                          'admin-order-detail__badge',
                          statusBadgeClass(detail.shippingStatus),
                        ]"
                      >
                        {{
                          detail.shippingStatusName ||
                          statusLabel(detail.shippingStatus)
                        }}
                      </span>
                    </span>
                  </div>

                  <div
                    v-if="detail.storeName || detail.storeId"
                    class="admin-order-detail__field"
                  >
                    <span class="admin-order-detail__field-label">店家</span>
                    <span class="admin-order-detail__field-value">
                      {{ detail.storeName || detail.storeId }}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <!-- 玩家資訊 -->
            <section class="admin-order-detail__section">
              <div class="admin-order-detail__section-head">
                <p class="admin-order-detail__section-title">玩家資訊</p>
                <span class="admin-order-detail__section-badge">Player</span>
              </div>

              <div class="admin-order-detail__card">
                <div class="admin-order-detail__grid">
                  <div class="admin-order-detail__field">
                    <span class="admin-order-detail__field-label">暱稱</span>
                    <span class="admin-order-detail__field-value">
                      {{
                        detail.player?.nickname || detail.userNickname || '-'
                      }}
                    </span>
                  </div>

                  <div class="admin-order-detail__field">
                    <span class="admin-order-detail__field-label">Email</span>
                    <span class="admin-order-detail__field-value">
                      {{ detail.player?.email || detail.userEmail || '-' }}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <!-- 配送資訊 -->
            <section class="admin-order-detail__section">
              <div class="admin-order-detail__section-head">
                <p class="admin-order-detail__section-title">配送資訊</p>
                <span class="admin-order-detail__section-badge">Shipping</span>
              </div>

              <div class="admin-order-detail__card">
                <template v-if="isConvenienceStore">
                  <div class="admin-order-detail__grid">
                    <div class="admin-order-detail__field">
                      <span class="admin-order-detail__field-label">
                        配送方式
                      </span>
                      <span class="admin-order-detail__field-value">
                        超商取貨
                      </span>
                    </div>

                    <div class="admin-order-detail__field">
                      <span class="admin-order-detail__field-label">
                        超商類型
                      </span>
                      <span class="admin-order-detail__field-value">
                        {{ shippingInfo?.cvsType || '-' }}
                      </span>
                    </div>

                    <div class="admin-order-detail__field">
                      <span class="admin-order-detail__field-label">
                        門市名稱
                      </span>
                      <span class="admin-order-detail__field-value">
                        {{ shippingInfo?.storeName || '-' }}
                      </span>
                    </div>

                    <div class="admin-order-detail__field">
                      <span class="admin-order-detail__field-label">
                        門市代碼
                      </span>
                      <span class="admin-order-detail__field-value">
                        {{ shippingInfo?.storeCode || '-' }}
                      </span>
                    </div>

                    <div
                      class="admin-order-detail__field admin-order-detail__field--full"
                    >
                      <span class="admin-order-detail__field-label">地址</span>
                      <span class="admin-order-detail__field-value">
                        {{ shippingInfo?.address || '-' }}
                      </span>
                    </div>
                  </div>
                </template>

                <template v-else>
                  <div class="admin-order-detail__grid">
                    <div class="admin-order-detail__field">
                      <span class="admin-order-detail__field-label">
                        配送方式
                      </span>
                      <span class="admin-order-detail__field-value">
                        {{
                          detail.shippingMethodName ||
                          shippingMethodText(shippingMethod)
                        }}
                      </span>
                    </div>

                    <div class="admin-order-detail__field">
                      <span class="admin-order-detail__field-label">
                        收件人
                      </span>
                      <span class="admin-order-detail__field-value">
                        {{
                          shippingInfo?.recipientName ||
                          detail.recipientName ||
                          '-'
                        }}
                      </span>
                    </div>

                    <div class="admin-order-detail__field">
                      <span class="admin-order-detail__field-label">
                        聯絡電話
                      </span>
                      <span class="admin-order-detail__field-value">
                        {{
                          shippingInfo?.recipientPhone ||
                          detail.recipientPhone ||
                          '-'
                        }}
                      </span>
                    </div>

                    <div class="admin-order-detail__field">
                      <span class="admin-order-detail__field-label">
                        物流單號
                      </span>
                      <span class="admin-order-detail__field-value">
                        {{
                          detail.trackingNo || shippingInfo?.trackingNo || '-'
                        }}
                      </span>
                    </div>

                    <div
                      class="admin-order-detail__field admin-order-detail__field--full"
                    >
                      <span class="admin-order-detail__field-label">
                        收件地址
                      </span>
                      <span class="admin-order-detail__field-value">
                        {{
                          detail.recipientAddress ||
                          shippingInfo?.address ||
                          '-'
                        }}
                      </span>
                    </div>
                  </div>
                </template>
              </div>
            </section>

            <!-- 獎品明細：ReportTable -->
            <section class="admin-order-detail__section">
              <div class="admin-order-detail__section-head">
                <p class="admin-order-detail__section-title">
                  獎品列表
                  <span>共 {{ prizeCount }} 件</span>
                </p>
                <span class="admin-order-detail__section-badge">Prizes</span>
              </div>

              <div class="admin-order-detail__report-card">
                <template v-if="prizes.length > 0">
                  <ReportTable
                    class="admin-order-detail__report-table"
                    :columns="prizeColumns"
                    :items="prizes"
                    row-key="id"
                    :useWidthClass="true"
                  >
                    <template #cell-index="{ index }">
                      <span>{{ index + 1 }}</span>
                    </template>

                    <template #cell-lotteryTitle="{ item }">
                      <span>{{ item.lotteryTitle || '-' }}</span>
                    </template>

                    <template #cell-prizeName="{ item }">
                      <span>{{ item.prizeName || item.name || '-' }}</span>
                    </template>

                    <template #cell-prizeLevel="{ item }">
                      <span class="admin-order-detail__level-pill">
                        {{ item.prizeLevel || item.level || '-' }}
                      </span>
                    </template>

                    <template #cell-createdAt="{ item }">
                      <DateFormatter
                        :date="item.createdAt"
                        format="YYYY-MM-DD HH:mm:ss"
                      />
                    </template>
                  </ReportTable>
                </template>

                <template v-else>
                  <NoData message="無獎品資料" />
                </template>
              </div>
            </section>
          </div>

          <!-- 右側資訊 -->
          <aside class="admin-order-detail__side">
            <!-- 付款資訊 -->
            <section class="admin-order-detail__section">
              <div class="admin-order-detail__section-head">
                <p class="admin-order-detail__section-title">付款資訊</p>
                <span class="admin-order-detail__section-badge">Payment</span>
              </div>

              <div
                class="admin-order-detail__card admin-order-detail__card--side"
              >
                <div class="admin-order-detail__side-list">
                  <div class="admin-order-detail__side-row">
                    <span>付款方式</span>
                    <strong>{{ detail.paymentMethod || '-' }}</strong>
                  </div>

                  <div class="admin-order-detail__side-row">
                    <span>付款狀態</span>
                    <strong>
                      <span
                        :class="[
                          'admin-order-detail__badge',
                          statusBadgeClass(detail.paymentStatus),
                        ]"
                      >
                        {{
                          detail.paymentStatusName ||
                          statusLabel(detail.paymentStatus)
                        }}
                      </span>
                    </strong>
                  </div>
                </div>
              </div>
            </section>

            <!-- 金額明細 -->
            <section class="admin-order-detail__section">
              <div class="admin-order-detail__section-head">
                <p class="admin-order-detail__section-title">金額明細</p>
                <span class="admin-order-detail__section-badge">Amount</span>
              </div>

              <div class="admin-order-detail__amount-card">
                <div class="admin-order-detail__amount-row">
                  <span>小計</span>
                  <strong>NT$ {{ formatMoney(detail.subtotal ?? 0) }}</strong>
                </div>

                <div class="admin-order-detail__amount-row">
                  <span>運費</span>
                  <strong>
                    NT$ {{ formatMoney(detail.shippingFee ?? 0) }}
                  </strong>
                </div>

                <div class="admin-order-detail__amount-row">
                  <span>折扣</span>
                  <strong>- NT$ {{ formatMoney(detail.discount ?? 0) }}</strong>
                </div>

                <div class="admin-order-detail__amount-total">
                  <span>合計</span>
                  <strong>
                    NT$ {{ formatMoney(detail.totalAmount ?? 0) }}
                  </strong>
                </div>
              </div>
            </section>

            <!-- 狀態歷程 -->
            <section class="admin-order-detail__section">
              <div class="admin-order-detail__section-head">
                <p class="admin-order-detail__section-title">狀態歷程</p>
                <span class="admin-order-detail__section-badge">History</span>
              </div>

              <div class="admin-order-detail__timeline-card">
                <template v-if="statusHistory.length > 0">
                  <div class="admin-order-detail__timeline">
                    <div
                      v-for="(entry, idx) in statusHistory"
                      :key="idx"
                      class="admin-order-detail__timeline-item"
                    >
                      <div
                        :class="[
                          'admin-order-detail__timeline-dot',
                          statusBadgeClass(entry.toStatus ?? entry.status),
                        ]"
                      />

                      <div class="admin-order-detail__timeline-content">
                        <span class="admin-order-detail__timeline-status">
                          {{
                            entry.toStatusLabel ||
                            statusLabel(entry.toStatus ?? entry.status)
                          }}
                        </span>

                        <span class="admin-order-detail__timeline-meta">
                          {{ operatorText(entry) }}
                          ·
                          {{
                            formatDateTime(entry.createdAt ?? entry.timestamp)
                          }}
                        </span>
                      </div>
                    </div>
                  </div>
                </template>

                <template v-else>
                  <p class="admin-order-detail__empty">無歷程記錄</p>
                </template>
              </div>
            </section>

            <!-- 操作區 -->
            <section class="admin-order-detail__section">
              <div class="admin-order-detail__section-head">
                <p class="admin-order-detail__section-title">訂單操作</p>
                <span class="admin-order-detail__section-badge">Action</span>
              </div>

              <div class="admin-order-detail__action-card">
                <template v-if="detail.shippingStatus === 'PENDING'">
                  <MButton
                    class="admin-order-detail__action-btn"
                    :loading="actionLoading"
                    @click="doPrepare"
                  >
                    <font-awesome-icon icon="fa-box-open" class="m-r-4" />
                    開始準備
                  </MButton>
                </template>

                <template v-else-if="detail.shippingStatus === 'PREPARING'">
                  <MButton
                    class="admin-order-detail__action-btn"
                    :loading="actionLoading"
                    @click="openShipModal"
                  >
                    <font-awesome-icon icon="fa-truck-fast" class="m-r-4" />
                    標記已出貨
                  </MButton>
                </template>

                <template v-else-if="detail.shippingStatus === 'SHIPPED'">
                  <MButton
                    class="admin-order-detail__action-btn"
                    :loading="actionLoading"
                    @click="doComplete"
                  >
                    <font-awesome-icon icon="fa-circle-check" class="m-r-4" />
                    確認完成
                  </MButton>
                </template>

                <MButton
                  v-if="canCancel"
                  class="admin-order-detail__action-btn mbtn--red"
                  variant="danger"
                  :disabled="actionLoading"
                  @click="openCancelModal"
                >
                  <font-awesome-icon icon="fa-ban" class="m-r-4" />
                  取消訂單
                </MButton>

                <p
                  v-if="!hasAvailableAction"
                  class="admin-order-detail__action-note"
                >
                  此訂單目前沒有可執行的操作。
                </p>
              </div>
            </section>
          </aside>
        </div>
      </template>
    </MCard>

    <!-- 出貨 Modal -->
    <Dialog
      :isOpen="shipModalOpen"
      customClass="dialog--orderShip"
      @close="closeShipModal"
    >
      <div class="admin-order-detail__modal">
        <div class="admin-order-detail__modal-head">
          <p class="admin-order-detail__modal-title">
            <font-awesome-icon icon="fa-truck-fast" class="m-r-6" />
            標記已出貨
          </p>

          <p class="admin-order-detail__modal-subtitle">
            請輸入物流單號，送出後訂單狀態將更新為已出貨。
          </p>
        </div>

        <div class="admin-order-detail__modal-form">
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
            placeholder="例如：超商取貨 / 指定時段"
          />

          <div class="admin-order-detail__modal-actions">
            <MButton :loading="actionLoading" @click="submitShip">
              確認出貨
            </MButton>

            <MButton variant="secondary" @click="closeShipModal">
              取消
            </MButton>
          </div>
        </div>
      </div>
    </Dialog>

    <!-- 取消訂單 Modal -->
    <Dialog
      :isOpen="cancelModalOpen"
      customClass="dialog--orderCancel"
      @close="closeCancelModal"
    >
      <div class="admin-order-detail__modal">
        <div class="admin-order-detail__modal-head">
          <p class="admin-order-detail__modal-title">
            <font-awesome-icon icon="fa-ban" class="m-r-6" />
            取消訂單
          </p>

          <p class="admin-order-detail__modal-warning">
            取消訂單後，賞品盒將回到可領取狀態。此操作無法復原。
          </p>
        </div>

        <div class="admin-order-detail__modal-form">
          <FormInput
            label="取消原因"
            type="textarea"
            v-model="cancelReason"
            :error="cancelReasonError"
            placeholder="請輸入取消原因（最多 200 字）"
            :maxlength="200"
            required
          />

          <div class="admin-order-detail__modal-actions">
            <MButton
              class="mbtn--red"
              :loading="actionLoading"
              @click="submitCancel"
            >
              確認取消
            </MButton>

            <MButton variant="secondary" @click="closeCancelModal">
              返回
            </MButton>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import Dialog from '@/components/common/Dialog.vue';
import FormInput from '@/components/common/FormInput.vue';
import ReportTable from '@/components/common/ReportTable.vue';
import NoData from '@/components/common/NoData.vue';
import DateFormatter from '@/components/common/DateFormatter.vue';

import { useAdminOrderStore } from '@/stores/order/useAdminOrderStore';

import {
  getOrderDetail,
  prepareShipping,
  shipOrder,
  completeOrder,
  cancelOrderWithReason,
} from '@/services/adminOrderService';

import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

const route = useRoute();
const router = useRouter();
const adminOrderStore = useAdminOrderStore();

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

const isConvenienceStore = computed(() =>
  ['CVS', 'CONVENIENCE_STORE'].includes(String(shippingMethod.value || '')),
);

const prizes = computed<any[]>(
  () => detail.value?.items ?? detail.value?.prizes ?? [],
);

const prizeCount = computed(
  () => detail.value?.prizeCount ?? prizes.value.length ?? 0,
);

const statusHistory = computed<any[]>(() =>
  [...(detail.value?.statusHistory ?? [])].reverse(),
);

const canCancel = computed(() =>
  ['PENDING', 'PREPARING'].includes(
    detail.value?.shippingStatus ?? detail.value?.status ?? '',
  ),
);

const hasNextStatusAction = computed(() =>
  ['PENDING', 'PREPARING', 'SHIPPED'].includes(
    String(detail.value?.shippingStatus || ''),
  ),
);

const hasAvailableAction = computed(
  () => hasNextStatusAction.value || canCancel.value,
);

/* ==============================
 * ReportTable Columns
 * ============================== */
const prizeColumns = [
  { field: 'index', label: '#', width: 50 },
  { field: 'lotteryTitle', label: '商品', width: 180 },
  { field: 'prizeName', label: '獎品名稱', width: 220 },
  { field: 'prizeLevel', label: '等級', width: 100 },
  { field: 'createdAt', label: '時間', width: 180 },
];

/* ==============================
 * Format helpers
 * ============================== */
const formatMoney = (value: any) => {
  const num = Number(value);

  if (Number.isNaN(num)) return value ?? '-';

  return num.toLocaleString('zh-TW');
};

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

function statusLabel(status?: string): string {
  if (!status) return '-';

  return STATUS_LABEL[status] ?? status;
}

const STATUS_BADGE: Record<string, string> = {
  PAYMENT_PENDING: 'admin-order-detail__badge--yellow',
  PENDING: 'admin-order-detail__badge--yellow',
  PREPARING: 'admin-order-detail__badge--blue',
  SHIPPED: 'admin-order-detail__badge--purple',
  COMPLETED: 'admin-order-detail__badge--green',
  CANCELLED: 'admin-order-detail__badge--gray',
};

function statusBadgeClass(status?: string): string {
  if (!status) return 'admin-order-detail__badge--gray';

  return STATUS_BADGE[status] ?? 'admin-order-detail__badge--gray';
}

const shippingMethodText = (value?: string) => {
  if (value === 'HOME_DELIVERY') return '宅配';
  if (value === 'CONVENIENCE_STORE') return '超商取貨';
  if (value === 'CVS') return '超商取貨';

  return value || '-';
};

const operatorText = (entry: any) => {
  if (entry.operatorType === 'USER') return '會員操作';
  if (entry.operatorType === 'ADMIN') return '管理員';

  return entry.operator?.displayName || entry.operator?.email || '系統';
};

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
 * Error handler
 * ============================== */
function handle422(e: any): boolean {
  if (axios.isAxiosError(e) && e.response?.status === 422) {
    const errorCode = e.response.data?.errorCode;

    if (errorCode === 'INVALID_STATUS_TRANSITION') {
      openInfoDialog({
        title: '提示訊息',
        message: '此狀態無法執行該操作',
        iconType: 'warning',
      });
    } else {
      openInfoDialog({
        title: '提示訊息',
        message: e.response.data?.message ?? '操作失敗，請重試',
        iconType: 'warning',
      });
    }

    return true;
  }

  return false;
}

const markListShouldRefresh = () => {
  adminOrderStore.setShouldRefresh(true);
};

/* ==============================
 * Actions - Prepare
 * ============================== */
const doPrepare = async () => {
  const ok = await openConfirmDialog({
    title: '準備出貨確認',
    message: '確定要將訂單更新為「準備中」嗎？',
  });

  if (!ok) return;

  actionLoading.value = true;

  try {
    await prepareShipping(String(route.params.orderId));

    markListShouldRefresh();

    await openInfoDialog({
      title: '提示訊息',
      message: '訂單狀態已更新',
      iconType: 'success',
    });

    await loadDetail();
  } catch (e: any) {
    if (!handle422(e)) {
      openInfoDialog({
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
  shipTrackingNo.value = detail.value?.trackingNo || '';
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

  const ok = await openConfirmDialog({
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

    markListShouldRefresh();

    await openInfoDialog({
      title: '提示訊息',
      message: '訂單狀態已更新',
      iconType: 'success',
    });

    closeShipModal();
    await loadDetail();
  } catch (e: any) {
    if (!handle422(e)) {
      openInfoDialog({
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
  const ok = await openConfirmDialog({
    title: '完成訂單確認',
    message: '確定要將訂單標記為「已完成」嗎？',
  });

  if (!ok) return;

  actionLoading.value = true;

  try {
    await completeOrder(String(route.params.orderId));

    markListShouldRefresh();

    await openInfoDialog({
      title: '提示訊息',
      message: '訂單狀態已更新',
      iconType: 'success',
    });

    await loadDetail();
  } catch (e: any) {
    if (!handle422(e)) {
      openInfoDialog({
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

const openCancelModal = () => {
  cancelReason.value = '';
  cancelReasonError.value = '';
  cancelModalOpen.value = true;
};

const closeCancelModal = () => {
  cancelModalOpen.value = false;
  cancelReason.value = '';
  cancelReasonError.value = '';
};

const submitCancel = async () => {
  const reason = cancelReason.value?.trim();

  if (!reason) {
    cancelReasonError.value = '請填寫取消原因';
    return;
  }

  cancelReasonError.value = '';

  const ok = await openConfirmDialog({
    title: '取消確認',
    message: '取消訂單後，賞品盒將回到可領取狀態。確定取消？',
  });

  if (!ok) return;

  actionLoading.value = true;

  try {
    await cancelOrderWithReason(String(route.params.orderId), reason);

    markListShouldRefresh();

    await openInfoDialog({
      title: '提示訊息',
      message: '訂單已取消',
      iconType: 'success',
    });

    closeCancelModal();
    await loadDetail();
  } catch (e: any) {
    if (!handle422(e)) {
      openInfoDialog({
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
@use 'sass:color';
@use '@/assets/styles/base/tokens' as tokens;

.admin-order-detail {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 16px;
    min-width: 0;
  }

  &__header-main {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  &__title-block {
    min-width: 0;
  }

  &__title {
    margin: 0;
    color: tokens.$form-text;
    font-size: 20px;
    font-weight: 800;
    line-height: 1.35;
  }

  &__subtitle {
    margin: 4px 0 0;
    color: tokens.$form-muted;
    font-size: 13px;
    line-height: 1.5;
  }

  &__summary-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    max-width: 220px;
    min-height: 28px;
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
    line-height: 1.4;
    white-space: nowrap;
  }

  &__state {
    padding: 36px 12px;
    border: 1px dashed color.mix(tokens.$form-border, #fff, 40%);
    border-radius: 16px;
    background: color.mix(tokens.$form-border, #fff, 28%);
    text-align: center;

    &--error {
      border-color: color.mix(tokens.$danger, #fff, 40%);
      background: color.mix(tokens.$danger, #fff, 90%);
    }
  }

  &__state-text {
    margin: 0;
    color: tokens.$form-muted;
    font-size: 14px;
    font-weight: 700;
  }

  &__summary-card {
    margin-bottom: 18px;
    padding: 16px;
    border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
    border-radius: 18px;
    background: color.mix(tokens.$brand-light, #fff, 16%);
    overflow: hidden;
  }

  &__summary-content {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  &__summary-item {
    min-width: 0;
    padding: 12px;
    border: 1px solid color.mix(tokens.$form-border, #fff, 62%);
    border-radius: 14px;
    background: rgba(#fff, 0.86);
  }

  &__summary-label {
    display: block;
    margin-bottom: 6px;
    color: tokens.$form-muted;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.4;
  }

  &__summary-value {
    display: block;
    color: tokens.$form-text;
    font-size: 14px;
    font-weight: 800;
    line-height: 1.5;
    word-break: break-word;

    &--money {
      color: tokens.$brand-dark;
      font-size: 16px;
    }
  }

  &__layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 380px);
    gap: 18px;
    align-items: flex-start;
    width: 100%;
    max-width: 100%;
  }

  &__main,
  &__side {
    min-width: 0;
    width: 100%;
  }

  &__section {
    width: 100%;
    min-width: 0;

    & + & {
      margin-top: 18px;
    }
  }

  &__section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 10px;
    min-width: 0;
  }

  &__section-title {
    margin: 0;
    padding-left: 10px;
    border-left: 4px solid tokens.$brand;
    color: tokens.$form-text;
    font-size: 15px;
    font-weight: 800;
    line-height: 1.4;
    word-break: break-word;

    span {
      margin-left: 6px;
      color: tokens.$form-muted;
      font-size: 12px;
      font-weight: 700;
    }
  }

  &__section-badge {
    flex: 0 0 auto;
    padding: 4px 10px;
    border-radius: 999px;
    background: color.mix(tokens.$brand-light, #fff, 18%);
    color: tokens.$brand;
    font-size: 12px;
    font-weight: 800;
    line-height: 1.4;
  }

  &__card,
  &__timeline-card,
  &__amount-card,
  &__action-card,
  &__report-card {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    padding: 16px;
    border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
    border-radius: 18px;
    background: tokens.$form-bg;
    box-shadow: 0 8px 20px rgba(tokens.$ink-900, 0.035);
    overflow: hidden;
  }

  &__card--side {
    padding: 14px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    min-width: 0;
  }

  &__field {
    display: grid;
    grid-template-columns: 96px minmax(0, 1fr);
    gap: 10px;
    align-items: flex-start;
    min-width: 0;
    padding: 12px;
    border: 1px dashed color.mix(tokens.$form-border, #fff, 42%);
    border-radius: 14px;
    background: rgba(#fff, 0.82);

    &--full {
      grid-column: 1 / -1;
    }
  }

  &__field-label {
    color: tokens.$form-muted;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.5;
  }

  &__field-value {
    min-width: 0;
    color: tokens.$form-text;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.5;
    word-break: break-word;
    overflow-wrap: anywhere;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 24px;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
    line-height: 1.4;
    white-space: nowrap;

    &--yellow {
      background: color.mix(#facc15, #fff, 24%);
      color: #854d0e;
    }

    &--blue {
      background: color.mix(#60a5fa, #fff, 24%);
      color: #1e40af;
    }

    &--purple {
      background: color.mix(#a78bfa, #fff, 28%);
      color: #5b21b6;
    }

    &--green {
      background: color.mix(#22c55e, #fff, 22%);
      color: #14532d;
    }

    &--gray {
      background: color.mix(tokens.$form-border, #fff, 46%);
      color: tokens.$form-muted;
    }
  }

  &__level-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 24px;
    padding: 3px 10px;
    border-radius: 999px;
    background: color.mix(tokens.$brand-light, #fff, 18%);
    color: tokens.$brand-dark;
    font-size: 12px;
    font-weight: 800;
    line-height: 1.4;
    white-space: nowrap;
  }

  &__side-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__side-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-width: 0;
    padding: 10px 12px;
    border-radius: 12px;
    background: rgba(#fff, 0.86);

    span {
      color: tokens.$form-muted;
      font-size: 13px;
      font-weight: 700;
    }

    strong {
      min-width: 0;
      color: tokens.$form-text;
      font-size: 13px;
      font-weight: 800;
      text-align: right;
      word-break: break-word;
    }
  }

  &__amount-card {
    padding: 14px;
  }

  &__amount-row,
  &__amount-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-width: 0;
    padding: 10px 12px;
    border-radius: 12px;

    span {
      color: tokens.$form-muted;
      font-size: 13px;
      font-weight: 700;
    }

    strong {
      color: tokens.$form-text;
      font-size: 13px;
      font-weight: 800;
    }
  }

  &__amount-row {
    background: rgba(#fff, 0.84);

    & + & {
      margin-top: 8px;
    }
  }

  &__amount-total {
    margin-top: 10px;
    background: color.mix(tokens.$brand-light, #fff, 24%);

    span,
    strong {
      color: tokens.$brand-dark;
      font-size: 15px;
    }
  }

  &__report-card {
    padding: 12px;
  }

  &__report-table {
    width: 100%;
    min-width: 0;
  }

  &__timeline-card {
    padding: 14px;
  }

  &__timeline {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-left: 4px;
  }

  &__timeline-item {
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr);
    gap: 8px;
    min-width: 0;
  }

  &__timeline-dot {
    width: 12px;
    height: 12px;
    margin-top: 4px;
    border-radius: 999px;
    box-shadow: 0 0 0 4px rgba(tokens.$brand, 0.08);
  }

  &__timeline-content {
    min-width: 0;
    padding: 10px 12px;
    border: 1px solid color.mix(tokens.$form-border, #fff, 62%);
    border-radius: 14px;
    background: rgba(#fff, 0.9);
  }

  &__timeline-status {
    display: block;
    color: tokens.$form-text;
    font-size: 13px;
    font-weight: 800;
    line-height: 1.5;
  }

  &__timeline-meta {
    display: block;
    margin-top: 3px;
    color: tokens.$form-muted;
    font-size: 12px;
    line-height: 1.5;
    word-break: break-word;
  }

  &__empty {
    margin: 0;
    padding: 22px 12px;
    color: tokens.$form-muted;
    font-size: 13px;
    font-weight: 700;
    text-align: center;
  }

  &__action-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
  }

  &__action-btn {
    width: 100%;
  }

  &__action-note {
    margin: 0;
    padding: 12px;
    border-radius: 12px;
    background: color.mix(tokens.$form-border, #fff, 35%);
    color: tokens.$form-muted;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.5;
    text-align: center;
  }

  &__modal {
    width: 100%;
    min-width: 0;
    padding: 16px;
  }

  &__modal-head {
    margin-bottom: 14px;
  }

  &__modal-title {
    margin: 0;
    color: tokens.$form-text;
    font-size: 16px;
    font-weight: 800;
    line-height: 1.4;
  }

  &__modal-subtitle {
    margin: 6px 0 0;
    color: tokens.$form-muted;
    font-size: 13px;
    line-height: 1.5;
  }

  &__modal-warning {
    margin: 10px 0 0;
    padding: 10px 12px;
    border-left: 4px solid tokens.$brand;
    border-radius: tokens.$form-radius;
    background: color.mix(tokens.$brand-light, #fff, 35%);
    color: tokens.$brand-dark;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.6;
  }

  &__modal-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__modal-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 12px;
    flex-wrap: wrap;
  }

  @media (max-width: 1180px) {
    &__layout {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 960px) {
    &__summary-content {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    &__header {
      flex-direction: column;
    }

    &__header-main {
      align-items: flex-start;
      flex-direction: column;
    }

    &__summary-pill {
      max-width: 100%;
    }
  }

  @media (max-width: 768px) {
    &__grid {
      grid-template-columns: 1fr;
    }

    &__field {
      grid-template-columns: 1fr;
      gap: 4px;

      &--full {
        grid-column: auto;
      }
    }

    &__section-head {
      align-items: flex-start;
      flex-direction: column;
    }
  }

  @media (max-width: 576px) {
    &__summary-content {
      grid-template-columns: 1fr;
    }

    &__summary-card,
    &__card,
    &__timeline-card,
    &__amount-card,
    &__action-card,
    &__report-card {
      border-radius: 14px;
      padding: 12px;
    }
  }
}
</style>

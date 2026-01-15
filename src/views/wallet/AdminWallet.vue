<!-- src/views/wallet/AdminWallet.vue -->
<template>
  <!-- 玩家錢包查詢 -->
  <MCard>
    <Form
      ref="walletFormRef"
      :initial-values="walletInitValues"
      @submit="onWalletSubmit"
    >
      <FormTitle title="錢包管理" />

      <AdminWalletSearchForm />

      <div class="flex justify-center m-y-8 gap-x-12">
        <MButton type="submit">查詢錢包</MButton>
        <MButton type="button" variant="secondary" @click="resetWallet"
          >清除</MButton
        >
      </div>
    </Form>

    <div class="m-t-12" v-if="walletSearched">
      <template v-if="walletLoading">
        <p class="adminWallet__hint">載入中...</p>
      </template>

      <template v-else>
        <template v-if="wallet">
          <div class="adminWallet__walletCard">
            <div class="adminWallet__walletRow">
              <span class="adminWallet__k">User ID</span>
              <span class="adminWallet__v">{{ wallet.userId || '-' }}</span>
            </div>
            <div class="adminWallet__walletRow">
              <span class="adminWallet__k">玩家名稱</span>
              <span class="adminWallet__v">{{
                wallet.userName || wallet.nickname || '-'
              }}</span>
            </div>
            <div class="adminWallet__walletRow">
              <span class="adminWallet__k">點數餘額</span>
              <span class="adminWallet__v">{{
                formatMoney(wallet.balance ?? wallet.coinBalance)
              }}</span>
            </div>
            <div class="adminWallet__walletRow">
              <span class="adminWallet__k">更新時間</span>
              <span class="adminWallet__v">{{
                formatDateTime(wallet.updatedAt)
              }}</span>
            </div>
          </div>
        </template>

        <template v-else>
          <NoData message="查無此玩家錢包資料" />
        </template>
      </template>
    </div>
  </MCard>

  <!-- 手動調整點數 -->
  <div class="m-t-12">
    <MCard>
      <Form
        ref="adjustFormRef"
        :initial-values="adjustInitValues"
        @submit="onAdjustSubmit"
      >
        <FormTitle title="手動調整點數" />

        <AdminWalletAdjustForm :coin-type-options="coinTypeOptions" />

        <div class="flex justify-center m-y-8 gap-x-12">
          <MButton type="submit">送出調整</MButton>
          <MButton type="button" variant="secondary" @click="resetAdjust"
            >清除</MButton
          >
        </div>
      </Form>
    </MCard>
  </div>

  <!-- 交易紀錄 -->
  <div class="m-t-12">
    <MCard>
      <Form ref="txFormRef" :initial-values="txInitValues" @submit="onTxSubmit">
        <FormTitle title="交易紀錄查詢" />

        <AdminWalletTxSearchForm :coin-type-options="coinTypeOptions" />

        <div class="flex justify-center m-y-8 gap-x-12">
          <MButton type="submit">查詢</MButton>
          <MButton type="button" variant="secondary" @click="resetTx"
            >清除</MButton
          >
        </div>
      </Form>

      <template v-if="!hasData">
        <NoData :message="noDataMessage" />
      </template>

      <template v-else>
        <ReportTable
          class="m-t-12"
          :columns="columns"
          :items="currentPageItems"
          row-key="id"
          :useWidthClass="true"
          :sort-key="sortKey"
          :sort-order="sortOrder"
          @sort="handleSort"
        >
          <template #cell-amount="{ item }">
            <span>{{ formatSignedMoney(item.amount) }}</span>
          </template>

          <template #cell-coinTypeName="{ item }">
            <span>{{ item.coinTypeName || coinTypeText(item.coinType) }}</span>
          </template>

          <template #cell-createdAt="{ item }">
            <span>{{ formatDateTime(item.createdAt) }}</span>
          </template>

          <template #cell-remark="{ item }">
            <span>{{ item.remark || '-' }}</span>
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

import { usePagination } from '@/hook/usePagination';
import { useSearchPage } from '@/hook/useSearchPage';
import { compareByKeySmart } from '@/utils/sortUtils';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import NoData from '@/components/common/NoData.vue';
import Pagination from '@/components/common/Pagination.vue';
import ReportTable from '@/components/common/ReportTable.vue';
import FormTitle from '@/components/common/FormTitle.vue';

import AdminWalletSearchForm from '@/components/wallet/AdminWalletSearchForm.vue';
import AdminWalletAdjustForm from '@/components/wallet/AdminWalletAdjustForm.vue';
import AdminWalletTxSearchForm from '@/components/wallet/AdminWalletTxSearchForm.vue';

import { useDialogStore } from '@/stores';
import { executeApi } from '@/utils/executeApiUtils';

import {
  getUserWallet,
  adjustWalletCoins,
  queryWalletTransactions,
} from '@/services/adminWalletService';

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
const dialogStore = useDialogStore();

/* ==============================
 * Coin Type Options (依你後端 coinType 定義調整)
 * ============================== */
const coinTypeOptions = ref<SelectOption[]>([
  { label: '點數', value: 'COIN' },
  { label: '贈送點數', value: 'BONUS' },
]);

const coinTypeText = (coinType?: string) =>
  coinType === 'COIN' ? '點數' : coinType === 'BONUS' ? '贈送點數' : '-';

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

const formatSignedMoney = (n: any) => {
  const num = Number(n);
  if (Number.isNaN(num)) return n ?? '-';
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toLocaleString('zh-TW')}`;
};

/* ==============================
 * 1) Wallet Query Form
 * ============================== */
const walletFormRef = ref<FormContext | null>(null);
const walletInitValues = ref<any>({
  userId: '',
});

const walletLoading = ref(false);
const walletSearched = ref(false);
const wallet = ref<any>(null);

const onWalletSubmit = async (values: any) => {
  const userId = String(values?.userId || '').trim();
  if (!userId) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '請輸入 userId',
      iconType: 'warning',
    });
    return;
  }

  walletSearched.value = true;
  walletLoading.value = true;
  wallet.value = null;

  try {
    const res = await getUserWallet(userId);
    wallet.value = (res as any)?.data ?? res;
  } catch (e) {
    console.error(e);
    wallet.value = null;
  } finally {
    walletLoading.value = false;
  }
};

const resetWallet = () => {
  walletFormRef.value?.resetForm?.();
  walletSearched.value = false;
  walletLoading.value = false;
  wallet.value = null;
};

/* ==============================
 * 2) Adjust Form
 * ============================== */
const adjustFormRef = ref<FormContext | null>(null);

const adjustInitValues = ref<any>({
  userId: '',
  coinType: 'COIN',
  amount: '',
  reason: '',
});

const onAdjustSubmit = async (values: any) => {
  const payload = {
    userId: String(values?.userId || '').trim(),
    coinType: values?.coinType,
    amount: Number(values?.amount),
    reason: String(values?.reason || '').trim(),
  };

  if (!payload.userId) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '請輸入 userId',
      iconType: 'warning',
    });
    return;
  }
  if (!payload.coinType) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '請選擇 coinType',
      iconType: 'warning',
    });
    return;
  }
  if (!Number.isFinite(payload.amount) || payload.amount === 0) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: 'amount 必須是數字，且不可為 0（正數=加值；負數=扣除）',
      iconType: 'warning',
    });
    return;
  }

  const ok = await dialogStore.openConfirmDialog({
    title: '調整確認',
    message: `確定要調整玩家點數嗎？\nuserId=${payload.userId}\ncoinType=${payload.coinType}\namount=${payload.amount}`,
  });
  if (!ok) return;

  await executeApi({
    fn: async () => adjustWalletCoins(payload),
    onSuccess: async () => {
      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '調整成功',
        iconType: 'success',
      });

      // 調整完順便刷新錢包（如果 userId 一樣）
      const currentWalletUserId = String(
        walletFormRef.value?.values?.userId || ''
      ).trim();
      if (currentWalletUserId && currentWalletUserId === payload.userId) {
        await onWalletSubmit({ userId: payload.userId });
      }
    },
    showSuccessDialog: false,
  });
};

const resetAdjust = () => {
  adjustFormRef.value?.resetForm?.();
};

/* ==============================
 * 3) Transaction List
 * ============================== */
const txFormRef = ref<FormContext | null>(null);

const txInitValues = ref<any>({
  userId: '',
  coinType: '',
  type: '',
  createdAtStart: '',
  createdAtEnd: '',
});

const { list, hasData, isSearch, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

/* ---- Sorting ---- */
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

/* ---- Pagination ---- */
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

/* ---- Columns ---- */
const columns = [
  { field: 'userId', label: 'User ID', width: 160, sortable: true },
  { field: 'coinTypeName', label: '幣別', width: 120, sortable: true },
  { field: 'type', label: '類型', width: 140, sortable: true },
  { field: 'amount', label: '金額', width: 120, sortable: true },
  { field: 'balanceAfter', label: '調整後餘額', width: 140, sortable: true },
  { field: 'remark', label: '備註', width: 220, sortable: true },
  { field: 'createdAt', label: '建立時間', width: 170, sortable: true },
];

const onTxSubmit = async (values: any) => {
  // 後端：POST /admin/wallet/transactions/list body 可為空
  const req = {
    condition: {
      userId: values?.userId || null,
      coinType: values?.coinType || null,
      type: values?.type || null,
      createdAtStart: values?.createdAtStart || null,
      createdAtEnd: values?.createdAtEnd || null,
    },
  };

  await query(() => queryWalletTransactions(req));
  goToPage(1);
};

const resetTx = async () => {
  txFormRef.value?.resetForm?.();
  list.value = [];
  isSearch.value = false;
  sortKey.value = '';
  sortOrder.value = 'asc';
  goToPage(1);
};

/* ==============================
 * Lifecycle
 * ============================== */
onMounted(async () => {
  await loadSelectOptions();
});
</script>

<style scoped lang="scss">
.adminWallet {
  &__hint {
    color: #6b7280;
    padding: 12px 0;
  }

  &__walletCard {
    margin-top: 8px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 12px;
  }

  &__walletRow {
    display: grid;
    grid-template-columns: 90px 1fr;
    gap: 10px;
    padding: 6px 0;
  }

  &__k {
    color: #6b7280;
    font-size: 13px;
  }

  &__v {
    font-size: 13px;
    word-break: break-word;
  }
}
</style>

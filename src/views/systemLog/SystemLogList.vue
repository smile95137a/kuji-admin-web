<!-- src/views/systemLog/SystemLogList.vue -->
<template>
  <!-- Header + 分類切換 -->
  <MCard>
    <div class="sl-header">
      <div>
        <h2 class="sl-header__title">系統日誌</h2>
        <p class="sl-header__sub">System Activity Logs</p>
      </div>
      <span v-if="hasData" class="sl-count">共 {{ list.length }} 筆</span>
    </div>

    <div class="sl-tabs">
      <button
        v-for="tab in LOG_TABS"
        :key="tab.value"
        class="sl-tab"
        :class="[`sl-tab--${tab.value.toLowerCase()}`, { 'sl-tab--active': activeTab === tab.value, 'sl-tab--disabled': tab.disabled }]"
        :disabled="tab.disabled"
        :title="tab.disabled ? '後端尚未支援此日誌類型' : undefined"
        type="button"
        @click="!tab.disabled && switchTab(tab.value)"
      >
        <span class="sl-tab__dot"></span>
        <span>{{ tab.label }}</span>
        <span v-if="tab.disabled" class="sl-tab__unsupported">（尚未支援）</span>
      </button>
    </div>
  </MCard>

  <!-- 查詢條件 -->
  <div class="m-t-12">
    <MCard>
      <div class="sl-filter-grid">
        <FormInput label="開始時間" type="datetime-local" v-model="startInput" />
        <FormInput label="結束時間" type="datetime-local" v-model="endInput" />
        <FormInput label="Email 搜尋（選填）" v-model="emailInput" placeholder="輸入 Email 篩選" />
        <FormSelect
          label="結果狀態"
          v-model="resultFilter"
          :options="resultOptions"
          empty-label="全部"
        />
        <FormInput label="筆數上限" type="number" v-model="limitInput" placeholder="預設 200" />
      </div>
      <div class="sl-filter-actions">
        <MButton @click="doSearch">查詢</MButton>
        <MButton type="button" @click="resetFilters" class="mbtn--gray">清除</MButton>
        <MButton type="button" class="mbtn--red" @click="cleanupLogs">清除過期日誌</MButton>
      </div>
    </MCard>
  </div>

  <!-- 結果列表 -->
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
          row-key="id"
          :useWidthClass="true"
          :sort-key="sortKey"
          :sort-order="sortOrder"
          @sort="handleSort"
        >
          <!-- 時間 -->
          <template #cell-createdAt="{ item }">
            <DateFormatter v-if="item.createdAt" :date="item.createdAt" format="YYYY-MM-DD HH:mm:ss" />
            <span v-else class="sl-empty">—</span>
          </template>

          <!-- 結果 badge（兩個 tab 共用） -->
          <template #cell-result="{ item }">
            <span
              class="sl-result"
              :class="`sl-result--${(item.result ?? '').toLowerCase()}`"
            >
              {{ RESULT_LABEL[item.result] ?? item.result ?? '-' }}
            </span>
          </template>

          <!-- errorMessage（hover tooltip） -->
          <template #cell-errorMessage="{ item }">
            <span v-if="item.errorMessage" class="sl-error" :title="item.errorMessage">
              {{ truncate(item.errorMessage, 40) }}
            </span>
            <span v-else class="sl-empty">—</span>
          </template>

          <!-- ===== LOGIN 專用 ===== -->
          <!-- userType 翻譯 -->
          <template #cell-userType="{ item }">
            <span class="sl-badge" :class="item.userType === 'admin' ? 'sl-badge--admin' : 'sl-badge--user'">
              {{ item.userType === 'admin' ? '後台' : '前台' }}
            </span>
          </template>

          <!-- loginMethod -->
          <template #cell-loginMethod="{ item }">
            {{ LOGIN_METHOD_LABEL[item.loginMethod] ?? item.loginMethod ?? '-' }}
          </template>

          <!-- ===== ADMIN_ACTION 專用 ===== -->
          <!-- action badge -->
          <template #cell-action="{ item }">
            <span class="sl-action" :class="`sl-action--${(item.action ?? '').toLowerCase()}`">
              {{ item.action || '-' }}
            </span>
          </template>

          <!-- 操作對象（targetType + targetName 合併顯示） -->
          <template #cell-target="{ item }">
            <span v-if="item.targetType || item.targetName">
              <span class="sl-target-type">{{ item.targetType }}</span>
              <span v-if="item.targetName" class="sl-target-name"> — {{ truncate(item.targetName, 30) }}</span>
            </span>
            <span v-else class="sl-empty">—</span>
          </template>

          <!-- 快照詳情按鈕 -->
          <template #cell-snapshot="{ item }">
            <button
              v-if="item.beforeSnapshot || item.afterSnapshot"
              class="sl-detail-btn"
              type="button"
              @click="openSnapshot(item)"
            >
              查看
            </button>
            <span v-else class="sl-empty">—</span>
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

  <!-- Snapshot Dialog -->
  <Dialog
    :isOpen="snapshotOpen"
    customClass="dialog--snapshot"
    @close="snapshotOpen = false"
  >
    <div class="sl-snapshot">
      <p class="sl-snapshot__title">操作快照</p>
      <div class="sl-snapshot__row">
        <p class="sl-snapshot__label">操作前</p>
        <pre class="sl-snapshot__code">{{ formatJson(selectedSnapshot.before) }}</pre>
      </div>
      <div class="sl-snapshot__row m-t-12">
        <p class="sl-snapshot__label">操作後</p>
        <pre class="sl-snapshot__code">{{ formatJson(selectedSnapshot.after) }}</pre>
      </div>
      <div class="flex justify-center m-t-12">
        <MButton variant="secondary" @click="snapshotOpen = false">關閉</MButton>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

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
import Dialog from '@/components/common/Dialog.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { useDialogStore } from '@/stores';

import {
  getSystemLogsByType,
  getSystemLogsByDateRange,
  cleanupOldSystemLogs,
} from '@/services/adminSystemLogService';

/* ==============================
 * Constants
 * ============================== */
const LOG_TABS = [
  { label: '登入日誌', value: 'LOGIN', disabled: false },
  { label: '後台操作', value: 'ADMIN_ACTION', disabled: false },
  { label: '抽獎日誌', value: 'DRAW', disabled: true },
  { label: '支付日誌', value: 'PAYMENT', disabled: true },
] as const;

type LogType = typeof LOG_TABS[number]['value'];

const RESULT_LABEL: Record<string, string> = {
  SUCCESS: '成功',
  FAILED: '失敗',
  BLOCKED: '封鎖',
};

const LOGIN_METHOD_LABEL: Record<string, string> = {
  PASSWORD: '密碼',
  GOOGLE: 'Google',
  LINE: 'LINE',
};

const resultOptions = [
  { label: '成功 (SUCCESS)', value: 'SUCCESS' },
  { label: '失敗 (FAILED)', value: 'FAILED' },
  { label: '封鎖 (BLOCKED)', value: 'BLOCKED' },
];

/* ==============================
 * Store
 * ============================== */
const dialogStore = useDialogStore();

/* ==============================
 * Tab / Filter State
 * ============================== */
const activeTab = ref<LogType>('LOGIN');

const startInput = ref('');
const endInput = ref('');
const emailInput = ref('');
const resultFilter = ref('');
const limitInput = ref<number | string>(200);

/* ==============================
 * Snapshot Dialog
 * ============================== */
const snapshotOpen = ref(false);
const selectedSnapshot = ref<{ before: string | null; after: string | null }>({ before: null, after: null });

const openSnapshot = (item: any) => {
  selectedSnapshot.value = { before: item.beforeSnapshot ?? null, after: item.afterSnapshot ?? null };
  snapshotOpen.value = true;
};

const formatJson = (raw: string | null): string => {
  if (!raw) return '（無資料）';
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
};

/* ==============================
 * Search Hook
 * ============================== */
const { list, hasData, isSearch, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

/* ==============================
 * Utils
 * ============================== */
const toBackendDateTime = (v?: string | null) => {
  if (!v) return '';
  return String(v).length === 16 ? `${v}:00` : String(v);
};

const truncate = (s?: string, max = 60) => {
  const t = String(s ?? '');
  if (!t || t === 'null' || t === 'undefined') return '-';
  return t.length <= max ? t : `${t.slice(0, max)}...`;
};

/* ==============================
 * Sorting
 * ============================== */
const sortKey = ref('');
const sortOrder = ref<'asc' | 'desc' | ''>('');

const handleSort = ({ key, order }: { key: string; order: 'asc' | 'desc' | '' }) => {
  sortKey.value = key;
  sortOrder.value = order;
  goToPage(1);
};

const sortedList = computed(() => {
  if (!sortKey.value || !sortOrder.value) return list.value as any[];
  const arr = [...(list.value as any[])];
  arr.sort((a, b) =>
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
const pageLimitSize = ref(20);

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
 * Columns（依 Tab 切換）
 * ============================== */
const columns = computed(() => {
  if (activeTab.value === 'LOGIN') {
    return [
      { field: 'createdAt', label: '時間', width: 165, sortable: true },
      { field: 'email', label: 'Email', width: 200, sortable: true },
      { field: 'userType', label: '使用者類型', width: 100, sortable: true },
      { field: 'loginMethod', label: '登入方式', width: 110, sortable: true },
      { field: 'result', label: '結果', width: 90, sortable: true },
      { field: 'ip', label: 'IP', width: 140, sortable: true },
      { field: 'errorMessage', label: '失敗原因', width: 200, sortable: true },
    ];
  }
  // ADMIN_ACTION
  return [
    { field: 'createdAt', label: '時間', width: 165, sortable: true },
    { field: 'adminEmail', label: '操作人員', width: 200, sortable: true },
    { field: 'adminRole', label: '角色', width: 160, sortable: true },
    { field: 'action', label: '操作', width: 120, sortable: true },
    { field: 'target', label: '操作對象', width: 240, sortable: false },
    { field: 'result', label: '結果', width: 90, sortable: true },
    { field: 'ip', label: 'IP', width: 140, sortable: true },
    { field: 'snapshot', label: '快照', width: 70, sortable: false },
  ];
});

/* ==============================
 * Core Query Logic
 * ============================== */
const fetchLogs = async (logType: LogType) => {
  const start = toBackendDateTime(startInput.value);
  const end = toBackendDateTime(endInput.value);
  const limit = Number(limitInput.value || 200);
  const emailQ = emailInput.value.trim().toLowerCase();
  const resultQ = resultFilter.value;

  await query(async () => {
    let rows: any[];

    if (start && end) {
      const res = await getSystemLogsByDateRange(start, end, limit);
      const all: any[] = Array.isArray(res) ? res : (Array.isArray((res as any)?.data) ? (res as any).data : []);
      rows = all.filter((r) => r?.logType === logType);
    } else {
      const res = await getSystemLogsByType(logType, limit);
      rows = Array.isArray(res) ? res : (Array.isArray((res as any)?.data) ? (res as any).data : []);
    }

    // 前端 email 篩選（LOGIN 用 email，ADMIN_ACTION 用 adminEmail）
    if (emailQ) {
      rows = rows.filter((r) =>
        String(r?.email ?? r?.adminEmail ?? '').toLowerCase().includes(emailQ)
      );
    }

    // 前端 result 篩選
    if (resultQ) {
      rows = rows.filter((r) => r?.result === resultQ);
    }

    return rows;
  });

  goToPage(1);
};

/* ==============================
 * Actions
 * ============================== */
const doSearch = () => fetchLogs(activeTab.value);

const resetFilters = () => {
  startInput.value = '';
  endInput.value = '';
  emailInput.value = '';
  resultFilter.value = '';
  limitInput.value = 200;
};

const switchTab = (tab: LogType) => {
  activeTab.value = tab;
  sortKey.value = '';
  sortOrder.value = '';
  fetchLogs(tab);
};

const cleanupLogs = async () => {
  const days = 90;

  const ok = await dialogStore.openConfirmDialog({
    title: '清除確認',
    message: `確定要清除 ${days} 天前的系統日誌嗎？（不可復原）`,
  });
  if (!ok) return;

  await executeApi({
    fn: async () => cleanupOldSystemLogs(days),
    onSuccess: async (data: any) => {
      const deleted = (data as any)?.data ?? data ?? 0;
      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: `清除完成：共刪除 ${deleted} 筆日誌`,
        iconType: 'success',
      });
      await fetchLogs(activeTab.value);
    },
    showSuccessDialog: false,
  });
};

/* ==============================
 * Lifecycle
 * ============================== */
onMounted(() => {
  fetchLogs('LOGIN');
});
</script>

<style scoped lang="scss">
.sl-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  &__title { font-size: 20px; font-weight: 700; color: #1f2937; }
  &__sub   { font-size: 13px; color: #9ca3af; margin-top: 2px; }
}

.sl-count { font-size: 13px; color: #6b7280; }

/* ── Tabs ── */
.sl-tabs { display: flex; gap: 8px; flex-wrap: wrap; }

.sl-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  color: #4b5563;
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  &:hover { background: #f3f4f6; border-color: #d1d5db; }

  &__dot { width: 8px; height: 8px; border-radius: 50%; background: #d1d5db; }
  &__unsupported { font-size: 11px; color: #9ca3af; }
}

.sl-tab--disabled { opacity: 0.45; cursor: not-allowed; }

.sl-tab--login .sl-tab__dot { background: #3b82f6; }
.sl-tab--login.sl-tab--active { background: #eff6ff; border-color: #3b82f6; color: #1d4ed8; font-weight: 600; }

.sl-tab--admin_action .sl-tab__dot { background: #f59e0b; }
.sl-tab--admin_action.sl-tab--active { background: #fffbeb; border-color: #f59e0b; color: #d97706; font-weight: 600; }

.sl-tab--draw .sl-tab__dot { background: #10b981; }
.sl-tab--draw.sl-tab--active { background: #ecfdf5; border-color: #10b981; color: #059669; font-weight: 600; }

.sl-tab--payment .sl-tab__dot { background: #8b5cf6; }
.sl-tab--payment.sl-tab--active { background: #f5f3ff; border-color: #8b5cf6; color: #7c3aed; font-weight: 600; }

/* ── Filter ── */
.sl-filter-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.sl-filter-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* ── Result Badge ── */
.sl-result {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;

  &--success { background: #d1fae5; color: #065f46; }
  &--failed  { background: #fee2e2; color: #dc2626; }
  &--blocked { background: #fef3c7; color: #d97706; }
}

/* ── User Type Badge ── */
.sl-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;

  &--admin { background: #ede9fe; color: #6d28d9; }
  &--user  { background: #dbeafe; color: #1d4ed8; }
}

/* ── Action Badge ── */
.sl-action {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: #f3f4f6;
  color: #374151;

  &--create   { background: #d1fae5; color: #065f46; }
  &--update   { background: #fef3c7; color: #d97706; }
  &--delete   { background: #fee2e2; color: #dc2626; }
  &--on_shelf { background: #dbeafe; color: #1d4ed8; }
  &--off_shelf{ background: #fef9c3; color: #a16207; }
}

/* ── Target ── */
.sl-target-type { font-weight: 600; font-size: 12px; color: #374151; }
.sl-target-name { font-size: 12px; color: #6b7280; }

/* ── Detail Button ── */
.sl-detail-btn {
  padding: 2px 10px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  background: #fff;
  font-size: 12px;
  cursor: pointer;
  color: #374151;
  &:hover { background: #f3f4f6; }
}

/* ── Snapshot Dialog ── */
.sl-snapshot {
  padding: 16px;
  min-width: 560px;

  &__title { font-size: 16px; font-weight: 700; margin-bottom: 12px; }
  &__label { font-size: 12px; color: #6b7280; margin-bottom: 4px; font-weight: 600; }
  &__code  {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 10px 14px;
    font-size: 12px;
    font-family: monospace;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 240px;
    overflow-y: auto;
  }
}

/* ── Misc ── */
.sl-error { color: #dc2626; font-size: 12px; }
.sl-empty { color: #d1d5db; }
</style>

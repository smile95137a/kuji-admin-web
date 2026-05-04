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
        :class="[
          `sl-tab--${tab.value.toLowerCase()}`,
          {
            'sl-tab--active': activeTab === tab.value,
            'sl-tab--disabled': tab.disabled,
          },
        ]"
        :disabled="tab.disabled"
        :title="tab.disabled ? '後端尚未支援此日誌類型' : undefined"
        type="button"
        @click="!tab.disabled && switchTab(tab.value)"
      >
        <span class="sl-tab__dot"></span>
        <span>{{ tab.label }}</span>
        <span v-if="tab.disabled" class="sl-tab__unsupported">
          （尚未支援）
        </span>
      </button>
    </div>
  </MCard>

  <!-- 查詢條件 -->
  <div class="m-t-12">
    <MCard>
      <div class="sl-filter-grid">
        <FormInput
          label="開始時間"
          type="datetime-local"
          v-model="startInput"
        />

        <FormInput label="結束時間" type="datetime-local" v-model="endInput" />

        <FormInput
          label="Email 搜尋（選填）"
          v-model="emailInput"
          placeholder="輸入 Email 篩選"
        />

        <FormSelect
          label="結果狀態"
          v-model="resultFilter"
          :options="resultOptions"
          :showAll="true"
          allLabel="全部"
          :allValue="''"
        />

        <FormInput
          label="筆數上限"
          type="number"
          v-model="limitInput"
          placeholder="預設 200"
        />
      </div>

      <div class="sl-filter-actions">
        <MButton type="button" @click="doSearch">查詢</MButton>

        <MButton type="button" class="mbtn--gray" @click="resetFilters">
          清除
        </MButton>

        <MButton type="button" class="mbtn--red" @click="cleanupLogs">
          清除過期日誌
        </MButton>
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
            <DateFormatter
              v-if="item.createdAt"
              :date="item.createdAt"
              format="YYYY-MM-DD HH:mm:ss"
            />
            <span v-else class="sl-empty">—</span>
          </template>

          <!-- 結果 badge -->
          <template #cell-result="{ item }">
            <span
              class="sl-result"
              :class="`sl-result--${String(item.result ?? '').toLowerCase()}`"
            >
              {{ RESULT_LABEL[item.result] ?? item.result ?? '-' }}
            </span>
          </template>

          <!-- errorMessage -->
          <template #cell-errorMessage="{ item }">
            <span
              v-if="item.errorMessage"
              class="sl-error"
              :title="item.errorMessage"
            >
              {{ truncate(item.errorMessage, 40) }}
            </span>
            <span v-else class="sl-empty">—</span>
          </template>

          <!-- LOGIN 專用：userType -->
          <template #cell-userType="{ item }">
            <span
              class="sl-badge"
              :class="
                item.userType === 'admin' ? 'sl-badge--admin' : 'sl-badge--user'
              "
            >
              {{ item.userType === 'admin' ? '後台' : '前台' }}
            </span>
          </template>

          <!-- LOGIN 專用：loginMethod -->
          <template #cell-loginMethod="{ item }">
            {{
              LOGIN_METHOD_LABEL[item.loginMethod] ?? item.loginMethod ?? '-'
            }}
          </template>

          <!-- ADMIN_ACTION 專用：action -->
          <template #cell-action="{ item }">
            <span
              class="sl-action"
              :class="`sl-action--${String(item.action ?? '').toLowerCase()}`"
            >
              {{ item.action || '-' }}
            </span>
          </template>

          <!-- ADMIN_ACTION 專用：操作對象 -->
          <template #cell-target="{ item }">
            <span v-if="item.targetType || item.targetName">
              <span class="sl-target-type">{{ item.targetType }}</span>
              <span v-if="item.targetName" class="sl-target-name">
                — {{ truncate(item.targetName, 30) }}
              </span>
            </span>
            <span v-else class="sl-empty">—</span>
          </template>

          <!-- ADMIN_ACTION 專用：快照 -->
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
        <pre class="sl-snapshot__code">{{
          formatJson(selectedSnapshot.before)
        }}</pre>
      </div>

      <div class="sl-snapshot__row m-t-12">
        <p class="sl-snapshot__label">操作後</p>
        <pre class="sl-snapshot__code">{{
          formatJson(selectedSnapshot.after)
        }}</pre>
      </div>

      <div class="flex justify-center m-t-12">
        <MButton type="button" class="mbtn--gray" @click="snapshotOpen = false">
          關閉
        </MButton>
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

import {
  getSystemLogsByType,
  getSystemLogsByDateRange,
  cleanupOldSystemLogs,
} from '@/services/adminSystemLogService';

import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

/* ==============================
 * Constants
 * ============================== */
const LOG_TABS = [
  { label: '登入日誌', value: 'LOGIN', disabled: false },
  { label: '後台操作', value: 'ADMIN_ACTION', disabled: false },
  { label: '抽獎日誌', value: 'DRAW', disabled: true },
  { label: '支付日誌', value: 'PAYMENT', disabled: true },
] as const;

type LogType = (typeof LOG_TABS)[number]['value'];

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
const selectedSnapshot = ref<{
  before: string | null;
  after: string | null;
}>({
  before: null,
  after: null,
});

const openSnapshot = (item: any) => {
  selectedSnapshot.value = {
    before: item.beforeSnapshot ?? null,
    after: item.afterSnapshot ?? null,
  };
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
const { list, hasData, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

/* ==============================
 * Utils
 * ============================== */
const toBackendDateTime = (value?: string | null) => {
  if (!value) return '';
  return String(value).length === 16 ? `${value}:00` : String(value);
};

const truncate = (value?: string, max = 60) => {
  const text = String(value ?? '');

  if (!text || text === 'null' || text === 'undefined') return '-';

  return text.length <= max ? text : `${text.slice(0, max)}...`;
};

/* ==============================
 * Sorting
 * ============================== */
const sortKey = ref('');
const sortOrder = ref<'asc' | 'desc' | ''>('');

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
  if (!sortKey.value || !sortOrder.value) return list.value as any[];

  const arr = [...(list.value as any[])];

  arr.sort((a, b) =>
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
 * Columns
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
 * Query
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
      const all: any[] = Array.isArray(res)
        ? res
        : Array.isArray((res as any)?.data)
          ? (res as any).data
          : [];

      rows = all.filter((item) => item?.logType === logType);
    } else {
      const res = await getSystemLogsByType(logType, limit);

      rows = Array.isArray(res)
        ? res
        : Array.isArray((res as any)?.data)
          ? (res as any).data
          : [];
    }

    if (emailQ) {
      rows = rows.filter((item) =>
        String(item?.email ?? item?.adminEmail ?? '')
          .toLowerCase()
          .includes(emailQ),
      );
    }

    if (resultQ) {
      rows = rows.filter((item) => item?.result === resultQ);
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

  const ok = await openConfirmDialog({
    title: '清除確認',
    message: `確定要清除 ${days} 天前的系統日誌嗎？（不可復原）`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () => cleanupOldSystemLogs(days),
    onSuccess: async (data: any) => {
      const deleted = (data as any)?.data ?? data ?? 0;

      await openInfoDialog({
        title: '提示訊息',
        message: `清除完成：共刪除 ${deleted} 筆日誌`,
        iconType: 'success',
      });

      await fetchLogs(activeTab.value);
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
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
@use 'sass:color';
@use '@/assets/styles/base/tokens' as tokens;

.sl-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  &__title {
    margin: 0;
    color: tokens.$form-text;
    font-size: 20px;
    font-weight: 700;
  }

  &__sub {
    margin: 2px 0 0;
    color: color.mix(tokens.$form-muted, #fff, 68%);
    font-size: 13px;
  }
}

.sl-count {
  color: tokens.$form-muted;
  font-size: 13px;
}

/* ── Tabs ── */
.sl-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.sl-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
  border-radius: tokens.$form-radius;
  background: tokens.$form-bg;
  color: tokens.$ink-700;
  font-size: 13px;
  cursor: pointer;
  transition:
    background-color 0.15s,
    border-color 0.15s,
    color 0.15s;

  &:hover:not(:disabled) {
    background: color.mix(tokens.$brand-light, #fff, 18%);
    border-color: tokens.$brand;
    color: tokens.$brand-dark;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: tokens.$form-border;
  }

  &__unsupported {
    color: color.mix(tokens.$form-muted, #fff, 68%);
    font-size: 11px;
  }

  &--disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.sl-tab--login .sl-tab__dot {
  background: tokens.$brand;
}

.sl-tab--login.sl-tab--active {
  background: tokens.$brand-light;
  border-color: tokens.$brand;
  color: tokens.$brand-dark;
  font-weight: 600;
}

.sl-tab--admin_action .sl-tab__dot {
  background: tokens.$brand-hover;
}

.sl-tab--admin_action.sl-tab--active {
  background: color.mix(tokens.$brand-light-hover, #fff, 42%);
  border-color: tokens.$brand-hover;
  color: tokens.$brand-dark;
  font-weight: 600;
}

.sl-tab--draw .sl-tab__dot,
.sl-tab--payment .sl-tab__dot {
  background: tokens.$form-border;
}

/* ── Filter ── */
.sl-filter-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 12px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
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

  &--success {
    background: color.mix(tokens.$brand-light, #fff, 52%);
    color: tokens.$brand-dark;
  }

  &--failed {
    background: color.mix(tokens.$danger-light, #fff, 18%);
    color: tokens.$danger;
  }

  &--blocked {
    background: tokens.$brand-light-hover;
    color: tokens.$brand-dark;
  }
}

/* ── User Type Badge ── */
.sl-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;

  &--admin {
    background: tokens.$brand-light;
    color: tokens.$brand-dark;
  }

  &--user {
    background: color.mix(tokens.$brand-light, #fff, 52%);
    color: tokens.$brand;
  }
}

/* ── Action Badge ── */
.sl-action {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  background: color.mix(tokens.$border-light, #fff, 28%);
  color: tokens.$ink-800;
  font-size: 12px;
  font-weight: 600;

  &--create {
    background: color.mix(tokens.$brand-light, #fff, 52%);
    color: tokens.$brand-dark;
  }

  &--update {
    background: tokens.$brand-light-hover;
    color: tokens.$brand-dark;
  }

  &--delete {
    background: color.mix(tokens.$danger-light, #fff, 18%);
    color: tokens.$danger;
  }

  &--on_shelf {
    background: tokens.$brand-light;
    color: tokens.$brand-dark;
  }

  &--off_shelf {
    background: color.mix(tokens.$brand-light-hover, #fff, 38%);
    color: tokens.$brand-dark;
  }
}

/* ── Target ── */
.sl-target-type {
  color: tokens.$ink-800;
  font-size: 12px;
  font-weight: 600;
}

.sl-target-name {
  color: tokens.$form-muted;
  font-size: 12px;
}

/* ── Detail Button ── */
.sl-detail-btn {
  padding: 2px 10px;
  border: 1px solid tokens.$form-border;
  border-radius: 4px;
  background: tokens.$form-bg;
  color: tokens.$ink-800;
  font-size: 12px;
  cursor: pointer;
  transition:
    background-color 0.15s,
    border-color 0.15s,
    color 0.15s;

  &:hover {
    border-color: tokens.$brand;
    background: tokens.$brand-light;
    color: tokens.$brand-dark;
  }
}

/* ── Snapshot Dialog ── */
.sl-snapshot {
  min-width: 560px;
  padding: 16px;

  &__title {
    margin: 0 0 12px;
    color: tokens.$form-text;
    font-size: 16px;
    font-weight: 700;
  }

  &__label {
    margin: 0 0 4px;
    color: tokens.$form-muted;
    font-size: 12px;
    font-weight: 600;
  }

  &__code {
    max-height: 240px;
    padding: 10px 14px;
    overflow-y: auto;
    border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
    border-radius: tokens.$form-radius;
    background: color.mix(tokens.$brand-light, #fff, 10%);
    font-family: monospace;
    font-size: 12px;
    white-space: pre-wrap;
    word-break: break-all;
  }
}

/* ── Misc ── */
.sl-error {
  color: tokens.$danger;
  font-size: 12px;
}

.sl-empty {
  color: tokens.$form-border;
}
</style>

<!-- src/views/systemLog/SystemLogList.vue -->
<template>
  <div class="system-log-page">
    <!-- Header + Summary + 分類切換 -->
    <MCard>
      <div class="sl-page-head">
        <div class="sl-page-head__main">
          <p class="sl-page-head__eyebrow">System Management</p>
          <h2 class="sl-page-head__title">系統日誌</h2>
          <p class="sl-page-head__sub">
            查看登入紀錄、後台操作紀錄與系統活動追蹤
          </p>
        </div>

        <div class="sl-page-head__actions">
          <span class="sl-current-type">
            {{ activeTabLabel }}
          </span>

          <span v-if="hasData" class="sl-total-count">
            共 {{ list.length }} 筆
          </span>
        </div>
      </div>

      <div class="sl-summary-row">
        <div class="sl-summary-card">
          <span class="sl-summary-card__label">目前分類</span>
          <strong class="sl-summary-card__value">
            {{ activeTabLabel }}
          </strong>
        </div>

        <div class="sl-summary-card">
          <span class="sl-summary-card__label">查詢筆數</span>
          <strong class="sl-summary-card__value">
            {{ hasData ? list.length : 0 }}
          </strong>
        </div>

        <div class="sl-summary-card">
          <span class="sl-summary-card__label">筆數上限</span>
          <strong class="sl-summary-card__value">
            {{ limitInput || 200 }}
          </strong>
        </div>
      </div>

      <div class="sl-tab-bar">
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
          <span class="sl-tab__content">
            <span class="sl-tab__label">{{ tab.label }}</span>
            <span class="sl-tab__value">{{ tab.value }}</span>
          </span>

          <span v-if="tab.disabled" class="sl-tab__unsupported">
            尚未支援
          </span>
        </button>
      </div>
    </MCard>

    <!-- 查詢條件 -->
    <div class="m-t-12">
      <MCard>
        <div class="sl-card-head">
          <div>
            <p class="sl-card-head__title">查詢條件</p>
            <p class="sl-card-head__sub">
              可依照時間區間、Email、結果狀態與筆數上限篩選日誌
            </p>
          </div>
        </div>

        <div class="sl-filter-grid">
          <FormInput
            label="開始時間"
            type="datetime-local"
            v-model="startInput"
          />

          <FormInput
            label="結束時間"
            type="datetime-local"
            v-model="endInput"
          />

          <FormInput
            label="Email 搜尋"
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
          <MButton type="button" @click="doSearch">
            <font-awesome-icon icon="fa-magnifying-glass" class="m-r-4" />
            查詢
          </MButton>

          <MButton type="button" class="mbtn--gray" @click="resetFilters">
            <font-awesome-icon icon="fa-rotate-left" class="m-r-4" />
            清除
          </MButton>

          <MButton type="button" class="mbtn--red" @click="cleanupLogs">
            <font-awesome-icon icon="fa-trash-can" class="m-r-4" />
            清除過期日誌
          </MButton>
        </div>
      </MCard>
    </div>

    <!-- 結果列表 -->
    <div class="m-t-12">
      <MCard>
        <div class="sl-card-head sl-card-head--result">
          <div>
            <p class="sl-card-head__title">查詢結果</p>
            <p class="sl-card-head__sub">
              {{ activeTabLabel }} / 依查詢條件顯示目前日誌資料
            </p>
          </div>

          <span v-if="hasData" class="sl-card-head__count">
            {{ list.length }} 筆資料
          </span>
        </div>

        <template v-if="!hasData">
          <NoData :message="noDataMessage" />
        </template>

        <template v-else>
          <ReportTable
            class="sl-report-table"
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
                  item.userType === 'admin'
                    ? 'sl-badge--admin'
                    : 'sl-badge--user'
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
  </div>
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

import { executeApi } from '@/utils/executeApiUtils';

import {
  getSystemLogsByType,
  getSystemLogsByDateRange,
  cleanupOldSystemLogs,
} from '@/services/adminSystemLogService';

import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';
import { openSystemLogSnapshotDialog } from '@/utils/dialog/openSystemLogSnapshotDialog';

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

const activeTabLabel = computed(() => {
  return LOG_TABS.find((item) => item.value === activeTab.value)?.label ?? '-';
});

const startInput = ref('');
const endInput = ref('');
const emailInput = ref('');
const resultFilter = ref('');
const limitInput = ref<number | string>(200);

/* ==============================
 * Snapshot Dialog
 * ============================== */
const openSnapshot = async (item: any) => {
  await openSystemLogSnapshotDialog({
    beforeSnapshot: item.beforeSnapshot ?? null,
    afterSnapshot: item.afterSnapshot ?? null,
  });
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

.system-log-page {
  width: 100%;
  max-width: 100%;
}

/* ==============================
 * Page Head
 * ============================== */
.sl-page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
  margin-bottom: 14px;

  &__main {
    min-width: 0;
  }

  &__eyebrow {
    margin: 0 0 4px;
    color: tokens.$brand;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  &__title {
    margin: 0;
    color: tokens.$form-text;
    font-size: 22px;
    font-weight: 800;
    line-height: 1.35;
  }

  &__sub {
    margin: 4px 0 0;
    color: tokens.$form-muted;
    font-size: 13px;
    line-height: 1.5;
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;
  }
}

.sl-current-type {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 12px;
  border-radius: 999px;
  background: color.mix(tokens.$brand-light, #fff, 18%);
  color: tokens.$brand-dark;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.sl-total-count {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 12px;
  border-radius: 999px;
  background: color.mix(tokens.$form-border, #fff, 42%);
  color: tokens.$form-muted;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

/* ==============================
 * Summary
 * ============================== */
.sl-summary-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.sl-summary-card {
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
  border-radius: 14px;
  background: color.mix(tokens.$brand-light, #fff, 8%);

  &__label {
    display: block;
    margin-bottom: 4px;
    color: tokens.$form-muted;
    font-size: 12px;
    line-height: 1.4;
  }

  &__value {
    display: block;
    color: tokens.$form-text;
    font-size: 15px;
    font-weight: 800;
    line-height: 1.5;
    word-break: break-word;
  }
}

/* ==============================
 * Tabs
 * ============================== */
.sl-tab-bar {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.sl-tab {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  min-height: 52px;
  padding: 10px 12px;
  border: 1px solid color.mix(tokens.$form-border, #fff, 70%);
  border-radius: 14px;
  background: tokens.$form-bg;
  color: tokens.$ink-700;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.12s ease;

  &:hover:not(:disabled) {
    border-color: tokens.$brand;
    background: color.mix(tokens.$brand-light, #fff, 18%);
    color: tokens.$brand-dark;
    box-shadow: 0 6px 14px rgba(tokens.$ink-900, 0.06);
    transform: translateY(-1px);
  }

  &__dot {
    flex: 0 0 auto;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: tokens.$form-border;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__label {
    color: inherit;
    font-size: 13px;
    font-weight: 800;
    line-height: 1.4;
  }

  &__value {
    color: tokens.$form-muted;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.3;
    word-break: break-word;
  }

  &__unsupported {
    flex: 0 0 auto;
    margin-left: auto;
    padding: 2px 7px;
    border-radius: 999px;
    background: color.mix(tokens.$form-border, #fff, 45%);
    color: tokens.$form-muted;
    font-size: 11px;
    font-weight: 700;
  }

  &--active {
    border-color: tokens.$brand;
    background: tokens.$brand-light;
    color: tokens.$brand-dark;
    box-shadow: 0 6px 14px rgba(tokens.$brand, 0.1);

    .sl-tab__value {
      color: tokens.$brand-dark;
    }
  }

  &--disabled {
    opacity: 0.48;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
}

.sl-tab--login .sl-tab__dot {
  background: tokens.$brand;
}

.sl-tab--admin_action .sl-tab__dot {
  background: tokens.$brand-hover;
}

.sl-tab--draw .sl-tab__dot,
.sl-tab--payment .sl-tab__dot {
  background: tokens.$form-border;
}

/* ==============================
 * Card Head
 * ============================== */
.sl-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;

  &--result {
    margin-bottom: 12px;
  }

  &__title {
    margin: 0;
    padding-left: 10px;
    border-left: 4px solid tokens.$brand;
    color: tokens.$form-text;
    font-size: 15px;
    font-weight: 800;
    line-height: 1.4;
  }

  &__sub {
    margin: 4px 0 0;
    color: tokens.$form-muted;
    font-size: 13px;
    line-height: 1.5;
  }

  &__count {
    flex: 0 0 auto;
    padding: 4px 10px;
    border-radius: 999px;
    background: color.mix(tokens.$brand-light, #fff, 18%);
    color: tokens.$brand;
    font-size: 12px;
    font-weight: 800;
  }
}

/* ==============================
 * Filter
 * ============================== */
.sl-filter-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
  padding: 14px;
  border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
  border-radius: 16px;
  background: color.mix(tokens.$brand-light, #fff, 7%);
}

.sl-filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

/* ==============================
 * ReportTable
 * ============================== */
.sl-report-table {
  margin-top: 0;
}

/* ==============================
 * Result Badge
 * ============================== */
.sl-result {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.4;

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

/* ==============================
 * User Type Badge
 * ============================== */
.sl-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;

  &--admin {
    background: tokens.$brand-light;
    color: tokens.$brand-dark;
  }

  &--user {
    background: color.mix(tokens.$brand-light, #fff, 52%);
    color: tokens.$brand;
  }
}

/* ==============================
 * Action Badge
 * ============================== */
.sl-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 2px 9px;
  border-radius: 999px;
  background: color.mix(tokens.$border-light, #fff, 28%);
  color: tokens.$ink-800;
  font-size: 12px;
  font-weight: 700;

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

/* ==============================
 * Target
 * ============================== */
.sl-target-type {
  color: tokens.$ink-800;
  font-size: 12px;
  font-weight: 700;
}

.sl-target-name {
  color: tokens.$form-muted;
  font-size: 12px;
}

/* ==============================
 * Detail Button
 * ============================== */
.sl-detail-btn {
  min-height: 26px;
  padding: 0 11px;
  border: 1px solid color.mix(tokens.$form-border, #fff, 52%);
  border-radius: 999px;
  background: tokens.$form-bg;
  color: tokens.$ink-800;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    border-color: tokens.$brand;
    background: tokens.$brand-light;
    color: tokens.$brand-dark;
    box-shadow: 0 4px 10px rgba(tokens.$brand, 0.12);
  }
}

/* ==============================
 * Misc
 * ============================== */
.sl-error {
  color: tokens.$danger;
  font-size: 12px;
  font-weight: 700;
}

.sl-empty {
  color: tokens.$form-border;
}

/* ==============================
 * RWD
 * ============================== */
@media (max-width: 1180px) {
  .sl-tab-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .sl-page-head {
    flex-direction: column;

    &__actions {
      justify-content: flex-start;
    }
  }

  .sl-summary-row {
    grid-template-columns: 1fr;
  }

  .sl-filter-grid {
    grid-template-columns: 1fr;
  }

  .sl-filter-actions {
    justify-content: flex-start;
  }

  .sl-card-head {
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .sl-tab-bar {
    grid-template-columns: 1fr;
  }

  .sl-tab {
    min-height: 48px;
  }
}
</style>

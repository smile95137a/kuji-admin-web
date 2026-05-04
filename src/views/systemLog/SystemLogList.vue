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
          { 'sl-tab--active': activeTab === tab.value },
        ]"
        type="button"
        @click="switchTab(tab.value)"
      >
        <span class="sl-tab__dot"></span>
        <span>{{ tab.label }}</span>
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
          label="User ID（選填）"
          v-model="userIdInput"
          placeholder="輸入 userId 篩選特定使用者"
        />
        <FormInput
          label="筆數上限"
          type="number"
          v-model="limitInput"
          placeholder="預設 200"
        />
      </div>
      <div class="sl-filter-actions">
        <MButton @click="doSearch">查詢</MButton>
        <MButton type="button" @click="resetFilters" class="mbtn--gray"
          >清除</MButton
        >
        <MButton type="button" class="mbtn--red" @click="cleanupLogs"
          >清除過期日誌</MButton
        >
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
          <!-- createdAt -->
          <template #cell-createdAt="{ item }">
            <DateFormatter
              v-if="item.createdAt"
              :date="item.createdAt"
              format="YYYY-MM-DD HH:mm:ss"
            />
            <span v-else class="sl-empty">—</span>
          </template>

          <!-- requestMethod badge -->
          <template #cell-requestMethod="{ item }">
            <span
              class="sl-method"
              :class="`sl-method--${(item.requestMethod ?? '').toLowerCase()}`"
            >
              {{ item.requestMethod || '-' }}
            </span>
          </template>

          <!-- requestUrl monospace -->
          <template #cell-requestUrl="{ item }">
            <span class="sl-url" :title="item.requestUrl || ''">{{
              truncate(item.requestUrl, 50)
            }}</span>
          </template>

          <!-- responseStatus colored badge -->
          <template #cell-responseStatus="{ item }">
            <span
              class="sl-status"
              :class="
                item.responseStatus >= 500
                  ? 'sl-status--5xx'
                  : item.responseStatus >= 400
                    ? 'sl-status--4xx'
                    : item.responseStatus >= 300
                      ? 'sl-status--3xx'
                      : 'sl-status--2xx'
              "
            >
              {{ item.responseStatus ?? '-' }}
            </span>
          </template>

          <!-- errorMessage -->
          <template #cell-errorMessage="{ item }">
            <span
              v-if="item.errorMessage"
              class="sl-error"
              :title="item.errorMessage"
            >
              {{ truncate(item.errorMessage, 50) }}
            </span>
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
import FormTitle from '@/components/common/FormTitle.vue';
import FormInput from '@/components/common/FormInput.vue';
import DateFormatter from '@/components/common/DateFormatter.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { useDialogStore } from '@/stores';

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
  { label: '登入日誌', value: 'LOGIN' },
  { label: '後台操作', value: 'ADMIN' },
  { label: '抽獎日誌', value: 'DRAW' },
  { label: '支付日誌', value: 'PAYMENT' },
] as const;

type LogType = (typeof LOG_TABS)[number]['value'];

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
const userIdInput = ref('');
const limitInput = ref<number | string>(200);

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
  // datetime-local value is "2026-01-15T10:30" — pad seconds for backend
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
const columns = [
  { field: 'action', label: '動作', width: 180, sortable: true },
  { field: 'userType', label: '用戶類型', width: 100, sortable: true },
  { field: 'userId', label: '使用者 ID', width: 220, sortable: true },
  { field: 'requestIp', label: 'IP', width: 140, sortable: true },
  { field: 'requestMethod', label: 'Method', width: 90, sortable: true },
  { field: 'requestUrl', label: 'URL', width: 260, sortable: true },
  { field: 'responseStatus', label: 'HTTP', width: 75, sortable: true },
  { field: 'durationMs', label: '耗時(ms)', width: 95, sortable: true },
  { field: 'errorMessage', label: '錯誤訊息', width: 200, sortable: true },
  { field: 'createdAt', label: '時間', width: 165, sortable: true },
];

/* ==============================
 * Core Query Logic
 * ==============================
 * Strategy:
 *   - 有時間區間 → 呼叫 date-range API，前端再篩 logType
 *   - 無時間區間 → 呼叫 type API 直接取對應類型
 * userId 永遠在前端做篩選（避免多一支 API 也降低複雜度）
 * ============================== */
const fetchLogs = async (logType: LogType) => {
  const start = toBackendDateTime(startInput.value);
  const end = toBackendDateTime(endInput.value);
  const limit = Number(limitInput.value || 200);
  const uid = userIdInput.value.trim();

  await query(async () => {
    let rows: any[];

    if (start && end) {
      // 有時間區間：用 date-range API，前端篩 logType
      const res = await getSystemLogsByDateRange(start, end, limit);
      const all: any[] = Array.isArray(res)
        ? res
        : Array.isArray((res as any)?.data)
          ? (res as any).data
          : [];
      rows = all.filter((r) => r?.logType === logType);
    } else {
      // 無時間區間：直接依類型查
      const res = await getSystemLogsByType(logType, limit);
      rows = Array.isArray(res)
        ? res
        : Array.isArray((res as any)?.data)
          ? (res as any).data
          : [];
    }

    // 前端 userId 篩選
    if (uid) {
      rows = rows.filter((r) => String(r?.userId ?? '').includes(uid));
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
  userIdInput.value = '';
  limitInput.value = 200;
};

const switchTab = (tab: LogType) => {
  activeTab.value = tab;
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
/* ── Header ── */
.sl-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  &__title {
    font-size: 17px;
    font-weight: 700;
    color: #1f2937;
    line-height: 1.3;
  }

  &__sub {
    font-size: 11px;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-top: 2px;
  }
}

.sl-count {
  background: #ff9500;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 14px;
  border-radius: 20px;
  white-space: nowrap;
}

/* ── Tabs ── */
.sl-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.sl-tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 16px;
  border-radius: 8px;
  border: 1.5px solid #e5e7eb;
  background: #f9fafb;
  color: #4b5563;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s;

  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
}

.sl-tab--login .sl-tab__dot {
  background: #3b82f6;
}
.sl-tab--login.sl-tab--active {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #1d4ed8;
  font-weight: 600;
}

.sl-tab--admin .sl-tab__dot {
  background: #f59e0b;
}
.sl-tab--admin.sl-tab--active {
  background: #fffbeb;
  border-color: #f59e0b;
  color: #d97706;
  font-weight: 600;
}

.sl-tab--draw .sl-tab__dot {
  background: #10b981;
}
.sl-tab--draw.sl-tab--active {
  background: #ecfdf5;
  border-color: #10b981;
  color: #059669;
  font-weight: 600;
}

.sl-tab--payment .sl-tab__dot {
  background: #8b5cf6;
}
.sl-tab--payment.sl-tab--active {
  background: #f5f3ff;
  border-color: #8b5cf6;
  color: #7c3aed;
  font-weight: 600;
}

/* ── Filters ── */
.sl-filter-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0 8px;
}

.sl-filter-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

/* ── Table cells ── */
.sl-method {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  font-family: 'Courier New', Courier, monospace;
  letter-spacing: 0.04em;

  &--get {
    background: #f3f4f6;
    color: #374151;
  }
  &--post {
    background: #dbeafe;
    color: #1d4ed8;
  }
  &--put {
    background: #fef3c7;
    color: #d97706;
  }
  &--patch {
    background: #fef3c7;
    color: #d97706;
  }
  &--delete {
    background: #fee2e2;
    color: #dc2626;
  }
}

.sl-status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  font-family: 'Courier New', Courier, monospace;

  &--2xx {
    background: #d1fae5;
    color: #065f46;
  }
  &--3xx {
    background: #dbeafe;
    color: #1d4ed8;
  }
  &--4xx {
    background: #fef3c7;
    color: #d97706;
  }
  &--5xx {
    background: #fee2e2;
    color: #dc2626;
  }
}

.sl-url {
  font-family: 'Courier New', Courier, monospace;
  font-size: 11px;
  color: #4b5563;
}

.sl-error {
  color: #dc2626;
  font-size: 12px;
}
.sl-empty {
  color: #d1d5db;
}
</style>

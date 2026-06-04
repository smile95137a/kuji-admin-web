<!-- src/views/systemLog/SystemLogList.vue -->
<template>
  <div class="system-log-page">
    <MCard>
      <div class="sl-page-head">
        <div>
          <p class="sl-page-head__eyebrow">SYSTEM LOG</p>
          <h2 class="sl-page-head__title">系統日誌</h2>
          <p class="sl-page-head__sub">
            集中查看登入、後台操作、付款、物流、訂單狀態、錢包與抽獎事件。
          </p>
        </div>

        <div class="sl-page-head__actions">
          <span class="sl-current-type">{{ activeTabLabel }}</span>
          <span class="sl-total-count">{{ list.length }} 筆</span>
        </div>
      </div>

      <div class="sl-tab-bar">
        <button
          v-for="tab in LOG_TABS"
          :key="tab.value"
          class="sl-tab"
          :class="{ 'sl-tab--active': activeTab === tab.value }"
          type="button"
          @click="switchTab(tab.value)"
        >
          <span class="sl-tab__label">{{ tab.label }}</span>
          <span class="sl-tab__value">{{ tab.value }}</span>
        </button>
      </div>
    </MCard>

    <div class="m-t-12">
      <MCard>
        <div class="sl-card-head">
          <div>
            <p class="sl-card-head__title">查詢條件</p>
            <p class="sl-card-head__sub">
              可用日期、Email / ID / 第三方單號關鍵字與執行結果縮小範圍。
            </p>
          </div>
        </div>

        <div class="sl-filter-grid">
          <div class="sl-filter-grid__item sl-filter-grid__item--wide">
            <FormDateRangeField
              label="日期區間"
              type="datetime-local"
              v-model:start="startInput"
              v-model:end="endInput"
              separator="~"
              :auto-apply-default="true"
            />
          </div>

          <FormInput
            label="關鍵字"
            v-model="keywordInput"
            placeholder="Email、訂單、儲值、會員、第三方單號"
          />

          <FormSelect
            label="執行結果"
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
            重設
          </MButton>
        </div>
      </MCard>
    </div>

    <div class="m-t-12">
      <MCard>
        <div class="sl-card-head sl-card-head--result">
          <div>
            <p class="sl-card-head__title">查詢結果</p>
            <p class="sl-card-head__sub">{{ activeTabLabel }} / {{ list.length }} 筆</p>
          </div>
        </div>

        <NoData v-if="!hasData" message="目前沒有符合條件的系統日誌" />

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
            <template #cell-createdAt="{ item }">
              <DateFormatter
                v-if="item.createdAt"
                :date="item.createdAt"
                format="YYYY/MM/DD HH:mm:ss"
              />
              <span v-else class="sl-empty">-</span>
            </template>

            <template #cell-result="{ item }">
              <span
                class="sl-result"
                :class="`sl-result--${String(item.result ?? '').toLowerCase()}`"
              >
                {{ RESULT_LABEL[item.result] ?? item.result ?? '-' }}
              </span>
            </template>

            <template #cell-actor="{ item }">
              <span>{{ actorText(item) }}</span>
            </template>

            <template #cell-target="{ item }">
              <span v-if="targetText(item)">{{ targetText(item) }}</span>
              <span v-else class="sl-empty">-</span>
            </template>

            <template #cell-status="{ item }">
              <span v-if="item.beforeStatus || item.afterStatus">
                {{ item.beforeStatus || '-' }} -> {{ item.afterStatus || '-' }}
              </span>
              <span v-else class="sl-empty">-</span>
            </template>

            <template #cell-amount="{ item }">
              <span v-if="item.amount !== null && item.amount !== undefined">
                {{ Number(item.amount).toLocaleString('zh-TW') }}
              </span>
              <span v-else class="sl-empty">-</span>
            </template>

            <template #cell-errorMessage="{ item }">
              <span
                v-if="item.errorMessage"
                class="sl-error"
                :title="item.errorMessage"
              >
                {{ truncate(item.errorMessage, 48) }}
              </span>
              <span v-else class="sl-empty">-</span>
            </template>

            <template #cell-snapshot="{ item }">
              <button
                v-if="hasSnapshot(item)"
                class="sl-detail-btn"
                type="button"
                @click="openSnapshot(item)"
              >
                查看
              </button>
              <span v-else class="sl-empty">-</span>
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import MButton from '@/components/common/MButton.vue';
import MCard from '@/components/common/MCard.vue';
import DateFormatter from '@/components/common/DateFormatter.vue';
import FormDateRangeField from '@/components/common/FormDateRangeField.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import NoData from '@/components/common/NoData.vue';
import Pagination from '@/components/common/Pagination.vue';
import ReportTable from '@/components/common/ReportTable.vue';
import { usePagination } from '@/hook/usePagination';
import { getSystemLogsByDateRange, getSystemLogsByType } from '@/services/adminSystemLogService';
import { openInfoDialog } from '@/utils/dialog/infoDialog';
import { openSystemLogSnapshotDialog } from '@/utils/dialog/openSystemLogSnapshotDialog';
import { compareByKeySmart } from '@/utils/sortUtils';

const LOG_TABS = [
  { label: '登入日誌', value: 'LOGIN' },
  { label: '後台操作', value: 'ADMIN_ACTION' },
  { label: '付款事件', value: 'PAYMENT' },
  { label: '物流事件', value: 'LOGISTICS' },
  { label: '訂單狀態', value: 'ORDER_STATUS' },
  { label: '錢包異動', value: 'WALLET' },
  { label: '儲值紀錄', value: 'RECHARGE' },
  { label: '訂單紀錄', value: 'ORDER' },
  { label: '抽獎紀錄', value: 'DRAW' },
] as const;

type LogType = (typeof LOG_TABS)[number]['value'];

const RESULT_LABEL: Record<string, string> = {
  SUCCESS: '成功',
  FAILED: '失敗',
  FAIL: '失敗',
  PENDING: '待處理',
  DUPLICATE: '重複',
  SKIPPED: '略過',
  BLOCKED: '阻擋',
};

const resultOptions = [
  { label: '成功 (SUCCESS)', value: 'SUCCESS' },
  { label: '失敗 (FAILED)', value: 'FAILED' },
  { label: '待處理 (PENDING)', value: 'PENDING' },
  { label: '重複 (DUPLICATE)', value: 'DUPLICATE' },
  { label: '略過 (SKIPPED)', value: 'SKIPPED' },
  { label: '阻擋 (BLOCKED)', value: 'BLOCKED' },
];

const activeTab = ref<LogType>('LOGIN');
const startInput = ref('');
const endInput = ref('');
const keywordInput = ref('');
const resultFilter = ref('');
const limitInput = ref<number | string>(200);
const list = ref<any[]>([]);

const activeTabLabel = computed(() => {
  return LOG_TABS.find((item) => item.value === activeTab.value)?.label ?? '-';
});

const hasData = computed(() => list.value.length > 0);

const toBackendDateTime = (value?: string | null) => {
  const text = String(value ?? '').trim().replace('T', ' ').replace(/\//g, '-');
  if (!text) return '';
  if (text.length === 16) return `${text}:00`;
  return text;
};

const truncate = (value?: string, max = 60) => {
  const text = String(value ?? '');
  if (!text || text === 'null' || text === 'undefined') return '-';
  return text.length <= max ? text : `${text.slice(0, max)}...`;
};

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
  if (!sortKey.value || !sortOrder.value) return list.value;
  return [...list.value].sort((a, b) =>
    compareByKeySmart(a, b, sortKey.value, sortOrder.value as 'asc' | 'desc', {
      type: 'auto',
      mode: 'big5',
      locale: 'zh-TW',
    }),
  );
});

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

const handlePageLimitSizeChange = (value: number) => {
  pageLimitSize.value = value;
  goToPage(1);
};

const columns = computed(() => {
  const baseColumns = [
    { field: 'createdAt', label: '時間', width: 165, sortable: true },
    { field: 'logType', label: '類型', width: 120, sortable: true },
    { field: 'action', label: '動作', width: 180, sortable: true },
    { field: 'actor', label: '執行者', width: 180, sortable: false },
    { field: 'target', label: '對象', width: 260, sortable: false },
    { field: 'externalRef', label: '第三方單號', width: 180, sortable: true },
    { field: 'paymentMethod', label: '方法', width: 120, sortable: true },
    { field: 'amount', label: '金額', width: 100, sortable: true },
    { field: 'status', label: '狀態變化', width: 180, sortable: false },
    { field: 'result', label: '結果', width: 90, sortable: true },
    { field: 'errorMessage', label: '錯誤訊息', width: 220, sortable: true },
    { field: 'snapshot', label: '詳細', width: 80, sortable: false },
  ];

  if (activeTab.value === 'LOGIN') {
    return [
      { field: 'createdAt', label: '時間', width: 165, sortable: true },
      { field: 'email', label: 'Email', width: 220, sortable: true },
      { field: 'userType', label: '使用者類型', width: 120, sortable: true },
      { field: 'loginMethod', label: '登入方式', width: 120, sortable: true },
      { field: 'result', label: '結果', width: 90, sortable: true },
      { field: 'ip', label: 'IP', width: 140, sortable: true },
      { field: 'errorMessage', label: '錯誤訊息', width: 220, sortable: true },
    ];
  }

  if (activeTab.value === 'ADMIN_ACTION') {
    return [
      { field: 'createdAt', label: '時間', width: 165, sortable: true },
      { field: 'adminEmail', label: '後台帳號', width: 220, sortable: true },
      { field: 'adminRole', label: '角色', width: 140, sortable: true },
      { field: 'action', label: '動作', width: 160, sortable: true },
      { field: 'target', label: '操作對象', width: 260, sortable: false },
      { field: 'result', label: '結果', width: 90, sortable: true },
      { field: 'ip', label: 'IP', width: 140, sortable: true },
      { field: 'snapshot', label: '快照', width: 80, sortable: false },
    ];
  }

  return baseColumns;
});

const unwrapRows = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

const matchKeyword = (item: any, keyword: string) => {
  if (!keyword) return true;
  const source = [
    item.email,
    item.adminEmail,
    item.userId,
    item.actorId,
    item.targetId,
    item.targetNo,
    item.targetName,
    item.orderId,
    item.rechargeId,
    item.walletTransactionId,
    item.externalRef,
    item.action,
    item.errorMessage,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return source.includes(keyword);
};

const fetchLogs = async (logType: LogType) => {
  const start = toBackendDateTime(startInput.value);
  const end = toBackendDateTime(endInput.value);
  const limit = Number(limitInput.value || 200);
  const keyword = keywordInput.value.trim().toLowerCase();
  const resultQ = resultFilter.value;

  try {
    const res = start && end
      ? await getSystemLogsByDateRange(start, end, limit)
      : await getSystemLogsByType(logType, limit);

    const rows = unwrapRows(res)
      .filter((item) => (start && end ? item?.logType === logType : true))
      .filter((item) => matchKeyword(item, keyword))
      .filter((item) => !resultQ || item?.result === resultQ);

    list.value = rows;
    goToPage(1);
  } catch (error: any) {
    list.value = [];
    await openInfoDialog({
      title: '查詢失敗',
      message: error?.response?.data?.message ?? error?.message ?? '系統日誌查詢失敗',
      iconType: 'warning',
    });
  }
};

const doSearch = async () => {
  await fetchLogs(activeTab.value);
};

const resetFilters = async () => {
  startInput.value = '';
  endInput.value = '';
  keywordInput.value = '';
  resultFilter.value = '';
  limitInput.value = 200;
  await fetchLogs(activeTab.value);
};

const switchTab = async (tab: LogType) => {
  activeTab.value = tab;
  sortKey.value = '';
  sortOrder.value = '';
  await fetchLogs(tab);
};

const actorText = (item: any) => {
  return item.adminEmail
    ?? item.email
    ?? item.actorName
    ?? item.actorId
    ?? item.userId
    ?? item.actorType
    ?? '-';
};

const targetText = (item: any) => {
  const name = item.targetName ?? item.targetNo ?? item.targetId ?? item.orderId ?? item.rechargeId;
  if (!name) return '';
  return item.targetType ? `${item.targetType} / ${name}` : String(name);
};

const hasSnapshot = (item: any) => {
  return Boolean(
    item.beforeSnapshot
      || item.afterSnapshot
      || item.callbackSummary
      || item.rawPayloadHash,
  );
};

const openSnapshot = async (item: any) => {
  await openSystemLogSnapshotDialog({
    beforeSnapshot: item.beforeSnapshot ?? item.callbackSummary ?? null,
    afterSnapshot: item.afterSnapshot ?? (item.rawPayloadHash ? `rawPayloadHash=${item.rawPayloadHash}` : null),
  });
};

onMounted(async () => {
  await fetchLogs('LOGIN');
});
</script>

<style scoped lang="scss">
@use '@/assets/styles/base/tokens' as tokens;

.system-log-page {
  width: 100%;
  max-width: 100%;
}

.sl-page-head,
.sl-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.sl-page-head__eyebrow {
  margin: 0 0 4px;
  color: tokens.$brand;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.sl-page-head__title,
.sl-card-head__title {
  margin: 0;
  color: tokens.$form-text;
  font-size: 22px;
  font-weight: 800;
}

.sl-card-head__title {
  font-size: 18px;
}

.sl-page-head__sub,
.sl-card-head__sub {
  margin: 4px 0 0;
  color: tokens.$form-muted;
  font-size: 13px;
  line-height: 1.5;
}

.sl-page-head__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.sl-current-type,
.sl-total-count {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: #fff4e4;
  color: tokens.$brand;
  font-size: 12px;
  font-weight: 800;
}

.sl-total-count {
  background: #f5f6f8;
  color: tokens.$form-muted;
}

.sl-tab-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sl-tab {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 116px;
  padding: 10px 12px;
  border: 1px solid #e7e0d8;
  border-radius: 14px;
  background: #fff;
  color: tokens.$form-text;
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.sl-tab:hover,
.sl-tab--active {
  border-color: tokens.$brand;
  box-shadow: 0 8px 20px rgb(255 138 0 / 14%);
  transform: translateY(-1px);
}

.sl-tab__label {
  font-weight: 800;
}

.sl-tab__value {
  margin-top: 2px;
  color: tokens.$form-muted;
  font-size: 11px;
}

.sl-filter-grid {
  display: grid;
  grid-template-columns: minmax(280px, 2fr) repeat(3, minmax(160px, 1fr));
  gap: 12px;
}

.sl-filter-grid__item--wide {
  min-width: 0;
}

.sl-filter-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.sl-result {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: #f5f6f8;
  color: tokens.$form-muted;
  font-size: 12px;
  font-weight: 800;
}

.sl-result--success {
  background: #eaf8ef;
  color: #16833a;
}

.sl-result--failed,
.sl-result--fail {
  background: #fff0ee;
  color: #c0392b;
}

.sl-result--pending {
  background: #fff7df;
  color: #9a6500;
}

.sl-error {
  color: #c0392b;
  font-weight: 700;
}

.sl-empty {
  color: tokens.$form-muted;
}

.sl-detail-btn {
  border: 0;
  border-radius: 999px;
  padding: 5px 10px;
  background: #fff4e4;
  color: tokens.$brand;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

@media (max-width: 960px) {
  .sl-page-head,
  .sl-card-head {
    flex-direction: column;
  }

  .sl-filter-grid {
    grid-template-columns: 1fr;
  }
}
</style>

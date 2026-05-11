<template>
  <div class="platform-revenue-report-page">
    <MCard>
      <div class="pr-page-head">
        <div>
          <p class="pr-page-head__eyebrow">報表管理</p>
          <h2 class="pr-page-head__title">平台營收總覽</h2>
          <p class="pr-page-head__sub">
            僅限 Admin 檢視全站儲值、抽獎消耗與店家消耗分布。
          </p>
        </div>
      </div>

      <form class="pr-filter" @submit.prevent="onSubmit">
        <label class="pr-filter__field">
          <span>開始日期</span>
          <input v-model="startDate" type="date" />
        </label>

        <label class="pr-filter__field">
          <span>結束日期</span>
          <input v-model="endDate" type="date" />
        </label>

        <div class="pr-filter__actions">
          <MButton type="submit">查詢</MButton>
          <MButton type="button" class="mbtn--gray" @click="resetFilters">
            重設
          </MButton>
        </div>
      </form>
    </MCard>

    <div class="m-t-12">
      <MCard>
        <div v-if="forbiddenMessage" class="pr-state pr-state--warning">
          {{ forbiddenMessage }}
        </div>
        <div v-else-if="loading" class="pr-state">查詢中...</div>
        <template v-else>
          <div class="pr-summary">
            <div class="pr-summary__card">
              <span>總儲值</span>
              <strong>{{ formatNumber(report.totalRecharge) }}</strong>
            </div>
            <div class="pr-summary__card">
              <span>總消耗</span>
              <strong>{{ formatNumber(report.totalSpend) }}</strong>
            </div>
            <div class="pr-summary__card">
              <span>淨營收</span>
              <strong>{{ formatNumber(report.netRevenue) }}</strong>
            </div>
            <div class="pr-summary__card">
              <span>抽獎次數</span>
              <strong>{{ formatNumber(report.drawCount) }}</strong>
            </div>
          </div>

          <div class="pr-split">
            <div class="pr-panel">
              <h3>消耗來源</h3>
              <p>GOLD：{{ formatNumber(report.spendByType?.gold) }}</p>
              <p>BONUS：{{ formatNumber(report.spendByType?.bonus) }}</p>
              <p>儲值成長率：{{ formatRate(report.rechargeGrowthRate) }}</p>
              <p>消耗成長率：{{ formatRate(report.spendGrowthRate) }}</p>
            </div>

            <div class="pr-panel">
              <h3>查詢區間</h3>
              <p>{{ report.startDate || startDate || '-' }}</p>
              <p>{{ report.endDate || endDate || '-' }}</p>
            </div>
          </div>

          <div class="pr-table-wrap">
            <h3>每日營收</h3>
            <table class="pr-table">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>儲值</th>
                  <th>消耗</th>
                  <th>淨營收</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in report.dailyRevenue || []" :key="item.date">
                  <td>{{ item.date }}</td>
                  <td>{{ formatNumber(item.recharge) }}</td>
                  <td>{{ formatNumber(item.spend) }}</td>
                  <td>{{ formatNumber(item.net) }}</td>
                </tr>
                <tr v-if="!(report.dailyRevenue || []).length">
                  <td colspan="4" class="pr-table__empty">查無資料</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="pr-table-wrap">
            <h3>店家消耗分布</h3>
            <table class="pr-table">
              <thead>
                <tr>
                  <th>店家</th>
                  <th>總消耗</th>
                  <th>抽獎次數</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in report.storeBreakdown || []" :key="item.storeId">
                  <td>{{ item.storeName }}</td>
                  <td>{{ formatNumber(item.totalSpend) }}</td>
                  <td>{{ formatNumber(item.drawCount) }}</td>
                </tr>
                <tr v-if="!(report.storeBreakdown || []).length">
                  <td colspan="3" class="pr-table__empty">查無資料</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </MCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import {
  getPlatformRevenueReport,
  type PlatformRevenueReportRes,
} from '@/services/adminReportService';
import { getErrorMessage } from '@/utils/ErrorUtils';

const today = new Date();
const formatDateInput = (date: Date) => date.toISOString().slice(0, 10);
const defaultEndDate = formatDateInput(today);
const defaultStart = new Date(today);
defaultStart.setDate(defaultStart.getDate() - 29);
const defaultStartDate = formatDateInput(defaultStart);

const startDate = ref(defaultStartDate);
const endDate = ref(defaultEndDate);
const loading = ref(false);
const forbiddenMessage = ref('');
const report = ref<PlatformRevenueReportRes>({
  totalRecharge: 0,
  totalSpend: 0,
  netRevenue: 0,
  drawCount: 0,
  spendByType: { gold: 0, bonus: 0 },
  dailyRevenue: [],
  storeBreakdown: [],
});

const fetchReport = async () => {
  loading.value = true;
  forbiddenMessage.value = '';

  try {
    const res = await getPlatformRevenueReport({
      condition: {
        startDate: startDate.value || undefined,
        endDate: endDate.value || undefined,
      },
    });
    report.value = res?.data ?? report.value;
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 403) {
      forbiddenMessage.value = '只有 ADMIN 可以查看平台營收總覽報表。';
    } else {
      forbiddenMessage.value = getErrorMessage(error, '查詢平台營收總覽失敗');
    }
  } finally {
    loading.value = false;
  }
};

const onSubmit = async () => {
  await fetchReport();
};

const resetFilters = async () => {
  startDate.value = defaultStartDate;
  endDate.value = defaultEndDate;
  await fetchReport();
};

const formatNumber = (value?: number | null) =>
  new Intl.NumberFormat('zh-TW').format(Number(value ?? 0));

const formatRate = (value?: number | null) => {
  if (value == null) return '--';
  return `${value}%`;
};

onMounted(async () => {
  await fetchReport();
});
</script>

<style scoped lang="scss">
.platform-revenue-report-page {
  display: grid;
  gap: 12px;
}

.pr-page-head__eyebrow {
  font-size: 12px;
  color: #777;
}

.pr-page-head__title {
  margin: 4px 0 8px;
  font-size: 28px;
}

.pr-page-head__sub {
  color: #666;
}

.pr-filter {
  display: flex;
  gap: 12px;
  align-items: end;
  flex-wrap: wrap;
  margin-top: 16px;
}

.pr-filter__field {
  display: grid;
  gap: 6px;
}

.pr-filter__field input {
  min-width: 180px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 10px 12px;
}

.pr-filter__actions {
  display: flex;
  gap: 8px;
}

.pr-state {
  padding: 16px;
}

.pr-state--warning {
  color: #b54708;
}

.pr-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.pr-summary__card,
.pr-panel {
  border: 1px solid #ececec;
  border-radius: 12px;
  padding: 16px;
  background: #fff;
}

.pr-summary__card span {
  display: block;
  color: #666;
  margin-bottom: 8px;
}

.pr-summary__card strong {
  font-size: 24px;
}

.pr-split {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.pr-table-wrap {
  margin-top: 16px;
}

.pr-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
}

.pr-table th,
.pr-table td {
  border-bottom: 1px solid #eee;
  padding: 10px 12px;
  text-align: left;
}

.pr-table__empty {
  text-align: center;
  color: #888;
}
</style>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';

import MCard from '@/components/common/MCard.vue';
import ReportFilterBar from '@/components/report/ReportFilterBar.vue';
import ReportTable from '@/components/common/ReportTable.vue';
import { getReferralReport } from '@/services/adminReportService';
import { useReportFilter } from '@/composables/useReportFilter';
import { executeApi } from '@/utils/executeApiUtils';
import { exportToCsv } from '@/utils/csvExport';

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent]);

const reportData = ref<any>(null);
const { dateRange } = useReportFilter();

const chartOption = ref<any>({
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: [] },
  yAxis: { type: 'value' },
  series: [{ name: '每日推薦人數', type: 'bar', data: [], barMaxWidth: 40 }],
});

const rankingColumns = [
  { field: 'rank', label: '#', width: 50 },
  { field: 'referralCode', label: '推薦碼', width: 140 },
  { field: 'ownerName', label: '持有人', width: 160 },
  { field: 'referralCount', label: '推薦人數', width: 100 },
  { field: 'rewardGiven', label: '已發獎勵', width: 100 },
];

const dailyColumns = [
  { field: 'date', label: '日期', width: 120 },
  { field: 'referralCount', label: '推薦人數', width: 100 },
  { field: 'rewardGiven', label: '已發獎勵', width: 100 },
];

onMounted(() => fetchReport({ startDate: dateRange.value.startDate, endDate: dateRange.value.endDate }));

async function fetchReport(filter: { startDate: string; endDate: string }) {
  await executeApi({
    fn: () => getReferralReport({ condition: filter }),
    onSuccess: (data) => {
      reportData.value = data;
      const daily = (data as any)?.daily ?? [];
      chartOption.value = {
        ...chartOption.value,
        xAxis: { type: 'category', data: daily.map((d: any) => d.date) },
        series: [{ name: '每日推薦人數', type: 'bar', data: daily.map((d: any) => d.referralCount ?? 0), barMaxWidth: 40 }],
      };
    },
    showSuccessDialog: false,
  });
}

function rankingWithIndex(list: any[]) {
  return [...list]
    .sort((a, b) => (b.referralCount ?? 0) - (a.referralCount ?? 0))
    .slice(0, 10)
    .map((item, i) => ({ ...item, rank: i + 1 }));
}

function handleExport() {
  if (!reportData.value) return;
  const ranking = rankingWithIndex(reportData.value.ranking ?? []);
  if (ranking.length) exportToCsv(ranking, rankingColumns, '推薦碼報表_排行');
  const daily = reportData.value.daily ?? [];
  if (daily.length) exportToCsv(daily, dailyColumns, '推薦碼報表_每日明細');
}
</script>

<template>
  <MCard>
    <div class="rp__header">
      <p class="form__text form__text--title">推薦碼報表</p>
      <button v-if="reportData" class="rp__export-btn" @click="handleExport">↓ 匯出 CSV</button>
    </div>

    <ReportFilterBar @update:filter="fetchReport" />

    <div v-if="reportData">
      <div class="rp__cards m-t-16">
        <div class="rp__card">
          <p class="rp__card-label">總推薦人數</p>
          <p class="rp__card-value">{{ reportData.totalReferrals ?? '-' }}</p>
        </div>
        <div class="rp__card">
          <p class="rp__card-label">活躍推薦碼</p>
          <p class="rp__card-value">{{ reportData.activeReferralCodes ?? '-' }}</p>
        </div>
        <div class="rp__card">
          <p class="rp__card-label">已發放獎勵</p>
          <p class="rp__card-value">{{ reportData.totalRewardGiven ?? '-' }}</p>
        </div>
      </div>

      <!-- 每日推薦趨勢圖 -->
      <div v-if="(reportData.daily ?? []).length" class="rp__chart m-t-20">
        <v-chart :option="chartOption" style="height: 260px" autoresize />
      </div>

      <div class="m-t-20">
        <p class="form__text form__text--red m-b-8">推薦碼排行（前 10）</p>
        <ReportTable
          :columns="rankingColumns"
          :items="rankingWithIndex(reportData.ranking ?? [])"
          row-key="referralCode"
          :useWidthClass="true"
        />
      </div>

      <div class="m-t-20">
        <p class="form__text form__text--red m-b-8">每日明細</p>
        <ReportTable
          :columns="dailyColumns"
          :items="reportData.daily ?? []"
          row-key="date"
          :useWidthClass="true"
        />
      </div>
    </div>
  </MCard>
</template>

<style scoped lang="scss">
.rp {
  &__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  &__export-btn {
    padding: 6px 16px; font-size: 13px; border-radius: 6px;
    border: 1px solid #6366f1; background: #fff; color: #6366f1; cursor: pointer; transition: all 0.15s;
    &:hover { background: #6366f1; color: #fff; }
  }
  &__cards { display: flex; gap: 12px; flex-wrap: wrap; }
  &__card {
    flex: 1; min-width: 160px;
    background: #f5f3ff; border-radius: 8px; padding: 16px 20px; text-align: center;
  }
  &__card-label { font-size: 12px; color: #6b7280; margin-bottom: 6px; }
  &__card-value { font-size: 22px; font-weight: 700; color: #4f46e5; }
  &__chart { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; padding: 8px; background: #fafafa; }
}
</style>

const reportData = ref<any>(null);
const { dateRange } = useReportFilter();

const rankingColumns = [
  { field: 'rank', label: '#', width: 50 },
  { field: 'referralCode', label: '推薦碼', width: 140 },
  { field: 'ownerName', label: '持有人', width: 160 },
  { field: 'referralCount', label: '推薦人數', width: 100 },
  { field: 'rewardGiven', label: '已發獎勵', width: 100 },
];

const dailyColumns = [
  { field: 'date', label: '日期', width: 120 },
  { field: 'referralCount', label: '推薦人數', width: 100 },
  { field: 'rewardGiven', label: '已發獎勵', width: 100 },
];

onMounted(() => fetchReport({ startDate: dateRange.value.startDate, endDate: dateRange.value.endDate }));

async function fetchReport(filter: { startDate: string; endDate: string }) {
  await executeApi({
    fn: () => getReferralReport({ condition: filter }),
    onSuccess: (data) => { reportData.value = data; },
    showSuccessDialog: false,
  });
}

function rankingWithIndex(list: any[]) {
  return [...list]
    .sort((a, b) => (b.referralCount ?? 0) - (a.referralCount ?? 0))
    .slice(0, 10)
    .map((item, i) => ({ ...item, rank: i + 1 }));
}
</script>

<template>
  <MCard>
    <p class="form__text form__text--title">推薦碼報表</p>

    <ReportFilterBar @update:filter="fetchReport" />

    <div v-if="reportData">
      <div class="rp__cards m-t-16">
        <div class="rp__card">
          <p class="rp__card-label">總推薦人數</p>
          <p class="rp__card-value">{{ reportData.totalReferrals ?? '-' }}</p>
        </div>
        <div class="rp__card">
          <p class="rp__card-label">活躍推薦碼</p>
          <p class="rp__card-value">{{ reportData.activeReferralCodes ?? '-' }}</p>
        </div>
        <div class="rp__card">
          <p class="rp__card-label">已發放獎勵</p>
          <p class="rp__card-value">{{ reportData.totalRewardGiven ?? '-' }}</p>
        </div>
      </div>

      <div class="m-t-20">
        <p class="form__text form__text--red m-b-8">推薦碼排行（前 10）</p>
        <ReportTable
          :columns="rankingColumns"
          :items="rankingWithIndex(reportData.ranking ?? [])"
          row-key="referralCode"
          :useWidthClass="true"
        />
      </div>

      <div class="m-t-20">
        <p class="form__text form__text--red m-b-8">每日明細</p>
        <ReportTable
          :columns="dailyColumns"
          :items="reportData.daily ?? []"
          row-key="date"
          :useWidthClass="true"
        />
      </div>
    </div>
  </MCard>
</template>

<style scoped lang="scss">
.rp {
  &__loading { text-align: center; color: #9ca3af; font-size: 14px; }
  &__cards { display: flex; gap: 12px; flex-wrap: wrap; }
  &__card {
    flex: 1; min-width: 160px;
    background: #f5f3ff; border-radius: 8px; padding: 16px 20px; text-align: center;
  }
  &__card-label { font-size: 12px; color: #6b7280; margin-bottom: 6px; }
  &__card-value { font-size: 22px; font-weight: 700; color: #4f46e5; }
}
</style>

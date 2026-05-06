<script setup lang="ts">
import { ref, onMounted } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import MCard from '@/components/common/MCard.vue';
import ReportFilterBar from '@/components/report/ReportFilterBar.vue';
import ReportTable from '@/components/common/ReportTable.vue';
import { getLotteryResultReport } from '@/services/adminReportService';
import { useReportFilter } from '@/composables/useReportFilter';
import { executeApi } from '@/utils/executeApiUtils';
import { exportToCsv } from '@/utils/csvExport';

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent, LegendComponent]);

const reportData = ref<any>(null);
const { dateRange } = useReportFilter();

const prizeChartOption = ref<any>({
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'value' },
  yAxis: { type: 'category', data: [] },
  series: [
    { name: '已抽', type: 'bar', data: [], stack: 'total', barMaxWidth: 30 },
    { name: '剩餘', type: 'bar', data: [], stack: 'total', barMaxWidth: 30 },
  ],
});

const prizeStatsColumns = [
  { field: 'prizeLevel', label: '獎品等級', width: 100 },
  { field: 'totalCount', label: '總數量', width: 100 },
  { field: 'wonCount', label: '已抽數', width: 100 },
  { field: 'remainCount', label: '剩餘數', width: 100 },
  { field: 'wonPercentage', label: '抽出率(%)', width: 100 },
];

const lotteryStatsColumns = [
  { field: 'lotteryTitle', label: '商品名稱', width: 200 },
  { field: 'storeName', label: '店家', width: 140 },
  { field: 'totalSlots', label: '總签數', width: 90 },
  { field: 'soldSlots', label: '已售', width: 80 },
  { field: 'remainSlots', label: '剩餘', width: 80 },
  { field: 'soldPercentage', label: '售出率(%)', width: 100 },
  { field: 'revenue', label: '營收 (NT$)', width: 120 },
];

onMounted(() => fetchReport({ startDate: dateRange.value.startDate, endDate: dateRange.value.endDate }));

async function fetchReport(filter: { startDate: string; endDate: string; storeId?: string }) {
  await executeApi({
    fn: () => getLotteryResultReport({ condition: filter }),
    onSuccess: (data) => {
      reportData.value = data;
      const stats = (data as any)?.prizeStats ?? [];
      prizeChartOption.value = {
        ...prizeChartOption.value,
        yAxis: { type: 'category', data: stats.map((s: any) => s.prizeLevel ?? '') },
        series: [
          { name: '已抽', type: 'bar', data: stats.map((s: any) => s.wonCount ?? 0), stack: 'total', barMaxWidth: 30 },
          { name: '剩餘', type: 'bar', data: stats.map((s: any) => s.remainCount ?? 0), stack: 'total', barMaxWidth: 30 },
        ],
      };
    },
    showSuccessDialog: false,
  });
}

function handleExport() {
  if (!reportData.value) return;
  if (reportData.value.prizeStats?.length) exportToCsv(reportData.value.prizeStats, prizeStatsColumns, '抽獎結果報表_獎品統計');
  if (reportData.value.lotteryStats?.length) exportToCsv(reportData.value.lotteryStats, lotteryStatsColumns, '抽獎結果報表_商品統計');
}
</script>

<template>
  <MCard>
    <div class="rp__header">
      <p class="form__text form__text--title">抽獎結果報表</p>
      <button v-if="reportData" class="rp__export-btn" @click="handleExport">↓ 匯出 CSV</button>
    </div>

    <ReportFilterBar @update:filter="fetchReport" />

    <div v-if="reportData">
      <div class="rp__cards m-t-16">
        <div class="rp__card">
          <p class="rp__card-label">總抽獎次數</p>
          <p class="rp__card-value">{{ reportData.totalDraws ?? '-' }}</p>
        </div>
        <div class="rp__card">
          <p class="rp__card-label">總獎品數</p>
          <p class="rp__card-value">{{ reportData.totalPrizes ?? '-' }}</p>
        </div>
        <div class="rp__card">
          <p class="rp__card-label">大獎數</p>
          <p class="rp__card-value">{{ reportData.bigPrizes ?? '-' }}</p>
        </div>
        <div class="rp__card">
          <p class="rp__card-label">總營收 (NT$)</p>
          <p class="rp__card-value">NT$ {{ reportData.totalAmount?.toLocaleString() ?? '-' }}</p>
        </div>
      </div>

      <!-- 獎品售出橫條圖 -->
      <div v-if="(reportData.prizeStats ?? []).length" class="rp__chart m-t-20">
        <v-chart :option="prizeChartOption" style="height: 260px" autoresize />
      </div>

      <div class="m-t-20">
        <p class="form__text form__text--red m-b-8">獎品統計</p>
        <ReportTable
          :columns="prizeStatsColumns"
          :items="reportData.prizeStats ?? []"
          row-key="prizeName"
          :useWidthClass="true"
        />
      </div>

      <div class="m-t-20">
        <p class="form__text form__text--red m-b-8">商品統計</p>
        <ReportTable
          :columns="lotteryStatsColumns"
          :items="reportData.lotteryStats ?? []"
          row-key="lotteryTitle"
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

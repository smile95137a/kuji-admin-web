<script setup lang="ts">
import { ref, onMounted } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';

import MCard from '@/components/common/MCard.vue';
import ReportFilterBar from '@/components/report/ReportFilterBar.vue';
import ReportTable from '@/components/common/ReportTable.vue';

import { useAuthStore } from '@/stores';
import { getRechargeReport } from '@/services/adminReportService';
import { useReportFilter } from '@/composables/useReportFilter';
import { executeApi } from '@/utils/executeApiUtils';
import { exportToCsv } from '@/utils/csvExport';

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent]);

const authStore = useAuthStore();
const isAdmin = ref(authStore.user?.role === 'ADMIN' || authStore.user?.roles?.includes('ADMIN'));

const reportData = ref<any>(null);
const { dateRange } = useReportFilter();

const chartOption = ref<any>({
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: [] },
  yAxis: { type: 'value', name: 'NT$' },
  series: [{ name: '日儲值金額', type: 'line', data: [], smooth: true, areaStyle: {} }],
});

const planColumns = [
  { field: 'planName', label: '方案名稱', width: 200 },
  { field: 'planPrice', label: '方案金額 (NT$)', width: 130 },
  { field: 'bonusPoints', label: '贈送點數', width: 110 },
  { field: 'purchaseCount', label: '購買次數', width: 100 },
  { field: 'totalAmount', label: '總金額 (NT$)', width: 130 },
  { field: 'percentage', label: '占比 (%)', width: 90 },
];

onMounted(() => fetchReport({ startDate: dateRange.value.startDate, endDate: dateRange.value.endDate }));

async function fetchReport(filter: { startDate: string; endDate: string; storeId?: string }) {
  await executeApi({
    fn: () => getRechargeReport({ condition: filter }),
    onSuccess: (data) => {
      reportData.value = data;
      const daily = (data as any)?.dailyDetails ?? [];
      chartOption.value = {
        ...chartOption.value,
        xAxis: { type: 'category', data: daily.map((d: any) => d.date) },
        series: [{ name: '日儲值金額', type: 'line', data: daily.map((d: any) => d.amount ?? 0), smooth: true, areaStyle: {} }],
      };
    },
    showSuccessDialog: false,
  });
}
function handleExport() {
  if (!reportData.value) return;
  const dailyColumns = [
    { field: 'date', label: '日期', width: 120 },
    { field: 'amount', label: '金額 (NT$)', width: 120 },
    { field: 'count', label: '筆數', width: 90 },
  ];
  if (reportData.value.dailyDetails?.length) exportToCsv(reportData.value.dailyDetails, dailyColumns, '儲値報表_每日明細');
  if (reportData.value.planStats?.length) exportToCsv(reportData.value.planStats, planColumns, '儲値報表_方案統計');
}</script>

<template>
  <MCard>
    <div class="rp__header">
      <p class="form__text form__text--title">儲値報表</p>
      <button v-if="reportData" class="rp__export-btn" @click="handleExport">↓ 匯出 CSV</button>
    </div>

    <ReportFilterBar :show-store-filter="isAdmin" @update:filter="fetchReport" />

    <div v-if="reportData">
      <div class="rp__cards m-t-16">
        <div class="rp__card">
          <p class="rp__card-label">總儲値金額 (NT$)</p>
          <p class="rp__card-value">NT$ {{ reportData.totalAmount?.toLocaleString() ?? '-' }}</p>
        </div>
        <div class="rp__card">
          <p class="rp__card-label">儲値筆數</p>
          <p class="rp__card-value">{{ reportData.totalCount?.toLocaleString() ?? '-' }}</p>
        </div>
        <div class="rp__card">
          <p class="rp__card-label">均底儲値金額</p>
          <p class="rp__card-value">NT$ {{ reportData.avgAmount?.toLocaleString() ?? '-' }}</p>
        </div>
        <div class="rp__card">
          <p class="rp__card-label">成長率</p>
          <p class="rp__card-value">{{ reportData.growthRate != null ? reportData.growthRate + '%' : '-' }}</p>
        </div>
      </div>

      <!-- Line Chart -->
      <div class="rp__chart m-t-20">
        <v-chart :option="chartOption" style="height: 280px" autoresize />
      </div>

      <!-- Plan Stats -->
      <div v-if="reportData.planStats?.length" class="m-t-20">
        <p class="form__text form__text--red m-b-8">方案統計</p>
        <ReportTable
          :columns="planColumns"
          :items="reportData.planStats"
          row-key="planName"
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
  &__loading { text-align: center; color: #9ca3af; font-size: 14px; }
  &__cards { display: flex; gap: 12px; flex-wrap: wrap; }
  &__card {
    flex: 1; min-width: 160px;
    background: #ecfdf5; border-radius: 8px; padding: 16px 20px; text-align: center;
  }
  &__card-label { font-size: 12px; color: #6b7280; margin-bottom: 6px; }
  &__card-value { font-size: 20px; font-weight: 700; color: #059669; }
  &__chart { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
}
</style>

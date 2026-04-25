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

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent]);

const authStore = useAuthStore();
const isAdmin = ref(authStore.user?.role === 'ADMIN' || authStore.user?.roles?.includes('ADMIN'));

const reportData = ref<any>(null);
const isLoading = ref(false);
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
  isLoading.value = true;
  try {
    const res = await getRechargeReport({ condition: filter });
    reportData.value = (res as any)?.data ?? res;
    const daily = reportData.value?.dailyDetails ?? [];
    chartOption.value = {
      ...chartOption.value,
      xAxis: { type: 'category', data: daily.map((d: any) => d.date) },
      series: [{ name: '日儲值金額', type: 'line', data: daily.map((d: any) => d.amount ?? 0), smooth: true, areaStyle: {} }],
    };
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <MCard>
    <p class="form__text form__text--title">儲值報表</p>

    <ReportFilterBar :show-store-filter="isAdmin" @update:filter="fetchReport" />

    <div v-if="isLoading" class="rp__loading m-t-12">載入中...</div>

    <template v-else-if="reportData">
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
    </template>
  </MCard>
</template>

<style scoped lang="scss">
.rp {
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

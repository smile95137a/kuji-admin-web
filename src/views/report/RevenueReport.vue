<script setup lang="ts">
import { ref, onMounted } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';

import MCard from '@/components/common/MCard.vue';
import ReportFilterBar from '@/components/report/ReportFilterBar.vue';
import ReportTable from '@/components/common/ReportTable.vue';

import { useAuthStore } from '@/stores';
import { getStoreOptions } from '@/services/adminStoreService';
import { getRevenueReport } from '@/services/adminReportService';
import { useReportFilter } from '@/composables/useReportFilter';

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent]);

const authStore = useAuthStore();
const isAdmin = ref(authStore.user?.role === 'ADMIN' || authStore.user?.roles?.includes('ADMIN'));

const storeOptions = ref<{ label: string; value: string }[]>([]);
const reportData = ref<any>(null);
const isLoading = ref(false);

const { dateRange } = useReportFilter();

const chartOption = ref<any>({
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: [] },
  yAxis: { type: 'value', name: 'NT$' },
  series: [{ name: '日營收', type: 'line', data: [], smooth: true }],
});

const dailyColumns = [
  { field: 'date', label: '日期', width: 120 },
  { field: 'revenue', label: '營收 (NT$)', width: 130 },
  { field: 'orderCount', label: '訂單數', width: 100 },
  { field: 'drawCount', label: '抽獎次數', width: 110 },
];

const storeColumns = [
  { field: 'storeName', label: '店家', width: 180 },
  { field: 'revenue', label: '營收 (NT$)', width: 130 },
  { field: 'orderCount', label: '訂單數', width: 100 },
];

onMounted(async () => {
  if (isAdmin.value) {
    try {
      const optRes = await getStoreOptions();
      const list = (optRes as any)?.data ?? optRes;
      storeOptions.value = Array.isArray(list)
        ? list.map((s: any) => ({ label: s.label ?? s.storeName, value: s.value ?? s.id }))
        : [];
    } catch { /* ignore */ }
  }
  await fetchReport({ startDate: dateRange.value.startDate, endDate: dateRange.value.endDate });
});

async function fetchReport(filter: { startDate: string; endDate: string; storeId?: string }) {
  isLoading.value = true;
  try {
    const res = await getRevenueReport({ condition: filter });
    reportData.value = (res as any)?.data ?? res;
    const daily = reportData.value?.daily ?? [];
    chartOption.value = {
      ...chartOption.value,
      xAxis: { type: 'category', data: daily.map((d: any) => d.date) },
      series: [{ name: '日營收', type: 'line', data: daily.map((d: any) => d.revenue ?? 0), smooth: true }],
    };
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <MCard>
    <p class="form__text form__text--title">營收報表</p>

    <ReportFilterBar
      :show-store-filter="isAdmin"
      :store-options="storeOptions"
      @update:filter="fetchReport"
    />

    <div v-if="isLoading" class="rp__loading m-t-12">載入中...</div>

    <template v-else-if="reportData">
      <!-- Summary Cards -->
      <div class="rp__cards m-t-16">
        <div class="rp__card">
          <p class="rp__card-label">總營收</p>
          <p class="rp__card-value">NT$ {{ reportData.totalRevenue?.toLocaleString() ?? '-' }}</p>
        </div>
        <div class="rp__card">
          <p class="rp__card-label">總訂單數</p>
          <p class="rp__card-value">{{ reportData.totalOrders ?? '-' }}</p>
        </div>
        <div class="rp__card">
          <p class="rp__card-label">總抽獎次數</p>
          <p class="rp__card-value">{{ reportData.totalDraws ?? '-' }}</p>
        </div>
        <div class="rp__card">
          <p class="rp__card-label">日均營收</p>
          <p class="rp__card-value">NT$ {{ reportData.avgRevenuePerDay?.toLocaleString() ?? '-' }}</p>
        </div>
      </div>

      <!-- Line Chart -->
      <div class="rp__chart m-t-20">
        <v-chart :option="chartOption" style="height: 300px" autoresize />
      </div>

      <!-- Daily Table -->
      <div class="m-t-20">
        <p class="form__text form__text--red m-b-8">每日明細</p>
        <ReportTable
          :columns="dailyColumns"
          :items="reportData.daily ?? []"
          row-key="date"
          :useWidthClass="true"
        />
      </div>

      <!-- ByStore Table (Admin only) -->
      <div v-if="isAdmin && reportData.byStore?.length" class="m-t-20">
        <p class="form__text form__text--red m-b-8">各店家營收</p>
        <ReportTable
          :columns="storeColumns"
          :items="reportData.byStore"
          row-key="storeName"
          :useWidthClass="true"
        />
      </div>
    </template>
  </MCard>
</template>

<style scoped lang="scss">
.rp {
  &__loading { text-align: center; color: #9ca3af; font-size: 14px; }
  &__cards {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  &__card {
    flex: 1;
    min-width: 160px;
    background: #f5f3ff;
    border-radius: 8px;
    padding: 16px 20px;
    text-align: center;
  }
  &__card-label { font-size: 12px; color: #6b7280; margin-bottom: 6px; }
  &__card-value { font-size: 22px; font-weight: 700; color: #4f46e5; }
  &__chart { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
}
</style>

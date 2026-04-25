<script setup lang="ts">
import { ref, onMounted } from 'vue';
import MCard from '@/components/common/MCard.vue';
import ReportFilterBar from '@/components/report/ReportFilterBar.vue';
import ReportTable from '@/components/common/ReportTable.vue';
import { getLotteryResultReport } from '@/services/adminReportService';
import { useReportFilter } from '@/composables/useReportFilter';

const reportData = ref<any>(null);
const isLoading = ref(false);
const { dateRange } = useReportFilter();

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
  isLoading.value = true;
  try {
    const res = await getLotteryResultReport({ condition: filter });
    reportData.value = (res as any)?.data ?? res;
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <MCard>
    <p class="form__text form__text--title">抽獎結果報表</p>

    <ReportFilterBar @update:filter="fetchReport" />

    <div v-if="isLoading" class="rp__loading m-t-12">載入中...</div>

    <template v-else-if="reportData">
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
    </template>
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

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import MCard from '@/components/common/MCard.vue';
import ReportFilterBar from '@/components/report/ReportFilterBar.vue';
import ReportTable from '@/components/common/ReportTable.vue';
import { getReferralReport } from '@/services/adminReportService';
import { useReportFilter } from '@/composables/useReportFilter';

const reportData = ref<any>(null);
const isLoading = ref(false);
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
  isLoading.value = true;
  try {
    const res = await getReferralReport({ condition: filter });
    reportData.value = (res as any)?.data ?? res;
  } finally {
    isLoading.value = false;
  }
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

    <div v-if="isLoading" class="rp__loading m-t-12">載入中...</div>

    <template v-else-if="reportData">
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

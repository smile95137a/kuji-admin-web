<script setup lang="ts">
import { ref, onMounted } from 'vue';
import MCard from '@/components/common/MCard.vue';
import ReportFilterBar from '@/components/report/ReportFilterBar.vue';
import ReportTable from '@/components/common/ReportTable.vue';
import { getBonusReport } from '@/services/adminReportService';
import { useReportFilter } from '@/composables/useReportFilter';
import { executeApi } from '@/utils/executeApiUtils';

const reportData = ref<any>(null);
const { dateRange } = useReportFilter();

// API: POST /admin/report/bonus
// Response: { totalBonusPoints, totalCount, benefitUsers, growthRate, dailyDetails[], typeStats[] }
// typeStats.bonusType: REFERRAL / PROMOTION / ADJUSTMENT / REGISTRATION

const BONUS_TYPE_LABEL: Record<string, string> = {
  REFERRAL: '推薦好友',
  PROMOTION: '活動贈點',
  ADJUSTMENT: '手動調整',
  REGISTRATION: '註冊贈點',
};

const dailyColumns = [
  { field: 'date', label: '日期', width: 120 },
  { field: 'points', label: '贈點數', width: 120 },
  { field: 'count', label: '筆數', width: 90 },
];

const typeStatsColumns = [
  { field: 'typeName', label: '類型', width: 140 },
  { field: 'bonusType', label: '代碼', width: 130 },
  { field: 'totalPoints', label: '總點數', width: 120 },
  { field: 'count', label: '筆數', width: 90 },
  { field: 'percentage', label: '佔比(%)', width: 100 },
];

onMounted(() => fetchReport({ startDate: dateRange.value.startDate, endDate: dateRange.value.endDate }));

async function fetchReport(filter: { startDate: string; endDate: string }) {
  await executeApi({
    fn: () => getBonusReport({ condition: filter }),
    onSuccess: (data) => {
      const raw = data as any;
      if (raw?.typeStats) {
        raw.typeStats = raw.typeStats.map((t: any) => ({
          ...t,
          typeName: t.typeName ?? BONUS_TYPE_LABEL[t.bonusType] ?? t.bonusType,
        }));
      }
      reportData.value = raw;
    },
    showSuccessDialog: false,
  });
}
</script>

<template>
  <MCard>
    <p class="form__text form__text--title">紅利報表</p>

    <ReportFilterBar @update:filter="fetchReport" />

    <div v-if="reportData">
      <!-- Summary Cards -->
      <div class="rp__cards m-t-16">
        <div class="rp__card">
          <p class="rp__card-label">總贈點數</p>
          <p class="rp__card-value">{{ reportData.totalBonusPoints?.toLocaleString() ?? '-' }}</p>
        </div>
        <div class="rp__card">
          <p class="rp__card-label">總贈點筆數</p>
          <p class="rp__card-value">{{ reportData.totalCount?.toLocaleString() ?? '-' }}</p>
        </div>
        <div class="rp__card">
          <p class="rp__card-label">受益人數</p>
          <p class="rp__card-value">{{ reportData.benefitUsers?.toLocaleString() ?? '-' }}</p>
        </div>
        <div class="rp__card">
          <p class="rp__card-label">成長率</p>
          <p class="rp__card-value">{{ reportData.growthRate != null ? reportData.growthRate + '%' : '-' }}</p>
        </div>
      </div>

      <!-- 類型統計 -->
      <div v-if="reportData.typeStats?.length" class="m-t-20">
        <p class="form__text form__text--red m-b-8">贈點類型統計</p>
        <ReportTable
          :columns="typeStatsColumns"
          :items="reportData.typeStats"
          row-key="bonusType"
          :useWidthClass="true"
        />
      </div>

      <!-- 每日明細 -->
      <div v-if="reportData.dailyDetails?.length" class="m-t-20">
        <p class="form__text form__text--red m-b-8">每日明細</p>
        <ReportTable
          :columns="dailyColumns"
          :items="reportData.dailyDetails"
          row-key="date"
          :useWidthClass="true"
        />
      </div>

      <div v-if="!reportData.typeStats?.length && !reportData.dailyDetails?.length" class="rp__empty m-t-16">
        無資料
      </div>
    </div>
  </MCard>
</template>

<style scoped lang="scss">
.rp {
  &__loading, &__empty { text-align: center; color: #9ca3af; font-size: 14px; padding: 24px; }
  &__cards { display: flex; gap: 12px; flex-wrap: wrap; }
  &__card {
    flex: 1; min-width: 160px;
    background: #fef9c3; border-radius: 8px; padding: 16px 20px; text-align: center;
  }
  &__card-label { font-size: 12px; color: #6b7280; margin-bottom: 6px; }
  &__card-value { font-size: 22px; font-weight: 700; color: #d97706; }
}
</style>

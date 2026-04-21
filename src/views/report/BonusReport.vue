<script setup lang="ts">
/**
 * BonusReport.vue
 * ⚠️ BonusReportRes 欄位待後端確認。
 * 目前以 summary 卡片 + raw data table 骨架呈現。
 */
import { ref, onMounted } from 'vue';
import MCard from '@/components/common/MCard.vue';
import ReportFilterBar from '@/components/report/ReportFilterBar.vue';
import ReportTable from '@/components/common/ReportTable.vue';
import { getBonusReport } from '@/services/adminReportService';
import { useReportFilter } from '@/composables/useReportFilter';

const reportData = ref<any>(null);
const rawItems = ref<any[]>([]);
const rawColumns = ref<{ field: string; label: string; width: number }[]>([]);
const isLoading = ref(false);
const { dateRange } = useReportFilter();

onMounted(() => fetchReport({ startDate: dateRange.value.startDate, endDate: dateRange.value.endDate }));

async function fetchReport(filter: { startDate: string; endDate: string }) {
  isLoading.value = true;
  try {
    const res = await getBonusReport({ condition: filter });
    reportData.value = (res as any)?.data ?? res;

    // Auto-build columns from first item keys (skeleton mode)
    const data = Array.isArray(reportData.value) ? reportData.value : (reportData.value?.items ?? []);
    rawItems.value = data;
    if (data.length > 0) {
      rawColumns.value = Object.keys(data[0]).map((key) => ({
        field: key,
        label: key,
        width: 140,
      }));
    }
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <MCard>
    <p class="form__text form__text--title">紅利報表</p>
    <p class="rp__notice">⚠️ 欄位待後端確認，目前顯示原始資料骨架</p>

    <ReportFilterBar @update:filter="fetchReport" />

    <div v-if="isLoading" class="rp__loading m-t-12">載入中...</div>

    <template v-else-if="reportData">
      <!-- Summary (generic KV display if object shape unknown) -->
      <div class="rp__cards m-t-16" v-if="reportData && !Array.isArray(reportData)">
        <template
          v-for="(val, key) in reportData"
          :key="String(key)"
        >
          <div
            v-if="typeof val !== 'object'"
            class="rp__card"
          >
            <p class="rp__card-label">{{ key }}</p>
            <p class="rp__card-value">{{ val }}</p>
          </div>
        </template>
      </div>

      <!-- Raw Data Table -->
      <div v-if="rawItems.length" class="m-t-16">
        <p class="form__text form__text--red m-b-8">原始資料（待欄位確認後更新）</p>
        <ReportTable
          :columns="rawColumns"
          :items="rawItems"
          row-key="id"
          :useWidthClass="true"
        />
      </div>
      <div v-else class="rp__empty m-t-16">無資料</div>
    </template>
  </MCard>
</template>

<style scoped lang="scss">
.rp {
  &__notice {
    font-size: 12px;
    color: #d97706;
    background: #fef3c7;
    padding: 6px 12px;
    border-radius: 4px;
    margin: 8px 0;
  }
  &__loading, &__empty { text-align: center; color: #9ca3af; font-size: 14px; padding: 24px; }
  &__cards { display: flex; gap: 12px; flex-wrap: wrap; }
  &__card {
    flex: 1; min-width: 140px;
    background: #fef9c3; border-radius: 8px; padding: 14px 16px; text-align: center;
  }
  &__card-label { font-size: 11px; color: #6b7280; margin-bottom: 4px; word-break: break-all; }
  &__card-value { font-size: 18px; font-weight: 700; color: #374151; }
}
</style>

<template>
  <div class="member-growth-page">
    <MCard>
      <div class="mg-page-head">
        <div class="mg-page-head__main">
          <p class="mg-page-head__eyebrow">報表管理</p>
          <h2 class="mg-page-head__title">會員成長報表</h2>
          <p class="mg-page-head__sub">
            平台會員視角：新增、活躍、留存與消費分布洞察。
          </p>
        </div>

        <div class="mg-page-head__actions">
          <span class="mg-current-type">ADMIN 平台視圖</span>
          <span v-if="hasReportData" class="mg-total-count">
            共 {{ totalRowCount }} 筆資料
          </span>
        </div>
      </div>

      <div class="mg-summary-row">
        <div class="mg-summary-card">
          <span class="mg-summary-card__label">查詢期間</span>
          <strong class="mg-summary-card__value">{{ queryDateText }}</strong>
        </div>
        <div class="mg-summary-card">
          <span class="mg-summary-card__label">分布區塊</span>
          <strong class="mg-summary-card__value">4 個</strong>
        </div>
        <div class="mg-summary-card">
          <span class="mg-summary-card__label">每日明細</span>
          <strong class="mg-summary-card__value">{{ dailyNewMembers.length }} 筆</strong>
        </div>
      </div>
    </MCard>

    <div class="m-t-12">
      <MCard>
        <div class="mg-card-head">
          <div>
            <p class="mg-card-head__title">查詢條件</p>
            <p class="mg-card-head__sub">可依日期區間查詢平台會員成長資料。</p>
          </div>
        </div>

        <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
          <div class="mg-filter-grid">
            <FormInput label="開始日期" type="date" name="startDate" v-model="startDate" />
            <FormInput label="結束日期" type="date" name="endDate" v-model="endDate" />
          </div>

          <div class="mg-filter-actions">
            <MButton type="submit">
              <font-awesome-icon icon="fa-magnifying-glass" class="m-r-4" />查詢
            </MButton>
            <MButton type="button" class="mbtn--gray" @click="resetFilters">
              <font-awesome-icon icon="fa-rotate-left" class="m-r-4" />清除
            </MButton>
          </div>
        </Form>
      </MCard>
    </div>

    <div class="m-t-12">
      <MCard>
        <div class="mg-card-head mg-card-head--result">
          <div>
            <p class="mg-card-head__title">查詢結果</p>
            <p class="mg-card-head__sub">摘要、分布圖表與明細同步顯示。</p>
          </div>

          <div class="mg-result-actions">
            <span v-if="hasReportData" class="mg-card-head__count">共 {{ totalRowCount }} 筆資料</span>
            <MButton v-if="hasReportData" type="button" variant="secondary" @click="handleExport">
              <font-awesome-icon icon="fa-download" class="m-r-4" />匯出 CSV
            </MButton>
          </div>
        </div>

        <div v-if="forbiddenMessage" class="mg-forbidden m-t-16">{{ forbiddenMessage }}</div>
        <div v-else-if="loading" class="mg-state m-t-16">查詢中...</div>

        <template v-else>
          <NoData v-if="!reportData" message="請輸入查詢條件後查詢" />

          <div v-else class="m-t-16">
            <div class="mg-stat-row">
              <div class="mg-stat-card"><span class="mg-stat-card__label">新增會員</span><strong class="mg-stat-card__value">{{ formatNumber(reportData.totalNewMembers) }}</strong></div>
              <div class="mg-stat-card"><span class="mg-stat-card__label">活躍會員</span><strong class="mg-stat-card__value">{{ formatNumber(reportData.activeMembers) }}</strong></div>
              <div class="mg-stat-card"><span class="mg-stat-card__label">成長率</span><strong class="mg-stat-card__value">{{ formatPercent(reportData.growthRate) }}</strong></div>
              <div class="mg-stat-card"><span class="mg-stat-card__label">7日留存</span><strong class="mg-stat-card__value">{{ formatPercent(reportData.retention7Days) }}</strong></div>
              <div class="mg-stat-card"><span class="mg-stat-card__label">30日留存</span><strong class="mg-stat-card__value">{{ formatPercent(reportData.retention30Days) }}</strong></div>
              <div class="mg-stat-card"><span class="mg-stat-card__label">金幣ARPU</span><strong class="mg-stat-card__value">{{ formatNumber(reportData.arpuGold) }}</strong></div>
            </div>

            <div v-if="dailyGrowthChartOption" class="mg-chart m-t-20">
              <div class="mg-chart__head"><div><p class="mg-chart__title">每日新增趨勢</p><p class="mg-chart__sub">平台每日新增會員變化。</p></div></div>
              <VChart :option="dailyGrowthChartOption" class="mg-chart__main" autoresize />
            </div>

            <div v-if="consumptionPatternChartOption" class="mg-chart m-t-20">
              <div class="mg-chart__head"><div><p class="mg-chart__title">消費模式分布</p><p class="mg-chart__sub">新增會員的行為分布。</p></div></div>
              <VChart :option="consumptionPatternChartOption" class="mg-chart__main" autoresize />
            </div>

            <div v-if="productConcentrationChartOption" class="mg-chart m-t-20">
              <div class="mg-chart__head"><div><p class="mg-chart__title">商品集中度（Top 10）</p><p class="mg-chart__sub">抽獎次數集中於哪些商品。</p></div></div>
              <VChart :option="productConcentrationChartOption" class="mg-chart__main" autoresize />
            </div>

            <div v-if="coinUsageChartOption" class="mg-chart m-t-20">
              <div class="mg-chart__head"><div><p class="mg-chart__title">金幣 vs 紅利消耗分布</p><p class="mg-chart__sub">抽獎消耗幣種占比。</p></div></div>
              <VChart :option="coinUsageChartOption" class="mg-chart__main" autoresize />
            </div>

            <div v-if="paymentMethodChartOption" class="mg-chart m-t-20">
              <div class="mg-chart__head"><div><p class="mg-chart__title">支付型態分布</p><p class="mg-chart__sub">儲值支付渠道分布。</p></div></div>
              <VChart :option="paymentMethodChartOption" class="mg-chart__main" autoresize />
            </div>

            <div class="m-t-20" v-if="dailyNewMembers.length">
              <div class="mg-section-head"><p class="mg-section-head__title">每日新增明細</p><span class="mg-section-head__count">共 {{ dailyNewMembers.length }} 筆</span></div>
              <ReportTable class="mg-report-table" :columns="dailyColumns" :items="getCurrentPageItems('daily', dailyNewMembers)" row-key="date" :use-width-class="true" />
              <div class="flex justify-center m-t-12"><Pagination :totalPages="getTotalPages('daily', dailyNewMembers)" :renderPaginationNums="getRenderPaginationNums('daily', dailyNewMembers)" :currentPage="getCurrentPage('daily')" :nextPage="() => nextPage('daily', dailyNewMembers)" :previousPage="() => previousPage('daily', dailyNewMembers)" :goToPage="(page:number) => goToPage('daily', dailyNewMembers, page)" :pageLimitSize="getPageLimitSize('daily')" :totalItems="dailyNewMembers.length" @update:pageLimitSize="(v:number)=>handlePageLimitSizeChange('daily', v)" /></div>
            </div>
          </div>
        </template>
      </MCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { Form, type FormContext } from 'vee-validate';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import NoData from '@/components/common/NoData.vue';
import Pagination from '@/components/common/Pagination.vue';
import FormInput from '@/components/common/FormInput.vue';
import ReportTable from '@/components/common/ReportTable.vue';

import { useAuthStore } from '@/stores';
import { useReportFilter } from '@/composables/useReportFilter';
import { executeApi } from '@/utils/executeApiUtils';
import { exportToCsv } from '@/utils/csvExport';
import {
  getMemberGrowthReport,
  type MemberGrowthReportRes,
} from '@/services/adminReportService';

use([CanvasRenderer, BarChart, LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent]);

type TableColumn = { field: string; label: string; width?: number };

const REPORT_TITLE = '會員成長報表';
const authStore = useAuthStore();
const { dateRange } = useReportFilter();

const formRef = ref<FormContext | null>(null);
const initValues = ref({ startDate: dateRange.value.startDate, endDate: dateRange.value.endDate });
const startDate = ref(dateRange.value.startDate);
const endDate = ref(dateRange.value.endDate);
const loading = ref(false);
const forbiddenMessage = ref('');
const reportData = ref<MemberGrowthReportRes | null>(null);
const lastQuery = ref({ startDate: dateRange.value.startDate, endDate: dateRange.value.endDate });

const roleSet = computed(() => new Set([...(Array.isArray((authStore.user as any)?.roles) ? (authStore.user as any).roles : []), (authStore.user as any)?.role].filter(Boolean).map((r) => String(r).toUpperCase())));
const isAdmin = computed(() => roleSet.value.has('ROLE_ADMIN') || roleSet.value.has('ADMIN'));

const dailyNewMembers = computed(() => Array.isArray(reportData.value?.dailyNewMembers) ? reportData.value.dailyNewMembers : []);
const consumptionPatterns = computed(() => Array.isArray(reportData.value?.consumptionPatterns) ? reportData.value.consumptionPatterns : []);
const productConcentrations = computed(() => Array.isArray(reportData.value?.productConcentrations) ? reportData.value.productConcentrations : []);
const paymentMethodDistributions = computed(() => Array.isArray(reportData.value?.paymentMethodDistributions) ? reportData.value.paymentMethodDistributions : []);

const totalRowCount = computed(() => dailyNewMembers.value.length + consumptionPatterns.value.length + productConcentrations.value.length + paymentMethodDistributions.value.length);
const hasReportData = computed(() => Boolean(reportData.value));
const queryDateText = computed(() => `${lastQuery.value.startDate || '-'} ~ ${lastQuery.value.endDate || '-'}`);

const dailyColumns: TableColumn[] = [{ field: 'date', label: '日期', width: 120 }, { field: 'count', label: '新增會員', width: 100 }];
const consumptionColumns: TableColumn[] = [{ field: 'patternName', label: '模式', width: 180 }, { field: 'userCount', label: '人數', width: 100 }, { field: 'percentage', label: '占比(%)', width: 100 }];
const productColumns: TableColumn[] = [{ field: 'lotteryTitle', label: '商品', width: 240 }, { field: 'category', label: '分類', width: 120 }, { field: 'drawCount', label: '抽獎次數', width: 120 }, { field: 'drawPercentage', label: '占比(%)', width: 100 }];
const paymentColumns: TableColumn[] = [{ field: 'paymentMethod', label: '支付方式', width: 180 }, { field: 'transactionCount', label: '筆數', width: 100 }, { field: 'totalAmount', label: '金額', width: 120 }, { field: 'percentage', label: '占比(%)', width: 100 }];

const pageLimitMap = ref<Record<string, number>>({});
const currentPageMap = ref<Record<string, number>>({});
const getPageLimitSize = (key: string) => pageLimitMap.value[key] ?? 10;
const getCurrentPage = (key: string) => currentPageMap.value[key] ?? 1;
const setPageLimitSize = (key: string, size: number) => (pageLimitMap.value = { ...pageLimitMap.value, [key]: size });
const setCurrentPage = (key: string, page: number) => (currentPageMap.value = { ...currentPageMap.value, [key]: page });
const getTotalPages = (key: string, rows: any[]) => Math.max(1, Math.ceil(rows.length / getPageLimitSize(key)));
const getCurrentPageItems = (key: string, rows: any[]) => rows.slice((getCurrentPage(key) - 1) * getPageLimitSize(key), (getCurrentPage(key) - 1) * getPageLimitSize(key) + getPageLimitSize(key));
const getRenderPaginationNums = (key: string, rows: any[]) => {
  const total = getTotalPages(key, rows);
  const cur = getCurrentPage(key);
  const start = Math.max(1, cur - 2);
  const end = Math.min(total, cur + 2);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};
const goToPage = (key: string, rows: any[], page: number) => setCurrentPage(key, Math.min(Math.max(page, 1), getTotalPages(key, rows)));
const nextPage = (key: string, rows: any[]) => goToPage(key, rows, getCurrentPage(key) + 1);
const previousPage = (key: string, rows: any[]) => goToPage(key, rows, getCurrentPage(key) - 1);
const handlePageLimitSizeChange = (key: string, value: number) => { setPageLimitSize(key, value); setCurrentPage(key, 1); };
const resetPagination = () => { pageLimitMap.value = {}; currentPageMap.value = {}; };

const dailyGrowthChartOption = computed(() => {
  if (!dailyNewMembers.value.length) return null;
  return { tooltip: { trigger: 'axis' }, legend: { data: ['新增會員'] }, grid: { top: 48, left: 42, right: 20, bottom: 36 }, xAxis: { type: 'category', data: dailyNewMembers.value.map((i: any) => i.date) }, yAxis: { type: 'value' }, series: [{ name: '新增會員', type: 'line', smooth: true, areaStyle: {}, data: dailyNewMembers.value.map((i: any) => i.count ?? 0) }] };
});

const consumptionPatternChartOption = computed(() => {
  if (!consumptionPatterns.value.length) return null;
  return { tooltip: { trigger: 'axis' }, grid: { top: 28, left: 42, right: 20, bottom: 36 }, xAxis: { type: 'category', data: consumptionPatterns.value.map((i: any) => i.patternName) }, yAxis: { type: 'value' }, series: [{ type: 'bar', barMaxWidth: 42, data: consumptionPatterns.value.map((i: any) => i.userCount ?? 0) }] };
});

const productConcentrationChartOption = computed(() => {
  if (!productConcentrations.value.length) return null;
  return { tooltip: { trigger: 'axis' }, grid: { top: 28, left: 120, right: 20, bottom: 36 }, xAxis: { type: 'value' }, yAxis: { type: 'category', data: productConcentrations.value.map((i: any) => i.lotteryTitle) }, series: [{ type: 'bar', barMaxWidth: 26, data: productConcentrations.value.map((i: any) => i.drawCount ?? 0) }] };
});

const coinUsageChartOption = computed(() => {
  const data = reportData.value?.coinUsageDistribution;
  if (!data) return null;
  return { tooltip: { trigger: 'item' }, legend: { bottom: 0 }, series: [{ type: 'pie', radius: ['35%', '68%'], data: [{ name: 'GOLD', value: data.goldSpend ?? 0 }, { name: 'BONUS', value: data.bonusSpend ?? 0 }] }] };
});

const paymentMethodChartOption = computed(() => {
  if (!paymentMethodDistributions.value.length) return null;
  return { tooltip: { trigger: 'axis' }, grid: { top: 28, left: 42, right: 20, bottom: 36 }, xAxis: { type: 'category', data: paymentMethodDistributions.value.map((i: any) => i.paymentMethod) }, yAxis: { type: 'value' }, series: [{ type: 'bar', barMaxWidth: 42, data: paymentMethodDistributions.value.map((i: any) => i.transactionCount ?? 0) }] };
});

function formatNumber(value: any) {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  return Number.isNaN(num) ? value : num.toLocaleString();
}

function formatPercent(value: any) {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  return Number.isNaN(num) ? String(value) : `${num.toFixed(1)}%`;
}

async function onSubmit(values: any) {
  if (!isAdmin.value) {
    forbiddenMessage.value = '此報表僅限平台管理員查看。';
    reportData.value = null;
    return;
  }

  forbiddenMessage.value = '';
  lastQuery.value = { startDate: values.startDate ?? '', endDate: values.endDate ?? '' };
  loading.value = true;

  await executeApi({
    fn: () => getMemberGrowthReport({ condition: { startDate: values.startDate || undefined, endDate: values.endDate || undefined } }),
    onSuccess: (data) => {
      reportData.value = data ?? null;
      resetPagination();
    },
    onFail: () => {
      reportData.value = null;
      resetPagination();
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
    onFinally: () => {
      loading.value = false;
    },
  });
}

function resetFilters() {
  const values = { startDate: dateRange.value.startDate, endDate: dateRange.value.endDate };
  startDate.value = values.startDate;
  endDate.value = values.endDate;
  formRef.value?.setValues(values);
}

function handleExport() {
  if (!reportData.value) return;
  exportToCsv([
    {
      startDate: reportData.value.startDate,
      endDate: reportData.value.endDate,
      totalNewMembers: reportData.value.totalNewMembers,
      activeMembers: reportData.value.activeMembers,
      growthRate: reportData.value.growthRate,
      retention7Days: reportData.value.retention7Days,
      retention30Days: reportData.value.retention30Days,
      arpuGold: reportData.value.arpuGold,
      arpuBonus: reportData.value.arpuBonus,
    },
  ], [
    { field: 'startDate', label: '開始日期' },
    { field: 'endDate', label: '結束日期' },
    { field: 'totalNewMembers', label: '新增會員' },
    { field: 'activeMembers', label: '活躍會員' },
    { field: 'growthRate', label: '成長率(%)' },
    { field: 'retention7Days', label: '7日留存(%)' },
    { field: 'retention30Days', label: '30日留存(%)' },
    { field: 'arpuGold', label: '金幣ARPU' },
    { field: 'arpuBonus', label: '紅利ARPU' },
  ], `${REPORT_TITLE}_摘要`);

  if (dailyNewMembers.value.length) exportToCsv(dailyNewMembers.value, dailyColumns, `${REPORT_TITLE}_每日新增`);
  if (consumptionPatterns.value.length) exportToCsv(consumptionPatterns.value, consumptionColumns, `${REPORT_TITLE}_消費模式分布`);
  if (productConcentrations.value.length) exportToCsv(productConcentrations.value, productColumns, `${REPORT_TITLE}_商品集中度`);
  if (paymentMethodDistributions.value.length) exportToCsv(paymentMethodDistributions.value, paymentColumns, `${REPORT_TITLE}_支付型態分布`);
}

onMounted(async () => {
  await nextTick();
  formRef.value?.setValues({ ...initValues.value });
  await onSubmit({ ...initValues.value });
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as tokens;

.member-growth-page {
  width: 100%;
  max-width: 100%;
}

/* ==============================
 * Page Head
 * ============================== */
.mg-page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
  margin-bottom: 14px;

  &__main {
    min-width: 0;
  }

  &__eyebrow {
    margin: 0 0 4px;
    color: tokens.$brand;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.04em;
  }

  &__title {
    margin: 0;
    color: tokens.$form-text;
    font-size: 22px;
    font-weight: 800;
    line-height: 1.35;
  }

  &__sub {
    margin: 4px 0 0;
    color: tokens.$form-muted;
    font-size: 13px;
    line-height: 1.5;
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;
  }
}

.mg-current-type,
.mg-total-count {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.mg-current-type {
  background: color.mix(tokens.$brand-light, #fff, 18%);
  color: tokens.$brand-dark;
}

.mg-total-count {
  background: color.mix(tokens.$form-border, #fff, 42%);
  color: tokens.$form-muted;
}

/* ==============================
 * Summary
 * ============================== */
.mg-summary-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.mg-summary-card {
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
  border-radius: 14px;
  background: color.mix(tokens.$brand-light, #fff, 8%);

  &__label {
    display: block;
    margin-bottom: 4px;
    color: tokens.$form-muted;
    font-size: 12px;
    line-height: 1.4;
  }

  &__value {
    display: block;
    color: tokens.$form-text;
    font-size: 15px;
    font-weight: 800;
    line-height: 1.5;
    word-break: break-word;
  }
}

/* ==============================
 * Card Head
 * ============================== */
.mg-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;

  &--result {
    margin-bottom: 12px;
  }

  &__title {
    margin: 0;
    padding-left: 10px;
    border-left: 4px solid tokens.$brand;
    color: tokens.$form-text;
    font-size: 15px;
    font-weight: 800;
    line-height: 1.4;
  }

  &__sub {
    margin: 4px 0 0;
    color: tokens.$form-muted;
    font-size: 13px;
    line-height: 1.5;
  }

  &__count {
    flex: 0 0 auto;
    padding: 4px 10px;
    border-radius: 999px;
    background: color.mix(tokens.$brand-light, #fff, 18%);
    color: tokens.$brand;
    font-size: 12px;
    font-weight: 800;
    white-space: nowrap;
  }
}

.mg-result-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

/* ==============================
 * Filter
 * ============================== */
.mg-filter-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
  padding: 14px;
  border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
  border-radius: 16px;
  background: color.mix(tokens.$brand-light, #fff, 7%);
}

.mg-filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

/* ==============================
 * State
 * ============================== */
.mg-state {
  color: tokens.$form-muted;
  font-size: 14px;
}

.mg-forbidden {
  color: #b45309;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 700;
}

/* ==============================
 * Stat Cards
 * ============================== */
.mg-stat-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.mg-stat-card {
  min-width: 0;
  padding: 14px;
  border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
  border-radius: 14px;
  background: tokens.$form-bg;

  &__label {
    display: block;
    margin-bottom: 4px;
    color: tokens.$form-muted;
    font-size: 12px;
    line-height: 1.4;
  }

  &__value {
    display: block;
    color: tokens.$form-text;
    font-size: 20px;
    font-weight: 800;
    line-height: 1.4;
    word-break: break-word;
  }
}

/* ==============================
 * Chart
 * ============================== */
.mg-chart {
  padding: 14px;
  border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
  border-radius: 16px;
  background: color.mix(tokens.$brand-light, #fff, 7%);

  &__head {
    margin-bottom: 8px;
  }

  &__title {
    margin: 0;
    color: tokens.$form-text;
    font-size: 15px;
    font-weight: 800;
  }

  &__sub {
    margin: 4px 0 0;
    color: tokens.$form-muted;
    font-size: 13px;
  }

  &__main {
    width: 100%;
    height: 280px;
  }
}

/* ==============================
 * Section / Table
 * ============================== */
.mg-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;

  &__title {
    margin: 0;
    padding-left: 10px;
    border-left: 4px solid tokens.$brand;
    color: tokens.$form-text;
    font-size: 15px;
    font-weight: 800;
  }

  &__count {
    flex: 0 0 auto;
    padding: 4px 10px;
    border-radius: 999px;
    background: color.mix(tokens.$brand-light, #fff, 18%);
    color: tokens.$brand;
    font-size: 12px;
    font-weight: 800;
  }
}

.mg-report-table {
  margin-top: 0;
}

/* ==============================
 * RWD
 * ============================== */
@media (max-width: 1180px) {
  .mg-stat-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .mg-page-head {
    flex-direction: column;

    &__actions {
      justify-content: flex-start;
    }
  }

  .mg-summary-row,
  .mg-filter-grid {
    grid-template-columns: 1fr;
  }

  .mg-card-head {
    flex-direction: column;
  }

  .mg-result-actions,
  .mg-filter-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .mg-stat-row {
    grid-template-columns: 1fr;
  }
}
</style>

<script setup lang="ts">
import GenericAdminReportPage from '@/components/report/GenericAdminReportPage.vue';
import { getPlatformRevenueReport } from '@/services/adminReportService';
</script>

<template>
  <GenericAdminReportPage
    title="平台營收總覽"
    :fetch-report-api="getPlatformRevenueReport"
    :show-store-filter="false"
  />
</template>

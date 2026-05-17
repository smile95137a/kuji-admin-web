<script setup lang="ts">
import GenericAdminReportPage from '@/components/report/GenericAdminReportPage.vue';
import { getStorePerformanceReport } from '@/services/adminReportService';
</script>

<template>
  <GenericAdminReportPage
    title="店家績效報表"
    :fetch-report-api="getStorePerformanceReport"
  />
</template>

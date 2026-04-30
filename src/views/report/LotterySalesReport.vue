<script setup lang="ts">
import GenericAdminReportPage from '@/components/report/GenericAdminReportPage.vue';
import { getLotterySalesReport } from '@/services/adminReportService';
</script>

<template>
  <GenericAdminReportPage
    title="抽獎銷售報表"
    :fetch-report-api="getLotterySalesReport"
  />
</template>

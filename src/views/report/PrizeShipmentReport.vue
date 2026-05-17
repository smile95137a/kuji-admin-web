<script setup lang="ts">
import GenericAdminReportPage from '@/components/report/GenericAdminReportPage.vue';
import { getPrizeShipmentReport } from '@/services/adminReportService';
</script>

<template>
  <GenericAdminReportPage
    title="獎品出貨報表"
    :fetch-report-api="getPrizeShipmentReport"
    :hidden-section-keys="['dailyDetails']"
  />
</template>

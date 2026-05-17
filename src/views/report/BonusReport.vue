<script setup lang="ts">
import GenericAdminReportPage from '@/components/report/GenericAdminReportPage.vue';
import { getBonusReport } from '@/services/adminReportService';
</script>

<template>
  <GenericAdminReportPage
    title="紅利報表"
    :fetch-report-api="getBonusReport"
    :show-store-filter="false"
    :hidden-section-keys="['dailyDetails']"
  />
</template>

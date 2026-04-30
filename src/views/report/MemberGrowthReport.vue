<script setup lang="ts">
import GenericAdminReportPage from '@/components/report/GenericAdminReportPage.vue';
import { getMemberGrowthReport } from '@/services/adminReportService';
</script>

<template>
  <GenericAdminReportPage
    title="會員成長報表"
    :fetch-report-api="getMemberGrowthReport"
  />
</template>

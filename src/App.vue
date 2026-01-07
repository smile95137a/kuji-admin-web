<template>
  <router-view></router-view>

  <ConfirmDialog v-if="dialogStore.isConfirmDialogOpen" />
  <InfoDialog v-if="dialogStore.isInfoDialogOpen" />

  <!-- Loading -->
  <LoadingMask v-if="loadingStore.isLoading" />
</template>

<script setup lang="ts">
import { useDialogStore, useLoadingStore } from './stores';

import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import InfoDialog from '@/components/common/InfoDialog.vue';
import LoadingMask from '@/components/common/LoadingMask.vue';

const dialogStore = useDialogStore();
const loadingStore = useLoadingStore();
</script>

<style scoped>
.layout__body {
  display: flex;
}
.layout__main {
  flex: 1;
}
</style>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSystemConfig } from '@/composables/useSystemConfig';
import { useDialogStore } from '@/stores';

import MCard from '@/components/common/MCard.vue';
import SystemConfigTable from '@/components/systemConfig/SystemConfigTable.vue';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

const dialogStore = useDialogStore();

const {
  isLoading,
  editingId,
  groupedConfigs,
  groups,
  fetchConfigs,
  updateConfig,
  startEdit,
  cancelEdit,
} = useSystemConfig();

const activeGroup = ref('');

onMounted(async () => {
  try {
    await fetchConfigs();
    if (groups.value.length > 0) activeGroup.value = groups.value[0];
  } catch {
    await openInfoDialog({
      title: '提示訊息',
      message: '載入系統設定失敗',
      iconType: 'warning',
    });
  }
});

const handleSave = async (id: string, value: string) => {
  const ok = await openConfirmDialog({
    title: '確認修改',
    message: '確定要儲存此設定值嗎？',
  });
  if (!ok) return;

  try {
    await updateConfig(id, value);
    cancelEdit();
    await openInfoDialog({
      title: '提示訊息',
      message: '設定已更新',
      iconType: 'success',
    });
  } catch {
    await openInfoDialog({
      title: '提示訊息',
      message: '儲存失敗，請重試',
      iconType: 'warning',
    });
  }
};
</script>

<template>
  <MCard>
    <p class="form__text form__text--title">系統設定管理</p>

    <!-- Loading -->
    <div v-if="isLoading" class="scl__loading">載入中...</div>

    <!-- No data -->
    <div v-else-if="groups.length === 0" class="scl__empty">目前無系統設定</div>

    <template v-else>
      <!-- Group Tabs -->
      <div class="scl__tabs">
        <button
          v-for="group in groups"
          :key="group"
          class="scl__tab"
          :class="{ 'scl__tab--active': activeGroup === group }"
          @click="
            activeGroup = group;
            cancelEdit();
          "
        >
          {{ group }}
        </button>
      </div>

      <!-- Active Group Table -->
      <div class="scl__table-wrap m-t-12">
        <SystemConfigTable
          :configs="groupedConfigs[activeGroup] ?? []"
          :editing-id="editingId"
          @start-edit="startEdit"
          @save="handleSave"
          @cancel="cancelEdit"
        />
      </div>
    </template>
  </MCard>
</template>

<style scoped lang="scss">
.scl {
  &__loading,
  &__empty {
    padding: 24px;
    text-align: center;
    color: #9ca3af;
    font-size: 14px;
  }

  &__tabs {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 0;
  }

  &__tab {
    padding: 8px 18px;
    font-size: 13px;
    font-weight: 500;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 6px 6px 0 0;
    color: #6b7280;
    transition:
      background 0.1s,
      color 0.1s;
    position: relative;
    bottom: -2px;
    border-bottom: 2px solid transparent;

    &:hover {
      background: #f3f4f6;
    }

    &--active {
      color: #6366f1;
      border-bottom-color: #6366f1;
      background: #f5f3ff;
      font-weight: 700;
    }
  }

  &__table-wrap {
    overflow-x: auto;
  }
}
</style>

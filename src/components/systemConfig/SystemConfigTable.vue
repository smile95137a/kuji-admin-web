<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import type { SystemConfigRes } from '@/services/adminSystemConfigService';
import SystemConfigEditor from './SystemConfigEditor.vue';

interface Props {
  configs: SystemConfigRes[];
  editingId: string | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'startEdit', id: string): void;
  (e: 'save', id: string, value: string): void;
  (e: 'cancel'): void;
}>();
</script>

<template>
  <div class="sct">
    <table class="sct__table">
      <thead>
        <tr>
          <th class="sct__th sct__th--key">設定鍵</th>
          <th class="sct__th sct__th--type">類型</th>
          <th class="sct__th sct__th--value">設定值</th>
          <th class="sct__th sct__th--desc">說明</th>
          <th class="sct__th sct__th--action">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="cfg in configs"
          :key="cfg.id"
          class="sct__tr"
          :class="{ 'sct__tr--editing': editingId === cfg.id }"
        >
          <td class="sct__td">
            <code class="sct__key">{{ cfg.configKey }}</code>
          </td>
          <td class="sct__td">
            <span :class="['sct__badge', `sct__badge--${cfg.configType.toLowerCase()}`]">
              {{ cfg.configType }}
            </span>
          </td>
          <td class="sct__td sct__td--value">
            <SystemConfigEditor
              :config="cfg"
              :is-editing="editingId === cfg.id"
              @save="(val) => emit('save', cfg.id, val)"
              @cancel="emit('cancel')"
            />
          </td>
          <td class="sct__td sct__td--desc">
            <span class="sct__desc">{{ cfg.description || '-' }}</span>
          </td>
          <td class="sct__td">
            <button
              v-if="cfg.isEditable && editingId !== cfg.id"
              class="sct__edit-btn"
              @click="emit('startEdit', cfg.id)"
            >
              編輯
            </button>
            <span
              v-else-if="!cfg.isEditable"
              class="sct__readonly-badge"
            >
              唯讀
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.sct {
  overflow-x: auto;

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  &__th {
    background: #f3f4f6;
    padding: 10px 12px;
    text-align: left;
    font-weight: 600;
    color: #374151;
    border-bottom: 1.5px solid #e5e7eb;
    white-space: nowrap;

    &--key   { width: 220px; }
    &--type  { width: 90px; }
    &--value { width: 280px; }
    &--desc  { width: auto; }
    &--action { width: 72px; text-align: center; }
  }

  &__tr {
    border-bottom: 1px solid #f3f4f6;
    transition: background 0.1s;

    &:hover { background: #fafafa; }
    &--editing { background: #faf5ff; }
  }

  &__td {
    padding: 10px 12px;
    vertical-align: top;

    &--value { min-width: 200px; }
    &--desc  { color: #6b7280; font-size: 12px; }
  }

  &__key {
    font-family: monospace;
    font-size: 12px;
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 3px;
    color: #4b5563;
  }

  &__badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;

    &--string  { background: #e0f2fe; color: #0369a1; }
    &--number  { background: #fef3c7; color: #92400e; }
    &--boolean { background: #dcfce7; color: #15803d; }
    &--json    { background: #fce7f3; color: #9d174d; }
  }

  &__desc {
    white-space: pre-wrap;
    word-break: break-word;
  }

  &__edit-btn {
    padding: 3px 10px;
    font-size: 12px;
    border-radius: 4px;
    cursor: pointer;
    border: 1px solid #6366f1;
    background: #fff;
    color: #6366f1;
    display: block;
    margin: 0 auto;

    &:hover { background: #eef2ff; }
  }

  &__readonly-badge {
    font-size: 11px;
    color: #9ca3af;
    display: block;
    text-align: center;
  }
}
</style>

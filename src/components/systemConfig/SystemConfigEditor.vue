<script setup lang="ts">
import { defineProps, defineEmits, ref, watch, computed } from 'vue';
import type { SystemConfigRes } from '@/services/adminSystemConfigService';

interface Props {
  config: SystemConfigRes;
  isEditing: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'save', value: string): void;
  (e: 'cancel'): void;
}>();

const editValue = ref(props.config.configValue);
const jsonError = ref('');
const jsonValid = ref(true);

// Auto-format JSON when editing starts
watch(() => props.isEditing, (val) => {
  if (val && props.config.configType === 'JSON') {
    try {
      editValue.value = JSON.stringify(JSON.parse(props.config.configValue), null, 2);
      jsonError.value = '';
      jsonValid.value = true;
    } catch {
      editValue.value = props.config.configValue;
      jsonValid.value = false;
    }
  } else if (!val) {
    editValue.value = props.config.configValue;
    jsonError.value = '';
    jsonValid.value = true;
  }
});

const validateJson = () => {
  if (props.config.configType !== 'JSON') return;
  try {
    JSON.parse(editValue.value);
    jsonError.value = '';
    jsonValid.value = true;
  } catch {
    jsonError.value = 'JSON 格式有誤';
    jsonValid.value = false;
  }
};

const formatJson = () => {
  try {
    editValue.value = JSON.stringify(JSON.parse(editValue.value), null, 2);
    jsonError.value = '';
    jsonValid.value = true;
  } catch {
    jsonError.value = '無法格式化：JSON 格式有誤';
    jsonValid.value = false;
  }
};

const prettyJson = computed(() => {
  if (props.config.configType !== 'JSON') return '';
  try {
    return JSON.stringify(JSON.parse(props.config.configValue), null, 2);
  } catch {
    return props.config.configValue;
  }
});

const handleSave = () => {
  if (props.config.configType === 'JSON') {
    try {
      JSON.parse(editValue.value);
    } catch {
      jsonError.value = 'JSON 格式有誤，請確認後再儲存';
      return;
    }
  }
  emit('save', editValue.value);
};

const handleCancel = () => {
  editValue.value = props.config.configValue;
  jsonError.value = '';
  jsonValid.value = true;
  emit('cancel');
};
</script>

<template>
  <div class="sce">
    <template v-if="!isEditing">
      <!-- JSON: pretty-print in <pre> -->
      <pre v-if="config.configType === 'JSON'" class="sce__json-preview">{{ prettyJson || '-' }}</pre>
      <span v-else class="sce__value">{{ config.configValue || '-' }}</span>
    </template>

    <template v-else>
      <!-- STRING / NUMBER -->
      <template v-if="config.configType === 'STRING' || config.configType === 'NUMBER'">
        <input
          v-model="editValue"
          :type="config.configType === 'NUMBER' ? 'number' : 'text'"
          class="sce__input"
          :disabled="!config.isEditable"
        />
      </template>

      <!-- BOOLEAN -->
      <template v-else-if="config.configType === 'BOOLEAN'">
        <select v-model="editValue" class="sce__select" :disabled="!config.isEditable">
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      </template>

      <!-- JSON -->
      <template v-else-if="config.configType === 'JSON'">
        <div class="sce__json-editor">
          <div class="sce__json-toolbar">
            <span :class="['sce__json-status', jsonValid ? 'sce__json-status--ok' : 'sce__json-status--err']">
              {{ jsonValid ? '✓ 格式正確' : '✗ 格式錯誤' }}
            </span>
            <button
              type="button"
              class="sce__fmt-btn"
              @click="formatJson"
              :disabled="!config.isEditable"
            >整理格式</button>
          </div>
          <textarea
            v-model="editValue"
            class="sce__textarea"
            :class="{ 'sce__textarea--err': !jsonValid && editValue.trim() !== '' }"
            rows="10"
            :disabled="!config.isEditable"
            @input="validateJson"
            spellcheck="false"
            autocomplete="off"
          />
          <span v-if="jsonError" class="sce__error">{{ jsonError }}</span>
        </div>
      </template>

      <div class="sce__actions" v-if="config.isEditable">
        <button
          class="sce__btn sce__btn--save"
          @click="handleSave"
          :disabled="config.configType === 'JSON' && !jsonValid"
        >儲存</button>
        <button class="sce__btn sce__btn--cancel" @click="handleCancel">取消</button>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.sce {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &__value {
    font-size: 13px;
    color: #374151;
    word-break: break-all;
  }

  &__json-preview {
    font-family: 'Cascadia Code', 'Fira Code', monospace;
    font-size: 11px;
    color: #374151;
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    padding: 8px 10px;
    margin: 0;
    white-space: pre;
    overflow-x: auto;
    max-height: 200px;
    overflow-y: auto;
    line-height: 1.5;
  }

  &__input,
  &__select {
    padding: 5px 8px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 13px;
    min-width: 180px;

    &:focus {
      outline: none;
      border-color: #6366f1;
    }

    &:disabled {
      background: #f3f4f6;
      color: #9ca3af;
    }
  }

  &__json-editor {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
  }

  &__json-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__json-status {
    font-size: 11px;
    font-weight: 600;

    &--ok  { color: #16a34a; }
    &--err { color: #dc2626; }
  }

  &__fmt-btn {
    padding: 2px 8px;
    font-size: 11px;
    border-radius: 4px;
    cursor: pointer;
    border: 1px solid #6366f1;
    background: #f5f3ff;
    color: #6366f1;

    &:hover:not(:disabled) { background: #ede9fe; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  &__textarea {
    padding: 8px 10px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 12px;
    font-family: 'Cascadia Code', 'Fira Code', monospace;
    width: 100%;
    resize: vertical;
    line-height: 1.6;
    transition: border-color 0.15s;

    &:focus {
      outline: none;
      border-color: #6366f1;
    }

    &:disabled {
      background: #f3f4f6;
      color: #9ca3af;
    }

    &--err {
      border-color: #dc2626;
      background: #fef2f2;

      &:focus { border-color: #dc2626; }
    }
  }

  &__error {
    font-size: 11px;
    color: #dc2626;
  }

  &__actions {
    display: flex;
    gap: 6px;
    margin-top: 4px;
  }

  &__btn {
    padding: 3px 10px;
    font-size: 12px;
    border-radius: 4px;
    cursor: pointer;
    border: 1px solid;

    &--save {
      background: #6366f1;
      color: #fff;
      border-color: #6366f1;

      &:hover:not(:disabled) { background: #4f46e5; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    &--cancel {
      background: #fff;
      color: #374151;
      border-color: #d1d5db;

      &:hover { background: #f3f4f6; }
    }
  }
}
</style>

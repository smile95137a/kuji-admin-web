<script setup lang="ts">
import { defineProps, defineEmits, ref } from 'vue';
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

const handleSave = () => {
  jsonError.value = '';
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
  emit('cancel');
};
</script>

<template>
  <div class="sce">
    <template v-if="!isEditing">
      <span class="sce__value">{{ config.configValue || '-' }}</span>
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
        <textarea
          v-model="editValue"
          class="sce__textarea"
          rows="4"
          :disabled="!config.isEditable"
        />
        <span v-if="jsonError" class="sce__error">{{ jsonError }}</span>
      </template>

      <div class="sce__actions" v-if="config.isEditable">
        <button class="sce__btn sce__btn--save" @click="handleSave">儲存</button>
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

  &__textarea {
    padding: 5px 8px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 12px;
    font-family: monospace;
    width: 100%;
    resize: vertical;

    &:focus {
      outline: none;
      border-color: #6366f1;
    }

    &:disabled {
      background: #f3f4f6;
      color: #9ca3af;
    }
  }

  &__error {
    font-size: 12px;
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

      &:hover { background: #4f46e5; }
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

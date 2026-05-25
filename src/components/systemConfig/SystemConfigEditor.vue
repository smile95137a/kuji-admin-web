<script setup lang="ts">
import { computed, defineEmits, defineProps, ref, watch } from 'vue';
import type { SystemConfigRes } from '@/services/adminSystemConfigService';

interface Props {
  config: SystemConfigRes;
  isEditing: boolean;
}

type BonusTierRow = {
  drawCount: string | number;
  bonus: string | number;
};

const DRAW_BONUS_TIERS_KEY = 'draw_bonus_tiers_json';

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'save', value: string): void;
  (e: 'cancel'): void;
}>();

const editValue = ref(props.config.configValue);
const jsonError = ref('');
const jsonValid = ref(true);
const bonusTierRows = ref<BonusTierRow[]>([]);
const bonusTierError = ref('');

const isEditable = computed(() => props.config.isEditable !== false);
const isBonusTierConfig = computed(
  () => props.config.configKey === DRAW_BONUS_TIERS_KEY
);

const toTrimmedString = (value: unknown): string => String(value ?? '').trim();

const parseBonusTierRows = (raw: string): BonusTierRow[] => {
  const text = String(raw || '').trim();
  if (!text) {
    return [{ drawCount: '', bonus: '' }];
  }

  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        const rows = parsed
          .map((item) => ({
            drawCount: String(item?.drawCount ?? '').trim(),
            bonus: String(item?.bonus ?? '').trim(),
          }))
          .filter((item) => item.drawCount || item.bonus);
        return rows.length ? rows : [{ drawCount: '', bonus: '' }];
      }
    } catch {
      return [{ drawCount: '', bonus: '' }];
    }
  }

  const strictRows: BonusTierRow[] = [];
  const strictPattern = /(\d+)\s*(?:抽|draws?)?\s*(?:[:=：])\s*(\d+)/gi;
  let strictMatch: RegExpExecArray | null;
  while ((strictMatch = strictPattern.exec(text)) !== null) {
    strictRows.push({
      drawCount: strictMatch[1] ?? '',
      bonus: strictMatch[2] ?? '',
    });
  }

  if (strictRows.length) {
    return strictRows;
  }

  const rows = text
    .split(/[\r\n,，;；]+/)
    .map((segment) => {
      const match = segment.trim().match(/(\d+)\D+(\d+)/);
      return {
        drawCount: match?.[1] ?? '',
        bonus: match?.[2] ?? '',
      };
    })
    .filter((item) => item.drawCount || item.bonus);

  return rows.length ? rows : [{ drawCount: '', bonus: '' }];
};

const serializeBonusTierRows = (): string =>
  bonusTierRows.value
    .map((row) => ({
      drawCount: toTrimmedString(row.drawCount),
      bonus: toTrimmedString(row.bonus),
    }))
    .filter((row) => row.drawCount || row.bonus)
    .map((row) => `${row.drawCount}:${row.bonus}`)
    .join('\n');

const validateJson = () => {
  if (props.config.configType !== 'JSON') return;

  try {
    JSON.parse(editValue.value);
    jsonError.value = '';
    jsonValid.value = true;
  } catch {
    jsonError.value = 'JSON 格式不正確';
    jsonValid.value = false;
  }
};

const formatJson = () => {
  try {
    editValue.value = JSON.stringify(JSON.parse(editValue.value), null, 2);
    jsonError.value = '';
    jsonValid.value = true;
  } catch {
    jsonError.value = '目前內容不是有效 JSON，無法格式化';
    jsonValid.value = false;
  }
};

const validateBonusTierRows = () => {
  if (!isBonusTierConfig.value) return true;

  const rows = bonusTierRows.value
    .map((row) => ({
      drawCount: toTrimmedString(row.drawCount),
      bonus: toTrimmedString(row.bonus),
    }))
    .filter((row) => row.drawCount || row.bonus);

  if (rows.length === 0) {
    bonusTierError.value = '請至少設定一組多抽紅利';
    return false;
  }

  for (const row of rows) {
    if (!/^\d+$/.test(row.drawCount) || Number(row.drawCount) <= 0) {
      bonusTierError.value = '抽數必須為大於 0 的整數';
      return false;
    }
    if (!/^\d+$/.test(row.bonus) || Number(row.bonus) <= 0) {
      bonusTierError.value = '紅利必須為大於 0 的整數';
      return false;
    }
  }

  bonusTierError.value = '';
  return true;
};

const addBonusTierRow = () => {
  bonusTierRows.value.push({ drawCount: '', bonus: '' });
};

const removeBonusTierRow = (index: number) => {
  bonusTierRows.value.splice(index, 1);
  if (bonusTierRows.value.length === 0) {
    bonusTierRows.value.push({ drawCount: '', bonus: '' });
  }
  validateBonusTierRows();
};

const prettyJson = computed(() => {
  if (props.config.configType !== 'JSON') return '';
  try {
    return JSON.stringify(JSON.parse(props.config.configValue), null, 2);
  } catch {
    return props.config.configValue;
  }
});

const bonusTierPreview = computed(() => {
  if (!isBonusTierConfig.value) return '';
  return parseBonusTierRows(props.config.configValue)
    .filter((row) => row.drawCount && row.bonus)
    .map((row) => `${row.drawCount}抽 = ${row.bonus}`)
    .join('、');
});

watch(
  () => props.isEditing,
  (isEditing) => {
    if (isEditing && isBonusTierConfig.value) {
      bonusTierRows.value = parseBonusTierRows(props.config.configValue);
      bonusTierError.value = '';
      return;
    }

    if (isEditing && props.config.configType === 'JSON') {
      try {
        editValue.value = JSON.stringify(
          JSON.parse(props.config.configValue),
          null,
          2
        );
        jsonError.value = '';
        jsonValid.value = true;
      } catch {
        editValue.value = props.config.configValue;
        jsonError.value = '';
        jsonValid.value = false;
      }
      return;
    }

    if (!isEditing) {
      editValue.value = props.config.configValue;
      jsonError.value = '';
      jsonValid.value = true;
      bonusTierRows.value = parseBonusTierRows(props.config.configValue);
      bonusTierError.value = '';
    }
  },
  { immediate: true }
);

const handleSave = () => {
  if (isBonusTierConfig.value) {
    if (!validateBonusTierRows()) return;
    emit('save', serializeBonusTierRows());
    return;
  }

  if (props.config.configType === 'JSON') {
    try {
      JSON.parse(editValue.value);
    } catch {
      jsonError.value = 'JSON 格式不正確，請先修正後再儲存';
      jsonValid.value = false;
      return;
    }
  }

  emit('save', editValue.value);
};

const handleCancel = () => {
  editValue.value = props.config.configValue;
  jsonError.value = '';
  jsonValid.value = true;
  bonusTierRows.value = parseBonusTierRows(props.config.configValue);
  bonusTierError.value = '';
  emit('cancel');
};
</script>

<template>
  <div class="sce">
    <template v-if="!isEditing">
      <span v-if="isBonusTierConfig" class="sce__value">
        {{ bonusTierPreview || '-' }}
      </span>
      <pre v-else-if="config.configType === 'JSON'" class="sce__json-preview">{{
        prettyJson || '-'
      }}</pre>
      <span v-else class="sce__value">{{ config.configValue || '-' }}</span>
    </template>

    <template v-else>
      <template v-if="isBonusTierConfig">
        <div class="sce__tier-editor">
          <div
            v-for="(row, index) in bonusTierRows"
            :key="`tier-${index}`"
            class="sce__tier-row"
          >
            <input
              v-model="row.drawCount"
              type="number"
              min="1"
              class="sce__input sce__input--tier"
              placeholder="抽數"
              :disabled="!isEditable"
              @input="validateBonusTierRows"
            />
            <span class="sce__tier-separator">抽</span>
            <input
              v-model="row.bonus"
              type="number"
              min="1"
              class="sce__input sce__input--tier"
              placeholder="紅利"
              :disabled="!isEditable"
              @input="validateBonusTierRows"
            />
            <span class="sce__tier-separator">紅利</span>
            <button
              type="button"
              class="sce__mini-btn sce__mini-btn--remove"
              :disabled="!isEditable"
              @click="removeBonusTierRow(index)"
            >
              刪除
            </button>
          </div>

          <div class="sce__tier-toolbar">
            <button
              type="button"
              class="sce__mini-btn"
              :disabled="!isEditable"
              @click="addBonusTierRow"
            >
              新增一組
            </button>
            <span class="sce__hint">每組填「抽數」和「紅利」，儲存時會自動整理格式</span>
          </div>

          <span v-if="bonusTierError" class="sce__error">{{ bonusTierError }}</span>
        </div>
      </template>

      <template
        v-else-if="
          config.configType === 'STRING' || config.configType === 'INTEGER'
        "
      >
        <input
          v-model="editValue"
          :type="config.configType === 'INTEGER' ? 'number' : 'text'"
          class="sce__input"
          :disabled="!isEditable"
        />
      </template>

      <template v-else-if="config.configType === 'BOOLEAN'">
        <select v-model="editValue" class="sce__select" :disabled="!isEditable">
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      </template>

      <template v-else-if="config.configType === 'JSON'">
        <div class="sce__json-editor">
          <div class="sce__json-toolbar">
            <span
              :class="[
                'sce__json-status',
                jsonValid ? 'sce__json-status--ok' : 'sce__json-status--err',
              ]"
            >
              {{ jsonValid ? 'JSON 格式正確' : 'JSON 格式錯誤' }}
            </span>
            <button
              type="button"
              class="sce__fmt-btn"
              :disabled="!isEditable"
              @click="formatJson"
            >
              格式化 JSON
            </button>
          </div>
          <textarea
            v-model="editValue"
            class="sce__textarea"
            :class="{ 'sce__textarea--err': !jsonValid && editValue.trim() !== '' }"
            rows="10"
            :disabled="!isEditable"
            spellcheck="false"
            autocomplete="off"
            @input="validateJson"
          />
          <span v-if="jsonError" class="sce__error">{{ jsonError }}</span>
        </div>
      </template>

      <div class="sce__actions" v-if="isEditable">
        <button
          class="sce__btn sce__btn--save"
          :disabled="(config.configType === 'JSON' && !jsonValid) || !!bonusTierError"
          @click="handleSave"
        >
          儲存
        </button>
        <button class="sce__btn sce__btn--cancel" @click="handleCancel">
          取消
        </button>
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

    &--tier {
      min-width: 96px;
    }
  }

  &__tier-editor,
  &__json-editor {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
  }

  &__tier-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__tier-toolbar,
  &__json-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__tier-separator,
  &__hint {
    font-size: 12px;
    color: #6b7280;
  }

  &__json-status {
    font-size: 11px;
    font-weight: 600;

    &--ok {
      color: #16a34a;
    }

    &--err {
      color: #dc2626;
    }
  }

  &__fmt-btn,
  &__mini-btn {
    padding: 4px 8px;
    font-size: 12px;
    border-radius: 4px;
    cursor: pointer;
    border: 1px solid #d1d5db;
    background: #fff;
    color: #374151;

    &:hover:not(:disabled) {
      background: #f9fafb;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__fmt-btn {
    border-color: #6366f1;
    background: #f5f3ff;
    color: #6366f1;
  }

  &__mini-btn--remove {
    color: #b91c1c;
    border-color: #fecaca;
    background: #fff5f5;
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
    }

    &--cancel {
      background: #fff;
      color: #374151;
      border-color: #d1d5db;
    }
  }
}
</style>

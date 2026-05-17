<script setup lang="ts">
import { ref, watch } from 'vue';

import FormDateRangeField from '@/components/common/FormDateRangeField.vue';
import { useReportFilter, type ReportPreset } from '@/composables/useReportFilter';

interface Props {
  showStoreFilter?: boolean;
  storeOptions?: { label: string; value: string }[];
  storeFilterDisabled?: boolean;
  selectedStoreId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  showStoreFilter: false,
  storeOptions: () => [],
  storeFilterDisabled: false,
  selectedStoreId: '',
});

const emit = defineEmits<{
  (e: 'update:filter', filter: {
    startDate: string;
    endDate: string;
    storeId?: string;
  }): void;
}>();

const { startDate, endDate, preset, setPreset, setCustomRange } = useReportFilter();
const selectedStoreId = ref('');

watch(
  () => props.selectedStoreId,
  (value) => {
    selectedStoreId.value = value || '';
  },
  { immediate: true },
);

const presets: { label: string; value: ReportPreset }[] = [
  { label: '今天', value: 'today' },
  { label: '本週', value: 'thisWeek' },
  { label: '本月', value: 'thisMonth' },
  { label: '上月', value: 'lastMonth' },
  { label: '自訂', value: 'custom' },
];

function applyPreset(nextPreset: ReportPreset) {
  setPreset(nextPreset);
  if (nextPreset !== 'custom') {
    emitFilter();
  }
}

function onCustomDateChange() {
  setCustomRange(startDate.value, endDate.value);
}

function emitFilter() {
  emit('update:filter', {
    startDate: startDate.value,
    endDate: endDate.value,
    ...(props.showStoreFilter
      ? { storeId: selectedStoreId.value || undefined }
      : {}),
  });
}
</script>

<template>
  <div class="rfb">
    <div class="rfb__presets">
      <button
        v-for="item in presets"
        :key="item.value"
        type="button"
        class="rfb__preset-btn"
        :class="{ 'rfb__preset-btn--active': preset === item.value }"
        @click="applyPreset(item.value)"
      >
        {{ item.label }}
      </button>
    </div>

    <div v-if="preset === 'custom'" class="rfb__range">
      <FormDateRangeField
        label="日期區間"
        v-model:start="startDate"
        v-model:end="endDate"
        @update:start="onCustomDateChange"
        @update:end="onCustomDateChange"
      />
    </div>

    <div v-if="showStoreFilter" class="rfb__store">
      <label class="rfb__store-label">店家</label>
      <select
        v-model="selectedStoreId"
        class="rfb__select"
        :disabled="storeFilterDisabled"
      >
        <option value="">全部店家</option>
        <option
          v-for="option in storeOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </div>

    <button type="button" class="rfb__query-btn" @click="emitFilter">
      查詢
    </button>
  </div>
</template>

<style scoped lang="scss">
.rfb {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f8fafc;

  &__presets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__preset-btn {
    min-height: 36px;
    padding: 6px 14px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: #fff;
    color: #374151;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;

    &--active {
      border-color: #4f46e5;
      background: #4f46e5;
      color: #fff;
    }
  }

  &__range {
    min-width: min(100%, 420px);
    flex: 1 1 320px;
  }

  &__store {
    min-width: 180px;
  }

  &__store-label {
    display: block;
    margin-bottom: 6px;
    color: #374151;
    font-size: 14px;
    font-weight: 600;
  }

  &__select {
    width: 100%;
    min-height: 38px;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: #fff;
    color: #111827;
  }

  &__query-btn {
    min-height: 38px;
    padding: 8px 18px;
    border: 1px solid #4f46e5;
    border-radius: 8px;
    background: #4f46e5;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }
}

@media (max-width: 640px) {
  .rfb {
    align-items: stretch;

    &__range,
    &__store,
    &__query-btn {
      width: 100%;
    }
  }
}
</style>

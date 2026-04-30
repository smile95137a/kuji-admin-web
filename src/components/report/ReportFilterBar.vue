<script setup lang="ts">
import { ref, watch } from 'vue';
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
  { immediate: true }
);

const presets: { label: string; value: ReportPreset }[] = [
  { label: '今天', value: 'today' },
  { label: '本週', value: 'thisWeek' },
  { label: '本月', value: 'thisMonth' },
  { label: '上個月', value: 'lastMonth' },
  { label: '自訂', value: 'custom' },
];

function applyPreset(p: ReportPreset) {
  setPreset(p);
  if (p !== 'custom') emitFilter();
}

function onCustomDateChange() {
  setCustomRange(startDate.value, endDate.value);
}

function emitFilter() {
  emit('update:filter', {
    startDate: startDate.value,
    endDate: endDate.value,
    ...(props.showStoreFilter ? { storeId: selectedStoreId.value || undefined } : {}),
  });
}
</script>

<template>
  <div class="rfb">
    <!-- Preset Buttons -->
    <div class="rfb__presets">
      <button
        v-for="p in presets"
        :key="p.value"
        class="rfb__preset-btn"
        :class="{ 'rfb__preset-btn--active': preset === p.value }"
        @click="applyPreset(p.value)"
      >
        {{ p.label }}
      </button>
    </div>

    <!-- Custom Date Range -->
    <div v-if="preset === 'custom'" class="rfb__custom">
      <input
        type="date"
        v-model="startDate"
        class="rfb__date-input"
        @change="onCustomDateChange"
      />
      <span class="rfb__sep">~</span>
      <input
        type="date"
        v-model="endDate"
        class="rfb__date-input"
        @change="onCustomDateChange"
      />
    </div>

    <!-- Store Filter (Admin only) -->
    <div v-if="showStoreFilter" class="rfb__store">
      <select
        v-model="selectedStoreId"
        class="rfb__select"
        :disabled="storeFilterDisabled"
      >
        <option value="">全部店家</option>
        <option
          v-for="opt in storeOptions"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
    </div>

    <!-- Query Button -->
    <button class="rfb__query-btn" @click="emitFilter">查詢</button>
  </div>
</template>

<style scoped lang="scss">
.rfb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;

  &__presets {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  &__preset-btn {
    padding: 5px 12px;
    font-size: 13px;
    border-radius: 5px;
    border: 1px solid #d1d5db;
    background: #fff;
    cursor: pointer;
    color: #374151;
    transition: all 0.1s;

    &:hover { background: #f3f4f6; }

    &--active {
      background: #6366f1;
      border-color: #6366f1;
      color: #fff;
    }
  }

  &__custom {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__date-input {
    padding: 5px 8px;
    border: 1px solid #d1d5db;
    border-radius: 5px;
    font-size: 13px;
    color: #374151;

    &:focus { outline: none; border-color: #6366f1; }
  }

  &__sep {
    font-size: 13px;
    color: #9ca3af;
  }

  &__store {
    margin-left: 4px;
  }

  &__select {
    padding: 5px 8px;
    border: 1px solid #d1d5db;
    border-radius: 5px;
    font-size: 13px;
    color: #374151;
    min-width: 160px;

    &:disabled {
      background: #f3f4f6;
      color: #6b7280;
      cursor: not-allowed;
    }

    &:focus { outline: none; border-color: #6366f1; }
  }

  &__query-btn {
    padding: 5px 16px;
    font-size: 13px;
    border-radius: 5px;
    background: #6366f1;
    color: #fff;
    border: none;
    cursor: pointer;
    font-weight: 600;

    &:hover { background: #4f46e5; }
  }
}
</style>

<template>
  <div class="business-hours-editor">
    <div class="business-hours-editor__timezone">
      <FormInput
        label="時區"
        :model-value="localValue.tz"
        :error="error"
        placeholder="Asia/Taipei"
        @update:model-value="updateTimezone"
      />
    </div>

    <div class="business-hours-editor__grid">
      <div
        v-for="schedule in localValue.schedules"
        :key="schedule.day"
        class="business-hours-editor__row"
      >
        <div class="business-hours-editor__day">{{ dayLabelMap[schedule.day] }}</div>

        <FormCheckbox
          :model-value="schedule.closed"
          label="公休"
          @update:model-value="(checked) => updateClosed(schedule.day, checked)"
        />

        <FormInput
          label="開始"
          type="time"
          :model-value="schedule.open ?? ''"
          :disabled="schedule.closed"
          @update:model-value="(value) => updateTime(schedule.day, 'open', value)"
        />

        <FormInput
          label="結束"
          type="time"
          :model-value="schedule.close ?? ''"
          :disabled="schedule.closed"
          @update:model-value="(value) => updateTime(schedule.day, 'close', value)"
        />
      </div>
    </div>

    <p class="business-hours-editor__hint">
      未公休的日期需填開始與結束時間，格式為 HH:mm。
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import FormInput from '@/components/common/FormInput.vue';
import FormCheckbox from '@/components/common/FormCheckbox.vue';

type WeekDay = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

interface BusinessHourSchedule {
  day: WeekDay;
  open?: string;
  close?: string;
  closed: boolean;
}

interface BusinessHoursStructured {
  schedules: BusinessHourSchedule[];
  exceptions?: Array<Record<string, any>>;
  tz?: string;
}

const props = defineProps<{
  modelValue?: BusinessHoursStructured | null;
  error?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: BusinessHoursStructured): void;
}>();

const dayOrder: WeekDay[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const dayLabelMap: Record<WeekDay, string> = {
  MON: '週一',
  TUE: '週二',
  WED: '週三',
  THU: '週四',
  FRI: '週五',
  SAT: '週六',
  SUN: '週日',
};

const createDefaultValue = (): BusinessHoursStructured => ({
  schedules: dayOrder.map((day) => ({
    day,
    open: '',
    close: '',
    closed: false,
  })),
  exceptions: [],
  tz: 'Asia/Taipei',
});

const normalizeValue = (
  value?: BusinessHoursStructured | null,
): BusinessHoursStructured => {
  const source = value ?? createDefaultValue();
  const scheduleMap = new Map(
    (Array.isArray(source.schedules) ? source.schedules : []).map((item) => [
      item.day,
      item,
    ]),
  );

  return {
    schedules: dayOrder.map((day) => {
      const existing = scheduleMap.get(day);
      return {
        day,
        open: existing?.open ?? '',
        close: existing?.close ?? '',
        closed: existing?.closed ?? false,
      };
    }),
    exceptions: Array.isArray(source.exceptions) ? source.exceptions : [],
    tz: source.tz || 'Asia/Taipei',
  };
};

const localValue = computed(() => normalizeValue(props.modelValue));

const updateValue = (updater: (value: BusinessHoursStructured) => BusinessHoursStructured) => {
  emit('update:modelValue', updater(normalizeValue(props.modelValue)));
};

const updateTimezone = (value: string | number | null) => {
  updateValue((current) => ({
    ...current,
    tz: String(value ?? '').trim() || 'Asia/Taipei',
  }));
};

const updateClosed = (day: WeekDay, checked: boolean | string | number | null) => {
  updateValue((current) => ({
    ...current,
    schedules: current.schedules.map((item) =>
      item.day === day
        ? {
            ...item,
            closed: Boolean(checked),
            open: checked ? '' : item.open ?? '',
            close: checked ? '' : item.close ?? '',
          }
        : item,
    ),
  }));
};

const updateTime = (
  day: WeekDay,
  key: 'open' | 'close',
  value: string | number | null,
) => {
  updateValue((current) => ({
    ...current,
    schedules: current.schedules.map((item) =>
      item.day === day
        ? {
            ...item,
            [key]: String(value ?? '').trim(),
          }
        : item,
    ),
  }));
};
</script>

<style scoped lang="scss">
.business-hours-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__timezone {
    max-width: 240px;
  }

  &__grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__row {
    display: grid;
    grid-template-columns: 64px 84px minmax(0, 1fr) minmax(0, 1fr);
    gap: 12px;
    align-items: end;
  }

  &__day {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    padding-bottom: 10px;
  }

  &__hint {
    margin: 0;
    font-size: 12px;
    color: #6b7280;
  }
}

@media (max-width: 767px) {
  .business-hours-editor {
    &__row {
      grid-template-columns: 1fr;
      gap: 8px;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    &__day {
      padding-bottom: 0;
    }
  }
}
</style>

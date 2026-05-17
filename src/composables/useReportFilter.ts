// src/composables/useReportFilter.ts
import { ref, computed } from 'vue';

export type ReportPreset = 'today' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'custom';

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function calcRange(preset: ReportPreset): { start: string; end: string } {
  const now = new Date();
  const today = toDateStr(now);

  if (preset === 'today') {
    return { start: today, end: today };
  }

  if (preset === 'thisWeek') {
    const day = now.getDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day; // Mon start
    const mon = new Date(now);
    mon.setDate(now.getDate() + diff);
    return { start: toDateStr(mon), end: today };
  }

  if (preset === 'thisMonth') {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: toDateStr(first), end: today };
  }

  if (preset === 'lastMonth') {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start: toDateStr(first), end: toDateStr(last) };
  }

  // custom — caller must call setCustomRange
  return { start: '', end: '' };
}

export function useReportFilter() {
  const preset = ref<ReportPreset>('today');
  const startDate = ref('');
  const endDate = ref('');

  // Initialise with default preset
  const { start, end } = calcRange(preset.value);
  startDate.value = start;
  endDate.value = end;

  function setPreset(p: ReportPreset) {
    preset.value = p;
    if (p !== 'custom') {
      const range = calcRange(p);
      startDate.value = range.start;
      endDate.value = range.end;
    }
  }

  function setCustomRange(start: string, end: string) {
    preset.value = 'custom';
    startDate.value = start;
    endDate.value = end;
  }

  const dateRange = computed(() => ({
    startDate: startDate.value,
    endDate: endDate.value,
  }));

  return {
    startDate,
    endDate,
    preset,
    dateRange,
    setPreset,
    setCustomRange,
  };
}

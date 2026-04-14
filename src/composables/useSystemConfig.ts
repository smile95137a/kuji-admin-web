// src/composables/useSystemConfig.ts
import { ref, computed } from 'vue';
import {
  getSystemConfigs,
  createSystemConfig,
  updateSystemConfig,
  deleteSystemConfig,
  type SystemConfigRes,
  type SystemConfigCreateReq,
} from '@/services/adminSystemConfigService';

export function useSystemConfig() {
  // ─── state ───────────────────────────────────────────────────────────
  const configs = ref<SystemConfigRes[]>([]);
  const isLoading = ref(false);
  const editingId = ref<string | null>(null);

  // ─── computed ─────────────────────────────────────────────────────────
  const groupedConfigs = computed((): Record<string, SystemConfigRes[]> => {
    return configs.value.reduce(
      (acc, cfg) => {
        const g = cfg.group || 'DEFAULT';
        if (!acc[g]) acc[g] = [];
        acc[g].push(cfg);
        return acc;
      },
      {} as Record<string, SystemConfigRes[]>
    );
  });

  const groups = computed((): string[] =>
    Array.from(new Set(configs.value.map((c) => c.group || 'DEFAULT')))
  );

  // ─── methods ──────────────────────────────────────────────────────────
  async function fetchConfigs(group?: string) {
    isLoading.value = true;
    try {
      const res = await getSystemConfigs(group);
      const data = (res as any)?.data ?? res;
      configs.value = Array.isArray(data) ? data : [];
    } finally {
      isLoading.value = false;
    }
  }

  async function updateConfig(id: string, configValue: string) {
    const res = await updateSystemConfig(id, { configValue });
    const updated = (res as any)?.data ?? res;
    if (updated?.id) {
      const idx = configs.value.findIndex((c) => c.id === id);
      if (idx !== -1) configs.value[idx] = { ...configs.value[idx], ...updated };
    }
  }

  async function createConfig(req: SystemConfigCreateReq) {
    const res = await createSystemConfig(req);
    const created = (res as any)?.data ?? res;
    if (created?.id) configs.value.push(created);
  }

  async function deleteConfig(id: string) {
    await deleteSystemConfig(id);
    configs.value = configs.value.filter((c) => c.id !== id);
  }

  function startEdit(id: string) {
    editingId.value = id;
  }

  function cancelEdit() {
    editingId.value = null;
  }

  return {
    configs,
    isLoading,
    editingId,
    groupedConfigs,
    groups,
    fetchConfigs,
    updateConfig,
    createConfig,
    deleteConfig,
    startEdit,
    cancelEdit,
  };
}

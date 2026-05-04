<script setup lang="ts">
import { provide, computed } from 'vue';

const props = defineProps<{
  activeTab: string;
}>();

const emit = defineEmits<{
  (e: 'update:active-tab', value: string): void;
}>();

// 讓 Tab.vue 可以 inject
const setActiveTab = (name: string) => {
  emit('update:active-tab', name);
};

provide(
  'activeTab',
  computed(() => props.activeTab),
);
provide('setActiveTab', setActiveTab);
</script>

<template>
  <div class="tabs">
    <div class="tab-headers">
      <slot
        name="headers"
        :activeTab="props.activeTab"
        :setActiveTab="setActiveTab"
      />
    </div>

    <div class="tab-content">
      <slot />
    </div>
  </div>
</template>

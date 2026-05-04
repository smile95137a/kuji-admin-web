<script setup lang="ts">
import { inject, onMounted, Ref, computed } from 'vue';

const props = withDefaults(
  defineProps<{
    name: string;
    renderMode?: 'if' | 'show';
  }>(),
  {
    renderMode: 'if',
  },
);

const activeTab = inject<Ref<string>>('activeTab')!;
const setActiveTab = inject<(name: string) => void>('setActiveTab')!;

const isActive = computed(() => activeTab.value === props.name);

onMounted(() => {
  if (!activeTab.value) {
    setActiveTab(props.name);
  }
});
</script>

<template>
  <div
    v-if="renderMode === 'if' ? isActive : true"
    v-show="renderMode === 'show' ? isActive : true"
  >
    <slot></slot>
  </div>
</template>

<!-- src/components/common/FormSection.vue -->
<template>
  <section class="form-section">
    <div v-if="title" class="form-section__title">
      {{ title }}
    </div>

    <div class="form-section__content">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
}>();
</script>

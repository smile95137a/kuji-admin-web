<!-- src/components/common/FormSection.vue -->
<template>
  <section class="form-section">
    <div v-if="title || subtitle" class="form-section__header">
      <div v-if="title" class="form-section__title">
        {{ title }}
      </div>

      <p v-if="subtitle" class="form-section__subtitle">
        {{ subtitle }}
      </p>
    </div>

    <div class="form-section__content">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  subtitle?: string;
}>();
</script>

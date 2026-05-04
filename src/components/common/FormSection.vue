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

<style scoped lang="scss">
.form-section {
  padding: 12px 0 4px;
  margin-top: 8px;

  & + & {
    margin-top: 16px;
    padding-top: 18px;
    border-top: 1px solid #e5e7eb;
  }

  &__title {
    margin: 0 6px 8px;
    padding-left: 10px;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.4;
    color: #374151;
    border-left: 4px solid #9ca3af;
  }

  &__content {
    width: 100%;
  }
}
</style>

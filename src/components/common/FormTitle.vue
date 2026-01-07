<template>
  <div class="flex m-b-16" :class="wrapperClass">
    <p class="form__text form__text--title" :class="titleClass">
      <slot>{{ title }}</slot>
    </p>
    <div v-if="$slots.right" class="m-l-auto">
      <slot name="right" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  wrapperClass?: string | string[] | Record<string, boolean>;
  titleClass?: string | string[] | Record<string, boolean>;
}>();
</script>

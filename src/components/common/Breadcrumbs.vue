<template>
  <nav class="breadcrumbs" aria-label="breadcrumb">
    <ol class="breadcrumbs__list">
      <li
        v-for="(item, index) in breadcrumbs.items"
        :key="index"
        class="breadcrumbs__item"
      >
        <template v-if="index < lastIndex">
          <RouterLink :to="item.to" class="breadcrumbs__link">
            {{ item.label }}
          </RouterLink>

          <!-- 改用 FontAwesomeIcon -->
          <font-awesome-icon
            icon="chevron-right"
            class="breadcrumbs__separator"
          />
        </template>

        <template v-else>
          <span class="breadcrumbs__current">{{ item.label }}</span>
        </template>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useBreadcrumbsStore } from '@/stores';

const breadcrumbs = useBreadcrumbsStore();
const lastIndex = computed(() => breadcrumbs.items.length - 1);
</script>

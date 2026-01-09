<!-- src/components/menu/MenuTreeNode.vue -->
<template>
  <li class="menuTreeNode">
    <div class="menuTreeNode__row">
      <span
        class="menuTreeNode__name clickable"
        @click="$emit('edit', node.id)"
      >
        {{ node.name || node.title || node.code || '-' }}
      </span>
      <span class="menuTreeNode__meta">
        {{ node.path ? `(${node.path})` : '' }}
      </span>
    </div>

    <ul
      v-if="node.children && node.children.length"
      class="menuTreeNode__children"
    >
      <MenuTreeNode
        v-for="c in node.children"
        :key="c.id"
        :node="c"
        @edit="$emit('edit', $event)"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
defineProps<{ node: any }>();
defineEmits<{ (e: 'edit', id: string): void }>();
</script>

<style scoped lang="scss">
.menuTreeNode {
  margin: 6px 0;

  &__row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  &__name {
    font-weight: 600;
  }

  &__meta {
    color: #6b7280;
    font-size: 12px;
  }

  &__children {
    padding-left: 18px;
    margin-top: 6px;
  }
}
</style>

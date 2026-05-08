<!-- src/components/menu/MenuTreeNode.vue -->
<template>
  <li
    class="menu-tree-node"
    :class="{ 'menu-tree-node--dragging': draggingId === node.id }"
    draggable="true"
    @dragstart="handleDragStart"
    @dragover.prevent
    @drop="handleDrop"
    @dragend="handleDragEnd"
  >
    <div class="menu-tree-node__row">
      <div class="menu-tree-node__main">
        <label class="menu-tree-node__check">
          <input
            type="checkbox"
            :checked="isNodeSelected?.(node.id)"
            :disabled="Boolean(node.children?.length)"
            :title="
              node.children?.length
                ? '此選單仍有子選單，請先刪除子選單'
                : '勾選刪除'
            "
            @change.stop="toggleNodeSelected?.(node)"
            @click.stop
          />
        </label>

        <span class="menu-tree-node__handle">⠿</span>

        <span class="menu-tree-node__order">
          {{ node.orderNum ?? '-' }}
        </span>

        <span class="menu-tree-node__name">
          {{ node.name || '-' }}
        </span>

        <span class="menu-tree-node__code">
          {{ node.code || '-' }}
        </span>
      </div>

      <div class="menu-tree-node__actions">
        <button
          type="button"
          class="menu-tree-node__delete"
          :disabled="Boolean(node.children?.length)"
          :title="
            node.children?.length
              ? '此選單仍有子選單，請先刪除子選單'
              : '刪除選單'
          "
          @click.stop="deleteNode?.(node)"
        >
          <font-awesome-icon icon="fa-trash" class="m-r-4" />
          刪除
        </button>
      </div>
    </div>

    <ul v-if="node.children?.length" class="menu-tree-node__children">
      <MenuTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import { inject } from 'vue';

const props = defineProps<{
  node: any;
}>();

type MenuTreeContext = {
  draggingId: any;
  draggingParentId: any;
  selectedIds?: any;
  onDragStart: (id: string, parentId: string | null) => void;
  onDragEnd: () => void;
  onReorder: (fromId: string, toId: string) => void;
  deleteNode?: (node: any) => void | Promise<void>;
  isNodeSelected?: (nodeId: string) => boolean;
  toggleNodeSelected?: (node: any) => void;
};

const context = inject<MenuTreeContext>('menuTreeReorder');

const draggingId = context?.draggingId;
const onDragStart = context?.onDragStart;
const onDragEnd = context?.onDragEnd;
const onReorder = context?.onReorder;
const deleteNode = context?.deleteNode;
const isNodeSelected = context?.isNodeSelected;
const toggleNodeSelected = context?.toggleNodeSelected;

const handleDragStart = () => {
  onDragStart?.(props.node.id, props.node.parentId ?? null);
};

const handleDragEnd = () => {
  onDragEnd?.();
};

const handleDrop = () => {
  if (!draggingId?.value) return;

  onReorder?.(draggingId.value, props.node.id);
};
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as tokens;

.menu-tree-node {
  margin-bottom: 8px;
  list-style: none;

  &--dragging {
    opacity: 0.5;
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
    border-radius: 12px;
    background: tokens.$form-bg;
  }

  &__main {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  &__check {
    display: inline-flex;
    align-items: center;
    cursor: pointer;

    input {
      width: 16px;
      height: 16px;
      cursor: pointer;

      &:disabled {
        cursor: not-allowed;
        opacity: 0.45;
      }
    }
  }

  &__handle {
    cursor: grab;
    color: tokens.$form-muted;
    font-size: 16px;
  }

  &__order {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    min-height: 24px;
    padding: 2px 8px;
    border-radius: 999px;
    background: color.mix(tokens.$brand-light, #fff, 18%);
    color: tokens.$brand-dark;
    font-size: 12px;
    font-weight: 800;
  }

  &__name {
    color: tokens.$form-text;
    font-size: 14px;
    font-weight: 800;
  }

  &__code {
    color: tokens.$form-muted;
    font-size: 12px;
  }

  &__actions {
    flex: 0 0 auto;
  }

  &__delete {
    display: inline-flex;
    align-items: center;
    min-height: 30px;
    padding: 4px 10px;
    border: none;
    border-radius: 999px;
    background: #fee2e2;
    color: #991b1b;
    cursor: pointer;
    font-size: 12px;
    font-weight: 800;

    &:hover:not(:disabled) {
      opacity: 0.85;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.45;
    }
  }

  &__children {
    margin-top: 8px;
    margin-left: 28px;
    padding-left: 14px;
    border-left: 1px dashed color.mix(tokens.$form-border, #fff, 35%);
    list-style: none;
  }
}

@media (max-width: 640px) {
  .menu-tree-node {
    &__row {
      align-items: flex-start;
      flex-direction: column;
    }

    &__main {
      flex-wrap: wrap;
    }

    &__actions {
      width: 100%;
    }
  }
}
</style>

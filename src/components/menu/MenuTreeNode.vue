<!-- src/components/menu/MenuTreeNode.vue -->
<template>
  <li
    class="menuTreeNode"
    :class="{
      'menuTreeNode--dragging': isDraggingThis,
      'menuTreeNode--over': isDragOver,
    }"
    draggable="true"
    @dragstart.stop="onDragStart"
    @dragend.stop="onDragEnd"
    @dragover.stop.prevent="onDragOver"
    @dragleave.stop="onDragLeave"
    @drop.stop.prevent="onDrop"
  >
    <div class="menuTreeNode__row">
      <span class="menuTreeNode__handle" title="拖曳排序">⠿</span>
      <span class="menuTreeNode__order">{{ node.orderNum ?? '-' }}</span>
      <span class="menuTreeNode__name">
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
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue';

const props = defineProps<{ node: any }>();

const { draggingId, draggingParentId, onDragStart: ctxDragStart, onDragEnd: ctxDragEnd, onReorder } =
  inject<any>('menuTreeReorder');

/* -------------------------------------------------------
 * 當前節點是否正在被拖曳
 * ------------------------------------------------------- */
const isDraggingThis = computed(() => draggingId.value === props.node.id);

/* -------------------------------------------------------
 * hover 狀態（只有同 parent 才視為有效）
 * ------------------------------------------------------- */
const isHovering = ref(false);

const isDragOver = computed(() => {
  if (!isHovering.value) return false;
  if (!draggingId.value || draggingId.value === props.node.id) return false;
  // 同 parentId 才視為有效放置目標
  const myParent = props.node.parentId ?? null;
  return myParent === draggingParentId.value;
});

/* -------------------------------------------------------
 * Drag handlers
 * ------------------------------------------------------- */
const onDragStart = (e: DragEvent) => {
  ctxDragStart(props.node.id, props.node.parentId ?? null);
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', props.node.id);
  }
};

const onDragEnd = () => {
  ctxDragEnd();
  isHovering.value = false;
};

const onDragOver = () => {
  if (draggingId.value && draggingId.value !== props.node.id) {
    isHovering.value = true;
  }
};

const onDragLeave = () => {
  isHovering.value = false;
};

const onDrop = () => {
  isHovering.value = false;
  const fromId = draggingId.value;
  if (!fromId || fromId === props.node.id) return;
  onReorder(fromId, props.node.id);
};
</script>

<style scoped lang="scss">
.menuTreeNode {
  margin: 4px 0;
  list-style: none;
  border-radius: 6px;
  transition: opacity 0.15s, background 0.15s;

  &--dragging {
    opacity: 0.4;
  }

  &--over > &__row {
    background: #eff6ff;
    border-color: #3b82f6;
    outline: 2px dashed #3b82f6;
    border-radius: 4px;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 6px;
    border-radius: 4px;
    cursor: default;

    &:hover {
      background: #f9fafb;
    }
  }

  &__handle {
    cursor: grab;
    color: #9ca3af;
    font-size: 16px;
    letter-spacing: 1px;
    user-select: none;
    flex-shrink: 0;

    &:active {
      cursor: grabbing;
    }
  }

  &__order {
    min-width: 24px;
    font-size: 11px;
    color: #6b7280;
    background: #f3f4f6;
    border-radius: 4px;
    text-align: center;
    padding: 1px 5px;
    flex-shrink: 0;
  }

  &__name {
    font-weight: 600;
    flex-shrink: 0;
  }

  &__meta {
    color: #6b7280;
    font-size: 12px;
  }

  &__children {
    padding-left: 28px;
    margin-top: 4px;
  }
}
</style>

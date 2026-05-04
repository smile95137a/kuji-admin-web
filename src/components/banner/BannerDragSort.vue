<!-- src/components/banner/BannerDragSort.vue -->
<template>
  <div class="banner-drag-sort">
    <div class="banner-drag-sort__header">
      <div class="banner-drag-sort__title-wrap">
        <div class="banner-drag-sort__icon">
          <font-awesome-icon icon="fa-arrow-up-wide-short" />
        </div>

        <div>
          <p class="banner-drag-sort__title">{{ title }}</p>
          <p class="banner-drag-sort__desc">
            {{ description }}
          </p>
        </div>
      </div>

      <div class="banner-drag-sort__actions">
        <MButton
          size="sm"
          @click="resetSort"
          :disabled="saving || localList.length === 0"
        >
          <font-awesome-icon icon="fa-rotate-left" class="m-r-4" />
          還原
        </MButton>

        <MButton
          size="sm"
          @click="submitSort"
          :disabled="saving || localList.length === 0"
        >
          <font-awesome-icon icon="fa-floppy-disk" class="m-r-4" />
          {{ saving ? '儲存中...' : '儲存排序' }}
        </MButton>

        <MButton
          size="sm"
          class="mbtn--red"
          @click="emit('cancel')"
          :disabled="saving"
        >
          <font-awesome-icon icon="fa-xmark" class="m-r-4" />
          離開
        </MButton>
      </div>
    </div>

    <div v-if="localList.length === 0" class="banner-drag-sort__empty">
      <font-awesome-icon icon="fa-inbox" class="banner-drag-sort__empty-icon" />
      <p>目前沒有可排序的 Banner</p>
    </div>

    <ul v-else class="banner-drag-sort__list">
      <li
        v-for="(item, idx) in localList"
        :key="item.id"
        class="banner-drag-sort__item"
        :class="{
          'banner-drag-sort__item--dragging': dragFromIdx === idx,
          'banner-drag-sort__item--over': dragOverIdx === idx,
        }"
        draggable="true"
        @dragstart="onDragStart(idx)"
        @dragover.prevent="onDragOver(idx)"
        @drop.prevent="onDrop(idx)"
        @dragend="onDragEnd"
      >
        <div class="banner-drag-sort__rank">
          {{ idx + 1 }}
        </div>

        <div class="banner-drag-sort__handle" title="拖曳排序">
          <font-awesome-icon icon="fa-grip-vertical" />
        </div>

        <div class="banner-drag-sort__thumb-wrap">
          <img
            v-if="item.imageUrl"
            :src="resolveImageUrl(item.imageUrl)"
            alt="banner"
            class="banner-drag-sort__thumb"
          />

          <div
            v-else
            class="banner-drag-sort__thumb banner-drag-sort__thumb--empty"
          >
            <font-awesome-icon icon="fa-image" />
          </div>
        </div>

        <div class="banner-drag-sort__main">
          <p class="banner-drag-sort__banner-title">
            {{ item.title || '-' }}
          </p>

          <div class="banner-drag-sort__meta">
            <span>
              <font-awesome-icon icon="fa-store" class="m-r-4" />
              {{ item.storeName || item.storeId || '未指定店家' }}
            </span>

            <span>
              <font-awesome-icon icon="fa-clock" class="m-r-4" />
              {{ formatDateTime(item.updatedAt) }}
            </span>
          </div>
        </div>

        <div class="banner-drag-sort__status">
          <span :class="statusBadgeClass(item.status)">
            {{ item.statusName || statusText(item.status) }}
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

import MButton from '@/components/common/MButton.vue';

type BannerSortItem = {
  id: string;
  title?: string;
  imageUrl?: string;
  storeName?: string;
  storeId?: string;
  status?: string;
  statusName?: string;
  updatedAt?: string;
  orderNum?: number | null;
};

const props = withDefaults(
  defineProps<{
    items: BannerSortItem[];
    saving?: boolean;
    title?: string;
    description?: string;
    apiBaseUrl?: string;
  }>(),
  {
    saving: false,
    title: 'Banner 排序管理',
    description: '按住左側拖曳圖示調整顯示順序，排序完成後請點擊「儲存排序」。',
    apiBaseUrl: '',
  },
);

const emit = defineEmits<{
  (e: 'save', ids: string[]): void;
  (e: 'cancel'): void;
}>();

const localList = ref<BannerSortItem[]>([]);
const originalList = ref<BannerSortItem[]>([]);
const dragFromIdx = ref<number | null>(null);
const dragOverIdx = ref<number | null>(null);

const sortItems = (items: BannerSortItem[]) => {
  return [...(items ?? [])].sort(
    (a: BannerSortItem, b: BannerSortItem) =>
      (a.orderNum ?? 9999) - (b.orderNum ?? 9999),
  );
};

watch(
  () => props.items,
  (items) => {
    const sorted = sortItems(items);
    localList.value = sorted;
    originalList.value = [...sorted];
    dragFromIdx.value = null;
    dragOverIdx.value = null;
  },
  {
    immediate: true,
    deep: true,
  },
);

const resolveImageUrl = (url?: string) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;

  if (props.apiBaseUrl) {
    const base = props.apiBaseUrl.replace(/\/$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
  }

  return url;
};

const formatDateTime = (v?: string) => {
  if (!v) return '-';
  return String(v).replace('T', ' ');
};

const statusText = (status?: string) => {
  if (status === 'PUBLISHED') return '已上架';
  if (status === 'UNPUBLISHED') return '已下架';
  if (status === 'SCHEDULED') return '排程中';
  return '-';
};

const statusBadgeClass = (status?: string) => {
  if (status === 'PUBLISHED') return 'badge badge--green';
  if (status === 'SCHEDULED') return 'badge badge--blue';
  return 'badge badge--gray';
};

const resetSort = () => {
  localList.value = [...originalList.value];
  dragFromIdx.value = null;
  dragOverIdx.value = null;
};

const onDragStart = (idx: number) => {
  if (props.saving) return;
  dragFromIdx.value = idx;
};

const onDragOver = (idx: number) => {
  if (props.saving) return;
  if (dragFromIdx.value === null || dragFromIdx.value === idx) return;

  dragOverIdx.value = idx;
};

const onDrop = (toIdx: number) => {
  if (props.saving) return;

  const fromIdx = dragFromIdx.value;

  if (fromIdx === null || fromIdx === toIdx) {
    dragFromIdx.value = null;
    dragOverIdx.value = null;
    return;
  }

  const arr = [...localList.value];
  const [moved] = arr.splice(fromIdx, 1);
  arr.splice(toIdx, 0, moved);

  localList.value = arr;
  dragFromIdx.value = null;
  dragOverIdx.value = null;
};

const onDragEnd = () => {
  dragFromIdx.value = null;
  dragOverIdx.value = null;
};

const submitSort = () => {
  if (localList.value.length === 0 || props.saving) return;

  const ids = localList.value.map((item) => item.id);
  emit('save', ids);
};
</script>

<style scoped lang="scss">
.banner-drag-sort {
  padding: 16px;
  border: 1px solid #d1d5db;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #f9fafb 100%);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding-bottom: 14px;
    margin-bottom: 14px;
    border-bottom: 1px solid #e5e7eb;
  }

  &__title-wrap {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    min-width: 0;
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 38px;
    height: 38px;
    border-radius: 12px;
    color: #017162;
    background: #e7f5f2;
    font-size: 16px;
  }

  &__title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #111827;
  }

  &__desc {
    margin: 4px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: #6b7280;
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;
    flex: 0 0 auto;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 140px;
    color: #9ca3af;
    font-size: 14px;
  }

  &__empty-icon {
    font-size: 28px;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 0;
    margin: 0;
    list-style: none;
  }

  &__item {
    position: relative;
    display: grid;
    grid-template-columns: 44px 34px 104px minmax(220px, 1fr) 110px;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: #ffffff;
    cursor: grab;
    user-select: none;
    transition:
      transform 0.16s ease,
      border-color 0.16s ease,
      background-color 0.16s ease,
      box-shadow 0.16s ease;

    &:hover {
      border-color: #9fd3ca;
      box-shadow: 0 6px 14px rgba(15, 23, 42, 0.06);

      .banner-drag-sort__handle {
        color: #017162;
        background: #e7f5f2;
      }
    }

    &:active {
      cursor: grabbing;
    }

    &--dragging {
      opacity: 0.55;
      transform: scale(0.99);
    }

    &--over {
      border-color: #017162;
      background: #f1faf8;
      box-shadow: 0 0 0 3px rgba(1, 113, 98, 0.12);
    }
  }

  &__rank {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 999px;
    background: #f3f4f6;
    color: #374151;
    font-size: 13px;
    font-weight: 700;
  }

  &__handle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 34px;
    border-radius: 8px;
    color: #9ca3af;
    font-size: 16px;
    transition:
      color 0.16s ease,
      background-color 0.16s ease;
  }

  &__thumb-wrap {
    width: 96px;
    height: 48px;
  }

  &__thumb {
    width: 96px;
    height: 48px;
    border-radius: 8px;
    object-fit: cover;
    background: #f3f4f6;
  }

  &__thumb--empty {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    border: 1px dashed #d1d5db;
  }

  &__main {
    min-width: 0;
  }

  &__banner-title {
    margin: 0;
    color: #111827;
    font-size: 14px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 5px;
    color: #6b7280;
    font-size: 12px;

    span {
      display: inline-flex;
      align-items: center;
      min-width: 0;
    }
  }

  &__status {
    display: flex;
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .banner-drag-sort {
    padding: 12px;

    &__header {
      flex-direction: column;
      align-items: stretch;
    }

    &__actions {
      justify-content: flex-start;
    }

    &__item {
      grid-template-columns: 38px 30px 72px minmax(160px, 1fr);
    }

    &__thumb-wrap,
    &__thumb {
      width: 68px;
      height: 44px;
    }

    &__status {
      grid-column: 4 / 5;
      justify-content: flex-start;
      margin-top: 4px;
    }

    &__meta {
      display: none;
    }
  }
}
</style>

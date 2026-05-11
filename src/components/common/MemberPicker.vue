<!-- src/components/common/MemberPicker.vue
     通用會員搜尋選擇器：輸入暱稱 / Email → 下拉選取 → emit userId + label
-->
<template>
  <div class="memberPicker">
    <p class="form__text">
      搜尋玩家
      <span v-if="required" class="form__text--red"> *</span>
    </p>

    <div class="flex gap-x-8 items-end m-t-4">
      <div class="flex-1">
        <input
          class="memberPicker__input"
          v-model="query"
          :placeholder="placeholder"
          @keydown.enter.prevent="search"
        />
      </div>
      <MButton type="button" size="sm" :disabled="searching" @click="search">
        {{ searching ? '搜尋中…' : '搜尋' }}
      </MButton>
      <MButton
        v-if="modelValue"
        type="button"
        size="sm"
        variant="secondary"
        @click="clear"
      >
        清除
      </MButton>
    </div>

    <!-- 搜尋結果下拉 -->
    <div v-if="results.length > 0" class="memberPicker__results">
      <div
        v-for="u in results"
        :key="u.id"
        class="memberPicker__item"
        :class="{ 'memberPicker__item--active': modelValue === u.id }"
        @click="select(u)"
      >
        <span class="memberPicker__name">{{ u.nickname || u.name || u.email || u.id }}</span>
        <span class="memberPicker__sub">{{ u.email }}</span>
      </div>
    </div>

    <!-- 已選取 -->
    <div v-if="modelValue" class="memberPicker__selected">
      <span class="memberPicker__selectedIcon">✓</span>
      已選：<strong>{{ selectedLabel }}</strong>
      <span class="memberPicker__selectedId">（ID: {{ modelValue }}）</span>
    </div>

    <p v-if="error" class="error-text m-t-4">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MButton from '@/components/common/MButton.vue';
import { queryFrontendUsers } from '@/services/adminFrontendUserService';

interface UserResult {
  id: string;
  nickname?: string;
  name?: string;
  email?: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: string;
    selectedLabel?: string;
    placeholder?: string;
    required?: boolean;
    error?: string;
  }>(),
  {
    placeholder: '輸入暱稱或 Email 搜尋...',
    required: false,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', id: string): void;
  (e: 'update:selectedLabel', label: string): void;
  (e: 'select', user: UserResult): void;
  (e: 'clear'): void;
}>();

const query = ref('');
const searching = ref(false);
const results = ref<UserResult[]>([]);

const search = async () => {
  const q = query.value.trim();
  if (!q) return;
  searching.value = true;
  results.value = [];
  try {
    const res = await queryFrontendUsers({
      condition: { keyword: q },
      sortBy: 'createdAt',
      sortOrder: 'DESC',
      size: 20,
    });
    const data = (res as any)?.data ?? res;
    results.value = Array.isArray(data) ? data : [];
  } catch {
    results.value = [];
  } finally {
    searching.value = false;
  }
};

const select = (u: UserResult) => {
  const label = u.nickname || u.name || u.email || String(u.id);
  emit('update:modelValue', String(u.id));
  emit('update:selectedLabel', label);
  emit('select', u);
  results.value = [];
};

const clear = () => {
  query.value = '';
  results.value = [];
  emit('update:modelValue', '');
  emit('update:selectedLabel', '');
  emit('clear');
};
</script>

<style scoped lang="scss">
.memberPicker {
  &__input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;

    &:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
  }

  &__results {
    margin-top: 6px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 8px;
    overflow: hidden;
    max-height: 220px;
    overflow-y: auto;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    cursor: pointer;
    transition: background 0.15s;

    &:hover,
    &--active {
      background: rgba(99, 102, 241, 0.08);
    }
  }

  &__name {
    font-weight: 600;
    flex: 1;
    font-size: 14px;
  }

  &__sub {
    font-size: 12px;
    opacity: 0.55;
  }

  &__selected {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    padding: 6px 10px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 6px;
    font-size: 13px;
    color: #166534;
  }

  &__selectedIcon {
    color: #16a34a;
    font-weight: bold;
  }

  &__selectedId {
    opacity: 0.6;
    font-size: 12px;
  }
}
</style>

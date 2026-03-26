<!-- src/components/prizeBox/AdminPrizeBoxSearchForm.vue -->
<template>
  <div class="flex flex-wrap">
    <!-- 會員搜尋 -->
    <div class="w-100 p-6">
      <p class="form__text">搜尋會員（Email 或暱稱）</p>
      <div class="flex gap-x-8 items-end m-t-4">
        <div class="flex-1">
          <FormInput
            :showLabel="false"
            v-model="memberQuery"
            placeholder="輸入 Email 或暱稱搜尋..."
            @keydown.enter.prevent="searchMembers"
          />
        </div>
        <div>
          <MButton
            type="button"
            size="sm"
            :disabled="searching"
            @click="searchMembers"
          >
            {{ searching ? '搜尋中...' : '搜尋會員' }}
          </MButton>
        </div>
      </div>

      <!-- 搜尋結果 -->
      <div v-if="memberResults.length > 0" class="prizeBoxSearch__results m-t-8">
        <p class="form__text" style="font-size: 13px; margin-bottom: 4px">請選擇會員</p>
        <div
          v-for="m in memberResults"
          :key="m.id"
          class="prizeBoxSearch__item"
          :class="{ 'prizeBoxSearch__item--active': userId === m.id }"
          @click="selectMember(m)"
        >
          <span class="prizeBoxSearch__name">{{ m.nickname || m.name || m.email || m.id }}</span>
          <span class="prizeBoxSearch__email">{{ m.email }}</span>
        </div>
      </div>

      <!-- 已選擇的會員 -->
      <div v-if="selectedLabel" class="flex items-center gap-x-8 m-t-8">
        <span class="form__text">已選會員：</span>
        <strong>{{ selectedLabel }}</strong>
        <MButton type="button" size="sm" variant="secondary" @click="clearMember">
          清除
        </MButton>
      </div>

      <p class="error-text m-t-4" v-if="userIdError">{{ userIdError }}</p>
    </div>

    <!-- 顯示模式 -->
    <div class="w-50 w-md-100 p-6">
      <FormSelect
        label="顯示模式"
        v-model="mode"
        :options="modeOptions"
        :error="modeError"
        required
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useField } from 'vee-validate';

import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import MButton from '@/components/common/MButton.vue';

import { queryFrontendUsers } from '@/services/adminFrontendUserService';

interface SelectOption {
  label: string;
  value: any;
}

interface MemberResult {
  id: string;
  nickname?: string;
  name?: string;
  email?: string;
}

const { value: userId, errorMessage: userIdError } = useField<string>('userId');
const { value: mode, errorMessage: modeError } = useField<string>('mode');

const modeOptions = computed<SelectOption[]>(() => [
  { label: '按店家分組（Summary）', value: 'summary' },
  { label: '明細（Detail）', value: 'detail' },
]);

// 搜尋狀態
const memberQuery = ref('');
const searching = ref(false);
const memberResults = ref<MemberResult[]>([]);
const selectedLabel = ref('');

const searchMembers = async () => {
  const q = memberQuery.value.trim();
  if (!q) return;

  searching.value = true;
  memberResults.value = [];

  try {
    const res = await queryFrontendUsers({
      condition: { nickname: q, email: q },
    });
    const data = (res as any)?.data ?? res;
    memberResults.value = Array.isArray(data) ? data : [];
  } catch {
    memberResults.value = [];
  } finally {
    searching.value = false;
  }
};

const selectMember = (m: MemberResult) => {
  userId.value = m.id;
  selectedLabel.value = m.nickname || m.name || m.email || m.id;
  memberResults.value = [];
};

const clearMember = () => {
  userId.value = '';
  selectedLabel.value = '';
  memberQuery.value = '';
  memberResults.value = [];
};
</script>

<style scoped lang="scss">
.prizeBoxSearch {
  &__results {
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
  }

  &__email {
    font-size: 13px;
    opacity: 0.6;
  }
}
</style>

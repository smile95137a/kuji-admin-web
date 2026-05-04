<!-- src/components/prizeBox/AdminPrizeBoxSearchForm.vue -->
<template>
  <div class="admin-prize-box-search-form">
    <div class="flex flex-wrap">
      <!-- 會員選擇 -->
      <div class="w-50 w-md-100 p-6">
        <FormInput
          label="會員"
          v-model="memberLabel"
          :error="errors.userId"
          placeholder="請點擊右側搜尋選擇會員"
          required
        >
          <template #addonRight>
            <div
              class="form-input__addon clickable"
              title="搜尋會員"
              @click="searchMember"
            >
              <font-awesome-icon :icon="['fas', 'search']" />
            </div>
          </template>
        </FormInput>
      </div>

      <!-- 顯示模式 -->
      <div class="w-50 w-md-100 p-6">
        <FormSelect
          label="顯示模式"
          v-model="mode"
          :options="modeOptions"
          :error="errors.mode"
          required
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useFormContext } from 'vee-validate';

import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';

import { openSearchMemberDialog } from '@/utils/dialog/openSearchMemberDialog';

interface SelectOption {
  label: string;
  value: any;
}

const { defineField, errors } = useFormContext();

const [userId] = defineField('userId');
const [mode] = defineField('mode');

const memberLabel = ref('');

const modeOptions = computed<SelectOption[]>(() => [
  { label: '按店家分組（Summary）', value: 'summary' },
  { label: '明細（Detail）', value: 'detail' },
]);

const searchMember = async () => {
  const result = await openSearchMemberDialog({
    title: '會員查詢',
  });

  if (!result) return;

  userId.value = result.value ?? '';
  memberLabel.value = result.label ?? result.value ?? '';
};

watch(userId, (value) => {
  if (!value) {
    memberLabel.value = '';
  }
});
</script>

<style scoped lang="scss">
.admin-prize-box-search-form {
}
</style>

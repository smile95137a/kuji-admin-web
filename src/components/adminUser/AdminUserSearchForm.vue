<!-- src/components/adminUser/AdminUserSearchForm.vue -->
<template>
  <div class="admin-user-search-form">
    <div class="admin-user-search-form__section">
      <p class="admin-user-search-form__section-title">帳號條件</p>

      <div class="flex flex-wrap">
        <!-- 關鍵字 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="關鍵字"
            v-model="keyword"
            :error="errors.keyword"
            maxlength="100"
            placeholder="Email / 顯示名稱"
          />
        </div>

        <!-- 狀態 -->
        <div class="w-25 w-md-50 w-sm-100 p-6">
          <FormSelect
            label="狀態"
            v-model="status"
            :options="statusOptions"
            :error="errors.status"
            :showAll="true"
            allLabel="全部"
            :allValue="''"
          />
        </div>

        <!-- 角色 -->
        <div class="w-25 w-md-50 w-sm-100 p-6">
          <FormSelect
            label="角色"
            v-model="roleCode"
            :options="roleCodeOptions"
            :error="errors.roleCode"
            :showAll="true"
            allLabel="全部"
            :allValue="''"
          />
        </div>
      </div>
    </div>

    <div class="admin-user-search-form__section">
      <p class="admin-user-search-form__section-title">店家條件</p>

      <div class="flex flex-wrap">
        <!-- 店家 -->
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="店家"
            v-model="storeId"
            :options="storeOptions"
            :error="errors.storeId"
            :showAll="true"
            allLabel="全部"
            :allValue="''"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFormContext } from 'vee-validate';

import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';

interface SelectOption {
  label: string;
  value: any;
  description?: string;
}

defineProps<{
  statusOptions: SelectOption[];
  storeOptions: SelectOption[];
  roleCodeOptions: SelectOption[];
}>();

const { defineField, errors } = useFormContext();

const [keyword] = defineField('keyword');
const [status] = defineField('status');
const [storeId] = defineField('storeId');
const [roleCode] = defineField('roleCode');
</script>

<style scoped lang="scss">
.admin-user-search-form {
  &__section {
    padding: 4px 0 8px;

    & + & {
      margin-top: 8px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
    }
  }

  &__section-title {
    margin: 0 6px 4px;
    padding-left: 10px;
    border-left: 4px solid #9ca3af;
    color: #374151;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.4;
  }
}
</style>

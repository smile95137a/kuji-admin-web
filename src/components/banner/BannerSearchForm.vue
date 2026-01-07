<!-- src/components/banner/BannerSearchForm.vue -->
<template>
  <div class="flex flex-wrap">
    <!-- 狀態 -->
    <div class="w-50 w-md-100 p-6">
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

    <!-- 標題（模糊） -->
    <div class="w-50 w-md-100 p-6">
      <FormInput
        label="標題"
        v-model="title"
        :error="errors.title"
        placeholder="請輸入標題（模糊查詢）"
        maxlength="50"
      />
    </div>

    <!-- 關鍵字（BaseCondition.keyword） -->
    <div class="w-50 w-md-100 p-6">
      <FormInput
        label="關鍵字"
        v-model="keyword"
        :error="errors.keyword"
        placeholder="請輸入關鍵字（模糊查詢）"
        maxlength="50"
      />
    </div>

    <!-- 建立時間（起） -->
    <div class="w-25 w-md-100 p-6">
      <FormInput
        label="建立時間（起）"
        type="datetime-local"
        v-model="createdAtStart"
        :error="errors.createdAtStart"
      />
    </div>

    <!-- 建立時間（迄） -->
    <div class="w-25 w-md-100 p-6">
      <FormInput
        label="建立時間（迄）"
        type="datetime-local"
        v-model="createdAtEnd"
        :error="errors.createdAtEnd"
      />
    </div>

    <!-- 店家 ID（可留著，未來如果改成用店家搜尋元件也方便） -->
    <div class="w-50 w-md-100 p-6">
      <FormInput
        label="店家 ID"
        v-model="storeId"
        :error="errors.storeId"
        placeholder="請輸入店家 ID"
        maxlength="64"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import FormSelect from '@/components/common/FormSelect.vue';
import FormInput from '@/components/common/FormInput.vue';
import { useFormContext } from 'vee-validate';

defineProps<{
  statusOptions: SelectOption[];
}>();

const { defineField, errors } = useFormContext();

const [status] = defineField('status');
const [title] = defineField('title');
const [storeId] = defineField('storeId');
const [keyword] = defineField('keyword');
const [createdAtStart] = defineField('createdAtStart');
const [createdAtEnd] = defineField('createdAtEnd');
</script>

<!-- src/components/banner/BannerSearchForm.vue -->
<template>
  <div class="banner-search-form">
    <div class="banner-search-form__head">
      <div>
        <p class="banner-search-form__title">查詢條件</p>
        <p class="banner-search-form__sub">
          可依狀態、店家、標題與建立日期區間查詢 Banner。
        </p>
      </div>
    </div>

    <div class="banner-search-form__grid">
      <!-- 狀態 -->
      <div class="banner-search-form__item">
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

      <!-- 店家 -->
      <div class="banner-search-form__item">
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

      <!-- 標題 -->
      <div class="banner-search-form__item banner-search-form__item--wide">
        <FormInput
          label="標題"
          v-model="title"
          :error="errors.title"
          maxlength="50"
          placeholder="輸入標題"
        />
      </div>

      <!-- 建立日期 -->
      <div class="banner-search-form__item banner-search-form__item--wide">
        <FormDateRangeField
          label="建立日期"
          type="date"
          v-model:start="createdAtStart"
          v-model:end="createdAtEnd"
          :start-error="errors.createdAtStart"
          :end-error="errors.createdAtEnd"
          separator="~"
          :auto-apply-default="true"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFormContext } from 'vee-validate';

import FormSelect from '@/components/common/FormSelect.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormDateRangeField from '@/components/common/FormDateRangeField.vue';

defineProps<{
  statusOptions: SelectOption[];
  storeOptions: SelectOption[];
}>();

const { defineField, errors } = useFormContext();

const [status] = defineField('status');
const [title] = defineField('title');
const [storeId] = defineField('storeId');
const [createdAtStart] = defineField('createdAtStart');
const [createdAtEnd] = defineField('createdAtEnd');
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as tokens;

.banner-search-form {
  margin-top: 12px;

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }

  &__title {
    margin: 0;
    padding-left: 10px;
    border-left: 4px solid tokens.$brand;
    color: tokens.$form-text;
    font-size: 15px;
    font-weight: 800;
    line-height: 1.4;
  }

  &__sub {
    margin: 4px 0 0;
    color: tokens.$form-muted;
    font-size: 13px;
    line-height: 1.5;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    padding: 14px;
    border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
    border-radius: 16px;
    background: color.mix(tokens.$brand-light, #fff, 7%);
  }

  &__item {
    min-width: 0;

    &--wide {
      grid-column: span 2;
    }
  }
}

@media (max-width: 1180px) {
  .banner-search-form {
    &__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    &__item {
      &--wide {
        grid-column: span 2;
      }
    }
  }
}

@media (max-width: 640px) {
  .banner-search-form {
    &__grid {
      grid-template-columns: 1fr;
    }

    &__item {
      &--wide {
        grid-column: span 1;
      }
    }
  }
}
</style>

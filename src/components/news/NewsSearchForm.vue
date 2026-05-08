<!-- src/components/news/NewsSearchForm.vue -->
<template>
  <div class="news-search-form">
    <div class="news-search-form__head">
      <div>
        <p class="news-search-form__title">查詢條件</p>
        <p class="news-search-form__sub">
          可依狀態、標題、內容關鍵字與建立日期區間查詢最新消息。
        </p>
      </div>
    </div>

    <div class="news-search-form__grid">
      <!-- 狀態 -->
      <div class="news-search-form__item">
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

      <!-- 標題 -->
      <div class="news-search-form__item">
        <FormInput
          label="標題"
          v-model="title"
          :error="errors.title"
          maxlength="50"
          placeholder="請輸入標題"
        />
      </div>

      <!-- 內容關鍵字 -->
      <div class="news-search-form__item news-search-form__item--wide">
        <FormInput
          label="內容關鍵字"
          v-model="keyword"
          :error="errors.keyword"
          maxlength="50"
          placeholder="請輸入內文關鍵字"
        />
      </div>

      <!-- 建立日期 -->
      <div class="news-search-form__item news-search-form__item--wide">
        <p class="form__text">建立日期</p>

        <div class="news-search-form__date-range">
          <FormInput
            type="date"
            v-model="createdAtStart"
            :error="errors.createdAtStart"
            :show-label="false"
          />

          <span class="news-search-form__date-separator">~</span>

          <FormInput
            type="date"
            v-model="createdAtEnd"
            :error="errors.createdAtEnd"
            :show-label="false"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFormContext } from 'vee-validate';

import FormSelect from '@/components/common/FormSelect.vue';
import FormInput from '@/components/common/FormInput.vue';

defineProps<{
  statusOptions: SelectOption[];
}>();

const { defineField, errors } = useFormContext();

const [status] = defineField('status');
const [title] = defineField('title');
const [keyword] = defineField('keyword');
const [createdAtStart] = defineField('createdAtStart');
const [createdAtEnd] = defineField('createdAtEnd');
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as tokens;

.news-search-form {
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

  &__date-range {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  &__date-separator {
    flex: 0 0 auto;
    padding-top: 9px;
    color: tokens.$form-muted;
    font-size: 14px;
  }
}

@media (max-width: 1180px) {
  .news-search-form {
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
  .news-search-form {
    &__grid {
      grid-template-columns: 1fr;
    }

    &__item {
      &--wide {
        grid-column: span 1;
      }
    }

    &__date-range {
      flex-direction: column;
      gap: 6px;
    }

    &__date-separator {
      padding-top: 0;
    }
  }
}
</style>

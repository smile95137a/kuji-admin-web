<!-- src/components/marquee/MarqueeSearchForm.vue -->
<template>
  <div class="marquee-search-form">
    <div class="marquee-search-form__head">
      <div>
        <p class="marquee-search-form__title">查詢條件</p>
        <p class="marquee-search-form__sub">
          可依狀態、內容關鍵字與開始日期區間查詢跑馬燈。
        </p>
      </div>
    </div>

    <div class="marquee-search-form__grid">
      <!-- 狀態 -->
      <div class="marquee-search-form__item">
        <FormSelect
          label="狀態"
          v-model="active"
          :options="activeOptions"
          :error="errors.active"
          :showAll="true"
          allLabel="全部"
          :allValue="''"
        />
      </div>

      <!-- 內容關鍵字 -->
      <div class="marquee-search-form__item marquee-search-form__item--wide">
        <FormInput
          label="內容關鍵字"
          v-model="keyword"
          :error="errors.keyword"
          maxlength="100"
          placeholder="請輸入內容關鍵字"
        />
      </div>

      <!-- 開始日期 -->
      <div class="marquee-search-form__item marquee-search-form__item--wide">
        <p class="form__text">開始日期</p>

        <div class="marquee-search-form__date-range">
          <FormInput
            type="date"
            v-model="startDate"
            :error="errors.startDate"
            :show-label="false"
          />

          <span class="marquee-search-form__date-separator">~</span>

          <FormInput
            type="date"
            v-model="endDate"
            :error="errors.endDate"
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
  activeOptions: SelectOption[];
}>();

const { defineField, errors } = useFormContext();

const [active] = defineField('active');
const [keyword] = defineField('keyword');
const [startDate] = defineField('startDate');
const [endDate] = defineField('endDate');
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as tokens;

.marquee-search-form {
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
  .marquee-search-form {
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
  .marquee-search-form {
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

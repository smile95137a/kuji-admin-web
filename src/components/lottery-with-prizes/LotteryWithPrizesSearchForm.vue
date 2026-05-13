<!-- src/components/lottery-with-prizes/LotteryWithPrizesSearchForm.vue -->
<template>
  <div class="lottery-with-prizes-search-form">
    <div class="lottery-with-prizes-search-form__head">
      <div>
        <p class="lottery-with-prizes-search-form__title">查詢條件</p>
        <p class="lottery-with-prizes-search-form__sub">
          可依店家、狀態、分類、子分類、商品名稱、每抽價格與指定狀態查詢商品。
        </p>
      </div>
    </div>

    <div class="lottery-with-prizes-search-form__grid">
      <!-- 店家 -->
      <div class="lottery-with-prizes-search-form__item">
        <FormSelect
          label="店家"
          v-model="storeId"
          :options="storeOptions"
          :showAll="true"
          allLabel="全部"
          :allValue="''"
        />
      </div>

      <!-- 狀態 -->
      <div class="lottery-with-prizes-search-form__item">
        <FormSelect
          label="狀態"
          v-model="status"
          :options="statusOptions"
          :showAll="true"
          allLabel="全部"
          :allValue="''"
        />
      </div>

      <!-- 分類 -->
      <div class="lottery-with-prizes-search-form__item">
        <FormSelect
          label="分類"
          v-model="category"
          :options="categoryOptions"
          :showAll="true"
          allLabel="全部"
          :allValue="''"
        />
      </div>

      <!-- 子分類 -->
      <div class="lottery-with-prizes-search-form__item">
        <FormSelect
          label="子分類"
          v-model="subCategory"
          :options="subCategoryOptions"
          :showAll="true"
          allLabel="全部"
          :allValue="''"
        />
      </div>

      <!-- 指定狀態 -->
      <div class="lottery-with-prizes-search-form__item">
        <FormSelect
          label="指定狀態"
          v-model="designationStatus"
          :options="designationStatusOptions"
          :showAll="true"
          allLabel="全部"
          :allValue="''"
        />
      </div>

      <!-- 商品名稱 -->
      <div
        class="lottery-with-prizes-search-form__item lottery-with-prizes-search-form__item--wide"
      >
        <FormInput
          label="商品名稱"
          v-model="title"
          maxlength="100"
          placeholder="輸入商品名稱關鍵字"
        />
      </div>

      <!-- 每抽價格 -->
      <div
        class="lottery-with-prizes-search-form__item lottery-with-prizes-search-form__item--wide"
      >
        <p class="form__text">每抽價格</p>

        <div class="lottery-with-prizes-search-form__price-range">
          <FormInput
            type="number"
            v-model="priceMin"
            :show-label="false"
            placeholder="最小值"
          />

          <span class="lottery-with-prizes-search-form__range-separator">
            ~
          </span>

          <FormInput
            type="number"
            v-model="priceMax"
            :show-label="false"
            placeholder="最大值"
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
  storeOptions: SelectOption[];
  statusOptions: SelectOption[];
  categoryOptions: SelectOption[];
  subCategoryOptions: SelectOption[];
  designationStatusOptions: SelectOption[];
}>();

const { defineField } = useFormContext();

const [storeId] = defineField('storeId');
const [status] = defineField('status');
const [category] = defineField('category');
const [subCategory] = defineField('subCategory');
const [title] = defineField('title');
const [priceMin] = defineField('priceMin');
const [priceMax] = defineField('priceMax');
const [designationStatus] = defineField('designationStatus');
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as tokens;

.lottery-with-prizes-search-form {
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

  &__price-range {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  &__range-separator {
    flex: 0 0 auto;
    padding-top: 9px;
    color: tokens.$form-muted;
    font-size: 14px;
  }
}

@media (max-width: 1180px) {
  .lottery-with-prizes-search-form {
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
  .lottery-with-prizes-search-form {
    &__grid {
      grid-template-columns: 1fr;
    }

    &__item {
      &--wide {
        grid-column: span 1;
      }
    }

    &__price-range {
      flex-direction: column;
      gap: 6px;
    }

    &__range-separator {
      padding-top: 0;
    }
  }
}
</style>

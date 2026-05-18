<template>
  <div class="category-search-form">
    <div class="category-search-form__head">
      <div>
        <p class="category-search-form__title">查詢條件</p>
        <p class="category-search-form__sub">
          可依狀態與主題名稱查詢主題字典。
        </p>
      </div>
    </div>

    <div class="category-search-form__grid">
      <div class="category-search-form__item">
        <FormSelect
          label="狀態"
          v-model="status"
          :options="statusOptions"
          :error="errors.status"
          :showAll="false"
        />
      </div>

      <div class="category-search-form__item category-search-form__item--wide">
        <FormInput
          label="主題名稱"
          v-model="name"
          :error="errors.name"
          maxlength="100"
          placeholder="輸入主題名稱"
        />
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
const [name] = defineField('name');
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as tokens;

.category-search-form {
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
  .category-search-form {
    &__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    &__item {
      &--wide {
        grid-column: span 1;
      }
    }
  }
}

@media (max-width: 640px) {
  .category-search-form {
    &__grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>

<!-- src/components/cooperationInquiry/CooperationInquirySearchForm.vue -->
<template>
  <div class="cooperation-inquiry-search-form">
    <div class="cooperation-inquiry-search-form__head">
      <div>
        <p class="cooperation-inquiry-search-form__title">查詢條件</p>
        <p class="cooperation-inquiry-search-form__sub">
          可依處理狀態、合作類型、公司、姓名、Email、電話或需求內容查詢。
        </p>
      </div>
    </div>

    <div class="cooperation-inquiry-search-form__grid">
      <div class="cooperation-inquiry-search-form__item">
        <FormSelect
          label="處理狀態"
          v-model="status"
          :options="statusOptions"
          :error="errors.status"
          :showAll="true"
          allLabel="全部"
          :allValue="''"
        />
      </div>

      <div class="cooperation-inquiry-search-form__item">
        <FormSelect
          label="合作類型"
          v-model="type"
          :options="typeOptions"
          :error="errors.type"
          :showAll="true"
          allLabel="全部"
          :allValue="''"
        />
      </div>

      <div
        class="cooperation-inquiry-search-form__item cooperation-inquiry-search-form__item--wide"
      >
        <FormInput
          label="關鍵字"
          v-model="keyword"
          :error="errors.keyword"
          maxlength="100"
          placeholder="輸入公司、姓名、Email、電話或需求內容"
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
  typeOptions: SelectOption[];
}>();

const { defineField, errors } = useFormContext();

const [status] = defineField('status');
const [type] = defineField('type');
const [keyword] = defineField('keyword');
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as tokens;

.cooperation-inquiry-search-form {
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
  .cooperation-inquiry-search-form {
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
  .cooperation-inquiry-search-form {
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

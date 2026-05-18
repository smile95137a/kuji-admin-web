<!-- src/components/emergencyAnnouncement/EmergencyAnnouncementSearchForm.vue -->
<template>
  <div class="emergency-announcement-search-form">
    <div class="emergency-announcement-search-form__head">
      <div>
        <p class="emergency-announcement-search-form__title">查詢條件</p>
        <p class="emergency-announcement-search-form__sub">
          可依公告狀態、公告類型、關鍵字與公告顯示日期區間查詢。
        </p>
      </div>
    </div>

    <div class="emergency-announcement-search-form__grid">
      <!-- 狀態 -->
      <div class="emergency-announcement-search-form__item">
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

      <!-- 公告類型 -->
      <div class="emergency-announcement-search-form__item">
        <FormSelect
          label="公告類型"
          v-model="announcementType"
          :options="announcementTypeOptions"
          :error="errors.announcementType"
          :showAll="true"
          allLabel="全部"
          :allValue="''"
        />
      </div>

      <!-- 關鍵字 -->
      <div
        class="emergency-announcement-search-form__item emergency-announcement-search-form__item--wide"
      >
        <FormInput
          label="關鍵字"
          v-model="keyword"
          :error="errors.keyword"
          maxlength="50"
          placeholder="輸入公告標題或內容"
        />
      </div>

      <!-- 公告顯示日期 -->
      <div
        class="emergency-announcement-search-form__item emergency-announcement-search-form__item--wide"
      >
        <FormDateRangeField
          label="公告顯示日期"
          type="date"
          v-model:start="displayStartTime"
          v-model:end="displayEndTime"
          :start-error="errors.displayStartTime"
          :end-error="errors.displayEndTime"
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
  announcementTypeOptions: SelectOption[];
}>();

const { defineField, errors } = useFormContext();

const [status] = defineField('status');
const [announcementType] = defineField('announcementType');
const [keyword] = defineField('keyword');
const [displayStartTime] = defineField('displayStartTime');
const [displayEndTime] = defineField('displayEndTime');
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as tokens;

.emergency-announcement-search-form {
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
  .emergency-announcement-search-form {
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
  .emergency-announcement-search-form {
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

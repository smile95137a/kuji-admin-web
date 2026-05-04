<!-- src/components/lottery/TabLotteryPrizes.vue -->
<template>
  <div class="tab-lottery-prizes">
    <div class="tab-lottery-prizes__section">
      <div class="tab-lottery-prizes__section-header">
        <p class="tab-lottery-prizes__section-title">獎品清單</p>

        <MButton type="button" size="sm" @click="openAddDialog">
          <font-awesome-icon :icon="['fas', 'plus']" class="m-r-4" />
          新增獎品
        </MButton>
      </div>

      <div v-if="!fields.length" class="tab-lottery-prizes__empty">
        <NoData message="尚未建立獎品，請點擊「新增獎品」加入獎品" />
      </div>

      <div v-else class="tab-lottery-prizes__grid">
        <div
          v-for="(field, index) in fields"
          :key="field.key"
          class="tab-lottery-prizes__item"
          @click="openEditDialog(index)"
        >
          <div class="tab-lottery-prizes__image-wrap">
            <img
              v-if="field.value.imageUrl"
              :src="field.value.imageUrl"
              alt="獎品圖片"
              class="tab-lottery-prizes__image"
            />

            <div v-else class="tab-lottery-prizes__image-empty">
              <font-awesome-icon :icon="['fas', 'image']" />
            </div>

            <button
              type="button"
              class="tab-lottery-prizes__remove"
              aria-label="移除獎品"
              @click.stop="removePrize(index)"
            >
              <font-awesome-icon :icon="['fas', 'xmark']" />
            </button>
          </div>

          <div class="tab-lottery-prizes__info">
            <p class="tab-lottery-prizes__name">
              {{ field.value.name || '未命名獎品' }}
            </p>

            <span class="tab-lottery-prizes__level">
              {{ getLevelLabel(field.value.level) }}
            </span>
          </div>
        </div>
      </div>

      <p v-if="showError('prizes')" class="error-text m-t-8">
        {{ showError('prizes') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFieldArray, useFormContext } from 'vee-validate';

import MButton from '@/components/common/MButton.vue';
import NoData from '@/components/common/NoData.vue';

import { openPrizeFormDialog } from '@/utils/dialog/openPrizeFormDialog';
import type { PrizeFormRow } from '@/components/lottery/PrizeFormDialog.vue';

const { errors, submitCount } = useFormContext();

const { fields, push, remove, update } = useFieldArray<PrizeFormRow>('prizes');

const openAddDialog = async () => {
  const result = await openPrizeFormDialog({
    title: '新增獎品',
    data: {
      mode: 'add',
    },
  });

  if (!result) return;

  push(result);
};

const openEditDialog = async (index: number) => {
  const prize = fields.value[index]?.value;

  if (!prize) return;

  const result = await openPrizeFormDialog({
    title: '編輯獎品',
    data: {
      mode: 'edit',
      prize: {
        ...prize,
      },
    },
  });

  if (!result) return;

  update(index, result);
};

const removePrize = (index: number) => {
  remove(index);
};

const showError = (field: string) => {
  if (!submitCount.value) return '';

  return errors.value[field] as string;
};

const levelOptions = [
  { label: 'A賞', value: 'A' },
  { label: 'B賞', value: 'B' },
  { label: 'C賞', value: 'C' },
  { label: 'D賞', value: 'D' },
  { label: 'E賞', value: 'E' },
  { label: '最後賞', value: 'LAST' },
];

const getLevelLabel = (value?: string) => {
  return (
    levelOptions.find((item) => item.value === value)?.label || value || '-'
  );
};
</script>

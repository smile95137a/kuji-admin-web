<!-- src/components/lottery/TabLotteryPrizes.vue -->
<template>
  <div class="tab-lottery-prizes">
    <FormSection title="獎品清單">
      <div class="tab-lottery-prizes__section-header">
        <div class="tab-lottery-prizes__title-group">
          <span v-if="fields.length" class="tab-lottery-prizes__count">
            共 {{ fields.length }} 筆
          </span>
        </div>

        <div class="tab-lottery-prizes__actions">
          <MButton type="button" size="sm" @click="openAddDialog">
            <font-awesome-icon :icon="['fas', 'plus']" class="m-r-4" />
            新增獎品
          </MButton>
        </div>
      </div>

      <p v-if="isCustomLotteryMode" class="tab-lottery-prizes__hint">
        自製賞抽籤型固定只有 1 個大獎，系統會自動將第 1 筆獎品設為唯一大獎。
      </p>

      <div v-if="!fields.length">
        <NoData message="尚未建立獎品，請點擊「新增獎品」加入獎品" />
      </div>

      <div v-else class="tab-lottery-prizes__list">
        <article
          v-for="(field, index) in fields"
          :key="field.key"
          class="tab-lottery-prizes__item"
          @click="openEditDialog(index)"
        >
          <!-- 圖片 -->
          <div class="tab-lottery-prizes__image-wrap">
            <img
              v-if="field.value.imageUrl"
              :src="field.value.imageUrl"
              alt="獎品圖片"
              class="tab-lottery-prizes__image"
            />

            <div v-else class="tab-lottery-prizes__image-empty">
              <font-awesome-icon :icon="['fas', 'image']" />
              <span>無圖片</span>
            </div>

            <span class="tab-lottery-prizes__level-badge">
              {{ getLevelLabel(field.value.level) }}
            </span>
          </div>

          <!-- 內容 -->
          <div class="tab-lottery-prizes__content">
            <div class="tab-lottery-prizes__top">
              <div class="tab-lottery-prizes__name-block">
                <p class="tab-lottery-prizes__name">
                  {{ field.value.name || '未命名獎品' }}
                </p>

                <div
                  class="tab-lottery-prizes__tag-list"
                  :class="{
                    'tab-lottery-prizes__tag-list--empty':
                      !field.value.isGrandPrize &&
                      !field.value.isLastPrize &&
                      field.value.prizeType !== 'point',
                  }"
                >
                  <span
                    v-if="field.value.isGrandPrize"
                    class="tab-lottery-prizes__tag tab-lottery-prizes__tag--grand"
                  >
                    大獎
                  </span>

                  <span
                    v-if="field.value.isLastPrize"
                    class="tab-lottery-prizes__tag tab-lottery-prizes__tag--last"
                  >
                    最後賞
                  </span>

                  <span
                    v-if="field.value.prizeType === 'point'"
                    class="tab-lottery-prizes__tag tab-lottery-prizes__tag--point"
                  >
                    點數 {{ field.value.pointValue || 0 }}
                  </span>
                </div>
              </div>

              <button
                type="button"
                class="tab-lottery-prizes__remove"
                aria-label="移除獎品"
                @click.stop="removePrize(index)"
              >
                <font-awesome-icon :icon="['fas', 'trash']" />
              </button>
            </div>

            <div class="tab-lottery-prizes__meta">
              <div class="tab-lottery-prizes__meta-item">
                <span class="tab-lottery-prizes__meta-label">數量</span>
                <span class="tab-lottery-prizes__meta-value">
                  {{ field.value.quantity || 0 }}
                </span>
              </div>

              <div class="tab-lottery-prizes__meta-item">
                <span class="tab-lottery-prizes__meta-label">類型</span>
                <span class="tab-lottery-prizes__meta-value">
                  {{ getPrizeTypeLabel(field.value.prizeType) }}
                </span>
              </div>
            </div>

            <p v-if="field.value.description" class="tab-lottery-prizes__desc">
              {{ field.value.description }}
            </p>

            <p
              v-else
              class="tab-lottery-prizes__desc tab-lottery-prizes__desc--empty"
            >
              尚未填寫獎品描述
            </p>
          </div>
        </article>
      </div>

      <p v-if="showError('prizes')" class="error-text m-t-8">
        {{ showError('prizes') }}
      </p>
    </FormSection>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useFieldArray, useFormContext } from 'vee-validate';

import MButton from '@/components/common/MButton.vue';
import NoData from '@/components/common/NoData.vue';
import FormSection from '@/components/common/FormSection.vue';

import { openPrizeFormDialog } from '@/utils/dialog/openPrizeFormDialog';
import type { PrizeFormRow } from '@/components/lottery/PrizeFormDialog.vue';

import { levelOptions, prizeTypeOptions } from '@/constants/lotteryOptions';

const { errors, submitCount, defineField } = useFormContext();

const [category] = defineField('category');
const [subCategory] = defineField('subCategory');
const [playMode] = defineField('playMode');
const [gameMode] = defineField('gameMode');

const isScratchMode = computed(() => {
  const values = [subCategory.value, playMode.value, gameMode.value]
    .map((item) => String(item || ''))
    .filter(Boolean);

  return (
    values.includes('SCRATCH_MODE') ||
    values.includes('SCRATCH_STORE') ||
    values.includes('SCRATCH_PLAYER')
  );
});

const isCustomLotteryMode = computed(() => {
  const values = [subCategory.value, playMode.value]
    .map((item) => String(item || ''))
    .filter(Boolean);

  return (
    String(category.value || '') === 'CUSTOM_GACHA' &&
    values.includes('LOTTERY_MODE')
  );
});

const { fields, push, remove, update } = useFieldArray<PrizeFormRow>('prizes');

const createKey = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2)}`;

const normalizeScratchPrize = (row: PrizeFormRow): PrizeFormRow => ({
  ...row,
  name: String(row.name || '').trim(),
  level: 'GRAND',
  quantity: 1,
  isGrandPrize: true,
  isLastPrize: false,
});

const normalizeCustomLotteryPrize = (
  row: PrizeFormRow,
  index: number,
): PrizeFormRow => ({
  ...row,
  name: String(row.name || '').trim(),
  level: index === 0 ? 'GRAND' : row.level === 'GRAND' ? 'A' : row.level,
  isGrandPrize: index === 0,
});

const normalizePrizeForCurrentMode = (
  row: PrizeFormRow,
  index: number,
): PrizeFormRow => {
  if (isScratchMode.value) {
    return normalizeScratchPrize(row);
  }

  if (isCustomLotteryMode.value) {
    return normalizeCustomLotteryPrize(row, index);
  }

  return {
    ...row,
    name: String(row.name || '').trim(),
  };
};

const syncPrizesForCurrentMode = () => {
  fields.value.forEach((field, index) => {
    const normalized = normalizePrizeForCurrentMode(field.value, index);
    if (JSON.stringify(normalized) !== JSON.stringify(field.value)) {
      update(index, normalized);
    }
  });
};

watch(
  () => [category.value, subCategory.value, playMode.value, gameMode.value],
  () => {
    if (isScratchMode.value || isCustomLotteryMode.value) {
      syncPrizesForCurrentMode();
    }
  },
);

const openAddDialog = async () => {
  if (isScratchMode.value && fields.value.length >= 1) {
    const { openInfoDialog } = await import('@/utils/dialog/infoDialog');
    await openInfoDialog({
      title: '刮刮樂限制',
      message: '刮刮樂模式只能設定一個獎品（大獎）。',
      iconType: 'warning',
    });
    return;
  }

  const result = await openPrizeFormDialog({
    title: '新增獎品',
    data: {
      mode: 'add',
      isScratchPrize: isScratchMode.value,
      ...(isScratchMode.value || (isCustomLotteryMode.value && fields.value.length === 0)
        ? { prize: { _key: '', name: '', quantity: 1, level: 'GRAND', prizeType: 'physical', isLastPrize: false, isGrandPrize: true } }
        : {}),
    },
  });

  if (!result) return;

  push(normalizePrizeForCurrentMode(result, fields.value.length));
  syncPrizesForCurrentMode();
};

const openEditDialog = async (index: number) => {
  const prize = fields.value[index]?.value;

  if (!prize) return;

  const result = await openPrizeFormDialog({
    title: '編輯獎品',
    data: {
      mode: 'edit',
      isScratchPrize: isScratchMode.value,
      prize: {
        ...prize,
      },
    },
  });

  if (!result) return;
   const mergedPrize = mergeEditedPrize(prize, result);

  update(index, normalizePrizeForCurrentMode(mergedPrize , index));
  syncPrizesForCurrentMode();
};

const removePrize = (index: number) => {
  remove(index);
  syncPrizesForCurrentMode();
};

const showError = (field: string) => {
  if (!submitCount.value) return '';

  return errors.value[field] as string;
};

const getLevelLabel = (value?: string) => {
  return (
    levelOptions.find((item) => item.value === value)?.label || value || '-'
  );
};

const getPrizeTypeLabel = (value?: string) => {
  return (
    prizeTypeOptions.find((item) => item.value === value)?.label || value || '-'
  );
};

const mergeEditedPrize = (
  original: PrizeFormRow,
  edited: Partial<PrizeFormRow>
): PrizeFormRow => {
  return {
    ...original,
    ...edited,

    // 編輯既有獎品時，id / _key 不應該被 dialog 洗掉
    id: edited.id || original.id,
    _key: edited._key || original._key,
  };
};
</script>

<style scoped lang="scss">
.tab-lottery-prizes__hint {
  margin: 0 0 12px;
  color: #b45309;
  font-size: 14px;
  line-height: 1.6;
}
</style>

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
          <MButton
            type="button"
            size="sm"
            class="mbtn--gray"
            @click="generateFakePrizes"
          >
            <font-awesome-icon
              :icon="['fas', 'wand-magic-sparkles']"
              class="m-r-4"
            />
            快速產生假資料
          </MButton>

          <MButton type="button" size="sm" @click="openAddDialog">
            <font-awesome-icon :icon="['fas', 'plus']" class="m-r-4" />
            新增獎品
          </MButton>
        </div>
      </div>

      <div v-if="!fields.length" class="tab-lottery-prizes__empty">
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
import { useFieldArray, useFormContext } from 'vee-validate';

import MButton from '@/components/common/MButton.vue';
import NoData from '@/components/common/NoData.vue';
import FormSection from '@/components/common/FormSection.vue';

import { openPrizeFormDialog } from '@/utils/dialog/openPrizeFormDialog';
import type { PrizeFormRow } from '@/components/lottery/PrizeFormDialog.vue';

import { levelOptions, prizeTypeOptions } from '@/constants/lotteryOptions';

const { errors, submitCount } = useFormContext();

const { fields, push, remove, update } = useFieldArray<PrizeFormRow>('prizes');

const createKey = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2)}`;

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

/**
 * 測試用假資料
 * 實際串 API 後可移除 generateFakePrizes / fakePrizes / fakePrizeImages。
 */
const fakePrizeImages = [
  'https://picsum.photos/seed/prize-a/500/500',
  'https://picsum.photos/seed/prize-b/500/500',
  'https://picsum.photos/seed/prize-c/500/500',
  'https://picsum.photos/seed/prize-d/500/500',
  'https://picsum.photos/seed/prize-e/500/500',
  'https://picsum.photos/seed/prize-f/500/500',
  'https://picsum.photos/seed/prize-g/500/500',
  'https://picsum.photos/seed/prize-last/500/500',
];

const fakePrizes: PrizeFormRow[] = [
  {
    _key: createKey(),
    name: '限定模型公仔',
    quantity: 1,
    level: 'A',
    prizeType: 'physical',
    pointValue: undefined,
    prizeNumber: 'A-01',
    isLastPrize: false,
    isGrandPrize: true,
    orderNum: 1,
    imageUrl: fakePrizeImages[0],
    description: '主打大獎，適合放在最醒目的位置。',
  },
  {
    _key: createKey(),
    name: '角色抱枕',
    quantity: 2,
    level: 'B',
    prizeType: 'physical',
    pointValue: undefined,
    prizeNumber: 'B-01',
    isLastPrize: false,
    isGrandPrize: false,
    orderNum: 2,
    imageUrl: fakePrizeImages[1],
    description: '柔軟抱枕，適合作為中高階獎項。',
  },
  {
    _key: createKey(),
    name: '收藏立牌',
    quantity: 3,
    level: 'C',
    prizeType: 'physical',
    pointValue: undefined,
    prizeNumber: 'C-01',
    isLastPrize: false,
    isGrandPrize: false,
    orderNum: 3,
    imageUrl: fakePrizeImages[2],
    description: '角色立牌，可搭配系列收藏。',
  },
  {
    _key: createKey(),
    name: '隨機徽章',
    quantity: 8,
    level: 'D',
    prizeType: 'physical',
    pointValue: undefined,
    prizeNumber: 'D-01',
    isLastPrize: false,
    isGrandPrize: false,
    orderNum: 4,
    imageUrl: fakePrizeImages[3],
    description: '多款隨機徽章，適合大量配置。',
  },
  {
    _key: createKey(),
    name: '手機桌布序號',
    quantity: 10,
    level: 'E',
    prizeType: 'digital',
    pointValue: undefined,
    prizeNumber: 'E-01',
    isLastPrize: false,
    isGrandPrize: false,
    orderNum: 5,
    imageUrl: fakePrizeImages[4],
    description: '數位獎品，抽中後可派發兌換碼。',
  },
  {
    _key: createKey(),
    name: '會員點數 100 點',
    quantity: 5,
    level: 'F',
    prizeType: 'point',
    pointValue: 100,
    prizeNumber: 'F-01',
    isLastPrize: false,
    isGrandPrize: false,
    orderNum: 6,
    imageUrl: fakePrizeImages[5],
    description: '點數型獎品，適合補足獎池。',
  },
  {
    _key: createKey(),
    name: '紀念小卡',
    quantity: 12,
    level: 'G',
    prizeType: 'physical',
    pointValue: undefined,
    prizeNumber: 'G-01',
    isLastPrize: false,
    isGrandPrize: false,
    orderNum: 7,
    imageUrl: fakePrizeImages[6],
    description: '低階獎項，可增加抽獎豐富度。',
  },
  {
    _key: createKey(),
    name: '最後賞限定掛軸',
    quantity: 1,
    level: 'LAST',
    prizeType: 'physical',
    pointValue: undefined,
    prizeNumber: 'LAST-01',
    isLastPrize: true,
    isGrandPrize: false,
    orderNum: 8,
    imageUrl: fakePrizeImages[7],
    description: '最後一抽專屬獎品，提升玩家參與意願。',
  },
];

const generateFakePrizes = () => {
  fakePrizes.forEach((item, index) => {
    push({
      ...item,
      _key: createKey(),
      orderNum: fields.value.length + index + 1,
    });
  });
};
</script>

<style scoped lang="scss"></style>

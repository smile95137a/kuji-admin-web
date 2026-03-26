<template>
  <div class="lotteryWithPrizesForm__prizeCard">
    <!-- Header -->
    <div class="lotteryWithPrizesForm__prizeTop">
      <div class="lotteryWithPrizesForm__prizeTitle">
        <span>獎品 #{{ index + 1 }}</span>
        <span v-if="prize.id" class="lotteryWithPrizesForm__badge">已存在</span>
        <span
          class="lotteryWithPrizesForm__badge lotteryWithPrizesForm__badge--muted"
        >
          {{ localPrize.level || '-' }}
        </span>
      </div>

      <MButton
        size="sm"
        variant="danger"
        type="button"
        @click="$emit('remove')"
      >
        刪除
      </MButton>
    </div>

    <!-- Body: 左表單 / 右圖片 -->
    <div class="lotteryWithPrizesForm__prizeBody">
      <!-- Left -->
      <div class="lotteryWithPrizesForm__prizeLeft">
        <!-- 基本 -->
        <div class="lotteryWithPrizesForm__prizeSection">
          <p class="lotteryWithPrizesForm__prizeSectionTitle">基本</p>
          <div class="lotteryWithPrizesForm__grid">
            <div class="w-50 w-md-100 p-6">
              <FormInput label="獎品名稱" v-model="localPrize.name" required />
            </div>

            <div class="w-50 w-md-100 p-6">
              <FormSelect
                label="等級"
                v-model="localPrize.level"
                :options="levelOptions"
                placeholder="A / B / C / D / LAST"
              />
            </div>

            <div class="w-50 w-md-100 p-6">
              <FormSelect
                label="獎品類型"
                v-model="localPrize.prizeType"
                :options="prizeTypeOptions"
                placeholder="physical / digital / point"
              />
            </div>

            <div
              class="w-50 w-md-100 p-6"
              v-if="localPrize.prizeType === 'point'"
            >
              <FormInput
                label="點數金額（point 類型）"
                v-model="localPrize.pointValue"
                type="number"
              />
            </div>
          </div>
        </div>

        <!-- 數量/排序/籤號 -->
        <div class="lotteryWithPrizesForm__prizeSection">
          <p class="lotteryWithPrizesForm__prizeSectionTitle">規格</p>
          <div class="lotteryWithPrizesForm__grid">
            <div class="w-50 w-md-100 p-6">
              <FormInput
                label="數量"
                v-model="localPrize.quantity"
                type="number"
                required
              />
            </div>

            <div class="w-50 w-md-100 p-6" v-if="playMode === 'SCRATCH_MODE'">
              <FormInput
                label="籤號（刮刮樂模式用）"
                v-model="localPrize.prizeNumber"
                placeholder="01"
              />
            </div>
          </div>
        </div>

        <!-- 標記 -->
        <div class="lotteryWithPrizesForm__prizeSection">
          <p class="lotteryWithPrizesForm__prizeSectionTitle">標記</p>
          <div class="lotteryWithPrizesForm__grid">
            <div class="w-50 w-md-100 p-6">
              <FormSelect
                label="是否最後賞"
                v-model="localPrize.isLastPrize"
                :options="boolOptions"
              />
            </div>

            <div class="w-50 w-md-100 p-6">
              <FormSelect
                label="是否大賞（降價觸發）"
                v-model="localPrize.isGrandPrize"
                :options="boolOptions"
              />
            </div>
          </div>
        </div>

        <!-- 描述 -->
        <div class="lotteryWithPrizesForm__prizeSection">
          <p class="lotteryWithPrizesForm__prizeSectionTitle">描述</p>
          <div class="lotteryWithPrizesForm__grid">
            <div class="w-100 p-6">
              <FormInput
                label="獎品描述"
                v-model="localPrize.description"
                type="textarea"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Image -->
      <div class="lotteryWithPrizesForm__prizeRight">
        <UploadDropzone
          :label="`獎品圖片（#${index + 1}，1:1 裁切）`"
          accept="image/*"
          :disabled="uploading || cropOpen"
          :fileName="uploadFileName || ''"
          :errorMessage="uploadErrorMessage || null"
          :statusText="uploading ? '上傳中...' : cropOpen ? '裁切中...' : ''"
          :showDecorIcons="true"
          :showClear="true"
          @select="(file) => $emit('selectImage', file)"
          @clear="$emit('clearImage')"
        />

        <div
          v-if="localPrize.imageUrl"
          class="lotteryWithPrizesForm__prizePreviewWrap m-t-12"
        >
          <img
            :src="localPrize.imageUrl"
            alt="prize-preview"
            class="lotteryWithPrizesForm__prizePreview"
          />

          <!-- 右上角紅色叉叉（FontAwesome） -->
          <button
            type="button"
            class="lotteryWithPrizesForm__prizePreviewRemove"
            :disabled="uploading || cropOpen"
            aria-label="清除獎品圖片"
            @click="$emit('clearImage')"
          >
            <font-awesome-icon
              icon="fa-solid fa-xmark"
              class="lotteryWithPrizesForm__prizePreviewRemoveIcon"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import MButton from '@/components/common/MButton.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import UploadDropzone from '@/components/common/UploadDropzone.vue';

export type PrizeFormRow = {
  _key: string;
  id?: string;

  name: string;
  quantity: number;

  description?: string;
  imageUrl?: string;
  level?: string;

  prizeNumber?: string;
  prizeType?: string;
  pointValue?: number;

  isLastPrize?: boolean;
  isGrandPrize?: boolean;

  orderNum?: number;
};

const props = defineProps<{
  prize: PrizeFormRow;
  index: number;

  playMode: string;

  levelOptions: Array<{ label: string; value: any }>;
  prizeTypeOptions: Array<{ label: string; value: any }>;
  boolOptions: Array<{ label: string; value: any }>;

  uploading: boolean;
  cropOpen: boolean;

  uploadFileName?: string;
  uploadErrorMessage?: string | null;
}>();

const emit = defineEmits<{
  (e: 'update:prize', v: PrizeFormRow): void;
  (e: 'remove'): void;
  (e: 'selectImage', file: File): void;
  (e: 'clearImage'): void;
}>();

// 用 computed getter/setter 讓 v-model:prize 能「就地修改」
const localPrize = computed<PrizeFormRow>({
  get: () => props.prize,
  set: (v) => emit('update:prize', v),
});
</script>

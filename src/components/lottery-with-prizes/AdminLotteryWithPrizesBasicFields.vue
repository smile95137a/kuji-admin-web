<!-- src/components/lottery-with-prizes/AdminLotteryWithPrizesBasicFields.vue -->
<script setup lang="ts">
import { computed, watch } from 'vue';
import { useFormContext } from 'vee-validate';
import MCard from '@/components/common/MCard.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';

const props = defineProps<{
  storeOptions: SelectOption[];
  categoryOptions: SelectOption[];
  playModeOptions: SelectOption[];
  statusOptions: SelectOption[];
  boolOptions: SelectOption[];
}>();

const { defineField, errors } = useFormContext();

const [storeId] = defineField('storeId');

const [title] = defineField('title');
const [category] = defineField('category');
const [playMode] = defineField('playMode');
const [subCategory] = defineField('subCategory');
const [status] = defineField('status');

const [pricePerDraw] = defineField('pricePerDraw');
const [maxDraws] = defineField('maxDraws');

const [orderNum] = defineField('orderNum');
const [hotCount] = defineField('hotCount');
const [theme] = defineField('theme');
const [description] = defineField('description');

/** ✅ 這批從父層搬進來 */
const [tagsText] = defineField('tagsText');
const [remark] = defineField('remark');

const [scheduledAt] = defineField('scheduledAt');
const [startTime] = defineField('startTime');
const [endTime] = defineField('endTime');

const [discountedPrice] = defineField('discountedPrice');
const [autoDiscountEnabled] = defineField('autoDiscountEnabled');

const [allowMultiDraw] = defineField('allowMultiDraw');
const [multiDrawOptionsText] = defineField('multiDrawOptionsText');

const [bonusEnabled] = defineField('bonusEnabled');
const [bonusPointsPerDraw] = defineField('bonusPointsPerDraw');
const [bonusCostPerDraw] = defineField('bonusCostPerDraw');

const isCustomGacha = computed(() => category.value === 'CUSTOM_GACHA');

/** ✅ 刮刮樂才需要設定總抽數 */
const isScratchMode = computed(
  () => String(playMode.value || '') === 'SCRATCH_MODE',
);

/** ✅ 如果不是刮刮樂，就把 maxDraws 清掉，避免送錯 */
watch(
  isScratchMode,
  (yes) => {
    if (!yes) maxDraws.value = ''; // 或 0，看你後端怎麼定義
  },
  { immediate: true },
);
</script>
<template>
  <div class="basicFields">
    <!-- =========================
     * A. 基本資訊
     * ========================= -->
    <MCard class="basicFields__card">
      <div class="basicFields__header">
        <p class="basicFields__title">基本資訊</p>
      </div>

      <div class="flex">
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="所屬店家"
            v-model="storeId"
            :options="props.storeOptions"
            :error="errors.storeId"
            :showAll="true"
            allLabel="請選擇"
            :allValue="''"
          />
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="商品名稱"
            v-model="title"
            :error="errors.title"
            required
          />
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="分類"
            v-model="category"
            :options="props.categoryOptions"
            :error="errors.category"
            required
          />
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="遊玩模式"
            v-model="playMode"
            :options="props.playModeOptions"
            :error="errors.playMode"
          />
        </div>

        <div class="w-50 w-md-100 p-6" v-if="isCustomGacha">
          <FormSelect
            label="自製賞子類型（CUSTOM_GACHA）"
            v-model="subCategory"
            :options="props.playModeOptions"
            :error="errors.subCategory"
            placeholder="LOTTERY_MODE / SCRATCH_MODE"
          />
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="商品狀態"
            v-model="status"
            :options="props.statusOptions"
            :error="errors.status"
          />
        </div>
      </div>
    </MCard>

    <!-- =========================
     * B. 價格 / 抽數
     * ========================= -->
    <MCard class="basicFields__card">
      <div class="basicFields__header">
        <p class="basicFields__title">價格與抽數</p>
      </div>

      <div class="flex">
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="每抽價格"
            v-model="pricePerDraw"
            :error="errors.pricePerDraw"
            type="number"
            required
          />
        </div>

        <div class="w-50 w-md-100 p-6" v-if="isScratchMode">
          <FormInput
            label="總抽數上限（刮刮樂必填）"
            v-model="maxDraws"
            :error="errors.maxDraws"
            type="number"
            required
          />
        </div>
      </div>
    </MCard>

    <!-- =========================
     * C. 顯示 / 熱度 / 主題
     * ========================= -->
    <MCard class="basicFields__card">
      <div class="basicFields__header">
        <p class="basicFields__title">顯示與主題</p>
      </div>

      <div class="flex">
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="顯示排序（數字越小越前面）"
            v-model="orderNum"
            :error="errors.orderNum"
            type="number"
          />
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="熱門程度（熱門標籤用）"
            v-model="hotCount"
            :error="errors.hotCount"
            type="number"
          />
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="主題分類（火影/航海王/鬼滅等）"
            v-model="theme"
            :error="errors.theme"
          />
        </div>
      </div>
    </MCard>

    <!-- =========================
     * D. 活動時間 / 排程
     * ========================= -->
    <MCard class="basicFields__card">
      <div class="basicFields__header">
        <p class="basicFields__title">時間與排程</p>
      </div>

      <div class="flex">
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="定時上架時間（留空=手動上架）"
            v-model="scheduledAt"
            :error="errors.scheduledAt"
            type="datetime-local"
          />
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="活動開始時間"
            v-model="startTime"
            :error="errors.startTime"
            type="datetime-local"
          />
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="活動結束時間"
            v-model="endTime"
            :error="errors.endTime"
            type="datetime-local"
          />
        </div>
      </div>
    </MCard>

    <!-- =========================
     * E. 折扣設定
     * ========================= -->
    <MCard class="basicFields__card">
      <div class="basicFields__header">
        <p class="basicFields__title">折扣設定</p>
      </div>

      <div class="flex">
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="折扣價（大獎售完後）"
            v-model="discountedPrice"
            :error="errors.discountedPrice"
            type="number"
          />
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="大獎售完自動降價"
            v-model="autoDiscountEnabled"
            :options="props.boolOptions"
            :error="errors.autoDiscountEnabled"
          />
        </div>
      </div>
    </MCard>

    <!-- =========================
     * F. 多抽設定
     * ========================= -->
    <MCard class="basicFields__card">
      <div class="basicFields__header">
        <p class="basicFields__title">多抽設定</p>
      </div>

      <div class="flex">
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="允許多抽"
            v-model="allowMultiDraw"
            :options="props.boolOptions"
            :error="errors.allowMultiDraw"
          />
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="多抽選項（逗號分隔，例如：10,50）"
            v-model="multiDrawOptionsText"
            :error="errors.multiDrawOptionsText"
            placeholder="10,50"
          />
        </div>
      </div>
    </MCard>

    <!-- =========================
     * G. 紅利點數
     * ========================= -->
    <MCard class="basicFields__card">
      <div class="basicFields__header">
        <p class="basicFields__title">紅利點數</p>
      </div>

      <div class="flex">
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="是否啟用紅利點數"
            v-model="bonusEnabled"
            :options="props.boolOptions"
            :error="errors.bonusEnabled"
          />
        </div>

        <div class="w-50 w-md-100 p-6" v-if="bonusEnabled">
          <FormInput
            label="每抽贈送紅利點數"
            v-model="bonusPointsPerDraw"
            :error="errors.bonusPointsPerDraw"
            type="number"
          />
        </div>

        <div class="w-50 w-md-100 p-6" v-if="bonusEnabled">
          <FormInput
            label="每抽消耗紅利點數"
            v-model="bonusCostPerDraw"
            :error="errors.bonusCostPerDraw"
            type="number"
          />
        </div>
      </div>
    </MCard>

    <!-- =========================
     * H. 文案 / 標籤 / 備註
     * ========================= -->
    <MCard class="basicFields__card">
      <div class="basicFields__header">
        <p class="basicFields__title">文案與備註</p>
      </div>

      <div class="flex">
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="商品描述"
            v-model="description"
            :error="errors.description"
            type="textarea"
          />
        </div>

        <div class="w-100 p-6">
          <FormInput
            label="標籤（逗號分隔）"
            v-model="tagsText"
            :error="errors.tagsText"
            placeholder="鬼滅之刃, 一番賞, 熱門"
          />
        </div>

        <div class="w-100 p-6">
          <FormInput
            label="內部備註（不對外顯示）"
            v-model="remark"
            :error="errors.remark"
            type="textarea"
          />
        </div>
      </div>
    </MCard>
  </div>
</template>
<style lang="scss">
.basicFields {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 8px;
    margin-bottom: 4px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  &__title {
    font-size: 16px;
    font-weight: 800;
  }

  &__grid {
    display: flex;
    flex-wrap: wrap;
  }
}
</style>

<!-- src/components/lottery-with-prizes/AdminLotteryWithPrizesBasicFields.vue -->
<script setup lang="ts">
import { computed, watch } from 'vue';
import { useFormContext } from 'vee-validate';
import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';

const props = defineProps<{
  storeOptions: SelectOption[];
  categoryOptions: SelectOption[];
  subCategoryOptions: SelectOption[];
  gameModeOptions: SelectOption[];
  themeOptions: SelectOption[];
  statusOptions: SelectOption[];
  boolOptions: SelectOption[];
  isAdmin?: boolean;
}>();

const { defineField, errors } = useFormContext();

const [storeId] = defineField('storeId');

const [title] = defineField('title');
const [category] = defineField('category');
const [subCategory] = defineField('subCategory');
const [playMode] = defineField('playMode');
const [gameMode] = defineField('gameMode');
const [designatedPrizeNumbers] = defineField('designatedPrizeNumbers');
const [status] = defineField('status');

const [pricePerDraw] = defineField('pricePerDraw');
const [maxDraws] = defineField('maxDraws');

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

// 自動帶入店家（非 admin 且只有一間店）
watch(
  () => props.storeOptions,
  (opts) => {
    if (props.isAdmin === false && opts.length === 1 && !storeId.value) {
      storeId.value = opts[0]?.value ?? '';
    }
  },
  { immediate: true },
);

// 常用標籤
 const presetTags = ['熱門', '限定', '新品', '特價', '日系', '限量', '經典', '聯名', '徵貨中', '特別版'];
const addTag = (tag: string) => {
  const current = (tagsText.value || '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);
  if (!current.includes(tag)) {
    current.push(tag);
    tagsText.value = current.join(',');
  }
};

// 常用備註
const presetRemarks = ['全新商品', '客服補發', '活動加碼', '限時特價', '場地限定', '自製賞', '注意事項請詳閱說明'];
const addRemark = (r: string) => {
  const current = (remark.value || '').trim();
  remark.value = current ? `${current}\n${r}` : r;
};

const isCustomGacha = computed(() => category.value === 'CUSTOM_GACHA');

/** 刮刮樂模式：以 subCategory 為依據，不再依賴 playMode 的選取 */
const isScratchMode = computed(
  () => String(subCategory.value || '') === 'SCRATCH_MODE',
);

/** 同步 playMode （方便 PrizeFormCard 等使用 playMode 的地方） */
watch(
  isScratchMode,
  (yes) => {
    playMode.value = yes ? 'SCRATCH_MODE' : 'LOTTERY_MODE';
  },
  { immediate: true },
);

/** 分類不是 CUSTOM_GACHA 時，清除 subCategory */
watch(
  isCustomGacha,
  (yes) => {
    if (!yes) subCategory.value = '';
  },
);

const isScratchStore = computed(
  () => isScratchMode.value && String(gameMode.value || '') === 'SCRATCH_STORE',
);

/** ✅ 刮刮樂才需要設定總抽數 */
watch(
  isScratchMode,
  (yes) => {
    if (!yes) {
      maxDraws.value = '';
      gameMode.value = '';
      designatedPrizeNumbers.value = '';
    }
  },
  { immediate: true },
);

/** ✅ 如果不是 SCRATCH_STORE，就清掉 designatedPrizeNumbers */
watch(
  () => gameMode.value,
  (val) => {
    if (String(val || '') !== 'SCRATCH_STORE') {
      designatedPrizeNumbers.value = '';
    }
  },
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
          <!-- 管理員 or 多店：下拉選單 -->
          <FormSelect
            v-if="props.isAdmin !== false || props.storeOptions.length > 1"
            label="所屬店家"
            v-model="storeId"
            :options="props.storeOptions"
            :error="errors.storeId"
            :showAll="true"
            allLabel="請選擇"
            :allValue="''"
          />
          <!-- 非管理員且只有一間店：顯示店家名稱（唯讀） -->
          <FormInput
            v-else
            label="所屬店家"
            :modelValue="props.storeOptions[0]?.label ?? '-'"
            disabled
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

        <div class="w-50 w-md-100 p-6" v-if="isCustomGacha">
          <FormSelect
            label="自製賞子分類"
            v-model="subCategory"
            :options="props.subCategoryOptions"
            :error="errors.subCategory"
            :showAll="true"
            allLabel="請選擇"
            :allValue="''"
          />
        </div>

        <div class="w-50 w-md-100 p-6" v-if="isScratchMode">
          <FormSelect
            label="遊戲模式（刮刮樂大獎策略）"
            v-model="gameMode"
            :options="props.gameModeOptions"
            :error="errors.gameMode"
            :showAll="true"
            allLabel="請選擇"
            :allValue="''"
          />
        </div>

        <div class="w-100 w-md-100 p-6" v-if="isScratchStore">
          <FormInput
            label="指定大獎號碼（designatedPrizeNumbers，JSON 格式）"
            v-model="designatedPrizeNumbers"
            :error="errors.designatedPrizeNumbers"
            type="textarea"
            placeholder='[{"revealedNumber": 42, "prizeId": "uuid"}, ...]'
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
          <FormSelect
            label="主題分類（火影/航海王/鬼滅等）"
            v-model="theme"
            :options="props.themeOptions"
            :error="errors.theme"
            :showAll="true"
            allLabel="請選擇"
            :allValue="''"
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
            placeholder="系統自動計算"
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
          <p class="form__text">商品標籤</p>
          <div class="flex flex-wrap gap-8 m-t-4 m-b-8">
            <button
              v-for="tag in presetTags"
              :key="tag"
              type="button"
              class="basicFields__presetBtn"
              @click="addTag(tag)"
            >
              {{ tag }}
            </button>
          </div>
          <FormInput
            label="已選標籤（可直接編輯，逗號分隔）"
            v-model="tagsText"
            :error="errors.tagsText"
            placeholder="熱門, 限定, 日系..."
          />
        </div>

        <div class="w-100 p-6">
          <p class="form__text">內部備註（不對外顯示）</p>
          <div class="flex flex-wrap gap-8 m-t-4 m-b-8">
            <button
              v-for="r in presetRemarks"
              :key="r"
              type="button"
              class="basicFields__presetBtn basicFields__presetBtn--secondary"
              @click="addRemark(r)"
            >
              {{ r }}
            </button>
          </div>
          <FormInput
            label="備註"
            v-model="remark"
            :error="errors.remark"
            type="textarea"
            placeholder="點選常用備註或直接輸入..."
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

  &__presetBtn {
    padding: 4px 10px;
    border: 1px solid var(--color-primary, #6366f1);
    border-radius: 20px;
    background: transparent;
    color: var(--color-primary, #6366f1);
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;

    &:hover {
      background: var(--color-primary, #6366f1);
      color: #fff;
    }

    &--secondary {
      border-color: var(--color-secondary, #64748b);
      color: var(--color-secondary, #64748b);

      &:hover {
        background: var(--color-secondary, #64748b);
        color: #fff;
      }
    }
  }
}
</style>

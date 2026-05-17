<template>
  <div v-if="show" class="designate-modal__overlay" @click.self="emit('close')">
    <div class="designate-modal__box">
      <div class="designate-modal__header">
        <p class="designate-modal__title">{{ modalTitle }}｜{{ lotteryName }}</p>
      </div>

      <div class="designate-modal__body">
        <div
          v-if="loadingLottery"
          class="designate-modal__hint designate-modal__hint--info m-b-12"
        >
          讀取商品資料中...
        </div>

        <div
          v-else-if="!resolvedGameMode"
          class="designate-modal__hint designate-modal__hint--error m-b-12"
        >
          無法判斷目前的刮刮樂模式，請重新整理後再試。
        </div>

        <div
          v-else-if="needsGrandPrize && !resolvedGrandPrizeId"
          class="designate-modal__hint designate-modal__hint--error m-b-12"
        >
          找不到大獎資料，請先確認商品獎項設定後再指定號碼。
        </div>

        <template v-else>
          <p class="form__text m-b-12">{{ modeDescription }}</p>

          <div
            v-if="maxDraws === 1"
            class="designate-modal__hint designate-modal__hint--info m-b-12"
          >
            此商品只有 1 個號碼，系統會自動指定為 1。
          </div>

          <div v-if="maxDraws > 1" class="m-b-8">
            <label class="form__label">指定號碼</label>
            <input
              v-model.number="prizeNumber"
              type="number"
              class="designate-modal__input"
              :min="1"
              :max="maxDraws"
              @input="validateInput"
              placeholder="請輸入 1 到最大抽數之間的整數"
            />
            <p v-if="inputError" class="error-text m-t-4">{{ inputError }}</p>
          </div>
        </template>
      </div>

      <div class="designate-modal__footer">
        <MButton variant="secondary" :disabled="submitting" @click="emit('close')">
          取消
        </MButton>
        <MButton :disabled="!canConfirm || submitting" @click="handleConfirm">
          確認指定
        </MButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import MButton from '@/components/common/MButton.vue';
import { executeApi } from '@/utils/executeApiUtils';
import {
  designatePrize,
  getLotteryWithPrizes,
  updateLotteryWithPrizes,
} from '@/services/adminLotteryWithPrizesService';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';

const props = defineProps<{
  show: boolean;
  lotteryId: string;
  lotteryName: string;
  maxDraws: number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const prizeNumber = ref<number | null>(null);
const inputError = ref('');
const submitting = ref(false);
const loadingLottery = ref(false);
const resolvedGrandPrizeId = ref('');
const resolvedGameMode = ref('');

const isScratchStoreMode = computed(
  () => resolvedGameMode.value === 'SCRATCH_STORE',
);
const isScratchPlayerMode = computed(
  () => resolvedGameMode.value === 'SCRATCH_PLAYER',
);
const needsGrandPrize = computed(
  () => isScratchStoreMode.value || isScratchPlayerMode.value,
);
const modalTitle = computed(() =>
  isScratchStoreMode.value ? '店家指定大獎號碼' : '玩家指定大獎位置',
);
const modeDescription = computed(() => {
  if (isScratchStoreMode.value) {
    return `請設定店家指定的大獎號碼。可指定範圍為 1 ~ ${props.maxDraws}。`;
  }
  return `請設定玩家指定的大獎位置。可指定範圍為 1 ~ ${props.maxDraws}。`;
});

watch(
  () => props.show,
  async (show) => {
    if (!show) return;

    prizeNumber.value = props.maxDraws === 1 ? 1 : null;
    inputError.value = '';
    submitting.value = false;
    loadingLottery.value = true;
    resolvedGrandPrizeId.value = '';
    resolvedGameMode.value = '';

    try {
      const res = await getLotteryWithPrizes(props.lotteryId);
      const data = (res as any)?.data ?? res;
      const prizes: any[] = Array.isArray(data?.prizes) ? data.prizes : [];
      const grandPrize = prizes.find((p: any) => p.isGrandPrize === true);

      resolvedGrandPrizeId.value = grandPrize?.id ?? '';
      resolvedGameMode.value = String(
        data?.lottery?.gameMode ?? data?.gameMode ?? '',
      ).toUpperCase();

      const designated = data?.lottery?.designatedPrizeNumbers ?? data?.designatedPrizeNumbers;
      const currentNumber = Array.isArray(designated)
        ? designated[0]
        : String(designated ?? '')
            .replace(/[\[\]\s]/g, '')
            .split(',')
            .find(Boolean);
      if (currentNumber) {
        const parsed = Number(currentNumber);
        if (Number.isInteger(parsed) && parsed >= 1 && parsed <= props.maxDraws) {
          prizeNumber.value = parsed;
        }
      }
    } catch {
      resolvedGameMode.value = '';
      resolvedGrandPrizeId.value = '';
    } finally {
      loadingLottery.value = false;
    }
  },
);

const validateInput = () => {
  const value = prizeNumber.value;
  if (value == null || String(value) === '') {
    inputError.value = '';
    return;
  }
  if (!Number.isInteger(value) || value < 1 || value > props.maxDraws) {
    inputError.value = `請輸入 1 到 ${props.maxDraws} 的整數`;
    return;
  }
  inputError.value = '';
};

const canConfirm = computed(() => {
  if (loadingLottery.value || !resolvedGameMode.value) return false;
  if (needsGrandPrize.value && !resolvedGrandPrizeId.value) return false;
  if (props.maxDraws === 1) return true;
  return prizeNumber.value != null && !inputError.value;
});

const updateScratchStoreDesignation = async (num: number) => {
  await updateLotteryWithPrizes(props.lotteryId, {
    lottery: {
      designatedPrizeNumbers: String(num),
    },
  });
};

const designateScratchPlayerPrize = async (num: number) => {
  await designatePrize(props.lotteryId, {
    designations: [
      {
        revealedNumber: num,
        prizeId: resolvedGrandPrizeId.value,
      },
    ],
  });
};

const handleConfirm = async () => {
  if (!canConfirm.value || submitting.value) return;

  const num = props.maxDraws === 1 ? 1 : prizeNumber.value!;
  const ok = await openConfirmDialog({
    title: modalTitle.value,
    message: isScratchStoreMode.value
      ? `確認將店家指定的大獎號碼設為 ${num} 嗎？若商品已產生籤位，系統會依既有規則清除並待重新生成。`
      : `確認將玩家指定的大獎位置設為 ${num} 嗎？`,
  });
  if (!ok) return;

  submitting.value = true;
  await executeApi({
    fn: async () => {
      if (isScratchStoreMode.value) {
        await updateScratchStoreDesignation(num);
        return { success: true, data: null, message: '店家指定的大獎號碼已更新' };
      }

      await designateScratchPlayerPrize(num);
      return { success: true, data: null, message: '玩家指定的大獎位置已更新' };
    },
    onSuccess: () => {
      emit('success');
    },
    onFail: (err: any) => {
      inputError.value = err?.message ?? '指定失敗，請稍後再試';
    },
    showSuccessDialog: false,
  });
  submitting.value = false;
};
</script>

<style scoped>
.designate-modal__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.designate-modal__box {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  width: 420px;
  max-width: 94vw;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.designate-modal__header {
  padding: 18px 24px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.designate-modal__title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.designate-modal__body {
  padding: 20px 24px;
}

.designate-modal__footer {
  padding: 12px 24px 18px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid #f0f0f0;
}

.designate-modal__input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.designate-modal__input:focus {
  border-color: #4a90e2;
}

.designate-modal__hint {
  padding: 10px 14px;
  border-radius: 4px;
  font-size: 13px;
}

.designate-modal__hint--info {
  background: #e6f7ff;
  border-left: 4px solid #1890ff;
  color: #005a99;
}

.designate-modal__hint--error {
  background: #fff2f0;
  border-left: 4px solid #ff4d4f;
  color: #a8071a;
}

.error-text {
  color: #cf1322;
  font-size: 12px;
}
</style>

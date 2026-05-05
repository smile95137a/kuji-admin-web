<!-- src/components/lottery-with-prizes/DesignatePrizeModal.vue -->
<template>
  <div v-if="show" class="designate-modal__overlay" @click.self="emit('close')">
    <div class="designate-modal__box">
      <!-- Header -->
      <div class="designate-modal__header">
        <p class="designate-modal__title">指定大獎號碼 — {{ lotteryName }}</p>
      </div>

      <!-- Body -->
      <div class="designate-modal__body">
        <!-- 載入大獎資訊中 -->
        <div
          v-if="fetchingPrizeId"
          class="designate-modal__hint designate-modal__hint--info m-b-12"
        >
          載入獎品資訊中，請稍候…
        </div>

        <!-- 無法取得大獎 prizeId -->
        <div
          v-else-if="!resolvedGrandPrizeId"
          class="designate-modal__hint designate-modal__hint--error m-b-12"
        >
          ⚠️ 無法取得大獎資訊，請確認商品已設定「大獎（isGrandPrize）」後重新開啟。
        </div>

        <template v-else>
          <p class="form__text m-b-12">
            請選擇大獎對應的籤號（1 ~ {{ maxDraws }}），指定後無法更改。
          </p>

          <!-- maxDraws=1 auto-select hint -->
          <div
            v-if="maxDraws === 1"
            class="designate-modal__hint designate-modal__hint--info m-b-12"
          >
            僅有 1 個籤號，已自動選取第 1 號。
          </div>

          <!-- Number input (hidden when maxDraws=1) -->
          <div v-if="maxDraws > 1" class="m-b-8">
            <label class="form__label">籤號</label>
            <input
              type="number"
              class="designate-modal__input"
              :min="1"
              :max="maxDraws"
              v-model.number="prizeNumber"
              @input="validateInput"
              placeholder="請輸入號碼"
            />
            <p v-if="inputError" class="error-text m-t-4">{{ inputError }}</p>
          </div>
        </template>
      </div>

      <!-- Footer -->
      <div class="designate-modal__footer">
        <MButton
          variant="secondary"
          @click="emit('close')"
          :disabled="submitting"
          >取消</MButton
        >
        <MButton :disabled="!canConfirm || submitting" @click="handleConfirm"
          >確認</MButton
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import MButton from '@/components/common/MButton.vue';
import { useDialogStore } from '@/stores';
import { executeApi } from '@/utils/executeApiUtils';
import { designatePrize, getLotteryWithPrizes } from '@/services/adminLotteryWithPrizesService';
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

const dialogStore = useDialogStore();

const prizeNumber = ref<number | null>(null);
const inputError = ref('');
const submitting = ref(false);
const fetchingPrizeId = ref(false);
const resolvedGrandPrizeId = ref('');

/* T005 — maxDraws=1 auto-select; also reset state on modal open */
watch(
  () => props.show,
  async (val) => {
    if (val) {
      if (props.maxDraws === 1) {
        prizeNumber.value = 1;
        inputError.value = '';
      } else {
        prizeNumber.value = null;
        inputError.value = '';
      }
      submitting.value = false;

      // 取得大獎 prizeId（新 designations 格式必要欄位）
      fetchingPrizeId.value = true;
      resolvedGrandPrizeId.value = '';
      try {
        const res = await getLotteryWithPrizes(props.lotteryId);
        const data = (res as any)?.data ?? res;
        const prizes: any[] = Array.isArray(data?.prizes) ? data.prizes : [];
        const grandPrize = prizes.find((p: any) => p.isGrandPrize === true);
        resolvedGrandPrizeId.value = grandPrize?.id ?? '';
      } catch {
        resolvedGrandPrizeId.value = '';
      } finally {
        fetchingPrizeId.value = false;
      }
    }
  },
);

/* T004 — Real-time validation */
const validateInput = () => {
  const v = prizeNumber.value;
  if (v === null || v === undefined || String(v) === '') {
    inputError.value = '';
    return;
  }
  if (!Number.isInteger(v) || v < 1 || v > props.maxDraws) {
    inputError.value = `請輸入 1 到 ${props.maxDraws} 之間的號碼`;
  } else {
    inputError.value = '';
  }
};

const canConfirm = computed(() => {
  if (fetchingPrizeId.value || !resolvedGrandPrizeId.value) return false;
  if (props.maxDraws === 1) return true;
  return prizeNumber.value !== null && !inputError.value;
});

/* T006 — Confirm → double-confirm → API call */
const handleConfirm = async () => {
  if (!canConfirm.value || submitting.value) return;

  const num = props.maxDraws === 1 ? 1 : prizeNumber.value!;

  const ok = await openConfirmDialog({
    title: '確認指定',
    message: `確定將第 ${num} 號指定為大獎？指定後系統將自動將其餘籤號設為銘謝惠顧，且此操作不可撤銷。`,
  });
  if (!ok) return;

  submitting.value = true;
  await executeApi({
    fn: () => designatePrize(props.lotteryId, {
      designations: [{ revealedNumber: num, prizeId: resolvedGrandPrizeId.value }],
    }),
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
  color: #dc2626;
  font-size: 12px;
}
</style>

<!-- src/views/lotteryPrize/LotteryPrizeForm.vue -->
<template>
  <MCard>
    <form @submit.prevent="onSubmit">
      <p class="form__text form__text--title">
        獎項 {{ isEdit ? '編輯' : '新增' }}
      </p>

      <div class="form__text m-b-12">
        商品 ID：<b>{{ lotteryId }}</b>
      </div>

      <div class="flex flex-wrap">
        <!-- 大獎勾選（刮刮樂專用） T009 -->
        <div v-if="isScratch" class="w-50 w-md-100 p-6">
          <FormSelect
            label="此為大獎（isGrandPrize）"
            v-model="isGrandPrize"
            :options="boolOptions"
          />
        </div>

        <!-- 等級 T010 -->
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            v-if="isScratch && isGrandPrize"
            label="等級"
            v-model="level"
            :options="levelOptions"
            placeholder="A / B / ... / GRAND"
          />
          <FormInput
            v-else
            label="獎項等級（level）"
            v-model="level"
            :error="errors.level"
            placeholder="例如：A / B / C / D / LAST"
            required
          />
        </div>

        <!-- 名稱 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="獎項名稱（name）"
            v-model="name"
            :error="errors.name"
            placeholder="例如：A賞 - 超大公仔"
            required
          />
        </div>

        <!-- 圖片 -->
        <div class="w-100 p-6">
          <FormInput
            label="圖片 URL（imageUrl）"
            v-model="imageUrl"
            :error="errors.imageUrl"
            placeholder="https://..."
            @blur="syncPreviewFromUrl"
            required
          />

          <div v-if="imagePreview" class="m-t-12">
            <img
              :src="imagePreview"
              alt="preview"
              style="max-width: 240px; border-radius: 8px"
            />
          </div>
        </div>

        <!-- 數量 T011 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="總數量（totalQuantity）"
            v-model="totalQuantity"
            :error="errors.totalQuantity"
            type="number"
            placeholder="例如：10"
            required
            :disabled="isGrandPrize === true"
          />
          <p
            v-if="isGrandPrize === true"
            class="form__text m-t-4"
            style="color: #888; font-size: 12px"
          >
            大獎數量固定為 1
          </p>
        </div>

        <!-- 權重 -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="權重（weight）"
            v-model="weight"
            :error="errors.weight"
            type="number"
            placeholder="例如：1"
          />
        </div>
      </div>

      <div class="flex justify-center m-y-12 gap-x-12 flex-wrap">
        <MButton
          v-if="isDev"
          type="button"
          class="mbtn--gray"
          @click="fillMockData"
        >
          快速產生資料
        </MButton>

        <MButton type="submit">
          {{ isEdit ? '更新' : '新增' }}
        </MButton>

        <MButton type="button" class="mbtn--red" @click="router.back()">
          返回
        </MButton>
      </div>
    </form>
  </MCard>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import * as yup from 'yup';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { useDialogStore } from '@/stores';

import {
  createPrize,
  updatePrize,
  getPrizeById,
} from '@/services/adminLotteryPrizeService';

import { getLotteryWithPrizes } from '@/services/adminLotteryWithPrizesService';

import { levelOptions, boolOptions } from '@/constants/lotteryOptions';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

const route = useRoute();
const router = useRouter();
const dialogStore = useDialogStore();

const lotteryId = computed(() => String(route.params.lotteryId || ''));
const prizeId = computed(() => String(route.params.prizeId || ''));

const isEdit = computed(() => Boolean(prizeId.value));
const isDev = import.meta.env.DEV;

/* T007 — gameMode state */
const gameMode = ref('');
const isScratch = computed(
  () =>
    gameMode.value === 'SCRATCH_STORE' || gameMode.value === 'SCRATCH_PLAYER',
);

/* T009 — isGrandPrize local ref (not a form field, but passed in payload) */
const isGrandPrize = ref<boolean>(false);

/* schema（先用通用欄位） */
const schema = yup.object({
  level: yup.string().required('等級不能為空'),
  name: yup.string().required('獎項名稱不能為空'),
  imageUrl: yup.string().required('圖片 URL 不能為空'),
  totalQuantity: yup
    .number()
    .typeError('總數量必須是數字')
    .required('總數量不能為空'),
  weight: yup
    .number()
    .typeError('權重必須是數字')
    .nullable()
    .transform((v, o) =>
      o === '' || o === null || o === undefined ? null : v,
    ),
});

const { errors, handleSubmit, setValues, defineField } = useForm({
  validationSchema: schema,
  initialValues: {
    level: '',
    name: '',
    imageUrl: '',
    totalQuantity: 1,
    weight: null as number | null,
  },
});

const [level] = defineField('level');
const [name] = defineField('name');
const [imageUrl] = defineField('imageUrl');
const [totalQuantity] = defineField('totalQuantity');
const [weight] = defineField('weight');

const imagePreview = ref('');

/* T011 — lock totalQuantity=1 when isGrandPrize=true */
watch(isGrandPrize, (val) => {
  if (val === true) {
    totalQuantity.value = 1;
  }
});

const syncPreviewFromUrl = () => {
  imagePreview.value = imageUrl.value || '';
};

const fillMockData = async () => {
  const ts = Date.now();
  setValues({
    level: 'A',
    name: `測試獎項_${ts}`,
    imageUrl: 'https://picsum.photos/seed/prize/800/600',
    totalQuantity: 10,
    weight: 1,
  });

  imagePreview.value = 'https://picsum.photos/seed/prize/800/600';

  await openInfoDialog({
    title: '提示訊息',
    message: '已帶入測試資料',
    iconType: 'success',
  });
};

const loadDetail = async () => {
  if (!isEdit.value) return;

  await executeApi({
    fn: async () => getPrizeById(prizeId.value),
    onSuccess: (data) => {
      const d = (data as any)?.data ?? data;

      setValues({
        level: d?.level ?? '',
        name: d?.name ?? '',
        imageUrl: d?.imageUrl ?? '',
        totalQuantity: d?.totalQuantity ?? 1,
        weight: d?.weight ?? null,
      });

      /* T009 — load isGrandPrize from existing prize */
      isGrandPrize.value = d?.isGrandPrize ?? false;

      imagePreview.value = d?.imageUrl ?? '';
    },
    showSuccessDialog: false,
  });
};

/* T007 — fetch gameMode from parent lottery */
const loadGameMode = async () => {
  if (!lotteryId.value) return;
  try {
    const res = await getLotteryWithPrizes(lotteryId.value);
    const data = (res as any)?.data ?? res;
    gameMode.value = data?.gameMode ?? '';
  } catch {
    gameMode.value = '';
  }
};

const onSubmit = handleSubmit(async (values) => {
  const ok = await openConfirmDialog({
    title: '儲存確認',
    message: `確定要${isEdit.value ? '更新' : '新增'}獎項嗎？`,
  });
  if (!ok) return;

  /* T012 — include isGrandPrize in payload */
  const payload = {
    lotteryId: lotteryId.value,
    level: values.level?.trim(),
    name: values.name?.trim(),
    imageUrl: values.imageUrl?.trim(),
    totalQuantity: Number(values.totalQuantity),
    weight: values.weight ?? null,
    isGrandPrize: isGrandPrize.value,
  };

  await executeApi({
    fn: async () => {
      if (isEdit.value) {
        return updatePrize(prizeId.value, payload);
      }
      return createPrize(lotteryId.value, payload);
    },
    onSuccess: async () => {
      await openInfoDialog({
        title: '提示訊息',
        message: '儲存成功',
        iconType: 'success',
      });
      router.push(`/home/lottery/${lotteryId.value}/prizes`);
    },
  });
});

onMounted(async () => {
  await loadGameMode();
  await loadDetail();
});
</script>

<style scoped></style>

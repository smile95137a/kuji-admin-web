<!-- src/views/marquee/MarqueeForm.vue -->
<template>
  <MCard>
    <form @submit.prevent="onSubmit">
      <p class="form__text form__text--title">
        跑馬燈 {{ isEdit ? '編輯' : '新增' }}
      </p>

      <div class="flex flex-wrap">
        <!-- 內容 -->
        <div class="w-100 p-6">
          <FormInput
            label="內容"
            v-model="content"
            :error="errors.content"
            required
            maxlength="200"
            placeholder="跑馬燈文字內容"
          />
        </div>

        <!-- 連結類型 -->
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="連結類型"
            v-model="linkType"
            :options="linkTypeOptions"
            :error="errors.linkType"
            :showAll="true"
            allLabel="無（不帶連結）"
            :allValue="''"
          />
        </div>

        <!-- 連結 URL -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="連結 URL（可選）"
            v-model="linkUrl"
            :error="errors.linkUrl"
            placeholder="https://example.com"
          />
        </div>

        <!-- priority -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="優先序（priority）"
            v-model="priority"
            :error="errors.priority"
            type="number"
            placeholder="數字越大越優先"
          />
        </div>

        <!-- isActive -->
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="是否啟用"
            v-model="isActive"
            :options="activeOptions"
            :error="errors.isActive"
          />
        </div>

        <!-- bgColor -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="背景顏色（bgColor）"
            v-model="bgColor"
            :error="errors.bgColor"
            placeholder="#FF6600"
          />
        </div>

        <!-- textColor -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="文字顏色（textColor）"
            v-model="textColor"
            :error="errors.textColor"
            placeholder="#FFFFFF"
          />
        </div>

        <!-- startTime -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="開始顯示時間"
            type="datetime-local"
            v-model="startTime"
            :error="errors.startTime"
          />
        </div>

        <!-- endTime -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="結束顯示時間"
            type="datetime-local"
            v-model="endTime"
            :error="errors.endTime"
          />
        </div>
      </div>

      <!-- bottom buttons -->
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
import { computed, onMounted } from 'vue';
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
  getMarqueeById,
  createMarquee,
  updateMarquee,
} from '@/services/adminMarqueeService';

const route = useRoute();
const router = useRouter();
const dialogStore = useDialogStore();

const isEdit = computed(() => Boolean(route.params.id));
const id = computed(() => String(route.params.id || ''));

const isDev = import.meta.env.DEV;

/**
 * ✅ linkType：後端註解為 INTERNAL / EXTERNAL
 * 這裡允許空字串代表「不帶連結」（payload 會轉成 null）
 */
const linkTypeOptions: SelectOption[] = [
  { label: '外部連結（EXTERNAL）', value: 'EXTERNAL' },
  { label: '內部路由（INTERNAL）', value: 'INTERNAL' },
];

/**
 * ✅ isActive：後端要 Boolean
 * 但後端查詢回來可能是 1/0
 */
const activeOptions: SelectOption[] = [
  { label: '停用', value: false },
  { label: '啟用', value: true },
];

/**
 * ✅ 防地雷：避免 Boolean('false') === true
 */
const normalizeIsActive = (v: any) => {
  if (v === true || v === false) return v;

  if (v === 1) return true;
  if (v === 0) return false;

  const s = String(v ?? '')
    .trim()
    .toLowerCase();
  if (s === 'true' || s === '1') return true;
  if (s === 'false' || s === '0') return false;

  return false;
};

/**
 * ✅ linkType 空字串 → null
 */
const normalizeLinkType = (v: any) => {
  const s = String(v ?? '').trim();
  return s ? s : null;
};

/**
 * ✅ datetime-local：
 * input: 2026-01-15T10:30
 * backend LocalDateTime: 2026-01-15T10:30:00
 */
const normalizeToBackendLocalDateTime = (v?: string | null) => {
  if (!v) return null;
  if (v.length === 16) return `${v}:00`;
  return v;
};

const normalizeToDatetimeLocalInput = (v?: string | null) => {
  if (!v) return '';
  return v.length >= 16 ? v.slice(0, 16) : v;
};

/**
 * ✅ mock helper：產生 datetime-local 格式（不含秒）
 */
const pad2 = (n: number) => String(n).padStart(2, '0');
const toDatetimeLocal = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
};

/**
 * ✅ schema（依你的 req 調整）
 * - content 必填
 * - linkType 可空（空=不帶連結）
 * - linkType 有值時，linkUrl 建議必填
 * - priority 數字（越大越優先）
 * - start/end 可空
 * - isActive boolean
 */
const schema = yup.object({
  content: yup.string().required('內容不能為空'),
  linkType: yup
    .string()
    .nullable()
    .transform((v) => normalizeLinkType(v)), // ✅ '' 轉 null
  linkUrl: yup
    .string()
    .nullable()
    .when('linkType', {
      is: (v: any) => !!v,
      then: (s) => s.required('選了連結類型時，連結 URL 建議要填'),
      otherwise: (s) => s.notRequired(),
    }),
  priority: yup
    .number()
    .typeError('優先序必須是數字')
    .nullable()
    .transform((v, o) =>
      o === '' || o === null || o === undefined ? null : v
    ),
  bgColor: yup.string().nullable(),
  textColor: yup.string().nullable(),
  startTime: yup.string().nullable(),
  endTime: yup.string().nullable(),
  isActive: yup
    .mixed()
    .transform((v) => normalizeIsActive(v))
    .oneOf([true, false], '請選擇狀態')
    .required('請選擇狀態'),
});

/* useForm */
const { errors, handleSubmit, setValues, defineField } = useForm({
  validationSchema: schema,
  initialValues: {
    content: '',
    linkType: '', // ✅ 空字串代表無連結
    linkUrl: '',
    priority: 0,
    bgColor: '#FF6600',
    textColor: '#FFFFFF',
    startTime: '',
    endTime: '',
    isActive: true,
  },
});

/* defineField */
const [content] = defineField('content');
const [linkType] = defineField('linkType');
const [linkUrl] = defineField('linkUrl');
const [priority] = defineField('priority');
const [bgColor] = defineField('bgColor');
const [textColor] = defineField('textColor');
const [startTime] = defineField('startTime');
const [endTime] = defineField('endTime');
const [isActive] = defineField('isActive');

/* edit init */
onMounted(async () => {
  if (!isEdit.value) return;

  await executeApi({
    fn: async () => getMarqueeById(id.value),
    onSuccess: (data) => {
      // ✅ 你的回傳是 { success, data, ... } → executeApi 可能已拆 data
      const d = (data as any)?.data ?? data;

      setValues({
        content: d?.content ?? '',
        linkType: d?.linkType ?? '', // 若後端為 null → 這裡用 '' 回填
        linkUrl: d?.linkUrl ?? '',
        priority: d?.priority ?? 0,
        bgColor: d?.bgColor ?? '#FF6600',
        textColor: d?.textColor ?? '#FFFFFF',
        startTime: normalizeToDatetimeLocalInput(d?.startTime),
        endTime: normalizeToDatetimeLocalInput(d?.endTime),
        isActive: normalizeIsActive(d?.isActive), // ✅ 1/0 → boolean
      });
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
});

/* mock：每個欄位都帶入 ✅ */
const fillMockData = async () => {
  const ts = Date.now();

  const now = new Date();
  const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  setValues({
    content: `限時優惠進行中_${ts}`,
    linkType: 'EXTERNAL',
    linkUrl: 'https://example.com',
    priority: Math.floor(Math.random() * 10) + 1,
    bgColor: '#FF6600',
    textColor: '#FFFFFF',
    startTime: toDatetimeLocal(now),
    endTime: toDatetimeLocal(twoDaysLater),
    isActive: true,
  });

  await dialogStore.openInfoDialog({
    title: '提示訊息',
    message: '已帶入測試資料（所有欄位皆已填入）',
    iconType: 'success',
  });
};

/**
 * ✅ 單筆新增 / 更新
 * - create: MarqueeCreateReq
 * - update: MarqueeUpdateReq（欄位都可選）
 */
const onSubmit = handleSubmit(async (values) => {
  const ok = await dialogStore.openConfirmDialog({
    title: '儲存確認',
    message: '確定要儲存跑馬燈嗎？',
  });
  if (!ok) return;

  const payload = {
    content: values.content?.trim(),
    linkType: normalizeLinkType(values.linkType),
    linkUrl: values.linkUrl?.trim() || null,
    priority: values.priority ?? 0,
    bgColor: values.bgColor?.trim() || null,
    textColor: values.textColor?.trim() || null,
    startTime: normalizeToBackendLocalDateTime(values.startTime),
    endTime: normalizeToBackendLocalDateTime(values.endTime),
    isActive: normalizeIsActive(values.isActive), // ✅ 穩
  };

  await executeApi({
    fn: async () => {
      if (isEdit.value) return updateMarquee(id.value, payload);
      return createMarquee(payload);
    },
    onSuccess: async () => {
      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '儲存成功',
        iconType: 'success',
      });
      router.push('/home/marquee');
    },
  });
});
</script>

<style scoped></style>

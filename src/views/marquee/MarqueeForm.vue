<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import * as yup from 'yup';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import FormSection from '@/components/common/FormSection.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { useMarqueeStore } from '@/stores/marquee/useMarqueeStore';
import {
  createMarquee,
  getMarquee,
  updateMarquee,
} from '@/services/adminMarqueeService';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

const route = useRoute();
const router = useRouter();
const marqueeStore = useMarqueeStore();

const isEdit = computed(
  () => route.name === 'MarqueeEdit' || Boolean(route.params.id),
);
const id = computed(() => String(route.params.id || ''));
const pageTitle = computed(() =>
  isEdit.value ? '編輯跑馬燈' : '新增跑馬燈',
);

const isSubmitted = ref(false);

const displayErrors = computed<Record<string, string | undefined>>(() => {
  if (!isSubmitted.value) return {};
  return errors.value;
});

const activeOptions: SelectOption[] = [
  { label: '啟用', value: true },
  { label: '停用', value: false },
];

const linkTypeOptions: SelectOption[] = [
  { label: '無連結', value: 'NONE' },
  { label: '網址', value: 'URL' },
  { label: '最新消息', value: 'NEWS' },
  { label: 'Banner', value: 'BANNER' },
];

const isHexColor = (value?: string | null) => {
  const text = String(value ?? '').trim();
  if (!text) return true;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(text);
};

const normalizeBoolean = (value: unknown) => {
  if (value === true || value === false) return value;

  const text = String(value ?? '')
    .trim()
    .toLowerCase();

  if (text === 'true' || text === '1') return true;
  if (text === 'false' || text === '0') return false;

  return false;
};

const toNullableNumber = (value: unknown) => {
  if (value === '' || value === null || value === undefined) return null;

  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const normalizeText = (value: unknown) => String(value ?? '').trim();

const emptyToNull = (value: unknown) => {
  const text = normalizeText(value);
  return text ? text : null;
};

const normalizeColor = (value: unknown) => {
  const text = normalizeText(value);
  return text ? text : null;
};

const toDatetimeLocalValue = (value?: string | null) => {
  const text = normalizeText(value);
  if (!text) return '';
  return text.length >= 16 ? text.slice(0, 16) : text;
};

const toBackendLocalDateTime = (value?: string | null) => {
  const text = normalizeText(value);
  if (!text) return null;
  if (text.length >= 19) return text.slice(0, 19);
  if (text.length === 16) return `${text}:00`;
  return text;
};

const schema = yup.object({
  content: yup
    .string()
    .required('請輸入跑馬燈內容')
    .max(500, '跑馬燈內容最多 500 字'),
  priority: yup
    .number()
    .nullable()
    .typeError('排序必須是數字')
    .min(0, '排序不可小於 0')
    .transform((value, originalValue) =>
      originalValue === '' ||
      originalValue === null ||
      originalValue === undefined
        ? null
        : value,
    ),
  isActive: yup.boolean().required('請選擇狀態'),
  linkType: yup
    .string()
    .oneOf(linkTypeOptions.map((option) => option.value))
    .required('請選擇連結類型'),
  linkUrl: yup
    .string()
    .nullable()
    .max(500, '連結網址最多 500 字')
    .when('linkType', {
      is: (value: string) => value && value !== 'NONE',
      then: (rule) => rule.required('請輸入連結網址'),
    }),
  bgColor: yup
    .string()
    .nullable()
    .max(20, '背景色最多 20 字')
    .test('is-hex-color', '背景色格式錯誤，請輸入 HEX 色碼', (value) =>
      isHexColor(value),
    ),
  textColor: yup
    .string()
    .nullable()
    .max(20, '文字色最多 20 字')
    .test('is-hex-color', '文字色格式錯誤，請輸入 HEX 色碼', (value) =>
      isHexColor(value),
    ),
  startTime: yup.string().nullable(),
  endTime: yup
    .string()
    .nullable()
    .test('end-after-start', '結束時間必須晚於開始時間', function (value) {
      const startTime = this.parent.startTime;
      if (!startTime || !value) return true;
      return value >= startTime;
    }),
});

const { errors, handleSubmit, setValues, defineField } = useForm({
  validationSchema: schema,
  initialValues: {
    content: '',
    priority: null as number | null,
    isActive: true,
    linkType: 'NONE',
    linkUrl: '',
    bgColor: '',
    textColor: '',
    startTime: '',
    endTime: '',
  },
  validateOnMount: false,
});

const [content] = defineField('content');
const [priority] = defineField('priority');
const [isActive] = defineField('isActive');
const [linkType] = defineField('linkType');
const [linkUrl] = defineField('linkUrl');
const [bgColor] = defineField('bgColor');
const [textColor] = defineField('textColor');
const [startTime] = defineField('startTime');
const [endTime] = defineField('endTime');

const isLinkUrlDisabled = computed(() => linkType.value === 'NONE');
const bgColorPreview = computed(() =>
  isHexColor(bgColor.value) ? normalizeText(bgColor.value) : '',
);
const textColorPreview = computed(() =>
  isHexColor(textColor.value) ? normalizeText(textColor.value) : '',
);

watch(linkType, (value) => {
  if (value === 'NONE' && linkUrl.value) {
    linkUrl.value = '';
  }
});

const loadDetail = async () => {
  if (!isEdit.value || !id.value) return;

  await executeApi({
    fn: async () => getMarquee(id.value),
    onSuccess: (res: any) => {
      const data = res?.data ?? res;

      setValues(
        {
          content: data?.content ?? '',
          priority: data?.priority ?? data?.orderNum ?? null,
          isActive: normalizeBoolean(data?.isActive),
          linkType: data?.linkType ?? 'NONE',
          linkUrl: data?.linkUrl ?? '',
          bgColor: data?.bgColor ?? '',
          textColor: data?.textColor ?? '',
          startTime: toDatetimeLocalValue(data?.startTime ?? data?.startAt),
          endTime: toDatetimeLocalValue(data?.endTime ?? data?.endAt),
        },
        false,
      );
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

const onSubmit = handleSubmit(
  async (values) => {
    isSubmitted.value = true;

    const ok = await openConfirmDialog({
      title: '儲存確認',
      message: `確定要${isEdit.value ? '更新' : '新增'}跑馬燈嗎？`,
    });

    if (!ok) return;

    const priorityValue = toNullableNumber(values.priority);

    const payload = {
      content: normalizeText(values.content),
      priority: priorityValue,
      orderNum: priorityValue,
      isActive: normalizeBoolean(values.isActive),
      linkType: values.linkType,
      linkUrl: values.linkType === 'NONE' ? null : emptyToNull(values.linkUrl),
      bgColor: normalizeColor(values.bgColor),
      textColor: normalizeColor(values.textColor),
      startTime: toBackendLocalDateTime(values.startTime),
      endTime: toBackendLocalDateTime(values.endTime),
    };

    await executeApi({
      fn: async () => {
        if (isEdit.value) {
          return updateMarquee(id.value, payload);
        }

        return createMarquee(payload);
      },
      onSuccess: async () => {
        await openInfoDialog({
          title: '提示訊息',
          message: isEdit.value ? '更新成功' : '新增成功',
          iconType: 'success',
        });

        marqueeStore.setShouldRefresh(true);
        router.push('/home/marquee');
      },
      showSuccessDialog: false,
      showFailDialog: true,
      showCatchDialog: true,
    });
  },
  () => {
    isSubmitted.value = true;
  },
);

const navigateBack = () => {
  router.push('/home/marquee');
};

onMounted(async () => {
  await loadDetail();
});
</script>

<template>
  <MCard>
    <form class="marquee-form" @submit.prevent="onSubmit">
      <p class="form__text form__text--title">{{ pageTitle }}</p>

      <FormSection title="基本資料">
        <div class="flex flex-wrap">
          <div class="w-100 p-6">
            <FormInput
              label="跑馬燈內容"
              v-model="content"
              :error="displayErrors.content"
              required
              maxlength="500"
              placeholder="請輸入跑馬燈顯示文字"
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="排序"
              type="number"
              v-model="priority"
              :error="displayErrors.priority"
              placeholder="數字越小越前面"
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormSelect
              label="狀態"
              v-model="isActive"
              :options="activeOptions"
              :error="displayErrors.isActive"
              required
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="連結設定">
        <div class="flex flex-wrap">
          <div class="w-50 w-md-100 p-6">
            <FormSelect
              label="連結類型"
              v-model="linkType"
              :options="linkTypeOptions"
              :error="displayErrors.linkType"
              required
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="連結網址"
              v-model="linkUrl"
              :error="displayErrors.linkUrl"
              :disabled="isLinkUrlDisabled"
              placeholder="連結類型為無連結時可留空"
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="樣式設定">
        <div class="flex flex-wrap">
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="背景色（HEX 色碼）"
              v-model="bgColor"
              :error="displayErrors.bgColor"
              maxlength="20"
              placeholder="例如：#1a1a2e"
            />

            <div class="marquee-form__color-preview" v-if="bgColorPreview">
              <span
                class="marquee-form__color-dot"
                :style="{ backgroundColor: bgColorPreview }"
              />
              <span>{{ bgColorPreview }}</span>
            </div>
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="文字色（HEX 色碼）"
              v-model="textColor"
              :error="displayErrors.textColor"
              maxlength="20"
              placeholder="例如：#ffffff"
            />

            <div class="marquee-form__color-preview" v-if="textColorPreview">
              <span
                class="marquee-form__color-dot"
                :style="{ backgroundColor: textColorPreview }"
              />
              <span>{{ textColorPreview }}</span>
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="時間設定">
        <div class="flex flex-wrap">
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="開始時間"
              type="datetime-local"
              v-model="startTime"
              :error="displayErrors.startTime"
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="結束時間"
              type="datetime-local"
              v-model="endTime"
              :error="displayErrors.endTime"
            />
          </div>
        </div>
      </FormSection>

      <div class="flex justify-center m-y-12 gap-x-12 flex-wrap">
        <MButton type="submit">
          <font-awesome-icon icon="fa-floppy-disk" class="m-r-4" />
          {{ isEdit ? '更新' : '新增' }}
        </MButton>

        <MButton type="button" class="mbtn--red" @click="navigateBack">
          <font-awesome-icon icon="fa-arrow-left" class="m-r-4" />
          返回
        </MButton>
      </div>
    </form>
  </MCard>
</template>

<style scoped lang="scss">
.marquee-form {
  &__color-preview {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    color: #4b5563;
    font-size: 13px;
  }

  &__color-dot {
    width: 14px;
    height: 14px;
    border: 1px solid #d1d5db;
    border-radius: 50%;
    flex-shrink: 0;
  }
}
</style>

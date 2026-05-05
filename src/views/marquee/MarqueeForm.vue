<!-- src/views/marquee/MarqueeForm.vue -->
<template>
  <MCard>
    <form class="marquee-form" @submit.prevent="onSubmit">
      <p class="form__text form__text--title">
        {{ pageTitle }}
      </p>

      <div class="marquee-form__layout">
        <!-- 左側：主要表單 -->
        <div class="marquee-form__left">
          <!-- 基本資料 -->
          <FormSection title="基本資料">
            <div class="marquee-form__card">
              <div class="flex flex-wrap">
                <div class="w-50 w-md-100 p-6">
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
                  />
                </div>
              </div>
            </div>
          </FormSection>

          <!-- 狀態設定 -->
          <FormSection title="狀態設定">
            <div class="marquee-form__card marquee-form__card--status">
              <FormRadioTagGroup
                label="狀態"
                name="marquee-active"
                id-prefix="marquee-active"
                v-model="isActive"
                :options="activeOptions"
                :error="displayErrors.isActive"
                required
              />
            </div>
          </FormSection>

          <!-- 連結設定 -->
          <FormSection title="連結設定">
            <div class="marquee-form__card">
              <div class="marquee-form__link-type-panel">
                <FormRadioTagGroup
                  label="連結類型"
                  name="marquee-link-type"
                  id-prefix="marquee-link-type"
                  v-model="linkType"
                  :options="linkTypeOptions"
                  :error="displayErrors.linkType"
                  required
                />
              </div>

              <div class="flex flex-wrap">
                <div class="w-100 p-6">
                  <FormInput
                    label="連結網址"
                    v-model="linkUrl"
                    :error="displayErrors.linkUrl"
                    :disabled="isLinkUrlDisabled"
                    placeholder="連結類型為無連結時可留空"
                  />
                </div>
              </div>
            </div>
          </FormSection>

          <!-- 時間設定 -->
          <FormSection title="時間設定">
            <div class="marquee-form__card marquee-form__card--schedule">
              <div class="marquee-form__schedule-layout">
                <div class="w-100 p-6">
                  <FormDateRangeField
                    label="顯示時間"
                    type="datetime-local"
                    v-model:start="startTime"
                    v-model:end="endTime"
                    :start-error="displayErrors.startTime"
                    :end-error="displayErrors.endTime"
                  />
                </div>
              </div>
            </div>
          </FormSection>
        </div>

        <!-- 右側：樣式與預覽 -->
        <div class="marquee-form__right">
          <FormSection title="樣式設定">
            <div class="marquee-form__style-card">
              <div class="flex flex-wrap">
                <div class="w-100 p-6">
                  <FormColorPicker
                    label="背景色"
                    v-model="bgColor"
                    :error="displayErrors.bgColor"
                    maxlength="20"
                    placeholder="請選擇背景色"
                  />
                </div>

                <div class="w-100 p-6">
                  <FormColorPicker
                    label="文字色"
                    v-model="textColor"
                    :error="displayErrors.textColor"
                    maxlength="20"
                    placeholder="請選擇文字色"
                  />
                </div>
              </div>

              <div class="marquee-form__preview-block">
                <div class="marquee-form__preview-head">
                  <p class="marquee-form__preview-title">跑馬燈預覽</p>

                  <span
                    class="marquee-form__preview-badge"
                    :class="{
                      'marquee-form__preview-badge--off': !isActive,
                    }"
                  >
                    {{ isActive ? '啟用' : '停用' }}
                  </span>
                </div>

                <div class="marquee-form__preview" :style="previewStyle">
                  <span class="marquee-form__preview-text">
                    {{ previewText }}
                  </span>
                </div>

                <p class="marquee-form__preview-hint">
                  此區僅供後台預覽，實際前台樣式仍以版面設定為準。
                </p>
              </div>
            </div>
          </FormSection>
        </div>
      </div>

      <!-- bottom button -->
      <div class="flex justify-center m-y-12 gap-x-12 flex-wrap">
        <MButton type="submit">
          <font-awesome-icon icon="fa-floppy-disk" class="m-r-4" />
          {{ isEdit ? '更新' : '新增' }}
        </MButton>

        <MButton type="button" class="mbtn--gray" @click="navigateBack">
          <font-awesome-icon icon="fa-arrow-left" class="m-r-4" />
          返回
        </MButton>
      </div>
    </form>
  </MCard>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import * as yup from 'yup';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormColorPicker from '@/components/common/FormColorPicker.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSection from '@/components/common/FormSection.vue';
import FormDateRangeField from '@/components/common/FormDateRangeField.vue';
import FormRadioTagGroup from '@/components/common/FormRadioTagGroup.vue';

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

const pageTitle = computed(() => (isEdit.value ? '編輯跑馬燈' : '新增跑馬燈'));

const isSubmitted = ref(false);

const displayErrors = computed<Record<string, string | undefined>>(() => {
  if (!isSubmitted.value) return {};
  return errors.value;
});

type RadioOption = {
  label: string;
  value: string | number | boolean;
  disabled?: boolean;
};

const activeOptions: RadioOption[] = [
  { label: '啟用', value: true },
  { label: '停用', value: false },
];

const linkTypeOptions: RadioOption[] = [
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
    .oneOf(linkTypeOptions.map((option) => String(option.value)))
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

const previewText = computed(() => {
  const text = normalizeText(content.value);

  return text || '這裡會顯示跑馬燈預覽文字';
});

const previewStyle = computed(() => ({
  backgroundColor: bgColor.value || '#111827',
  color: textColor.value || '#ffffff',
}));

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

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as *;

.marquee-form {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;

  &__layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 440px);
    gap: 18px;
    align-items: flex-start;
    width: 100%;
    max-width: 100%;
  }

  &__left,
  &__right {
    min-width: 0;
    width: 100%;
  }

  &__card,
  &__style-card {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    padding: 14px;
    border: 1px solid color.mix($form-border, #fff, 72%);
    border-radius: 14px;
    background: $form-bg;
  }

  &__card--status {
    padding: 14px;
  }

  &__card--schedule {
    padding: 14px 8px;
  }

  &__link-type-panel {
    padding: 0 6px 14px;
    margin-bottom: 8px;
    border-bottom: 1px dashed $form-border;
  }

  &__schedule-layout {
    display: flex;
    flex-wrap: wrap;
    min-width: 0;
  }

  &__style-card {
    overflow: hidden;
  }

  &__preview-block {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px dashed $form-border;
  }

  &__preview-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-width: 0;
    margin-bottom: 10px;
  }

  &__preview-title {
    margin: 0;
    color: $form-text;
    font-size: 14px;
    font-weight: 800;
    line-height: 1.4;
    word-break: break-word;
  }

  &__preview-badge {
    flex: 0 0 auto;
    padding: 4px 10px;
    border-radius: 999px;
    background: color.mix($brand-light, #fff, 15%);
    color: $brand;
    font-size: 12px;
    font-weight: 800;
    line-height: 1.4;

    &--off {
      background: color.mix($form-border, #fff, 45%);
      color: $form-muted;
    }
  }

  &__preview {
    position: relative;
    width: 100%;
    min-width: 0;
    padding: 12px 14px;
    border-radius: 12px;
    overflow: hidden;
    white-space: nowrap;
  }

  &__preview-text {
    display: inline-block;
    max-width: 100%;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle;
  }

  &__preview-hint {
    margin: 8px 0 0;
    color: $form-muted;
    font-size: 12px;
    line-height: 1.5;
  }

  @media (max-width: 1180px) {
    &__layout {
      grid-template-columns: 1fr;
    }

    &__right {
      position: static;
    }
  }

  @media (max-width: 576px) {
    &__card,
    &__style-card {
      padding: 12px;
    }

    &__preview-head {
      align-items: flex-start;
      flex-direction: column;
    }

    &__preview-badge {
      max-width: 100%;
      white-space: normal;
      word-break: break-word;
    }
  }
}
</style>

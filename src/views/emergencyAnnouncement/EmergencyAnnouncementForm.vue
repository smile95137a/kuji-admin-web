<!-- src/views/emergencyAnnouncement/EmergencyAnnouncementForm.vue -->
<template>
  <MCard>
    <form class="emergency-announcement-form" @submit.prevent="onSubmit">
      <div class="emergency-announcement-form__header">
        <p class="form__text form__text--title">
          緊急公告{{ isEdit ? '編輯' : '新增' }}
        </p>
      </div>

      <div class="emergency-announcement-form__layout">
        <!-- 左側：主要表單 -->
        <div class="emergency-announcement-form__left">
          <FormSection title="基本資料">
            <div class="emergency-announcement-form__card">
              <div class="flex flex-wrap">
                <!-- 公告標題 -->
                <div class="w-50 w-md-100 p-6">
                  <FormInput
                    label="公告標題"
                    v-model="title"
                    :error="displayErrors.title"
                    required
                    maxlength="100"
                    placeholder="請輸入公告標題"
                  />
                </div>

                <!-- 公告類型 -->
                <div class="w-25 w-md-50 w-sm-100 p-6">
                  <FormSelect
                    label="公告類型"
                    v-model="announcementType"
                    :options="announcementTypeOptions"
                    :error="displayErrors.announcementType"
                    :showAll="true"
                    allLabel="請選擇"
                    :allValue="''"
                    required
                  />
                </div>

                <!-- 狀態 -->
                <div class="w-25 w-md-50 w-sm-100 p-6">
                  <FormSelect
                    label="狀態"
                    v-model="status"
                    :options="statusOptions"
                    :error="displayErrors.status"
                    :showAll="true"
                    allLabel="請選擇"
                    :allValue="''"
                    required
                  />
                </div>

                <!-- 排序 -->
                <div class="w-25 w-md-50 w-sm-100 p-6">
                  <FormInput
                    label="排序"
                    v-model="sortOrder"
                    :error="displayErrors.sortOrder"
                    type="number"
                    placeholder="例如：1"
                  />
                </div>

                <!-- 強制顯示 -->
                <div class="w-25 w-md-50 w-sm-100 p-6">
                  <FormSelect
                    label="強制顯示"
                    v-model="forceShow"
                    :options="forceShowOptions"
                    :error="displayErrors.forceShow"
                  />
                </div>

                <!-- 公告內容 -->
                <div class="w-100 p-6">
                  <FormTextarea
                    label="公告內容"
                    v-model="content"
                    :error="displayErrors.content"
                    required
                    :rows="8"
                    :maxlength="2000"
                    placeholder="請輸入公告內容"
                  />
                </div>
              </div>
            </div>
          </FormSection>
        </div>

        <!-- 右側：時間設定 -->
        <div class="emergency-announcement-form__right">
          <FormSection title="顯示時間">
            <div class="emergency-announcement-form__card">
              <div class="flex flex-wrap">
                <div class="w-100 p-6">
                  <FormDateRangeField
                    label="公告顯示期間"
                    type="datetime-local"
                    v-model:start="displayStartTime"
                    v-model:end="displayEndTime"
                    :start-error="displayErrors.displayStartTime"
                    :end-error="displayErrors.displayEndTime"
                    :auto-apply-default="true"
                    :default-start="getDefaultDisplayStartTime()"
                    :default-end="getDefaultDisplayEndTime()"
                    required
                  />
                </div>

                <div class="w-100 p-6">
                  <FormDateRangeField
                    label="維修/更新時間"
                    type="datetime-local"
                    v-model:start="maintenanceStartTime"
                    v-model:end="maintenanceEndTime"
                    :start-error="displayErrors.maintenanceStartTime"
                    :end-error="displayErrors.maintenanceEndTime"
                    :auto-apply-default="true"
                    :default-start="getDefaultMaintenanceStartTime()"
                    :default-end="getDefaultMaintenanceEndTime()"
                  />
                </div>

                <div class="emergency-announcement-form__info-box">
                  公告顯示期間是控制客戶看到公告的時間；維修/更新時間是公告內容中要告知客戶的實際作業時間。
                </div>
              </div>
            </div>
          </FormSection>
        </div>
      </div>

      <!-- bottom button -->
      <div class="flex justify-center m-y-12 gap-x-12 flex-wrap">
        <MButton type="submit" :disabled="mockCreating">
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
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import * as yup from 'yup';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import FormTextarea from '@/components/common/FormTextarea.vue';
import FormSection from '@/components/common/FormSection.vue';
import FormDateRangeField from '@/components/common/FormDateRangeField.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { useEmergencyAnnouncementStore } from '@/stores/emergencyAnnouncement/useEmergencyAnnouncementStore';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';

import {
  getEmergencyAnnouncementById,
  createEmergencyAnnouncement,
  updateEmergencyAnnouncement,
} from '@/services/adminEmergencyAnnouncementService';

const route = useRoute();
const router = useRouter();
const emergencyAnnouncementStore = useEmergencyAnnouncementStore();

const isEdit = computed(() => Boolean(route.params.id));
const id = computed(() => String(route.params.id || ''));

/** 是否已按過送出 */
const isSubmitted = ref(false);

/** 快速假資料是否建立中 */
const mockCreating = ref(false);

/** 只有送出後才顯示錯誤 */
const displayErrors = computed<Record<string, string | undefined>>(() => {
  if (!isSubmitted.value) return {};
  return errors.value;
});

const statusOptions: SelectOption[] = [
  { label: '草稿', value: 'DRAFT' },
  { label: '啟用', value: 'ACTIVE' },
  { label: '停用', value: 'INACTIVE' },
];

const announcementTypeOptions: SelectOption[] = [
  { label: '維修公告', value: 'MAINTENANCE' },
  { label: '版本更新', value: 'UPDATE' },
  { label: '重要公告', value: 'NOTICE' },
];

const forceShowOptions: SelectOption[] = [
  { label: '否', value: false },
  { label: '是', value: true },
];

/* --------------------------------------
 * Date utils
 * -------------------------------------- */
const pad2 = (value: number) => String(value).padStart(2, '0');

const formatToPickerDateTime = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const mi = pad2(date.getMinutes());

  return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
};

const addHours = (date: Date, hours: number) => {
  const next = new Date(date);
  next.setHours(next.getHours() + hours);
  return next;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getDefaultDisplayStartTime = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return formatToPickerDateTime(date);
};

const getDefaultDisplayEndTime = () => {
  const date = addDays(new Date(), 7);
  date.setHours(23, 59, 0, 0);
  return formatToPickerDateTime(date);
};

const getDefaultMaintenanceStartTime = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return formatToPickerDateTime(date);
};

const getDefaultMaintenanceEndTime = () => {
  const date = new Date();
  date.setHours(23, 59, 0, 0);
  return formatToPickerDateTime(date);
};

const normalizeToBackendLocalDateTime = (value?: string | null) => {
  const text = String(value ?? '')
    .trim()
    .replace('T', ' ')
    .replace(/\//g, '-');

  if (!text) return null;
  if (text.length >= 19) return text.slice(0, 19);
  if (text.length === 16) return `${text}:00`;

  return text;
};

const normalizeToPickerDateTime = (value?: string | null) => {
  const text = String(value ?? '')
    .trim()
    .replace('T', ' ')
    .replace(/-/g, '/');

  if (!text) return '';

  return text.length >= 16 ? text.slice(0, 16) : text;
};

/* --------------------------------------
 * Schema
 * -------------------------------------- */
const schema = yup.object({
  title: yup.string().required('請輸入公告標題').max(100, '公告標題最多100字'),

  content: yup
    .string()
    .required('請輸入公告內容')
    .max(2000, '公告內容最多2000字'),

  announcementType: yup
    .string()
    .oneOf(['MAINTENANCE', 'UPDATE', 'NOTICE'], '公告類型不合法')
    .required('請選擇公告類型'),

  status: yup
    .string()
    .oneOf(['DRAFT', 'ACTIVE', 'INACTIVE'], '公告狀態不合法')
    .required('請選擇狀態'),

  displayStartTime: yup.string().required('請選擇公告顯示開始時間'),

  displayEndTime: yup
    .string()
    .required('請選擇公告顯示結束時間')
    .test(
      'displayEndAfterStart',
      '公告顯示結束時間必須晚於開始時間',
      function (endValue) {
        const start = this.parent.displayStartTime;

        if (!start || !endValue) return true;

        return (
          normalizeToBackendLocalDateTime(endValue)! >
          normalizeToBackendLocalDateTime(start)!
        );
      },
    ),

  maintenanceStartTime: yup.string().nullable(),

  maintenanceEndTime: yup
    .string()
    .nullable()
    .test(
      'maintenanceEndAfterStart',
      '維修/更新結束時間必須晚於開始時間',
      function (endValue) {
        const start = this.parent.maintenanceStartTime;

        if (!start || !endValue) return true;

        return (
          normalizeToBackendLocalDateTime(endValue)! >
          normalizeToBackendLocalDateTime(start)!
        );
      },
    ),

  forceShow: yup.boolean().nullable(),

  sortOrder: yup
    .number()
    .typeError('排序必須是數字')
    .min(0, '排序不可小於 0')
    .nullable()
    .transform((value, originalValue) =>
      originalValue === '' ||
      originalValue === null ||
      originalValue === undefined
        ? null
        : value,
    ),
});

/* --------------------------------------
 * useForm
 * -------------------------------------- */
const { errors, handleSubmit, setValues, defineField } = useForm({
  validationSchema: schema,
  initialValues: {
    title: '',
    content: '',
    announcementType: '',
    status: 'DRAFT',
    displayStartTime: getDefaultDisplayStartTime(),
    displayEndTime: getDefaultDisplayEndTime(),
    maintenanceStartTime: getDefaultMaintenanceStartTime(),
    maintenanceEndTime: getDefaultMaintenanceEndTime(),
    forceShow: false,
    sortOrder: 0 as number | null,
  },
  validateOnMount: false,
});

const [title] = defineField('title');
const [content] = defineField('content');
const [announcementType] = defineField('announcementType');
const [status] = defineField('status');
const [displayStartTime] = defineField('displayStartTime');
const [displayEndTime] = defineField('displayEndTime');
const [maintenanceStartTime] = defineField('maintenanceStartTime');
const [maintenanceEndTime] = defineField('maintenanceEndTime');
const [forceShow] = defineField('forceShow');
const [sortOrder] = defineField('sortOrder');

/* --------------------------------------
 * Mock data
 * -------------------------------------- */
const announcementTypes = [
  {
    value: 'MAINTENANCE',
    label: '維修公告',
    titlePrefix: '系統維護',
    content:
      '系統將於指定時間進行維護作業，維護期間部分功能可能暫時無法使用，造成不便敬請見諒。',
  },
  {
    value: 'UPDATE',
    label: '版本更新',
    titlePrefix: '版本更新',
    content: '平台將進行版本更新，更新完成後將提供更穩定的服務與新功能體驗。',
  },
  {
    value: 'NOTICE',
    label: '重要公告',
    titlePrefix: '重要通知',
    content: '提醒用戶留意本次重要公告內容，請於公告期間內確認相關資訊。',
  },
];

const mockStatuses = ['DRAFT', 'ACTIVE', 'INACTIVE'];

const mockScenarios = [
  '登入頁公告',
  '付款服務公告',
  '抽獎系統公告',
  '會員中心公告',
  '後台管理公告',
  '金流維護公告',
  '圖片上傳公告',
  '訂單查詢公告',
  '儲值功能公告',
  '活動頁公告',
  '商品上架公告',
  '通知服務公告',
];

const buildMockAnnouncementPayload = (index: number) => {
  const type = announcementTypes[index % announcementTypes.length];
  const status = mockStatuses[index % mockStatuses.length];
  const scenario = mockScenarios[index % mockScenarios.length];

  const now = new Date();
  const displayStart = addDays(now, index - 6);
  const displayEnd = addDays(displayStart, 7 + (index % 5));

  const maintenanceStart = addHours(displayStart, 20 + (index % 6));
  const maintenanceEnd = addHours(maintenanceStart, 2 + (index % 3));

  return {
    title: `${type.titlePrefix}｜${scenario} ${pad2(index + 1)}`,
    content: [
      type.content,
      '',
      `影響範圍：${scenario}`,
      `測試批號：MOCK-${Date.now()}-${pad2(index + 1)}`,
      `公告類型：${type.label}`,
      `目前狀態：${status}`,
    ].join('\n'),
    announcementType: type.value,
    status,
    displayStartTime: normalizeToBackendLocalDateTime(
      formatToPickerDateTime(displayStart),
    )!,
    displayEndTime: normalizeToBackendLocalDateTime(
      formatToPickerDateTime(displayEnd),
    )!,
    maintenanceStartTime: normalizeToBackendLocalDateTime(
      formatToPickerDateTime(maintenanceStart),
    ),
    maintenanceEndTime: normalizeToBackendLocalDateTime(
      formatToPickerDateTime(maintenanceEnd),
    ),
    forceShow: index % 4 === 0,
    sortOrder: index + 1,
  };
};

/* --------------------------------------
 * Load detail
 * -------------------------------------- */
const loadDetail = async () => {
  if (!isEdit.value || !id.value) return;

  await executeApi({
    fn: async () => getEmergencyAnnouncementById(id.value),
    onSuccess: (res: any) => {
      const data = res?.data ?? res;

      setValues(
        {
          title: data?.title ?? '',
          content: data?.content ?? '',
          announcementType: data?.announcementType ?? '',
          status: data?.status ?? 'DRAFT',
          displayStartTime:
            normalizeToPickerDateTime(data?.displayStartTime) ||
            getDefaultDisplayStartTime(),
          displayEndTime:
            normalizeToPickerDateTime(data?.displayEndTime) ||
            getDefaultDisplayEndTime(),
          maintenanceStartTime:
            normalizeToPickerDateTime(data?.maintenanceStartTime) ||
            getDefaultMaintenanceStartTime(),
          maintenanceEndTime:
            normalizeToPickerDateTime(data?.maintenanceEndTime) ||
            getDefaultMaintenanceEndTime(),
          forceShow: Boolean(data?.forceShow),
          sortOrder: data?.sortOrder ?? 0,
        },
        false,
      );
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

/* --------------------------------------
 * Submit
 * -------------------------------------- */
const onSubmit = handleSubmit(
  async (values) => {
    isSubmitted.value = true;

    const ok = await openConfirmDialog({
      title: '儲存確認',
      message: '確定要儲存緊急公告嗎？',
    });

    if (!ok) return;

    const payload = {
      title: String(values.title ?? '').trim(),
      content: String(values.content ?? '').trim(),
      announcementType: values.announcementType,
      status: values.status,
      displayStartTime: normalizeToBackendLocalDateTime(
        values.displayStartTime,
      )!,
      displayEndTime: normalizeToBackendLocalDateTime(values.displayEndTime)!,
      maintenanceStartTime: normalizeToBackendLocalDateTime(
        values.maintenanceStartTime,
      ),
      maintenanceEndTime: normalizeToBackendLocalDateTime(
        values.maintenanceEndTime,
      ),
      forceShow: Boolean(values.forceShow),
      sortOrder:
        values.sortOrder === null || values.sortOrder === undefined
          ? 0
          : Number(values.sortOrder),
    };

    await executeApi({
      fn: async () => {
        if (isEdit.value) {
          return updateEmergencyAnnouncement(id.value, payload);
        }

        return createEmergencyAnnouncement(payload);
      },
      onSuccess: async () => {
        emergencyAnnouncementStore.setShouldRefresh(true);
        router.push('/home/emergency-announcements');
      },
      successMessage: isEdit.value ? '更新成功' : '新增成功',
      showSuccessDialog: true,
      showFailDialog: true,
      showCatchDialog: true,
    });
  },
  () => {
    isSubmitted.value = true;
  },
);

/* --------------------------------------
 * Navigation
 * -------------------------------------- */
const navigateBack = () => {
  router.push('/home/emergency-announcements');
};

/* --------------------------------------
 * Mounted
 * -------------------------------------- */
onMounted(async () => {
  await loadDetail();
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as *;

.emergency-announcement-form {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

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

  &__card {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    padding: 14px;
    border: 1px solid color.mix($form-border, #fff, 72%);
    border-radius: 14px;
    background: $form-bg;
  }

  &__info-box {
    margin: 8px 6px 4px;
    padding: 10px 14px;
    border-left: 4px solid $brand;
    border-radius: $form-radius;
    background: color.mix($brand-light, #fff, 35%);
    color: $brand-dark;
    font-size: 13px;
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
    &__card {
      padding: 12px;
    }
  }
}
</style>

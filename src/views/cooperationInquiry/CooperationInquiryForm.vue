<!-- src/views/cooperationInquiry/CooperationInquiryForm.vue -->
<template>
  <MCard>
    <form class="cooperation-inquiry-form" @submit.prevent="onSubmit">
      <div class="cooperation-inquiry-form__header">
        <div>
          <p class="form__text form__text--title">合作洽談明細</p>
          <p class="cooperation-inquiry-form__desc">
            查看合作洽談內容，並更新處理狀態與後台備註。
          </p>
        </div>
      </div>

      <FormSection title="聯絡資訊">
        <div class="cooperation-inquiry-form__card">
          <div class="flex flex-wrap">
            <div class="w-50 w-md-100 p-6">
              <FormInput
                label="公司 / 單位名稱"
                :modelValue="detail.company || '-'"
                disabled
              />
            </div>

            <div class="w-50 w-md-100 p-6">
              <FormInput
                label="聯絡人姓名"
                :modelValue="detail.name || '-'"
                disabled
              />
            </div>

            <div class="w-50 w-md-100 p-6">
              <FormInput
                label="電子郵件"
                :modelValue="detail.email || '-'"
                disabled
              />
            </div>

            <div class="w-50 w-md-100 p-6">
              <FormInput
                label="聯絡電話"
                :modelValue="detail.phone || '-'"
                disabled
              />
            </div>

            <div class="w-50 w-md-100 p-6">
              <FormInput
                label="合作類型"
                :modelValue="typeText(detail.type)"
                disabled
              />
            </div>

            <div class="w-50 w-md-100 p-6">
              <FormInput
                label="建立時間"
                :modelValue="detail.createdAt || '-'"
                disabled
              />
            </div>

            <div class="w-50 w-md-100 p-6">
              <FormInput
                label="是否已轉成廠商"
                :modelValue="isConvertedToVendor ? '是' : '否'"
                disabled
              />
            </div>

            <div class="w-50 w-md-100 p-6">
              <FormInput
                label="廠商帳號 ID"
                :modelValue="detail.vendorAdminUserId || '-'"
                disabled
              />
            </div>

            <div v-if="isDeleted" class="w-50 w-md-100 p-6">
              <FormInput
                label="刪除時間"
                :modelValue="detail.deletedAt || '-'"
                disabled
              />
            </div>

            <div class="w-100 p-6">
              <FormTextarea
                label="需求簡述"
                :modelValue="detail.message || '-'"
                :rows="7"
                disabled
              />
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="處理狀態">
        <div class="cooperation-inquiry-form__card">
          <div class="flex flex-wrap">
            <div class="w-50 w-md-100 p-6">
              <FormSelect
                label="處理狀態"
                v-model="status"
                :options="statusOptions"
                :error="errors.status"
                :disabled="isDeleted"
                required
              />
            </div>

            <div class="w-100 p-6">
              <FormTextarea
                label="後台備註"
                v-model="remark"
                :error="errors.remark"
                :rows="6"
                :disabled="isDeleted"
                placeholder="可輸入處理紀錄、聯繫結果或內部備註"
              />
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="處理歷程">
        <div class="cooperation-inquiry-form__card">
          <div
            v-if="statusLogs.length === 0"
            class="cooperation-inquiry-form__empty"
          >
            尚無處理歷程
          </div>

          <div v-else class="cooperation-inquiry-form__history">
            <div
              v-for="log in statusLogs"
              :key="log.id"
              class="cooperation-inquiry-form__history-item"
            >
              <div class="cooperation-inquiry-form__history-main">
                <div class="cooperation-inquiry-form__history-status">
                  <span>{{ statusText(log.beforeStatus) }}</span>
                  <span class="cooperation-inquiry-form__history-arrow">→</span>
                  <span>{{ statusText(log.afterStatus) }}</span>
                </div>

                <div class="cooperation-inquiry-form__history-time">
                  {{ log.createdAt || '-' }}
                </div>
              </div>

              <div
                v-if="log.remark"
                class="cooperation-inquiry-form__history-remark"
              >
                {{ log.remark }}
              </div>

              <div class="cooperation-inquiry-form__history-operator">
                操作者：
                {{
                  log.operatorDisplayName ||
                  log.operatorUsername ||
                  log.operatorId ||
                  '系統'
                }}
              </div>
            </div>
          </div>
        </div>
      </FormSection>

      <div class="flex justify-center m-y-12 gap-x-12 flex-wrap">
        <MButton v-if="!isDeleted" type="submit"> 儲存 </MButton>

        <MButton v-if="canConvertVendor" type="button" @click="convertVendor">
          轉成廠商
        </MButton>

        <MButton
          v-if="!isDeleted"
          type="button"
          class="mbtn--red"
          @click="deleteCurrent"
        >
          注記刪除
        </MButton>

        <MButton type="button" class="mbtn--gray" @click="navigateBack">
          返回
        </MButton>
      </div>
    </form>
  </MCard>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import * as yup from 'yup';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import FormTextarea from '@/components/common/FormTextarea.vue';
import FormSection from '@/components/common/FormSection.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { useCooperationInquiryStore } from '@/stores/cooperationInquiry/useCooperationInquiryStore';

import {
  getCooperationInquiryById,
  updateCooperationInquiryStatus,
  deleteCooperationInquiry,
  convertCooperationInquiryToVendor,
} from '@/services/adminCooperationInquiryService';

type StatusLog = {
  id?: string;
  inquiryId?: string;
  beforeStatus?: string;
  afterStatus?: string;
  remark?: string;
  operatorId?: string;
  operatorUsername?: string;
  operatorDisplayName?: string;
  createdAt?: string;
};

type CooperationInquiryDetail = {
  id?: string;
  company?: string;
  name?: string;
  email?: string;
  phone?: string;
  type?: string;
  message?: string;
  status?: string;
  remark?: string;
  convertedToVendor?: boolean | number | string;
  vendorAdminUserId?: string;
  deleted?: boolean | number | string;
  deletedAt?: string;
  deletedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  statusLogs?: StatusLog[];
};

const route = useRoute();
const router = useRouter();
const store = useCooperationInquiryStore();

const id = String(route.params.id || '');

const detail = ref<CooperationInquiryDetail>({});

const toBoolean = (value: unknown): boolean => {
  return value === true || value === 1 || value === '1';
};

const isDeleted = computed(() => toBoolean(detail.value.deleted));

const isConvertedToVendor = computed(() =>
  toBoolean(detail.value.convertedToVendor),
);

const canConvertVendor = computed(() => {
  return (
    !isDeleted.value &&
    !isConvertedToVendor.value &&
    !detail.value.vendorAdminUserId
  );
});

const statusLogs = computed<StatusLog[]>(() => {
  return detail.value.statusLogs ?? [];
});

const statusOptions: SelectOption[] = [
  { label: '待處理', value: 'PENDING' },
  { label: '處理中', value: 'PROCESSING' },
  { label: '已完成', value: 'DONE' },
  { label: '已關閉', value: 'CLOSED' },
];

const schema = yup.object({
  status: yup.string().required('請選擇處理狀態'),
  remark: yup.string().nullable(),
});

const { errors, handleSubmit, setValues, defineField } = useForm({
  validationSchema: schema,
  initialValues: {
    status: 'PENDING',
    remark: '',
  },
});

const [status] = defineField('status');
const [remark] = defineField('remark');

const typeText = (v?: string) => {
  if (v === 'IP') return 'IP / 授權';
  if (v === 'SUPPLY') return '供應 / 物流';
  if (v === 'CHANNEL') return '通路 / 門市';
  if (v === 'MARKETING') return '行銷 / 活動';

  return v || '-';
};

const statusText = (v?: string) => {
  if (v === 'PENDING') return '待處理';
  if (v === 'PROCESSING') return '處理中';
  if (v === 'DONE') return '已完成';
  if (v === 'CLOSED') return '已關閉';

  return v || '-';
};

const loadDetail = async () => {
  await executeApi({
    fn: async () => getCooperationInquiryById(id),
    onSuccess: (res: any) => {
      const data = res?.data ?? res;

      detail.value = data ?? {};

      setValues(
        {
          status: data?.status ?? 'PENDING',
          remark: data?.remark ?? '',
        },
        false,
      );
    },
    showSuccessDialog: false,
  });
};

const onSubmit = handleSubmit(async (values) => {
  if (isDeleted.value) return;

  const ok = await openConfirmDialog({
    title: '儲存確認',
    message: '確定要儲存處理狀態嗎？',
  });

  if (!ok) return;

  await executeApi({
    fn: async () =>
      updateCooperationInquiryStatus(id, {
        status: values.status,
        remark: values.remark,
      }),
    showSuccessDialog: true,
    successMessage: '儲存成功',
    onSuccess: async () => {
      store.setShouldRefresh(true);
      await loadDetail();
    },
  });
});

const convertVendor = async () => {
  const ok = await openConfirmDialog({
    title: '轉成廠商確認',
    message:
      '確定要將此合作洽談轉成廠商帳號嗎？系統會建立後台廠商帳號並綁定店家負責人角色。',
  });

  if (!ok) return;

  await executeApi({
    fn: async () =>
      convertCooperationInquiryToVendor(id, {
        remark: remark.value,
      }),
    showSuccessDialog: true,
    successMessage: '轉成廠商成功',
    onSuccess: async () => {
      store.setShouldRefresh(true);
      await loadDetail();
    },
  });
};

const deleteCurrent = async () => {
  const ok = await openConfirmDialog({
    title: '注記刪除確認',
    message:
      '確定要注記刪除此合作洽談資料嗎？資料不會真的刪除，但列表將不再顯示。',
  });

  if (!ok) return;

  await executeApi({
    fn: async () => deleteCooperationInquiry(id),
    showSuccessDialog: true,
    successMessage: '注記刪除成功',
    onSuccess: async () => {
      store.setShouldRefresh(true);
      router.push({ name: 'CooperationInquiryList' });
    },
  });
};

const navigateBack = () => {
  router.push({ name: 'CooperationInquiryList' });
};

onMounted(async () => {
  await loadDetail();
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as tokens;

.cooperation-inquiry-form {
  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }

  &__desc {
    margin: 4px 0 0;
    color: tokens.$form-muted;
    font-size: 13px;
    line-height: 1.5;
  }

  &__card {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    padding: 14px;
    border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
    border-radius: 14px;
    background: tokens.$form-bg;
  }

  &__empty {
    padding: 16px;
    color: tokens.$form-muted;
    font-size: 14px;
    text-align: center;
  }

  &__history {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__history-item {
    padding: 12px 14px;
    border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
    border-radius: 12px;
    background: #fff;
  }

  &__history-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__history-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: tokens.$form-text;
  }

  &__history-arrow {
    color: tokens.$form-muted;
  }

  &__history-time {
    color: tokens.$form-muted;
    font-size: 13px;
  }

  &__history-remark {
    margin-top: 8px;
    color: tokens.$form-text;
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-wrap;
  }

  &__history-operator {
    margin-top: 8px;
    color: tokens.$form-muted;
    font-size: 13px;
  }
}
</style>

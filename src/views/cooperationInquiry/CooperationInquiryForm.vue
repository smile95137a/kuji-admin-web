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
                required
              />
            </div>

            <div class="w-100 p-6">
              <FormTextarea
                label="後台備註"
                v-model="remark"
                :error="errors.remark"
                :rows="6"
                placeholder="可輸入處理紀錄、聯繫結果或內部備註"
              />
            </div>
          </div>
        </div>
      </FormSection>

      <div class="flex justify-center m-y-12 gap-x-12 flex-wrap">
        <MButton type="submit"> 儲存 </MButton>

        <MButton type="button" class="mbtn--red" @click="deleteCurrent">
          刪除
        </MButton>

        <MButton type="button" class="mbtn--gray" @click="navigateBack">
          返回
        </MButton>
      </div>
    </form>
  </MCard>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
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
} from '@/services/adminCooperationInquiryService';

const route = useRoute();
const router = useRouter();
const store = useCooperationInquiryStore();

const id = String(route.params.id || '');

const detail = ref<any>({});

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

const deleteCurrent = async () => {
  const ok = await openConfirmDialog({
    title: '刪除確認',
    message: '確定要刪除此合作洽談資料嗎？',
  });

  if (!ok) return;

  await executeApi({
    fn: async () => deleteCooperationInquiry(id),
    showSuccessDialog: true,
    successMessage: '刪除成功',
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
}
</style>

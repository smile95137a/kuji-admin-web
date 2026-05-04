<!-- src/views/menu/MenuForm.vue -->
<template>
  <MCard>
    <form class="menu-form" @submit.prevent="onSubmit">
      <p class="form__text form__text--title">{{ pageTitle }}</p>

      <!-- 基本資料 -->
      <FormSection title="基本資料">
        <div class="flex flex-wrap">
          <!-- 名稱 -->
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="選單名稱"
              v-model="name"
              :error="errors.name"
              required
              maxlength="50"
              placeholder="例如：商品管理"
            />
          </div>

          <!-- 代碼 -->
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="選單代碼"
              v-model="code"
              :error="errors.code"
              required
              maxlength="50"
              placeholder="例如：product_management"
            />
          </div>

          <!-- 路徑 -->
          <div class="w-100 p-6">
            <FormInput
              label="選單路徑（可選）"
              v-model="path"
              :error="errors.path"
              maxlength="200"
              placeholder="例如：/admin/products"
            />
          </div>
        </div>
      </FormSection>

      <!-- 選單設定 -->
      <FormSection title="選單設定">
        <div class="flex flex-wrap">
          <!-- 父選單 -->
          <div class="w-50 w-md-100 p-6">
            <FormSelect
              label="父選單"
              v-model="parentId"
              :options="parentOptions"
              :error="errors.parentId"
              :showAll="true"
              allLabel="（頂層）"
              :allValue="''"
            />

            <p class="form__text m-t-6" v-if="parentLoading">父選單載入中...</p>
          </div>

          <!-- Icon -->
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="圖示（可選）"
              v-model="icon"
              :error="errors.icon"
              maxlength="100"
              placeholder="例如：mdi-package-variant"
            />
          </div>

          <!-- 排序 orderNum -->
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="排序"
              type="number"
              v-model="orderNum"
              :error="errors.orderNum"
              placeholder="例如：1"
            />
          </div>

          <!-- 是否可見 isVisible -->
          <div class="w-50 w-md-100 p-6">
            <div class="menu-form__checkbox-field">
              <p class="menu-form__checkbox-label">
                是否可見 <span class="menu-form__required">*</span>
              </p>

              <FormCheckbox
                v-model="isVisible"
                label="顯示在選單中"
                :trueValue="true"
                :falseValue="false"
                :error="errors.isVisible"
                size="md"
              />

              <p class="menu-form__hint">
                取消勾選後，該選單將不會顯示於前台選單列表。
              </p>
            </div>
          </div>
        </div>
      </FormSection>

      <!-- 檢視資訊 -->
      <FormSection v-if="isDetail" title="系統資訊">
        <div class="flex flex-wrap">
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="建立時間"
              :modelValue="formatDateTime(detail?.createdAt)"
              disabled
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="更新時間"
              :modelValue="formatDateTime(detail?.updatedAt)"
              disabled
            />
          </div>
        </div>
      </FormSection>

      <!-- bottom button -->
      <div class="flex justify-center m-y-12 gap-x-12 flex-wrap">
        <template v-if="!isDetail">
          <MButton type="submit">儲存</MButton>
        </template>

        <MButton type="button" class="mbtn--red" @click="navigateBack">
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
import FormCheckbox from '@/components/common/FormCheckbox.vue';
import FormSection from '@/components/common/FormSection.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { useMenuStore } from '@/stores/menu/useMenuStore';

import {
  createMenu,
  updateMenu,
  getMenuById,
  getAllMenus,
} from '@/services/adminMenuService';

import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

interface SelectOption {
  label: string;
  value: any;
}

const route = useRoute();
const router = useRouter();
const menuStore = useMenuStore();

/* --------------------------------------
 * Mode
 * -------------------------------------- */
const mode = computed<'add' | 'edit'>(() => {
  if (route.name === 'MenuEdit') return 'edit';
  return 'add';
});

const isDetail = computed(() => false);
const isEdit = computed(() => mode.value === 'edit');
const id = computed(() => String(route.params.id || ''));

/* --------------------------------------
 * Page title
 * -------------------------------------- */
const pageTitle = computed(() => (isEdit.value ? '編輯選單' : '新增選單'));

/* --------------------------------------
 * 父選單 options
 * -------------------------------------- */
const parentOptions = ref<SelectOption[]>([]);
const parentLoading = ref(false);

/* --------------------------------------
 * Schema
 * -------------------------------------- */
const schema = computed(() =>
  yup.object({
    name: yup.string().required('選單名稱不可為空').max(50, '選單名稱最多50字'),
    code: yup.string().required('選單代碼不可為空').max(50, '選單代碼最多50字'),
    path: yup.string().nullable().max(200, '選單路徑最多200字'),
    parentId: yup.string().nullable(),
    icon: yup.string().nullable().max(100, '圖示名稱最多100字'),
    orderNum: yup
      .number()
      .nullable()
      .transform((v, orig) =>
        orig === '' || orig === null || orig === undefined ? null : v,
      ),
    isVisible: yup.boolean().required('是否可見必填'),
  }),
);

/* --------------------------------------
 * useForm
 * -------------------------------------- */
const { errors, handleSubmit, setValues, defineField } = useForm({
  validationSchema: schema,
  initialValues: {
    name: '',
    code: '',
    path: '',
    parentId: '',
    icon: '',
    orderNum: null as number | null,
    isVisible: true,
  },
});

const [name] = defineField('name');
const [code] = defineField('code');
const [path] = defineField('path');
const [parentId] = defineField('parentId');
const [icon] = defineField('icon');
const [orderNum] = defineField('orderNum');
const [isVisible] = defineField('isVisible');

/* --------------------------------------
 * Detail
 * -------------------------------------- */
const detail = ref<any>(null);

const formatDateTime = (v?: string) => (!v ? '-' : String(v).replace('T', ' '));

/* --------------------------------------
 * Utils
 * -------------------------------------- */
const emptyToNull = (value: any) => {
  if (value === null || value === undefined || value === '') return null;
  return String(value).trim() || null;
};

/* --------------------------------------
 * Load parent menus
 * -------------------------------------- */
const loadParentOptions = async () => {
  parentLoading.value = true;

  await executeApi<any>({
    fn: async () => getAllMenus(),
    onSuccess: (res: any) => {
      const data = res?.data ?? res ?? [];
      const arr = Array.isArray(data) ? data : [];

      // 編輯時：避免把自己當父選單
      const filtered = isEdit.value
        ? arr.filter((m: any) => String(m?.id) !== id.value)
        : arr;

      parentOptions.value = filtered.map((m: any) => ({
        label: m?.name || m?.title || m?.code || '-',
        value: m?.id,
      }));
    },
    onFinally: () => {
      parentLoading.value = false;
    },
    showFailDialog: true,
    showCatchDialog: true,
    showSuccessDialog: false,
  });
};

/* --------------------------------------
 * Load detail
 * -------------------------------------- */
const loadDetail = async () => {
  if (!isEdit.value || !id.value) return;

  await executeApi({
    fn: async () => getMenuById(id.value),
    onSuccess: (res: any) => {
      const d = res?.data ?? res;

      detail.value = d;

      setValues(
        {
          name: d?.name ?? '',
          code: d?.code ?? '',
          path: d?.path ?? '',
          parentId: d?.parentId ?? '',
          icon: d?.icon ?? '',
          orderNum: d?.orderNum ?? null,
          isVisible: typeof d?.isVisible === 'boolean' ? d.isVisible : true,
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
const onSubmit = handleSubmit(async (values: any) => {
  const ok = await openConfirmDialog({
    title: '儲存確認',
    message: '確定要儲存選單嗎？',
  });

  if (!ok) return;

  const payloadBase = {
    name: values.name?.trim(),
    code: values.code?.trim(),
    path: emptyToNull(values.path),
    parentId: emptyToNull(values.parentId),
    icon: emptyToNull(values.icon),
    orderNum:
      values.orderNum === '' ||
      values.orderNum === null ||
      values.orderNum === undefined
        ? null
        : Number(values.orderNum),
    isVisible: Boolean(values.isVisible),
  };

  await executeApi({
    fn: async () => {
      if (isEdit.value) {
        return updateMenu({
          id: id.value,
          ...payloadBase,
        });
      }

      return createMenu(payloadBase);
    },
    onSuccess: async () => {
      await openInfoDialog({
        title: '提示訊息',
        message: '儲存成功',
        iconType: 'success',
      });

      menuStore.setShouldRefresh(true);
      router.push('/home/menus');
    },
  });
});

/* --------------------------------------
 * Navigation
 * -------------------------------------- */
const navigateBack = () => {
  router.push('/home/menus');
};

/* --------------------------------------
 * Mounted
 * -------------------------------------- */
onMounted(async () => {
  await loadParentOptions();
  await loadDetail();
});
</script>

<style scoped lang="scss">
.menu-form {
  &__checkbox-field {
    min-height: 72px;
    padding: 8px 0 0;
  }

  &__checkbox-label {
    margin: 0 0 8px;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }

  &__required {
    color: #dc2626;
  }

  &__hint {
    margin: 6px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: #6b7280;
  }
}
</style>

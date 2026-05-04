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
              :error="displayErrors.name"
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
              :error="displayErrors.code"
              required
              maxlength="50"
              placeholder="例如：product_management"
            />
          </div>

          <!-- 路徑 -->
          <div class="w-100 p-6">
            <FormInput
              label="選單路徑"
              v-model="path"
              :error="displayErrors.path"
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
              :error="displayErrors.parentId"
              :showAll="true"
              allLabel="（頂層）"
              :allValue="''"
            />

            <p class="form__text m-t-6" v-if="parentLoading">父選單載入中...</p>
          </div>

          <!-- Icon -->
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="圖示"
              v-model="icon"
              :error="displayErrors.icon"
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
              :error="displayErrors.orderNum"
              placeholder="例如：1"
            />
          </div>

          <!-- 是否可見 isVisible -->
          <div class="w-50 w-md-100 p-6">
            <FormCheckboxField
              label="是否可見"
              checkbox-label="顯示在選單中"
              v-model="isVisible"
              :trueValue="true"
              :falseValue="false"
              :error="displayErrors.isVisible"
              required
              hint="取消勾選後，該選單將不會顯示於前台選單列表。"
            />
          </div>
        </div>
      </FormSection>

      <!-- 檢視資訊 -->
      <FormSection v-if="isDetail" title="系統資訊">
        <div class="flex flex-wrap">
          <div class="w-50 w-md-100 p-6">
            <p class="form__text">建立時間</p>
            <DateFormatter
              :date="detail?.createdAt"
              format="YYYY-MM-DD HH:mm:ss"
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <p class="form__text">更新時間</p>
            <DateFormatter
              :date="detail?.updatedAt"
              format="YYYY-MM-DD HH:mm:ss"
            />
          </div>
        </div>
      </FormSection>

      <!-- bottom button -->
      <div class="flex justify-center m-y-12 gap-x-12 flex-wrap">
        <template v-if="!isDetail">
          <MButton type="submit">
            <font-awesome-icon icon="fa-floppy-disk" class="m-r-4" />
            儲存
          </MButton>
        </template>

        <MButton type="button" class="mbtn--red" @click="navigateBack">
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
import FormSection from '@/components/common/FormSection.vue';
import FormCheckboxField from '@/components/common/FormCheckboxField.vue';
import DateFormatter from '@/components/common/DateFormatter.vue';

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
 * Submit error display
 * -------------------------------------- */
const isSubmitted = ref(false);

const displayErrors = computed<Record<string, string | undefined>>(() => {
  if (!isSubmitted.value) return {};
  return errors.value;
});

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
      .typeError('排序必須是數字')
      .transform((value, originalValue) =>
        originalValue === '' ||
        originalValue === null ||
        originalValue === undefined
          ? null
          : value,
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
  validateOnMount: false,
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

/* --------------------------------------
 * Utils
 * -------------------------------------- */
const emptyToNull = (value: any) => {
  if (value === null || value === undefined || value === '') return null;
  return String(value).trim() || null;
};

const normalizeBoolean = (value: any) => {
  if (value === true || value === false) return value;

  const text = String(value ?? '')
    .trim()
    .toLowerCase();

  if (text === 'true' || text === '1') return true;
  if (text === 'false' || text === '0') return false;

  return true;
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

      const filtered = isEdit.value
        ? arr.filter((menu: any) => String(menu?.id) !== id.value)
        : arr;

      parentOptions.value = filtered.map((menu: any) => ({
        label: menu?.name || menu?.title || menu?.code || '-',
        value: menu?.id,
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
      const data = res?.data ?? res;

      detail.value = data;

      setValues(
        {
          name: data?.name ?? '',
          code: data?.code ?? '',
          path: data?.path ?? '',
          parentId: data?.parentId ?? '',
          icon: data?.icon ?? '',
          orderNum: data?.orderNum ?? null,
          isVisible: normalizeBoolean(data?.isVisible),
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
  async (values: any) => {
    isSubmitted.value = true;

    const ok = await openConfirmDialog({
      title: '儲存確認',
      message: '確定要儲存選單嗎？',
    });

    if (!ok) return;

    const payloadBase = {
      name: String(values.name ?? '').trim(),
      code: String(values.code ?? '').trim(),
      path: emptyToNull(values.path),
      parentId: emptyToNull(values.parentId),
      icon: emptyToNull(values.icon),
      orderNum:
        values.orderNum === '' ||
        values.orderNum === null ||
        values.orderNum === undefined
          ? null
          : Number(values.orderNum),
      isVisible: normalizeBoolean(values.isVisible),
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
      showSuccessDialog: false,
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
}
</style>

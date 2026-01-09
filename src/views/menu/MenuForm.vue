<!-- src/views/menu/MenuForm.vue -->
<template>
  <MCard>
    <form @submit.prevent="onSubmit">
      <p class="form__text form__text--title">{{ pageTitle }}</p>

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
        <div class="w-25 w-md-50 w-sm-100 p-6">
          <FormInput
            label="排序（orderNum）"
            type="number"
            v-model="orderNum"
            :error="errors.orderNum"
            placeholder="例如：1"
          />
        </div>

        <!-- 是否可見 isVisible -->
        <div class="w-25 w-md-50 w-sm-100 p-6">
          <FormSelect
            label="是否可見"
            v-model="isVisible"
            :options="visibleOptions"
            :error="errors.isVisible"
            required
          />
        </div>

        <!-- 檢視資訊（可選：若你未來有 detail mode） -->
        <template v-if="isDetail">
          <div class="w-100 p-6">
            <p class="form__text form__text--red">系統資訊（檢視）</p>
          </div>

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
        </template>
      </div>

      <!-- bottom button -->
      <div class="flex justify-center m-y-12 gap-x-12 flex-wrap">
        <template v-if="!isDetail">
          <MButton
            v-if="isDev"
            type="button"
            class="mbtn--gray"
            @click="fillMockData"
          >
            快速產生資料
          </MButton>

          <MButton type="submit">儲存</MButton>
        </template>

        <MButton type="button" class="mbtn--red" @click="router.back()">
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

import { executeApi } from '@/utils/executeApiUtils';
import { useDialogStore } from '@/stores';

import {
  createMenu,
  updateMenu,
  getMenuById,
  getAllMenus,
} from '@/services/adminMenuService';

interface SelectOption {
  label: string;
  value: any;
}

const route = useRoute();
const router = useRouter();
const dialogStore = useDialogStore();

/** 你如果有 MenuDetail route，可以照 RoleForm 那樣延伸 */
const mode = computed<'add' | 'edit'>(() => {
  if (route.name === 'MenuEdit') return 'edit';
  return 'add';
});
const isDetail = computed(() => false);

const id = computed(() => String(route.params.id || ''));
const isEdit = computed(() => mode.value === 'edit');

/* dev-only */
const isDev = import.meta.env.DEV;

/* page title */
const pageTitle = computed(() => (isEdit.value ? '編輯選單' : '新增選單'));

/* 父選單 options */
const parentOptions = ref<SelectOption[]>([]);
const parentLoading = ref(false);

const visibleOptions = ref<SelectOption[]>([
  { label: '是（可見）', value: true },
  { label: '否（隱藏）', value: false },
]);

/* schema：依 DTO */
const schema = computed(() => {
  // create / edit 共用（update 允許不填，但前端通常還是要求 name+code）
  return yup.object({
    name: yup.string().required('選單名稱不可為空').max(50, '選單名稱最多50字'),
    code: yup.string().required('選單代碼不可為空').max(50, '選單代碼最多50字'),
    path: yup.string().nullable().max(200, '選單路徑最多200字'),
    parentId: yup.string().nullable(),
    icon: yup.string().nullable().max(100, '圖示名稱最多100字'),
    orderNum: yup
      .number()
      .nullable()
      .transform((v, orig) =>
        orig === '' || orig === null || orig === undefined ? null : v
      ),
    isVisible: yup.boolean().required('是否可見必填'),
  });
});

/* useForm（defineField + v-model） */
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

/* defineField */
const [name] = defineField('name');
const [code] = defineField('code');
const [path] = defineField('path');
const [parentId] = defineField('parentId');
const [icon] = defineField('icon');
const [orderNum] = defineField('orderNum');
const [isVisible] = defineField('isVisible');

/* detail（保留給未來） */
const detail = ref<any>(null);
const formatDateTime = (v?: string) => (!v ? '-' : String(v).replace('T', ' '));

/* load parent menus */
const loadParentOptions = async () => {
  parentLoading.value = true;

  await executeApi<any>({
    fn: async () => getAllMenus(),
    onSuccess: (res: any) => {
      const data = (res as any)?.data ?? res ?? [];
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

/* load detail */
const loadDetail = async () => {
  if (!isEdit.value || !id.value) return;

  await executeApi({
    fn: async () => getMenuById(id.value),
    onSuccess: (res: any) => {
      const d = (res as any)?.data ?? res;

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
        false
      );
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

/* mock */
const fillMockData = async () => {
  const ts = Date.now();
  setValues({
    name: `測試選單_${ts}`,
    code: `menu_test_${ts}`,
    path: '/admin/test',
    parentId: '',
    icon: 'mdi-test-tube',
    orderNum: 1,
    isVisible: true,
  });
};

/* submit */
const onSubmit = handleSubmit(async (values: any) => {
  const ok = await dialogStore.openConfirmDialog({
    title: '儲存確認',
    message: '確定要儲存選單嗎？',
  });
  if (!ok) return;

  // payload 對齊 DTO（空字串轉 null）
  const payloadBase = {
    name: values.name?.trim(),
    code: values.code?.trim(),
    path: values.path?.trim() || null,
    parentId: values.parentId?.trim() || null,
    icon: values.icon?.trim() || null,
    orderNum:
      values.orderNum === '' || values.orderNum === undefined
        ? null
        : values.orderNum,
    isVisible: Boolean(values.isVisible),
  };

  await executeApi({
    fn: async () => {
      if (isEdit.value) {
        return updateMenu({ id: id.value, ...payloadBase });
      }
      return createMenu(payloadBase);
    },
    onSuccess: async () => {
      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '儲存成功',
        iconType: 'success',
      });
      router.push('/home/menus');
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
});

onMounted(async () => {
  await loadParentOptions();
  await loadDetail();
});
</script>

<style scoped></style>

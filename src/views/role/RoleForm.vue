<!-- src/views/role/RoleForm.vue -->
<template>
  <MCard>
    <form @submit.prevent="onSubmit">
      <p class="form__text form__text--title">{{ pageTitle }}</p>

      <div class="flex flex-wrap">
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="角色名稱"
            v-model="name"
            :error="errors.name"
            required
            maxlength="50"
            placeholder="例如：店家負責人"
          />
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="角色代碼"
            v-model="code"
            :error="errors.code"
            required
            maxlength="50"
            placeholder="例如：ROLE_STORE_OWNER"
          />
        </div>

        <div class="w-100 p-6">
          <FormInput
            label="描述（可選）"
            v-model="description"
            :error="errors.description"
            maxlength="200"
            placeholder="可留空"
          />
        </div>

        <!-- 檢視資訊 -->
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

        <template v-else>
          <MButton type="button" class="mbtn--gray" @click="navigateToEdit">
            編輯
          </MButton>
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

import { executeApi } from '@/utils/executeApiUtils';
import { useDialogStore } from '@/stores';

import {
  createRole,
  updateRole,
  getRoleById,
} from '@/services/adminRoleService';
import { buildRoleSchema } from '@/validators/roleSchemas';

/* Setup */
const route = useRoute();
const router = useRouter();
const dialogStore = useDialogStore();

const mode = computed<'add' | 'edit' | 'detail'>(() => {
  if (route.name === 'RoleAdd') return 'add';
  if (route.name === 'RoleEdit') return 'edit';
  return 'detail';
});

const isDetail = computed(() => mode.value === 'detail');
const id = computed(() => String(route.params.id || ''));

/* dev-only */
const isDev = import.meta.env.DEV;

/* page title */
const pageTitle = computed(() => {
  if (mode.value === 'add') return '新增角色';
  if (mode.value === 'edit') return '編輯角色';
  return '角色詳情';
});

const schema = computed(() => buildRoleSchema(isDetail.value));

/* useForm（defineField + v-model） */
const { errors, handleSubmit, setValues, defineField } = useForm({
  validationSchema: schema,
  initialValues: {
    name: '',
    code: '',
    description: '',
  },
});

const [name] = defineField('name');
const [code] = defineField('code');
const [description] = defineField('description');

/* detail */
const detail = ref<any>(null);

const formatDateTime = (v?: string) => (!v ? '-' : String(v).replace('T', ' '));

const reloadDetail = async () => {
  if (!id.value) return;

  await executeApi({
    fn: async () => getRoleById(id.value),
    onSuccess: (data) => {
      // service 若回 ApiResponse，executeApi 通常會把 data 解開；
      // 這邊保守處理
      const d = (data as any)?.data ?? data;

      detail.value = d;

      setValues({
        name: d?.name ?? '',
        code: d?.code ?? '',
        description: d?.description ?? '',
      });
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

onMounted(async () => {
  // edit / detail 都要載入
  if (mode.value !== 'add') {
    await reloadDetail();
  }
});

/* mock */
const fillMockData = async () => {
  const ts = Date.now();
  setValues({
    name: `測試角色_${ts}`,
    code: `ROLE_TEST_${ts}`,
    description: 'dev 快速帶入的 mock 角色資料',
  });
};

/* submit */
const onSubmit = handleSubmit(async (values) => {
  if (isDetail.value) return;

  const ok = await dialogStore.openConfirmDialog({
    title: '儲存確認',
    message: '確定要儲存角色嗎？',
  });
  if (!ok) return;

  await executeApi({
    fn: async () => {
      if (mode.value === 'edit') {
        return updateRole({
          id: id.value,
          name: values.name?.trim(),
          code: values.code?.trim(),
          description: values.description?.trim() || null,
        });
      }
      return createRole({
        name: values.name?.trim(),
        code: values.code?.trim(),
        description: values.description?.trim() || null,
      });
    },
    onSuccess: async () => {
      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '儲存成功',
        iconType: 'success',
      });
      router.push('/home/roles');
    },
  });
});

/* navigation */
const navigateToEdit = () => {
  if (!id.value) return;
  router.push(`/home/roles/edit/${id.value}`);
};
</script>

<style scoped></style>

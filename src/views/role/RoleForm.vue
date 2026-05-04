<!-- src/views/role/RoleForm.vue -->
<template>
  <MCard>
    <form class="role-form" @submit.prevent="onSubmit">
      <p class="form__text form__text--title">{{ pageTitle }}</p>

      <!-- 基本資料 -->
      <FormSection title="基本資料">
        <div class="flex flex-wrap">
          <!-- 角色名稱 -->
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="角色名稱"
              v-model="name"
              :error="displayErrors.name"
              required
              maxlength="50"
              placeholder="例如：店家負責人"
              :disabled="isDetail"
            />
          </div>

          <!-- 角色代碼 -->
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="角色代碼"
              v-model="code"
              :error="displayErrors.code"
              :required="mode === 'add'"
              maxlength="50"
              placeholder="例如：ROLE_STORE_OWNER"
              :disabled="isEdit || isDetail"
            />

            <p v-if="isEdit" class="form__text form__text--section m-t-4">
              角色代碼建立後不可修改
            </p>
          </div>

          <!-- 描述 -->
          <div class="w-100 p-6">
            <FormInput
              label="描述"
              v-model="description"
              :error="displayErrors.description"
              maxlength="200"
              placeholder="可留空"
              :disabled="isDetail"
            />
          </div>
        </div>
      </FormSection>

      <!-- 系統資訊 -->
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

        <template v-else>
          <MButton type="button" class="mbtn--gray" @click="navigateToEdit">
            <font-awesome-icon icon="fa-pen-to-square" class="m-r-4" />
            編輯
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

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSection from '@/components/common/FormSection.vue';
import DateFormatter from '@/components/common/DateFormatter.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { useRoleStore } from '@/stores/role/useRoleStore';

import {
  createRole,
  updateRole,
  getRoleById,
} from '@/services/adminRoleService';

import { buildRoleSchema } from '@/validators/roleSchemas';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

const route = useRoute();
const router = useRouter();
const roleStore = useRoleStore();

/* --------------------------------------
 * Mode
 * -------------------------------------- */
const mode = computed<'add' | 'edit' | 'detail'>(() => {
  if (route.name === 'RoleAdd') return 'add';
  if (route.name === 'RoleEdit') return 'edit';
  return 'detail';
});

const isDetail = computed(() => mode.value === 'detail');
const isEdit = computed(() => mode.value === 'edit');
const id = computed(() => String(route.params.id || ''));

/* --------------------------------------
 * Page title
 * -------------------------------------- */
const pageTitle = computed(() => {
  if (mode.value === 'add') return '新增角色';
  if (mode.value === 'edit') return '編輯角色';
  return '角色詳情';
});

/* --------------------------------------
 * Submit error display
 * -------------------------------------- */
const isSubmitted = ref(false);

const displayErrors = computed<Record<string, string | undefined>>(() => {
  if (!isSubmitted.value) return {};
  return errors.value;
});

/* --------------------------------------
 * Schema
 * -------------------------------------- */
const schema = computed(() => buildRoleSchema(isDetail.value));

/* --------------------------------------
 * useForm
 * -------------------------------------- */
const { errors, handleSubmit, setValues, defineField } = useForm({
  validationSchema: schema,
  initialValues: {
    name: '',
    code: '',
    description: '',
  },
  validateOnMount: false,
});

const [name] = defineField('name');
const [code] = defineField('code');
const [description] = defineField('description');

/* --------------------------------------
 * Detail
 * -------------------------------------- */
const detail = ref<any>(null);

const reloadDetail = async () => {
  if (!id.value) return;

  await executeApi({
    fn: async () => getRoleById(id.value),
    onSuccess: (res: any) => {
      const data = res?.data ?? res;

      detail.value = data;

      setValues(
        {
          name: data?.name ?? '',
          code: data?.code ?? '',
          description: data?.description ?? '',
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

    if (isDetail.value) return;

    const ok = await openConfirmDialog({
      title: '儲存確認',
      message: '確定要儲存角色嗎？',
    });

    if (!ok) return;

    const payload = {
      name: String(values.name ?? '').trim(),
      code: String(values.code ?? '').trim(),
      description: String(values.description ?? '').trim() || null,
    };

    await executeApi({
      fn: async () => {
        if (isEdit.value) {
          return updateRole({
            id: id.value,
            name: payload.name,
            description: payload.description,
          });
        }

        return createRole(payload);
      },
      onSuccess: async () => {
        await openInfoDialog({
          title: '提示訊息',
          message: '儲存成功',
          iconType: 'success',
        });

        roleStore.setShouldRefresh(true);
        router.push('/home/roles');
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
const navigateToEdit = () => {
  if (!id.value) return;
  router.push(`/home/roles/edit/${id.value}`);
};

const navigateBack = () => {
  router.push('/home/roles');
};

/* --------------------------------------
 * Mounted
 * -------------------------------------- */
onMounted(async () => {
  if (mode.value !== 'add') {
    await reloadDetail();
  }
});
</script>

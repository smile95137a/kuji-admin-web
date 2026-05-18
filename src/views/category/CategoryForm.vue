<template>
  <MCard>
    <form class="category-form" @submit.prevent="onSubmit">
      <p class="form__text form__text--title">
        主題{{ isEdit ? '編輯' : '新增' }}
      </p>

      <div class="category-form__layout">
        <div class="category-form__left">
          <FormSection title="主題字典">
            <div class="category-form__card">
              <div class="flex flex-wrap">
                <!-- 主題名稱 -->
                <div class="w-50 w-md-100 p-6">
                  <FormInput
                    label="主題名稱"
                    v-model="name"
                    :error="displayErrors.name"
                    required
                    maxlength="100"
                    placeholder="例如：復古、鬼滅之刃"
                  />
                </div>

                <!-- 顯示排序 -->
                <div class="w-50 w-md-100 p-6">
                  <FormInput
                    label="顯示排序"
                    type="number"
                    v-model="displayOrder"
                    :error="displayErrors.displayOrder"
                    placeholder="預設 0"
                  />
                </div>
              </div>

              <div v-if="isEdit" class="category-form__editing-tip">
                目前正在編輯主題，修改後請按「更新主題」。
              </div>
            </div>
          </FormSection>
        </div>

        <div class="category-form__right">
          <FormSection title="代表圖片">
            <div class="category-form__image-card">
              <div
                class="category-form__image-upload"
                :class="{ 'category-form__image-upload--empty': !imageUrl }"
                @click="triggerImageUpload"
              >
                <img
                  v-if="imageUrl"
                  :src="resolveImageUrl(imageUrl)"
                  alt="主題代表圖"
                  class="category-form__image-preview"
                />

                <div v-else class="category-form__image-empty">
                  <font-awesome-icon icon="fa-image" />
                  <span>點擊上傳主題圖片</span>
                </div>
              </div>

              <div class="category-form__image-actions">
                <MButton
                  type="button"
                  class="mbtn--gray"
                  :disabled="imageUploading"
                  @click="triggerImageUpload"
                >
                  {{ imageUploading ? '上傳中...' : '選擇圖片' }}
                </MButton>

                <MButton
                  v-if="imageUrl"
                  type="button"
                  class="mbtn--gray"
                  :disabled="imageUploading"
                  @click="clearThemeImage"
                >
                  清除圖片
                </MButton>
              </div>

              <input
                ref="imageFileInput"
                class="category-form__hidden-input"
                type="file"
                accept="image/*"
                :disabled="imageUploading"
                @change="onImageFileChange"
              />
            </div>
          </FormSection>
        </div>
      </div>

      <div class="flex justify-center m-y-12 gap-x-12 flex-wrap">
        <MButton type="submit" :disabled="imageUploading">
          <font-awesome-icon icon="fa-floppy-disk" class="m-r-4" />
          {{ isEdit ? '更新主題' : '新增主題' }}
        </MButton>

        <MButton type="button" class="mbtn--gray" @click="resetForm">
          <font-awesome-icon icon="fa-rotate-left" class="m-r-4" />
          清除
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
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import * as yup from 'yup';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSection from '@/components/common/FormSection.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { useCategoryStore } from '@/stores/category/useCategoryStore';

import {
  queryThemes,
  updateTheme,
  upsertTheme,
  type CategoryRes,
} from '@/services/adminCategoryService';

import { uploadLotteryImage } from '@/services/adminUploadService';
import { openInfoDialog } from '@/utils/dialog/infoDialog';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';

const route = useRoute();
const router = useRouter();
const categoryStore = useCategoryStore();

const isEdit = computed(() => Boolean(route.params.id));
const id = computed(() => String(route.params.id || ''));

const isSubmitted = ref(false);

const displayErrors = computed<Record<string, string | undefined>>(() => {
  if (!isSubmitted.value) return {};
  return errors.value;
});

const imageFileInput = ref<HTMLInputElement | null>(null);
const imageUploading = ref(false);

const API_BASE_URL =
  ((import.meta as any)?.env?.VITE_API_BASE_URL as string) || '';

const resolveImageUrl = (url?: string) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;

  if (API_BASE_URL) {
    const base = API_BASE_URL.replace(/\/$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;

    return `${base}${path}`;
  }

  return url;
};

const unwrapList = (res: any): CategoryRes[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  if (Array.isArray(res?.data?.list)) return res.data.list;

  return [];
};

const schema = yup.object({
  name: yup.string().required('請先輸入主題名稱').max(100, '主題名稱最多100字'),

  imageUrl: yup.string().nullable(),

  displayOrder: yup
    .number()
    .typeError('顯示排序必須是數字')
    .min(0, '顯示排序不可小於 0')
    .nullable()
    .transform((value, originalValue) =>
      originalValue === '' ||
      originalValue === null ||
      originalValue === undefined
        ? null
        : value,
    ),
});

const {
  errors,
  handleSubmit,
  setValues,
  defineField,
  resetForm: resetVeeForm,
} = useForm({
  validationSchema: schema,
  initialValues: {
    name: '',
    imageUrl: '',
    displayOrder: '' as string | number | null,
  },
  validateOnMount: false,
});

const [name] = defineField('name');
const [imageUrl] = defineField('imageUrl');
const [displayOrder] = defineField('displayOrder');

/* --------------------------------------
 * Image upload
 * -------------------------------------- */
const triggerImageUpload = () => {
  if (imageUploading.value) return;
  imageFileInput.value?.click();
};

const clearThemeImage = () => {
  imageUrl.value = '';
};

const onImageFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  input.value = '';

  if (!file) return;

  if (!file.type.startsWith('image/')) {
    await openInfoDialog({
      title: '提示訊息',
      message: '請選擇圖片檔案。',
      iconType: 'warning',
    });
    return;
  }

  imageUploading.value = true;

  await executeApi({
    fn: async () => uploadLotteryImage(file),
    onSuccess: async (res: any) => {
      const url = res?.data?.imageUrl || res?.imageUrl || '';

      if (!url) {
        await openInfoDialog({
          title: '提示訊息',
          message: '上傳成功但未取得圖片網址，請檢查後端回傳。',
          iconType: 'warning',
        });
        return;
      }

      imageUrl.value = url;
    },
    onFinally: async () => {
      imageUploading.value = false;
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

/* --------------------------------------
 * Load detail
 * 舊版沒有單筆 detail API，所以照舊 API queryThemes 後用 id 過濾
 * -------------------------------------- */
const loadDetail = async () => {
  if (!isEdit.value || !id.value) return;

  await executeApi({
    fn: async () => queryThemes({ condition: { status: 'ACTIVE' } }),
    onSuccess: async (res: any) => {
      const themes = unwrapList(res);
      const theme = themes.find((item) => String(item.id) === String(id.value));

      if (!theme) {
        await openInfoDialog({
          title: '提示訊息',
          message: '查無主題資料。',
          iconType: 'warning',
        });

        router.push('/home/category');
        return;
      }

      setValues(
        {
          name: theme.name || '',
          imageUrl: theme.imageUrl || '',
          displayOrder: String(theme.displayOrder ?? 0),
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
      message: `確定要${isEdit.value ? '更新' : '新增'}主題嗎？`,
    });

    if (!ok) return;

    const payload = {
      name: String(values.name ?? '').trim(),
      imageUrl: String(values.imageUrl ?? '').trim() || undefined,
      displayOrder:
        values.displayOrder === '' ||
        values.displayOrder === null ||
        values.displayOrder === undefined
          ? undefined
          : Number(values.displayOrder),
    };

    await executeApi({
      fn: async () => {
        if (isEdit.value) {
          return updateTheme(id.value, payload);
        }

        return upsertTheme(payload);
      },
      onSuccess: async () => {
        await openInfoDialog({
          title: '提示訊息',
          message: isEdit.value ? '主題更新成功' : '主題新增成功',
          iconType: 'success',
        });

        categoryStore.setShouldRefresh(true);
        router.push('/home/category');
      },
      onFail: async () => {
        await openInfoDialog({
          title: '儲存失敗',
          message: '主題儲存失敗，請檢查名稱是否重複。',
          iconType: 'warning',
        });
      },
      showSuccessDialog: false,
      showFailDialog: false,
      showCatchDialog: true,
    });
  },
  () => {
    isSubmitted.value = true;
  },
);

/* --------------------------------------
 * Reset / Navigation
 * -------------------------------------- */
const resetForm = () => {
  if (isEdit.value) {
    loadDetail();
    return;
  }

  resetVeeForm({
    values: {
      name: '',
      imageUrl: '',
      displayOrder: '',
    },
  });

  isSubmitted.value = false;
};

const navigateBack = () => {
  router.push('/home/category');
};

onMounted(async () => {
  await loadDetail();
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as *;

.category-form {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;

  &__layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 420px);
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
  &__image-card {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    padding: 14px;
    border: 1px solid color.mix($form-border, #fff, 72%);
    border-radius: 14px;
    background: $form-bg;
  }

  &__editing-tip {
    margin-top: 12px;
    padding: 10px 12px;
    border-radius: 8px;
    background: #eff6ff;
    color: #1d4ed8;
    font-size: 13px;
  }

  &__image-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__image-upload {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    aspect-ratio: 16 / 9;
    border: 1px dashed $form-border;
    border-radius: 14px;
    background: color.mix($form-border, #fff, 28%);
    cursor: pointer;
    overflow: hidden;
    transition:
      border-color 0.15s ease,
      background-color 0.15s ease,
      transform 0.12s ease;

    &:hover {
      border-color: $brand;
      background: $brand-light;
    }

    &:active {
      transform: scale(0.995);
    }

    &--empty {
      background: color.mix($brand-light, #fff, 42%);
    }
  }

  &__image-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__image-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: $form-muted;
    font-size: 13px;

    svg {
      color: $brand;
      font-size: 28px;
    }
  }

  &__image-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__hidden-input {
    display: none;
  }

  @media (max-width: 1180px) {
    &__layout {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 576px) {
    &__card,
    &__image-card {
      padding: 12px;
    }
  }
}
</style>

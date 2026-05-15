<!-- src/views/category/CategoryManagement.vue -->
<template>
  <MCard>
    <form class="category-management__form" @submit.prevent="saveTheme">
      <p class="form__text form__text--title">類別管理</p>

      <FormSection title="主題字典">
        <div class="flex flex-wrap">
          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="主題名稱"
              v-model="form.name"
              required
              maxlength="100"
              placeholder="例如：復古、鬼滅之刃"
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="顯示排序"
              type="number"
              v-model="form.displayOrder"
              placeholder="預設 0"
            />
          </div>

          <div class="w-100 p-6">
            <p class="form__label">代表圖片</p>
            <div class="category-management__image-field">
              <div
                class="category-management__image-upload"
                :class="{ 'category-management__image-upload--empty': !form.imageUrl }"
                @click="triggerImageUpload"
              >
                <img
                  v-if="form.imageUrl"
                  :src="form.imageUrl"
                  alt="主題代表圖"
                  class="category-management__image-preview"
                />
                <div v-else class="category-management__image-empty">
                  <font-awesome-icon icon="fa-image" />
                  <span>點擊上傳主題圖片</span>
                </div>
              </div>

              <div class="category-management__image-actions">
                <MButton
                  type="button"
                  class="mbtn--gray"
                  :disabled="imageUploading"
                  @click="triggerImageUpload"
                >
                  {{ imageUploading ? '上傳中...' : '選擇圖片' }}
                </MButton>

                <MButton
                  v-if="form.imageUrl"
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
                class="category-management__hidden-input"
                type="file"
                accept="image/*"
                :disabled="imageUploading"
                @change="onImageFileChange"
              />
            </div>
          </div>
        </div>

        <div v-if="editingId" class="category-management__editing-tip">
          目前正在編輯主題，修改後請按「更新主題」。
        </div>

        <div class="category-management__actions">
          <MButton type="submit">
            <font-awesome-icon icon="fa-floppy-disk" class="m-r-4" />
            {{ editingId ? '更新主題' : '新增主題' }}
          </MButton>

          <MButton type="button" class="mbtn--gray" @click="resetForm">
            <font-awesome-icon icon="fa-rotate-left" class="m-r-4" />
            清除
          </MButton>
        </div>
      </FormSection>
    </form>
  </MCard>

  <MCard class="m-t-12">
    <div class="category-management__toolbar">
      <div>
        <p class="category-management__title">主題清單</p>
        <p class="category-management__summary">
          共 {{ themes.length }} 個主題，商品新增頁與前台主題篩選都會使用這份字典。
        </p>
      </div>

      <MButton type="button" class="mbtn--gray" @click="loadThemes">
        <font-awesome-icon icon="fa-rotate" class="m-r-4" />
        重新整理
      </MButton>
    </div>

    <NoData v-if="!themes.length && !loading" message="目前沒有主題資料" />

    <div v-else class="category-management__table-wrap">
      <table class="category-management__table">
        <thead>
          <tr>
            <th>主題</th>
            <th>同義字</th>
            <th>商品數</th>
            <th>排序</th>
            <th>圖片</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="theme in themes"
            :key="theme.id || theme.name"
            :class="{ 'category-management__row--editing': editingId === (theme.id || '') }"
          >
            <td>
              <button
                type="button"
                class="category-management__link"
                @click="editTheme(theme)"
              >
                {{ theme.name }}
              </button>
            </td>
            <td>
              <div class="category-management__aliases">
                <span
                  v-for="alias in theme.aliases || []"
                  :key="alias.id"
                  class="category-management__alias"
                >
                  {{ alias.aliasName }}
                  <button
                    type="button"
                    class="category-management__alias-remove"
                    :aria-label="`刪除 ${alias.aliasName}`"
                    @click="removeAlias(alias.id)"
                  >
                    ×
                  </button>
                </span>

                <span v-if="!theme.aliases?.length" class="category-management__muted">
                  -
                </span>
              </div>

              <div v-if="theme.id" class="category-management__alias-add">
                <FormInput
                  label="新增同義字"
                  v-model="aliasInputs[theme.id]"
                  maxlength="100"
                  placeholder="輸入同義字後按新增"
                />
                <MButton size="sm" type="button" @click="addAlias(theme.id)">
                  新增同義字
                </MButton>
              </div>
            </td>
            <td>{{ theme.productCount ?? 0 }}</td>
            <td>{{ theme.displayOrder ?? 0 }}</td>
            <td>
              <img
                v-if="theme.imageUrl"
                :src="theme.imageUrl"
                alt="主題圖"
                class="category-management__table-image"
              />
              <span v-else class="category-management__muted">-</span>
            </td>
            <td>
              <div class="category-management__row-actions">
                <MButton size="sm" type="button" @click="editTheme(theme)">
                  <font-awesome-icon icon="fa-pen-to-square" class="m-r-4" />
                  編輯
                </MButton>
                <MButton
                  size="sm"
                  type="button"
                  class="mbtn--red"
                  :disabled="!theme.id"
                  @click="removeTheme(theme)"
                >
                  <font-awesome-icon icon="fa-trash" class="m-r-4" />
                  刪除
                </MButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </MCard>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSection from '@/components/common/FormSection.vue';
import NoData from '@/components/common/NoData.vue';

import {
  createThemeAlias,
  deleteTheme,
  deleteThemeAlias,
  queryThemes,
  updateTheme,
  upsertTheme,
  type CategoryRes,
} from '@/services/adminCategoryService';
import { uploadLotteryImage } from '@/services/adminUploadService';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

const themes = ref<CategoryRes[]>([]);
const loading = ref(false);
const editingId = ref('');
const aliasInputs = reactive<Record<string, string>>({});
const imageFileInput = ref<HTMLInputElement | null>(null);
const imageUploading = ref(false);

const form = reactive({
  name: '',
  imageUrl: '',
  displayOrder: '',
});

const unwrapList = (res: any): CategoryRes[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

const loadThemes = async () => {
  loading.value = true;
  try {
    const res = await queryThemes({ condition: { status: 'ACTIVE' } });
    themes.value = unwrapList(res);
  } catch (error) {
    console.error('[CategoryManagement] loadThemes failed:', error);
    await openInfoDialog({
      title: '載入失敗',
      message: '主題資料載入失敗，請稍後再試。',
      iconType: 'warning',
    });
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  editingId.value = '';
  form.name = '';
  form.imageUrl = '';
  form.displayOrder = '';
};

const triggerImageUpload = () => {
  if (imageUploading.value) return;
  imageFileInput.value?.click();
};

const clearThemeImage = () => {
  form.imageUrl = '';
};

const onImageFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  input.value = '';

  if (!file) return;

  imageUploading.value = true;
  try {
    const res = await uploadLotteryImage(file);
    const imageUrl = res?.data?.imageUrl || (res as any)?.imageUrl || '';

    if (!imageUrl) {
      await openInfoDialog({
        title: '提示訊息',
        message: '上傳成功但未取得圖片網址，請檢查後端回傳。',
        iconType: 'warning',
      });
      return;
    }

    form.imageUrl = imageUrl;
  } catch (error) {
    console.error('[CategoryManagement] upload image failed:', error);
    await openInfoDialog({
      title: '上傳失敗',
      message: '主題圖片上傳失敗，請稍後再試。',
      iconType: 'warning',
    });
  } finally {
    imageUploading.value = false;
  }
};

const saveTheme = async () => {
  const name = form.name.trim();
  if (!name) {
    await openInfoDialog({
      title: '欄位未填',
      message: '請先輸入主題名稱。',
      iconType: 'warning',
    });
    return;
  }

  const payload = {
    name,
    imageUrl: form.imageUrl.trim() || undefined,
    displayOrder: form.displayOrder === '' ? undefined : Number(form.displayOrder),
  };

  try {
    if (editingId.value) {
      await updateTheme(editingId.value, payload);
    } else {
      await upsertTheme(payload);
    }
    resetForm();
    await loadThemes();
  } catch (error) {
    console.error('[CategoryManagement] saveTheme failed:', error);
    await openInfoDialog({
      title: '儲存失敗',
      message: '主題儲存失敗，請檢查名稱是否重複。',
      iconType: 'warning',
    });
  }
};

const editTheme = (theme: CategoryRes) => {
  editingId.value = theme.id || '';
  form.name = theme.name || '';
  form.imageUrl = theme.imageUrl || '';
  form.displayOrder = String(theme.displayOrder ?? 0);
  nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
};

const removeTheme = async (theme: CategoryRes) => {
  if (!theme.id) return;

  const ok = await openConfirmDialog({
    title: '刪除主題',
    message: `確定要刪除「${theme.name}」嗎？若已有商品使用，後端會拒絕刪除。`,
  });
  if (!ok) return;

  try {
    await deleteTheme(theme.id);
    if (editingId.value === theme.id) resetForm();
    await loadThemes();
  } catch (error) {
    console.error('[CategoryManagement] removeTheme failed:', error);
    await openInfoDialog({
      title: '刪除失敗',
      message: '若已有商品使用此主題，請先調整商品資料後再刪除。',
      iconType: 'warning',
    });
  }
};

const addAlias = async (themeId: string) => {
  const aliasName = (aliasInputs[themeId] || '').trim();
  if (!aliasName) {
    await openInfoDialog({
      title: '欄位未填',
      message: '請先輸入同義字名稱。',
      iconType: 'warning',
    });
    return;
  }

  try {
    await createThemeAlias(themeId, aliasName);
    aliasInputs[themeId] = '';
    await loadThemes();
  } catch (error) {
    console.error('[CategoryManagement] addAlias failed:', error);
    await openInfoDialog({
      title: '新增失敗',
      message: '同義字新增失敗，請確認沒有重複。',
      iconType: 'warning',
    });
  }
};

const removeAlias = async (aliasId: string) => {
  const ok = await openConfirmDialog({
    title: '刪除同義字',
    message: '確定要刪除此同義字嗎？',
  });
  if (!ok) return;

  try {
    await deleteThemeAlias(aliasId);
    await loadThemes();
  } catch (error) {
    console.error('[CategoryManagement] removeAlias failed:', error);
    await openInfoDialog({
      title: '刪除失敗',
      message: '同義字刪除失敗，請稍後再試。',
      iconType: 'warning',
    });
  }
};

onMounted(loadThemes);
</script>

<style scoped lang="scss">
.category-management {
  &__form {
    width: 100%;
  }

  &__actions,
  &__toolbar,
  &__row-actions,
  &__alias-add,
  &__image-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__actions {
    justify-content: center;
    margin-top: 12px;
  }

  &__toolbar {
    justify-content: space-between;
    margin-bottom: 12px;
  }

  &__title {
    font-size: 18px;
    font-weight: 700;
    margin: 0;
  }

  &__summary,
  &__muted {
    color: #667085;
    font-size: 13px;
  }

  &__editing-tip {
    margin-top: 12px;
    padding: 10px 12px;
    border-radius: 8px;
    background: #eff6ff;
    color: #1d4ed8;
    font-size: 13px;
  }

  &__table-wrap {
    overflow-x: auto;
  }

  &__table {
    width: 100%;
    min-width: 920px;
    border-collapse: collapse;

    th,
    td {
      border-bottom: 1px solid #eaecf0;
      padding: 12px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background: #f8fafc;
      color: #344054;
      font-weight: 700;
      white-space: nowrap;
    }
  }

  &__row--editing {
    background: #f8fafc;
  }

  &__link {
    border: 0;
    padding: 0;
    background: transparent;
    color: #175cd3;
    cursor: pointer;
    text-decoration: none;
  }

  &__aliases {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }

  &__alias {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: 1px solid #d0d5dd;
    border-radius: 6px;
    padding: 3px 8px;
    background: #fff;
    color: #344054;
    font-size: 13px;
  }

  &__alias-remove {
    border: 0;
    background: transparent;
    color: #b42318;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    padding: 0;
  }

  &__image-field {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__image-upload {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 280px;
    min-height: 160px;
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    background: #f8fafc;
    cursor: pointer;
    overflow: hidden;

    &--empty:hover {
      border-color: #94a3b8;
      background: #f1f5f9;
    }
  }

  &__image-preview {
    width: 100%;
    height: 160px;
    object-fit: cover;
  }

  &__image-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: #64748b;
    font-size: 13px;
  }

  &__hidden-input {
    display: none;
  }

  &__table-image {
    width: 72px;
    height: 72px;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }
}
</style>

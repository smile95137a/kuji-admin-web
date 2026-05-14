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
              placeholder="例如：航海王"
            />
          </div>

          <div class="w-50 w-md-100 p-6">
            <FormInput
              label="顯示排序"
              type="number"
              v-model="form.displayOrder"
              placeholder="例如：10"
            />
          </div>

          <div class="w-100 p-6">
            <FormInput
              label="代表圖片 URL"
              v-model="form.imageUrl"
              maxlength="500"
              placeholder="https://example.com/theme.jpg"
            />
          </div>
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
        <p class="category-management__title">主題列表</p>
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
            <th>同義詞</th>
            <th>商品數</th>
            <th>排序</th>
            <th>圖片</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="theme in themes" :key="theme.id || theme.name">
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
                  label="新增同義詞"
                  v-model="aliasInputs[theme.id]"
                  maxlength="100"
                  placeholder="例如：海賊王"
                />
                <MButton size="sm" type="button" @click="addAlias(theme.id)">
                  新增
                </MButton>
              </div>
            </td>
            <td>{{ theme.productCount ?? 0 }}</td>
            <td>{{ theme.displayOrder ?? 0 }}</td>
            <td>
              <a
                v-if="theme.imageUrl"
                :href="theme.imageUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="category-management__link"
              >
                查看
              </a>
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
import { onMounted, reactive, ref } from 'vue';

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
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

const themes = ref<CategoryRes[]>([]);
const loading = ref(false);
const editingId = ref('');
const aliasInputs = reactive<Record<string, string>>({});

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
    await openInfoDialog({ title: '載入失敗', message: '主題資料載入失敗，請稍後再試。' });
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

const saveTheme = async () => {
  const name = form.name.trim();
  if (!name) {
    await openInfoDialog({ title: '欄位未填', message: '請輸入主題名稱。' });
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
    await openInfoDialog({ title: '儲存失敗', message: '主題儲存失敗，請確認名稱是否重複。' });
  }
};

const editTheme = (theme: CategoryRes) => {
  editingId.value = theme.id || '';
  form.name = theme.name || '';
  form.imageUrl = theme.imageUrl || '';
  form.displayOrder = String(theme.displayOrder ?? 0);
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
    await openInfoDialog({ title: '刪除失敗', message: '此主題可能仍有商品使用，請先調整商品主題。' });
  }
};

const addAlias = async (themeId: string) => {
  const aliasName = (aliasInputs[themeId] || '').trim();
  if (!aliasName) {
    await openInfoDialog({ title: '欄位未填', message: '請輸入同義詞名稱。' });
    return;
  }

  try {
    await createThemeAlias(themeId, aliasName);
    aliasInputs[themeId] = '';
    await loadThemes();
  } catch (error) {
    console.error('[CategoryManagement] addAlias failed:', error);
    await openInfoDialog({ title: '新增失敗', message: '同義詞可能已被其他主題使用。' });
  }
};

const removeAlias = async (aliasId: string) => {
  const ok = await openConfirmDialog({
    title: '刪除同義詞',
    message: '確定要刪除此同義詞嗎？',
  });
  if (!ok) return;

  try {
    await deleteThemeAlias(aliasId);
    await loadThemes();
  } catch (error) {
    console.error('[CategoryManagement] removeAlias failed:', error);
    await openInfoDialog({ title: '刪除失敗', message: '同義詞刪除失敗，請稍後再試。' });
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
  &__alias-add {
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
}
</style>

<template>
  <MCard>
    <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
      <FormTitle title="類別管理" />

      <CategorySearchForm :status-options="statusOptions" />

      <div class="flex justify-center m-y-8">
        <MButton type="submit">
          <font-awesome-icon icon="fa-magnifying-glass" class="m-r-4" />
          查詢
        </MButton>
      </div>
    </Form>
  </MCard>

  <div class="m-t-12">
    <MCard>
      <div class="category-list__toolbar">
        <div>
          <p class="category-list__title">主題清單</p>
          <p class="category-list__summary">
            共
            {{ list.length }} 個主題，商品新增頁與前台主題篩選都會使用這份字典。
          </p>
        </div>

        <div class="category-list__toolbar-actions">
          <MButton @click="navigateToAdd">
            <font-awesome-icon icon="fa-plus" class="m-r-4" />
            新增
          </MButton>

          <MButton type="button" class="mbtn--gray" @click="refresh">
            <font-awesome-icon icon="fa-rotate" class="m-r-4" />
            重新整理
          </MButton>
        </div>
      </div>

      <template v-if="!hasData">
        <NoData :message="noDataMessage" />
      </template>

      <template v-else>
        <ReportTable
          class="m-t-12"
          :columns="columns"
          :items="currentPageItems"
          row-key="id"
          :useWidthClass="true"
          :sort-key="sortKey"
          :sort-order="sortOrder"
          @sort="handleSort"
        >
          <!-- 主題名稱 -->
          <template #cell-name="{ item }">
            <span class="clickable" @click="navigateToEdit(item)">
              {{ item.name || '-' }}
            </span>
          </template>

          <!-- 同義字 -->
          <template #cell-aliases="{ item }">
            <div class="category-list__alias-cell">
              <!-- 已有同義字 -->
              <div
                v-if="item.aliases?.length"
                class="category-list__alias-list"
              >
                <span
                  v-for="alias in item.aliases || []"
                  :key="alias.id"
                  class="category-list__alias-tag"
                >
                  <span class="category-list__alias-name">
                    {{ alias.aliasName }}
                  </span>

                  <button
                    type="button"
                    class="category-list__alias-delete"
                    :aria-label="`刪除 ${alias.aliasName}`"
                    @click.stop="removeAlias(alias.id)"
                  >
                    <font-awesome-icon icon="fa-xmark" />
                  </button>
                </span>
              </div>

              <div v-else class="category-list__alias-empty">
                尚未設定同義字
              </div>

              <!-- 新增同義字 -->
              <div v-if="item.id" class="category-list__alias-add-panel">
                <div class="category-list__alias-input-wrap">
                  <input
                    v-model="aliasInputs[item.id]"
                    class="category-list__alias-input"
                    type="text"
                    maxlength="100"
                    placeholder="輸入同義字，例如：復古、懷舊"
                    @keyup.enter="addAlias(item.id)"
                  />

                  <MButton
                    size="sm"
                    type="button"
                    :disabled="!(aliasInputs[item.id] || '').trim()"
                    @click="addAlias(item.id)"
                  >
                    <font-awesome-icon icon="fa-plus" class="m-r-4" />
                    新增
                  </MButton>
                </div>
              </div>
            </div>
          </template>

          <!-- 商品數 -->
          <template #cell-productCount="{ item }">
            <span>{{ item.productCount ?? 0 }}</span>
          </template>

          <!-- 排序 -->
          <template #cell-displayOrder="{ item }">
            <span>{{ item.displayOrder ?? 0 }}</span>
          </template>

          <!-- 圖片 -->
          <template #cell-imageUrl="{ item }">
            <img
              v-if="item.imageUrl"
              :src="resolveImageUrl(item.imageUrl)"
              alt="主題圖"
              class="category-list__table-image"
            />

            <span v-else class="category-list__muted">-</span>
          </template>

          <!-- 操作 -->
          <template #cell-actions="{ item }">
            <div class="category-list__row-actions">
              <MButton size="sm" type="button" @click="navigateToEdit(item)">
                <font-awesome-icon icon="fa-pen-to-square" class="m-r-4" />
                編輯
              </MButton>

              <MButton
                size="sm"
                type="button"
                class="mbtn--red"
                :disabled="!item.id"
                @click="removeTheme(item)"
              >
                <font-awesome-icon icon="fa-trash" class="m-r-4" />
                刪除
              </MButton>
            </div>
          </template>
        </ReportTable>

        <div class="flex justify-center m-t-12">
          <Pagination
            :totalPages="totalPages"
            :renderPaginationNums="renderPaginationNums"
            :currentPage="currentPage"
            :nextPage="nextPage"
            :previousPage="previousPage"
            :goToPage="goToPage"
            :pageLimitSize="pageLimitSize"
            :totalItems="list.length"
            @update:pageLimitSize="handlePageLimitSizeChange"
          />
        </div>
      </template>
    </MCard>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { Form, type FormContext } from 'vee-validate';
import { useRouter } from 'vue-router';

import { usePagination } from '@/hook/usePagination';
import { useSearchPage } from '@/hook/useSearchPage';
import { compareByKeySmart } from '@/utils/sortUtils';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import NoData from '@/components/common/NoData.vue';
import Pagination from '@/components/common/Pagination.vue';
import ReportTable from '@/components/common/ReportTable.vue';
import FormTitle from '@/components/common/FormTitle.vue';
import FormInput from '@/components/common/FormInput.vue';
import CategorySearchForm from '@/components/category/CategorySearchForm.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { useCategoryStore } from '@/stores/category/useCategoryStore';

import {
  createThemeAlias,
  deleteTheme,
  deleteThemeAlias,
  queryThemes,
  type CategoryRes,
} from '@/services/adminCategoryService';

import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

const router = useRouter();
const categoryStore = useCategoryStore();

const formRef = ref<FormContext | null>(null);

const initValues = ref({
  status: 'ACTIVE',
  name: '',
});

const { list, hasData, isSearch, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

const aliasInputs = reactive<Record<string, string>>({});

const statusOptions = ref<SelectOption[]>([{ label: '啟用', value: 'ACTIVE' }]);

const columns = [
  { field: 'name', label: '主題', width: 160, sortable: true },
  { field: 'aliases', label: '同義字', width: 280 },
  { field: 'productCount', label: '商品數', width: 100, sortable: true },
  { field: 'displayOrder', label: '排序', width: 100, sortable: true },
  { field: 'imageUrl', label: '圖片', width: 120 },
  { field: 'actions', label: '操作', width: 160 },
];

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

/* --------------------------------------
 * Sorting
 * -------------------------------------- */
const sortKey = ref('');
const sortOrder = ref<'asc' | 'desc' | ''>('asc');

const handleSort = ({
  key,
  order,
}: {
  key: string;
  order: 'asc' | 'desc' | '';
}) => {
  sortKey.value = key;
  sortOrder.value = order;
  goToPage(1);
};

const sortedList = computed(() => {
  if (!sortKey.value || !sortOrder.value) return list.value;

  const arr = [...list.value];

  arr.sort((a: any, b: any) =>
    compareByKeySmart(a, b, sortKey.value, sortOrder.value as 'asc' | 'desc', {
      type: 'auto',
      mode: 'big5',
      locale: 'zh-TW',
    }),
  );

  return arr;
});

/* --------------------------------------
 * Pagination
 * -------------------------------------- */
const pageLimitSize = ref(10);

const {
  totalPages,
  currentPageItems,
  renderPaginationNums,
  currentPage,
  nextPage,
  previousPage,
  goToPage,
} = usePagination(sortedList, pageLimitSize);

const handlePageLimitSizeChange = (value: number) => {
  pageLimitSize.value = value;
  goToPage(1);
};

/* --------------------------------------
 * Query
 * -------------------------------------- */
const onSubmit = async (values: any) => {
  const condition = {
    status: values.status || 'ACTIVE',
    name: values.name ?? '',
  };

  await query(async () => {
    const res = await queryThemes({ condition });
    return unwrapList(res);
  });

  categoryStore.setSearchCondition(condition);
  goToPage(1);
  isSearch.value = true;
};

const refresh = async () => {
  const values = formRef.value?.values || initValues.value;

  await onSubmit(values);
};

/* --------------------------------------
 * Alias
 * -------------------------------------- */
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

  await executeApi({
    fn: async () => createThemeAlias(themeId, aliasName),
    onSuccess: async () => {
      aliasInputs[themeId] = '';

      await openInfoDialog({
        title: '提示訊息',
        message: '同義字新增成功',
        iconType: 'success',
      });

      await refresh();
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

const removeAlias = async (aliasId: string) => {
  const ok = await openConfirmDialog({
    title: '刪除同義字',
    message: '確定要刪除此同義字嗎？',
  });

  if (!ok) return;

  await executeApi({
    fn: async () => deleteThemeAlias(aliasId),
    onSuccess: async () => {
      await openInfoDialog({
        title: '提示訊息',
        message: '同義字刪除成功',
        iconType: 'success',
      });

      await refresh();
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

/* --------------------------------------
 * Remove theme
 * -------------------------------------- */
const removeTheme = async (theme: CategoryRes) => {
  if (!theme.id) return;

  const ok = await openConfirmDialog({
    title: '刪除主題',
    message: `確定要刪除「${theme.name}」嗎？若已有商品使用，後端會拒絕刪除。`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () => deleteTheme(theme.id!),
    onSuccess: async () => {
      await openInfoDialog({
        title: '提示訊息',
        message: '主題刪除成功',
        iconType: 'success',
      });

      await refresh();
    },
    onFail: async () => {
      await openInfoDialog({
        title: '刪除失敗',
        message: '若已有商品使用此主題，請先調整商品資料後再刪除。',
        iconType: 'warning',
      });
    },
    showSuccessDialog: false,
    showFailDialog: false,
    showCatchDialog: true,
  });
};

/* --------------------------------------
 * Save state / Navigation
 * -------------------------------------- */
const saveListState = () => {
  categoryStore.setList([...list.value]);
  categoryStore.setSearchCondition(formRef.value?.values || initValues.value);
  categoryStore.setSort(sortKey.value, sortOrder.value);
  categoryStore.setCurrentPage(currentPage.value);
  categoryStore.setPageLimitSize(pageLimitSize.value);
};

const navigateToEdit = (item: CategoryRes) => {
  saveListState();
  router.push(`/home/category/edit/${item.id}`);
};

const navigateToAdd = () => {
  saveListState();
  router.push('/home/category/add');
};

/* --------------------------------------
 * Lifecycle
 * -------------------------------------- */
onMounted(async () => {
  if (categoryStore.list.length > 0 && !categoryStore.shouldRefresh) {
    list.value = [...categoryStore.list];
    initValues.value = { ...categoryStore.searchCondition };

    await nextTick();
    formRef.value?.setValues(categoryStore.searchCondition);

    sortKey.value = categoryStore.sortKey || '';
    sortOrder.value = categoryStore.sortOrder || 'asc';
    pageLimitSize.value = categoryStore.pageLimitSize;

    await nextTick();
    goToPage(categoryStore.currentPage);

    isSearch.value = true;
    categoryStore.resetAll();
    return;
  }

  const condition = categoryStore.shouldRefresh
    ? { ...categoryStore.searchCondition }
    : { ...initValues.value };

  initValues.value = { ...condition };

  await nextTick();
  formRef.value?.setValues(condition);

  await onSubmit(condition);
  categoryStore.resetAll();
});
</script>
<style scoped lang="scss">
.category-list {
  &__toolbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__toolbar-actions,
  &__row-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 800;
  }

  &__summary,
  &__muted {
    color: #667085;
    font-size: 13px;
  }

  /* 同義字區塊 */
  &__alias-cell {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 260px;
  }

  &__alias-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__alias-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
    padding: 5px 6px 5px 10px;
    border: 1px solid #dbe3ef;
    border-radius: 999px;
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    color: #334155;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.2;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  }

  &__alias-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__alias-delete {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    flex: 0 0 18px;
    border: 0;
    border-radius: 999px;
    background: #e2e8f0;
    color: #64748b;
    cursor: pointer;
    font-size: 11px;
    transition:
      background-color 0.15s ease,
      color 0.15s ease,
      transform 0.12s ease;

    &:hover {
      background: #ef4444;
      color: #fff;
      transform: scale(1.08);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  &__alias-empty {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    padding: 6px 10px;
    border-radius: 999px;
    background: #f8fafc;
    color: #94a3b8;
    font-size: 13px;
    font-weight: 600;
  }

  &__alias-add-panel {
    padding: 8px;
    border: 1px dashed #cbd5e1;
    border-radius: 12px;
    background: #f8fafc;
  }

  &__alias-input-wrap {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
    align-items: center;
  }

  &__alias-input {
    width: 100%;
    min-width: 0;
    height: 34px;
    padding: 0 10px;
    border: 1px solid #d0d5dd;
    border-radius: 8px;
    background: #fff;
    color: #344054;
    font-size: 13px;
    outline: none;
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease,
      background-color 0.15s ease;

    &::placeholder {
      color: #98a2b3;
    }

    &:focus {
      border-color: #017162;
      box-shadow: 0 0 0 3px rgba(1, 113, 98, 0.12);
    }
  }

  &__table-image {
    width: 72px;
    height: 72px;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }
}

@media (max-width: 768px) {
  .category-list {
    &__toolbar {
      align-items: stretch;
      flex-direction: column;
    }

    &__toolbar-actions {
      justify-content: flex-start;
    }

    &__alias-cell {
      min-width: 220px;
    }

    &__alias-input-wrap {
      grid-template-columns: 1fr;
    }
  }
}
</style>

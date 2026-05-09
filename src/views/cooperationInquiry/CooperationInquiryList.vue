<!-- src/views/cooperationInquiry/CooperationInquiryList.vue -->
<template>
  <MCard>
    <div class="cooperation-inquiry-list">
      <div class="cooperation-inquiry-list__header">
        <div>
          <p class="form__text form__text--title">合作洽談管理</p>
          <p class="cooperation-inquiry-list__desc">
            管理前台合作諮詢表單送出的資料。
          </p>
        </div>

        <div class="cooperation-inquiry-list__actions">
          <MButton type="button" class="mbtn--gray" @click="createMockData">
            快速產生100筆假資料
          </MButton>
        </div>
      </div>

      <Form
        :validation-schema="schema"
        :initial-values="store.searchCondition"
        v-slot="{ handleSubmit, resetForm }"
      >
        <form @submit.prevent="handleSubmit(onSearch)">
          <CooperationInquirySearchForm
            :status-options="statusOptions"
            :type-options="typeOptions"
          />

          <div class="flex justify-center m-y-12 gap-x-12 flex-wrap">
            <MButton type="submit"> 查詢 </MButton>

            <MButton
              type="button"
              class="mbtn--gray"
              @click="handleReset(resetForm)"
            >
              清除
            </MButton>
          </div>
        </form>
      </Form>

      <div class="cooperation-inquiry-list__toolbar">
        <div class="cooperation-inquiry-list__summary">
          共 {{ store.totalElements }} 筆
        </div>

        <div class="cooperation-inquiry-list__right">
          <MButton
            type="button"
            class="mbtn--red"
            :disabled="!store.selectedIds.length"
            @click="deleteSelected"
          >
            刪除勾選
          </MButton>
        </div>
      </div>

      <div class="cooperation-inquiry-list__table-wrap">
        <table class="cooperation-inquiry-list__table">
          <thead>
            <tr>
              <th class="cooperation-inquiry-list__check">
                <input
                  type="checkbox"
                  :checked="isAllChecked"
                  @change="toggleAll"
                />
              </th>
              <th>公司 / 單位</th>
              <th>聯絡人</th>
              <th>Email</th>
              <th>電話</th>
              <th>合作類型</th>
              <th>狀態</th>
              <th>建立時間</th>
              <th class="cooperation-inquiry-list__operate">操作</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="!store.list.length">
              <td colspan="9" class="cooperation-inquiry-list__empty">
                查無資料
              </td>
            </tr>

            <tr v-for="item in store.list" :key="item.id">
              <td class="cooperation-inquiry-list__check">
                <input
                  type="checkbox"
                  :value="item.id"
                  :checked="store.selectedIds.includes(item.id)"
                  @change="toggleOne(item.id)"
                />
              </td>
              <td>{{ item.company || '-' }}</td>
              <td>{{ item.name || '-' }}</td>
              <td>{{ item.email || '-' }}</td>
              <td>{{ item.phone || '-' }}</td>
              <td>
                <span class="cooperation-inquiry-list__badge">
                  {{ typeText(item.type) }}
                </span>
              </td>
              <td>
                <span
                  class="cooperation-inquiry-list__status"
                  :class="`cooperation-inquiry-list__status--${item.status}`"
                >
                  {{ statusText(item.status) }}
                </span>
              </td>
              <td>{{ item.createdAt || '-' }}</td>
              <td class="cooperation-inquiry-list__operate">
                <MButton
                  type="button"
                  class="mbtn--gray"
                  @click="goDetail(item.id)"
                >
                  查看
                </MButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="cooperation-inquiry-list__pager">
        <button
          type="button"
          class="cooperation-inquiry-list__page-btn"
          :disabled="store.currentPage <= 1"
          @click="changePage(store.currentPage - 1)"
        >
          上一頁
        </button>

        <span class="cooperation-inquiry-list__page-info">
          第 {{ store.currentPage }} / {{ totalPages }} 頁
        </span>

        <button
          type="button"
          class="cooperation-inquiry-list__page-btn"
          :disabled="store.currentPage >= totalPages"
          @click="changePage(store.currentPage + 1)"
        >
          下一頁
        </button>
      </div>
    </div>
  </MCard>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Form } from 'vee-validate';
import * as yup from 'yup';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import CooperationInquirySearchForm from '@/components/cooperationInquiry/CooperationInquirySearchForm.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';
import { useCooperationInquiryStore } from '@/stores/cooperationInquiry/useCooperationInquiryStore';

import {
  queryCooperationInquiries,
  deleteCooperationInquiry,
  createMockCooperationInquiries,
} from '@/services/adminCooperationInquiryService';

const router = useRouter();
const store = useCooperationInquiryStore();

const statusOptions: SelectOption[] = [
  { label: '待處理', value: 'PENDING' },
  { label: '處理中', value: 'PROCESSING' },
  { label: '已完成', value: 'DONE' },
  { label: '已關閉', value: 'CLOSED' },
];

const typeOptions: SelectOption[] = [
  { label: 'IP / 授權', value: 'IP' },
  { label: '供應 / 物流', value: 'SUPPLY' },
  { label: '通路 / 門市', value: 'CHANNEL' },
  { label: '行銷 / 活動', value: 'MARKETING' },
];

const schema = yup.object({
  status: yup.string().nullable(),
  type: yup.string().nullable(),
  keyword: yup.string().nullable(),
});

const totalPages = computed(() => {
  const size = store.pageLimitSize || 10;
  return Math.max(1, Math.ceil((store.totalElements || 0) / size));
});

const isAllChecked = computed(() => {
  if (!store.list.length) return false;

  return store.list.every((item) => store.selectedIds.includes(item.id));
});

const statusText = (v?: string) => {
  if (v === 'PENDING') return '待處理';
  if (v === 'PROCESSING') return '處理中';
  if (v === 'DONE') return '已完成';
  if (v === 'CLOSED') return '已關閉';

  return v || '-';
};

const typeText = (v?: string) => {
  if (v === 'IP') return 'IP / 授權';
  if (v === 'SUPPLY') return '供應 / 物流';
  if (v === 'CHANNEL') return '通路 / 門市';
  if (v === 'MARKETING') return '行銷 / 活動';

  return v || '-';
};

const normalizeList = (res: any) => {
  const data = res?.data ?? res;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.list)) return data.list;

  return [];
};

const normalizeTotal = (res: any, list: any[]) => {
  const data = res?.data ?? res;

  return data?.totalElements ?? data?.total ?? list.length;
};

const buildQueryParams = () => {
  return {
    page: store.currentPage - 1,
    size: store.pageLimitSize,
    status: store.searchCondition.status || undefined,
    type: store.searchCondition.type || undefined,
    keyword: store.searchCondition.keyword || undefined,
    sortBy: store.sortKey || 'createdAt',
    sortDir: store.sortOrder?.toUpperCase() || 'DESC',
  };
};

const queryList = async () => {
  await executeApi({
    fn: async () => queryCooperationInquiries(buildQueryParams()),
    onSuccess: (res: any, full: any) => {
      const payload = full ?? res;
      const list = normalizeList(payload);

      store.setList(list);
      store.setTotalElements(normalizeTotal(payload, list));
      store.clearSelectedIds();
    },
    showSuccessDialog: false,
  });
};

const onSearch = async (values: any) => {
  store.setSearchCondition(values);
  store.setCurrentPage(1);
  await queryList();
};

const handleReset = async (resetForm: any) => {
  const empty = {
    status: '',
    type: '',
    keyword: '',
  };

  resetForm({ values: empty });
  store.setSearchCondition(empty);
  store.setCurrentPage(1);

  await queryList();
};

const changePage = async (page: number) => {
  store.setCurrentPage(page);
  await queryList();
};

const toggleOne = (id: string) => {
  const exists = store.selectedIds.includes(id);

  store.setSelectedIds(
    exists
      ? store.selectedIds.filter((item) => item !== id)
      : [...store.selectedIds, id],
  );
};

const toggleAll = () => {
  if (isAllChecked.value) {
    store.clearSelectedIds();
    return;
  }

  store.setSelectedIds(store.list.map((item) => item.id));
};

const goDetail = (id: string) => {
  router.push({
    name: 'CooperationInquiryDetail',
    params: { id },
  });
};

const deleteSelected = async () => {
  if (!store.selectedIds.length) {
    await openInfoDialog({
      title: '提示訊息',
      message: '請先勾選資料',
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '刪除確認',
    message: `確定要刪除 ${store.selectedIds.length} 筆合作洽談資料嗎？`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () => {
      await Promise.all(
        store.selectedIds.map((id) => deleteCooperationInquiry(id)),
      );

      return {
        success: true,
        data: null,
        message: '刪除成功',
      };
    },
    showSuccessDialog: true,
    successMessage: '刪除成功',
    onSuccess: async () => {
      await queryList();
    },
  });
};

const createMockData = async () => {
  const ok = await openConfirmDialog({
    title: '快速產生假資料',
    message: '確定要快速產生 100 筆合作洽談假資料嗎？',
  });

  if (!ok) return;

  await executeApi({
    fn: async () => createMockCooperationInquiries(100),
    showSuccessDialog: true,
    useDefaultSuccessMessage: false,
    successMessage: '假資料產生成功',
    onSuccess: async () => {
      store.setCurrentPage(1);
      await queryList();
    },
  });
};

onMounted(async () => {
  if (store.shouldRefresh) {
    store.setShouldRefresh(false);
  }

  await queryList();
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as tokens;

.cooperation-inquiry-list {
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

  &__actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin: 12px 0;
    flex-wrap: wrap;
  }

  &__summary {
    color: tokens.$form-muted;
    font-size: 13px;
    font-weight: 700;
  }

  &__table-wrap {
    width: 100%;
    overflow-x: auto;
    border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
    border-radius: 14px;
    background: #fff;
  }

  &__table {
    width: 100%;
    min-width: 1080px;
    border-collapse: collapse;
    font-size: 14px;

    th,
    td {
      padding: 10px 12px;
      border-bottom: 1px solid color.mix(tokens.$form-border, #fff, 78%);
      text-align: left;
      vertical-align: middle;
      white-space: nowrap;
    }

    th {
      background: color.mix(tokens.$brand-light, #fff, 12%);
      color: tokens.$form-text;
      font-weight: 800;
    }

    tbody tr:hover {
      background: color.mix(tokens.$brand-light, #fff, 8%);
    }
  }

  &__check {
    width: 48px;
    text-align: center !important;
  }

  &__operate {
    width: 100px;
    text-align: center !important;
  }

  &__empty {
    padding: 24px !important;
    text-align: center !important;
    color: tokens.$form-muted;
  }

  &__badge {
    display: inline-flex;
    padding: 3px 8px;
    border-radius: 999px;
    background: color.mix(tokens.$brand-light, #fff, 35%);
    color: tokens.$brand-dark;
    font-size: 12px;
    font-weight: 800;
  }

  &__status {
    display: inline-flex;
    padding: 3px 8px;
    border-radius: 999px;
    background: #f3f4f6;
    color: #374151;
    font-size: 12px;
    font-weight: 800;

    &--PENDING {
      background: #fff7ed;
      color: #c2410c;
    }

    &--PROCESSING {
      background: #eff6ff;
      color: #1d4ed8;
    }

    &--DONE {
      background: #ecfdf5;
      color: #047857;
    }

    &--CLOSED {
      background: #f3f4f6;
      color: #374151;
    }
  }

  &__pager {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin-top: 16px;
  }

  &__page-btn {
    height: 36px;
    padding: 0 14px;
    border: 1px solid color.mix(tokens.$form-border, #fff, 68%);
    border-radius: 10px;
    background: #fff;
    color: tokens.$form-text;
    font-weight: 800;
    cursor: pointer;

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  }

  &__page-info {
    color: tokens.$form-muted;
    font-size: 13px;
    font-weight: 800;
  }
}
</style>

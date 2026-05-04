<!-- src/components/common/SearchMemberDialog.vue -->
<template>
  <Dialog
    :isOpen="true"
    :customClass="`${customClass} dialog--searchMember`"
    @close="handleDialogClose"
  >
    <div class="searchMemberDialog">
      <!-- Header -->
      <div class="searchMemberDialog__header">
        <div class="searchMemberDialog__header-title">
          <p class="searchMemberDialog__text searchMemberDialog__text--title">
            {{ title || '會員查詢' }}
          </p>
        </div>

        <div class="searchMemberDialog__close" @click="handleClose">
          <font-awesome-icon :icon="['fas', 'xmark']" size="lg" />
        </div>
      </div>

      <!-- Main -->
      <div class="searchMemberDialog__main">
        <div class="searchMemberDialog__main-content">
          <!-- 查詢條件 -->
          <MCard>
            <form class="form" @submit.prevent="onSubmit">
              <p v-if="message" class="searchMemberDialog__message">
                {{ message }}
              </p>

              <div class="flex flex-wrap">
                <!-- 關鍵字 -->
                <div class="w-50 w-md-100 p-6">
                  <FormInput
                    label="關鍵字"
                    v-model="keyword"
                    :error="errors.keyword"
                    placeholder="請輸入暱稱 / Email / 手機"
                    clearable
                  />
                </div>

                <!-- 狀態 -->
                <div class="w-50 w-md-100 p-6">
                  <FormSelect
                    label="狀態"
                    v-model="status"
                    :options="statusOptions"
                    :error="errors.status"
                    :showAll="true"
                    allLabel="全部"
                    :allValue="''"
                  />
                </div>
              </div>

              <div class="searchMemberDialog__main-btns m-y-8">
                <MButton type="submit">查詢</MButton>

                <MButton type="button" class="mbtn--gray" @click="resetForm">
                  清除
                </MButton>
              </div>
            </form>
          </MCard>

          <!-- 查詢結果 -->
          <div class="m-t-12">
            <MCard>
              <div class="searchMemberDialog__result-header">
                <p class="searchMemberDialog__result-title">查詢結果</p>
                <p class="searchMemberDialog__result-count">
                  共 {{ list.length }} 筆
                </p>
              </div>

              <template v-if="!hasData">
                <NoData message="無資料" />
              </template>

              <template v-else>
                <ReportTable
                  :columns="columns"
                  :items="currentPageItems"
                  row-key="id"
                  :striped="true"
                  :bordered="true"
                  :sort-key="sortKey"
                  :sort-order="sortOrder"
                  :useWidthClass="true"
                  widthMode="fixed-min"
                  @sort="handleSort"
                >
                  <!-- 會員 -->
                  <template #cell-member="{ item }">
                    <div
                      class="searchMemberDialog__member clickable"
                      @click="handleChoose(item)"
                    >
                      <div class="searchMemberDialog__avatar">
                        <img
                          v-if="item.avatar"
                          :src="item.avatar"
                          :alt="item.nickname || item.email || 'member'"
                        />
                        <span v-else>{{ getAvatarText(item) }}</span>
                      </div>

                      <div class="searchMemberDialog__member-info">
                        <strong class="searchMemberDialog__member-name">
                          {{ item.nickname || item.name || '-' }}
                        </strong>

                        <span class="searchMemberDialog__member-email">
                          {{ item.email || '-' }}
                        </span>
                      </div>
                    </div>
                  </template>

                  <!-- 手機號碼 -->
                  <template #cell-phoneNumber="{ item }">
                    <span
                      class="searchMemberDialog__phone clickable"
                      @click="handleChoose(item)"
                    >
                      {{ item.phoneNumber || '-' }}
                    </span>
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
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useForm } from 'vee-validate';

import Dialog from '@/components/common/Dialog.vue';
import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import ReportTable from '@/components/common/ReportTable.vue';
import Pagination from '@/components/common/Pagination.vue';
import NoData from '@/components/common/NoData.vue';

import { usePagination } from '@/hook/usePagination';
import { useLoadingStore } from '@/stores';
import { compareByKeySmart } from '@/utils/sortUtils';
import { queryFrontendUsers } from '@/services/adminFrontendUserService';

interface SelectOption {
  label: string;
  value: any;
}

interface Props {
  customClass?: string;
  title?: string;
  message?: string;
  data?: any;
  onConfirm?: (result: any) => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  onClose?: () => void | Promise<void>;
}

const props = withDefaults(defineProps<Props>(), {
  customClass: '',
  title: '會員查詢',
  message: '',
  data: undefined,
});

const loadingStore = useLoadingStore();

const list = ref<any[]>([]);
const hasData = computed(() => list.value.length > 0);

/* --------------------------------------
 * Form
 * -------------------------------------- */
const { defineField, handleSubmit, errors, setValues } = useForm({
  initialValues: {
    keyword: '',
    status: '',
  },
});

const [keyword] = defineField('keyword');
const [status] = defineField('status');

const statusOptions: SelectOption[] = [
  { label: '正常', value: 'ACTIVE' },
  { label: '停用', value: 'INACTIVE' },
  { label: '待驗證', value: 'PENDING' },
];

/* --------------------------------------
 * Columns
 * -------------------------------------- */
const columns = [
  {
    field: 'member',
    label: '會員',
    width: 100,
    sortable: true,
  },
  {
    field: 'phoneNumber',
    label: '手機號碼',
    width: 100,
    sortable: true,
  },
];

/* --------------------------------------
 * Helpers
 * -------------------------------------- */
const getMemberLabel = (item: any) => {
  const nicknameText = item?.nickname || item?.name || '-';
  const emailText = item?.email ? ` / ${item.email}` : '';
  return `${nicknameText}${emailText}`;
};

const getAvatarText = (item: any) => {
  const text = item?.nickname || item?.name || item?.email || '?';
  return String(text).slice(0, 1).toUpperCase();
};

const normalizeCondition = (values: any) => {
  const condition = {
    ...(props.data?.condition ?? {}),
    keyword: values.keyword ?? '',
    status: values.status ?? '',
  };

  Object.keys(condition).forEach((key) => {
    const value = String((condition as any)[key] ?? '').trim();

    if (!value) {
      delete (condition as any)[key];
    } else {
      (condition as any)[key] = value;
    }
  });

  return condition;
};

/* --------------------------------------
 * Search API
 * -------------------------------------- */
const queryMembers = async (values: any) => {
  const condition = normalizeCondition(values);

  const res = await queryFrontendUsers({
    ...(props.data ?? {}),
    condition,
  });

  const success = (res as any)?.success ?? true;
  const data = (res as any)?.data ?? res ?? [];

  if (!success) return [];

  if (Array.isArray(data)) return data;
  if (Array.isArray((data as any)?.list)) return (data as any).list;
  if (Array.isArray((res as any)?.list)) return (res as any).list;

  return [];
};

const onSubmit = handleSubmit(async (values) => {
  try {
    loadingStore.startLoading();

    list.value = await queryMembers(values);
    goToPage(1);
  } catch (error) {
    console.error('Error querying member data:', error);
    list.value = [];
  } finally {
    loadingStore.stopLoading();
  }
});

const resetForm = async () => {
  setValues({
    keyword: '',
    status: '',
  });

  await onSubmit();
};

/* --------------------------------------
 * Choose
 * -------------------------------------- */
const handleChoose = async (item: any) => {
  await props.onConfirm?.({
    value: item?.id,
    label: getMemberLabel(item),
    raw: item,
  });
};

/* --------------------------------------
 * Sort
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

  arr.sort((a, b) => {
    if (sortKey.value === 'member') {
      return compareByKeySmart(
        { member: getMemberLabel(a) },
        { member: getMemberLabel(b) },
        'member',
        sortOrder.value as 'asc' | 'desc',
        {
          type: 'auto',
          mode: 'big5',
          locale: 'zh-TW',
        },
      );
    }

    return compareByKeySmart(
      a,
      b,
      sortKey.value,
      sortOrder.value as 'asc' | 'desc',
      {
        type: 'auto',
        mode: 'big5',
        locale: 'zh-TW',
      },
    );
  });

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
} = usePagination<any>(sortedList, pageLimitSize);

const handlePageLimitSizeChange = (value: number) => {
  pageLimitSize.value = value;
  goToPage(1);
};

/* --------------------------------------
 * Close
 * -------------------------------------- */
const handleClose = async () => {
  await props.onCancel?.();
};

const handleDialogClose = async () => {
  await props.onClose?.();
};

onMounted(async () => {
  await onSubmit();
});
</script>

<style scoped lang="scss"></style>

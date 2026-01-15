<!-- src/views/marquee/MarqueeList.vue -->
<template>
  <MCard>
    <Form
      ref="formRef"
      :initial-values="initValues"
      @submit="onSubmit"
      v-slot="{ values, setFieldValue }"
    >
      <FormTitle title="跑馬燈管理" />

      <div class="flex flex-wrap">
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="狀態"
            :modelValue="values.active"
            @update:modelValue="setFieldValue('active', $event)"
            :options="activeOptions"
            :showAll="true"
            allLabel="全部"
            :allValue="''"
          />
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="內容關鍵字"
            :modelValue="values.keyword"
            @update:modelValue="setFieldValue('keyword', $event)"
            placeholder="輸入內容關鍵字"
          />
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="開始時間起"
            type="date"
            :modelValue="values.startDate"
            @update:modelValue="setFieldValue('startDate', $event)"
          />
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="開始時間迄"
            type="date"
            :modelValue="values.endDate"
            @update:modelValue="setFieldValue('endDate', $event)"
          />
        </div>
      </div>

      <div class="flex justify-center m-y-8">
        <MButton type="submit">查詢</MButton>
      </div>
    </Form>
  </MCard>

  <div class="m-t-12">
    <MCard>
      <div class="flex justify-end gap-x-12 flex-wrap">
        <MButton @click="navigateToAdd">新增</MButton>

        <MButton type="button" class="mbtn--gray" @click="broadcastNow">
          手動廣播
        </MButton>

        <MButton :disabled="!canEnable" @click="enableSelected">啟用</MButton>
        <MButton :disabled="!canDisable" @click="disableSelected">停用</MButton>

        <MButton
          class="mbtn--red"
          :disabled="!canDelete"
          @click="deleteSelected"
        >
          刪除
        </MButton>
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
          selectable
          selection-type="checkbox"
          :show-select-all="true"
          v-model:selected="selectedIds"
          :useWidthClass="true"
          :sort-key="sortKey"
          :sort-order="sortOrder"
          @sort="handleSort"
        >
          <!-- 內容可點 -->
          <template #cell-content="{ item }">
            <span class="clickable" @click="navigateToEdit(item)">
              {{ item.content || '-' }}
            </span>
          </template>

          <!-- 狀態 -->
          <template #cell-isActive="{ item }">
            <span>{{ item.isActive === 1 ? '啟用' : '停用' }}</span>
          </template>

          <!-- 日期 -->
          <template #cell-startTime="{ item }">
            <DateFormatter
              v-if="item.startTime"
              :date="item.startTime"
              format="YYYY-MM-DD HH:mm:ss"
            />
            <span v-else>-</span>
          </template>

          <template #cell-endTime="{ item }">
            <DateFormatter
              v-if="item.endTime"
              :date="item.endTime"
              format="YYYY-MM-DD HH:mm:ss"
            />
            <span v-else>-</span>
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
            @update:pageLimitSize="pageLimitSize = $event"
          />
        </div>
      </template>
    </MCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { Form, FormContext } from 'vee-validate';
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
import FormSelect from '@/components/common/FormSelect.vue';

import DateFormatter from '@/components/common/DateFormatter.vue';

import { useDialogStore } from '@/stores';
import { executeApi } from '@/utils/executeApiUtils';

import {
  getAllMarquees,
  deleteMarquee,
  updateMarqueeStatus,
  broadcastMarquees,
} from '@/services/adminMarqueeService';

const router = useRouter();
const dialogStore = useDialogStore();

/* Form */
const formRef = ref<FormContext | null>(null);

const initValues = ref<any>({
  active: '', // '' | '1' | '0'
  keyword: '',
  startDate: '',
  endDate: '',
});

/* Search Hook */
const { list, hasData, isSearch, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

/* Select Options */
const activeOptions = ref<SelectOption[]>([
  { label: '啟用', value: '1' },
  { label: '停用', value: '0' },
]);

const loadSelectOptions = async () => {
  await nextTick();
};

/* local filter */
const filterRows = (rows: any[], cond: any) => {
  const active = String(cond?.active ?? '').trim(); // '' | '1' | '0'
  const keyword = String(cond?.keyword ?? '')
    .trim()
    .toLowerCase();
  const startDate = String(cond?.startDate ?? '').trim();
  const endDate = String(cond?.endDate ?? '').trim();

  return (rows || []).filter((r) => {
    const hitActive = !active || String(r?.isActive ?? '') === active;

    const hitKeyword =
      !keyword ||
      String(r?.content || '')
        .toLowerCase()
        .includes(keyword);

    // startTime 做日期區間（可選）
    const startTime = String(r?.startTime || '');
    const hitStart = !startDate || startTime >= `${startDate}T00:00:00`;
    const hitEnd = !endDate || startTime <= `${endDate}T23:59:59`;

    return hitActive && hitKeyword && hitStart && hitEnd;
  });
};

/* Query */
const doQuery = async (condition: any) => {
  await query(async () => {
    const res = await getAllMarquees();
    return res;
  });

  list.value = filterRows(list.value, condition);
};

const onSubmit = async (values: any) => {
  await doQuery(values);
  goToPage(1);
  selectedIds.value = [];
};

/* Sorting */
const sortKey = ref('');
const sortOrder = ref<'asc' | 'desc' | ''>('asc');

const handleSort = ({ key, order }: any) => {
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
    })
  );
  return arr;
});

/* Pagination */
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

/* Columns */
const columns = [
  { field: 'content', label: '內容', width: 320, sortable: true },
  { field: 'linkType', label: '連結類型', width: 120, sortable: true },
  { field: 'linkUrl', label: '連結', width: 220 },
  { field: 'priority', label: '優先序', width: 90, sortable: true },
  { field: 'bgColor', label: '背景色', width: 110 },
  { field: 'textColor', label: '文字色', width: 110 },
  { field: 'isActive', label: '狀態', width: 90, sortable: true },
  { field: 'startTime', label: '開始時間', width: 160, sortable: true },
  { field: 'endTime', label: '結束時間', width: 160, sortable: true },
];

/* Selection */
const selectedIds = ref<string[]>([]);
const selectedRows = computed(() =>
  list.value.filter((row: any) => selectedIds.value.includes(row.id))
);

const canEnable = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every((r) => r.isActive !== 1)
);
const canDisable = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every((r) => r.isActive === 1)
);
const canDelete = computed(() => selectedRows.value.length > 0);

const refresh = async () => {
  const values = formRef.value?.values || initValues.value;
  await onSubmit(values);
};

/* Bulk Actions */
const enableSelected = async () => {
  if (!canEnable.value) return;

  const ok = await dialogStore.openConfirmDialog({
    title: '啟用確認',
    message: `確定要啟用選中的 ${selectedIds.value.length} 筆跑馬燈嗎？`,
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(
        selectedIds.value.map((id) => updateMarqueeStatus(id, true))
      ),
    onSuccess: async (results: any[]) => {
      const okCount = results.filter((x) => x.status === 'fulfilled').length;
      const failCount = results.length - okCount;

      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message:
          failCount > 0
            ? `啟用完成：成功 ${okCount}、失敗 ${failCount}`
            : `啟用完成：成功 ${okCount}`,
        iconType: failCount > 0 ? 'warning' : 'success',
      });

      await refresh();
    },
    showSuccessDialog: false,
  });
};

const disableSelected = async () => {
  if (!canDisable.value) return;

  const ok = await dialogStore.openConfirmDialog({
    title: '停用確認',
    message: `確定要停用選中的 ${selectedIds.value.length} 筆跑馬燈嗎？`,
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(
        selectedIds.value.map((id) => updateMarqueeStatus(id, false))
      ),
    onSuccess: async (results: any[]) => {
      const okCount = results.filter((x) => x.status === 'fulfilled').length;
      const failCount = results.length - okCount;

      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message:
          failCount > 0
            ? `停用完成：成功 ${okCount}、失敗 ${failCount}`
            : `停用完成：成功 ${okCount}`,
        iconType: failCount > 0 ? 'warning' : 'success',
      });

      await refresh();
    },
    showSuccessDialog: false,
  });
};

const deleteSelected = async () => {
  if (!canDelete.value) return;

  const ok = await dialogStore.openConfirmDialog({
    title: '刪除確認',
    message: `確定要刪除選中的 ${selectedIds.value.length} 筆跑馬燈嗎？（刪除後無法復原）`,
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(selectedIds.value.map((id) => deleteMarquee(id))),
    onSuccess: async (results: any[]) => {
      const okCount = results.filter((x) => x.status === 'fulfilled').length;
      const failCount = results.length - okCount;

      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message:
          failCount > 0
            ? `刪除完成：成功 ${okCount}、失敗 ${failCount}`
            : `刪除完成：成功 ${okCount}`,
        iconType: failCount > 0 ? 'warning' : 'success',
      });

      await refresh();
    },
    showSuccessDialog: false,
  });
};

const broadcastNow = async () => {
  const ok = await dialogStore.openConfirmDialog({
    title: '廣播確認',
    message: '確定要手動廣播所有啟用中的跑馬燈嗎？',
  });
  if (!ok) return;

  await executeApi({
    fn: async () => broadcastMarquees(),
    onSuccess: async () => {
      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '廣播成功',
        iconType: 'success',
      });
    },
  });
};

/* Navigation */
const navigateToAdd = () => router.push('/home/marquee/add');
const navigateToEdit = (item: any) =>
  router.push(`/home/marquee/edit/${item.id}`);

/* Lifecycle */
onMounted(async () => {
  await loadSelectOptions();
  await onSubmit(initValues.value);
});
</script>

<style scoped></style>

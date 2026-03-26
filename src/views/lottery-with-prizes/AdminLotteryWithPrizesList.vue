<!-- src/views/lottery-with-prizes/AdminLotteryWithPrizesList.vue -->
<template>
  <!-- ===================== 查詢區 ===================== -->
  <MCard>
    <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
      <FormTitle title="商品與獎品管理" />

      <div class="flex flex-wrap">
        <!-- 店家 -->
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="店家"
            v-model="storeId"
            :options="storeOptions"
            :showAll="true"
            allLabel="全部"
            :allValue="''"
          />
        </div>

        <!-- 狀態 -->
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="狀態"
            v-model="status"
            :options="statusOptions"
            :showAll="true"
            allLabel="全部"
            :allValue="''"
          />
        </div>

        <!-- 分類 -->
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="分類"
            v-model="category"
            :options="categoryOptions"
            :showAll="true"
            allLabel="全部"
            :allValue="''"
          />
        </div>

        <!-- 商品名稱 title -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="商品名稱"
            v-model="title"
            placeholder="鬼滅之刃一番賞..."
          />
        </div>

        <!-- 每抽價格 priceMin / priceMax -->
        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="每抽價格（最小）"
            v-model="priceMin"
            type="number"
            placeholder="0"
          />
        </div>

        <div class="w-50 w-md-100 p-6">
          <FormInput
            label="每抽價格（最大）"
            v-model="priceMax"
            type="number"
            placeholder="999999"
          />
        </div>

      </div>

      <div class="flex justify-center m-y-8">
        <MButton type="submit">查詢</MButton>
      </div>
    </Form>
  </MCard>

  <!-- ===================== 列表區 ===================== -->
  <div class="m-t-12">
    <MCard>
      <div class="flex justify-end gap-x-12">
        <MButton @click="navigateToAdd">新增</MButton>

        <MButton
          class="mbtn--red"
          :disabled="!canDelete"
          @click="deleteSelected"
        >
          刪除
        </MButton>

        <MButton :disabled="!canDisable" @click="disableSelected">下架</MButton>
        <MButton :disabled="!canEnable" @click="enableSelected">上架</MButton>
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
          <!-- ✅ title 可點擊去編輯 -->
          <template #cell-title="{ item }">
            <span class="clickable" @click="navigateToEdit(item)">
              {{ item.title || '-' }}
            </span>
          </template>

          <template #cell-storeName="{ item }">
            <span>{{ item.storeName || item.storeId || '-' }}</span>
          </template>

          <template #cell-category="{ item }">
            <span>{{ categoryText(item.category) }}</span>
          </template>

          <template #cell-gameMode="{ item }">
            <span>{{ gameModeText(item) }}</span>
          </template>

          <template #cell-status="{ item }">
            <span>{{ statusText(item.status) }}</span>
          </template>

          <template #cell-pricePerDraw="{ item }">
            <span>{{ item.pricePerDraw ?? '-' }}</span>
          </template>

          <template #cell-maxDraws="{ item }">
            <span>{{ item.maxDraws ?? '-' }}</span>
          </template>

          <template #cell-updatedAt="{ item }">
            <span>{{ formatDateTime(item.updatedAt) }}</span>
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
/* ==============================
 * Imports
 * ============================== */
import { ref, computed, onMounted } from 'vue';
import { Form, type FormContext, useForm } from 'vee-validate';
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

import { useDialogStore } from '@/stores';
import { executeApi } from '@/utils/executeApiUtils';

import { getStoreOptions } from '@/services/adminStoreService';
import {
  getAllLotteriesWithPrizes,
  updateLotteryWithPrizes,
} from '@/services/adminLotteryWithPrizesService';

/* ==============================
 * Router / Store
 * ============================== */
const router = useRouter();
const dialogStore = useDialogStore();

/* ==============================
 * Form & InitValues
 * ============================== */
const formRef = ref<FormContext | null>(null);

const initValues = ref<any>({
  storeId: '',
  status: '',
  category: '',
  title: '',
  priceMin: '',
  priceMax: '',
});

/* ==============================
 * useSearchPage（跟 BannerList 一樣）
 * ============================== */
const { list, hasData, isSearch, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

/* ==============================
 * Select Options
 * ============================== */
interface SelectOption {
  label: string;
  value: any;
  description?: string;
}

const storeOptions = ref<SelectOption[]>([]);

const statusOptions = ref<SelectOption[]>([
  { label: '草稿（DRAFT）', value: 'DRAFT' },
  { label: '上架（ON_SHELF）', value: 'ON_SHELF' },
  { label: '下架（OFF_SHELF）', value: 'OFF_SHELF' },
]);

const categoryOptions = ref<SelectOption[]>([
  { label: '官方一番賞', value: 'OFFICIAL_ICHIBAN' },
  { label: '扭蛋', value: 'GACHA' },
  { label: '卡牌', value: 'TRADING_CARD' },
  { label: '自製賞', value: 'CUSTOM_GACHA' },
]);

const mapEnumOptionsToSelect = (arr: any[] = []): SelectOption[] =>
  arr.map((x) => ({
    label: x?.label ?? '',
    value: x?.value ?? '',
    ...(x?.description ? { description: x.description } : {}),
  }));

const loadStoreOptions = async () => {
  await executeApi<any[]>({
    fn: async () => getStoreOptions({ activeOnly: true }),
    onSuccess: (data) => {
      storeOptions.value = mapEnumOptionsToSelect(
        Array.isArray(data) ? data : [],
      );
    },
    showSuccessDialog: false,
  });
};

/* ==============================
 * useForm defineField
 * ============================== */
const { defineField, handleSubmit, setValues } = useForm({
  initialValues: initValues.value,
});

const [storeId] = defineField('storeId');
const [status] = defineField('status');
const [category] = defineField('category');
const [title] = defineField('title');
const [priceMin] = defineField('priceMin');
const [priceMax] = defineField('priceMax');

/* ==============================
 * Utils
 * ============================== */
const formatDateTime = (v?: string) => {
  if (!v) return '-';
  return String(v).replace('T', ' ');
};

const statusText = (s?: string) =>
  s === 'DRAFT'
    ? '草稿'
    : s === 'ON_SHELF'
      ? '上架'
      : s === 'OFF_SHELF'
        ? '下架'
        : s
          ? String(s)
          : '-';

const categoryText = (c?: string) =>
  c === 'OFFICIAL_ICHIBAN'
    ? '官方一番賞'
    : c === 'GACHA'
      ? '扭蛋'
      : c === 'TRADING_CARD'
        ? '卡牌'
        : c === 'CUSTOM_GACHA'
          ? '自製賞'
          : c
            ? String(c)
            : '-';

const gameModeText = (item: any) => {
  if (String(item?.playMode || '') !== 'SCRATCH_MODE') return '-';
  const m = item?.gameMode;
  return m === 'RANDOM'
    ? '隨機'
    : m === 'SCRATCH_STORE'
      ? '店家指定'
      : m === 'SCRATCH_PLAYER'
        ? '玩家指定'
        : m
          ? String(m)
          : '-';
};

/* ==============================
 * Sorting
 * ============================== */
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
    compareByKeySmart(a, b, sortKey.value, sortOrder.value as any, {
      type: 'auto',
      mode: 'big5',
      locale: 'zh-TW',
    }),
  );
  return arr;
});

/* ==============================
 * Pagination
 * ============================== */
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

/* ==============================
 * Table Columns
 * ============================== */
const columns = [
  { field: 'storeName', label: '店家', width: 160, sortable: true },
  { field: 'title', label: '商品名稱', width: 240, sortable: true },
  { field: 'category', label: '分類', width: 140, sortable: true },
  { field: 'gameMode', label: '遊戲模式', width: 120, sortable: true },
  { field: 'pricePerDraw', label: '每抽價格', width: 110, sortable: true },
  { field: 'maxDraws', label: '總抽數', width: 90, sortable: true },
  { field: 'status', label: '狀態', width: 90, sortable: true },
  { field: 'updatedAt', label: '更新時間', width: 160, sortable: true },
];

/* ==============================
 * Submit (Query)
 * ============================== */
const onSubmit = handleSubmit(async (values: any) => {
  const req = { condition: values };

  // ✅ 真正打後端 /admin/lottery-with-prizes/list
  await query(() => getAllLotteriesWithPrizes(req));
  goToPage(1);
});

/* ==============================
 * Selection / Bulk Actions
 * ============================== */
const selectedIds = ref<string[]>([]);

const selectedRows = computed(() =>
  list.value.filter((row: any) => selectedIds.value.includes(row.id)),
);

// 上架：只有 OFF_SHELF 才能上架
const canEnable = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every((r: any) => r.status === 'OFF_SHELF'),
);

// 下架：只有 ON_SHELF 才能下架
const canDisable = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.every((r: any) => r.status === 'ON_SHELF'),
);

const canDelete = computed(() => selectedRows.value.length > 0);

const refresh = async () => {
  const values = formRef.value?.values || initValues.value;
  await onSubmit(values);
  selectedIds.value = [];
};

/** ✅ 批次上架 */
const enableSelected = async () => {
  if (!canEnable.value) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '只有「下架（OFF_SHELF）」的商品才可以上架。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await dialogStore.openConfirmDialog({
    title: '上架確認',
    message: '確定要上架選中的商品嗎？',
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(
        selectedIds.value.map((id) =>
          updateLotteryWithPrizes(id, { lottery: { status: 'ON_SHELF' } }),
        ),
      ),
    onSuccess: async (results: any[]) => {
      const okCount = results.filter((x) => x.status === 'fulfilled').length;
      const failCount = results.length - okCount;

      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message:
          failCount > 0
            ? `上架完成：成功 ${okCount}、失敗 ${failCount}`
            : `上架完成：成功 ${okCount}`,
        iconType: failCount > 0 ? 'warning' : 'success',
      });

      await refresh();
    },
    showSuccessDialog: false,
  });
};

/** ✅ 批次下架 */
const disableSelected = async () => {
  if (!canDisable.value) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '只有「上架（ON_SHELF）」的商品才可以下架。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await dialogStore.openConfirmDialog({
    title: '下架確認',
    message: '確定要下架選中的商品嗎？',
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(
        selectedIds.value.map((id) =>
          updateLotteryWithPrizes(id, { lottery: { status: 'OFF_SHELF' } }),
        ),
      ),
    onSuccess: async (results: any[]) => {
      const okCount = results.filter((x) => x.status === 'fulfilled').length;
      const failCount = results.length - okCount;

      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message:
          failCount > 0
            ? `下架完成：成功 ${okCount}、失敗 ${failCount}`
            : `下架完成：成功 ${okCount}`,
        iconType: failCount > 0 ? 'warning' : 'success',
      });

      await refresh();
    },
    showSuccessDialog: false,
  });
};

/** ✅ 批次刪除（你後端還沒提供 delete API） */
const deleteSelected = async () => {
  if (!canDelete.value) return;

  const ok = await dialogStore.openConfirmDialog({
    title: '刪除確認',
    message: `確定要刪除選中的 ${selectedIds.value.length} 筆商品嗎？（刪除後無法復原）`,
  });
  if (!ok) return;

  await dialogStore.openInfoDialog({
    title: '提示訊息',
    message:
      '目前後端尚未提供 deleteLotteryWithPrizes API，請補上後我再幫你串。',
    iconType: 'warning',
  });
};

/* ==============================
 * Navigation
 * ============================== */
const navigateToAdd = () => router.push('/home/lottery-with-prizes/add');

const navigateToEdit = (item: any) => {
  router.push(`/home/lottery-with-prizes/edit/${item.id}`);
};

/* ==============================
 * Lifecycle
 * ============================== */
onMounted(async () => {
  await loadStoreOptions();

  // 初次進來直接查一次
  setValues(initValues.value);
  await onSubmit(initValues.value);
  isSearch.value = true;
});
</script>

<style lang="scss" scoped>
.clickable {
  cursor: pointer;
  text-decoration: underline;
}
</style>

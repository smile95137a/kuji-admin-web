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

        <!-- T020 — designationStatus filter -->
        <div class="w-50 w-md-100 p-6">
          <FormSelect
            label="指定狀態"
            v-model="designationStatus"
            :options="[
              { label: '待指定（PENDING）', value: 'PENDING' },
              { label: '已指定（DESIGNATED）', value: 'DESIGNATED' },
            ]"
            :showAll="true"
            allLabel="全部"
            :allValue="''"
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
            <span :class="statusBadgeClass(item.status)">{{
              statusText(item.status)
            }}</span>
          </template>

          <!-- T019 — designationStatus badge -->
          <template #cell-designationStatus="{ item }">
            <span
              v-if="item.gameMode === 'SCRATCH_STORE'"
              :class="designationStatusBadgeClass(item.designationStatus)"
              >{{ designationStatusText(item.designationStatus) }}</span
            >
            <span v-else>-</span>
          </template>

          <template #cell-actions="{ item }">
            <div class="flex gap-x-6 flex-wrap">
              <!-- DRAFT → 完成配置 -->
              <MButton
                v-if="item.status === 'DRAFT'"
                size="sm"
                @click="
                  changeStatus(
                    item,
                    'CONFIGURED',
                    `確定要將「${item.title}」標記為完成配置？`,
                  )
                "
                >完成配置</MButton
              >

              <!-- CONFIGURED → 開始抽獎 / 取消 -->
              <template v-if="item.status === 'CONFIGURED'">
                <!-- T017 — disable 開始抽獎 if SCRATCH_STORE + PENDING -->
                <MButton
                  size="sm"
                  :disabled="
                    item.gameMode === 'SCRATCH_STORE' &&
                    item.designationStatus === 'PENDING'
                  "
                  :title="
                    item.gameMode === 'SCRATCH_STORE' &&
                    item.designationStatus === 'PENDING'
                      ? '請先完成大獎號碼指定才能開始抽獎'
                      : ''
                  "
                  @click="
                    changeStatus(
                      item,
                      'ACTIVE',
                      `確定要開始「${item.title}」的抽獎？`,
                    )
                  "
                  >開始抽獎</MButton
                >
                <MButton
                  size="sm"
                  class="mbtn--gray"
                  @click="
                    changeStatus(
                      item,
                      'CANCELLED',
                      `確定要取消「${item.title}」？`,
                    )
                  "
                  >取消</MButton
                >
              </template>

              <!-- T018 — 指定大獎號碼 button for SCRATCH_STORE + PENDING -->
              <MButton
                v-if="
                  item.gameMode === 'SCRATCH_STORE' &&
                  item.designationStatus === 'PENDING'
                "
                size="sm"
                class="mbtn--gray"
                @click="openDesignateModal(item)"
                >指定大獎號碼</MButton
              >

              <!-- ACTIVE → 結束抽獎 -->
              <MButton
                v-if="item.status === 'ACTIVE'"
                size="sm"
                class="mbtn--gray"
                @click="
                  changeStatus(
                    item,
                    'ENDED',
                    `確定要結束「${item.title}」的抽獎？`,
                  )
                "
                >結束抽獎</MButton
              >

              <!-- non-ACTIVE → 刪除（ACTIVE 狀態須先結束才能刪除） -->
              <MButton
                v-if="item.status !== 'ACTIVE'"
                size="sm"
                class="mbtn--red"
                @click="
                  changeStatus(
                    item,
                    'DELETED',
                    `確定要刪除「${item.title}」？（此操作不可復原）`,
                  )
                "
                >刪除</MButton
              >
            </div>
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

  <!-- T016/T018 — DesignatePrizeModal -->
  <DesignatePrizeModal
    v-if="designateTarget"
    :show="showDesignateModal"
    :lotteryId="designateTarget.id"
    :lotteryName="designateTarget.title"
    :maxDraws="designateTarget.maxDraws"
    @close="showDesignateModal = false"
    @success="onDesignateSuccess"
  />
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
  changeLotteryWithPrizesStatus,
  designatePrize,
} from '@/services/adminLotteryWithPrizesService';

import DesignatePrizeModal from '@/components/lottery-with-prizes/DesignatePrizeModal.vue';
import { openInfoDialog } from '@/utils/dialog/infoDialog';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';

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
  designationStatus: '',
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
  { label: '已配置（CONFIGURED）', value: 'CONFIGURED' },
  { label: '抽獎中（ACTIVE）', value: 'ACTIVE' },
  { label: '已結束（ENDED）', value: 'ENDED' },
  { label: '已取消（CANCELLED）', value: 'CANCELLED' },
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
const [designationStatus] = defineField('designationStatus');

/* ==============================
 * Utils
 * ============================== */
const formatDateTime = (v?: string) => {
  if (!v) return '-';
  return String(v).replace('T', ' ');
};

const statusText = (s?: string) => {
  if (s === 'DRAFT') return '草稿';
  if (s === 'CONFIGURED') return '已配置';
  if (s === 'ACTIVE') return '抽獎中';
  if (s === 'ENDED') return '已結束';
  if (s === 'CANCELLED') return '已取消';
  return s ? String(s) : '-';
};

const statusBadgeClass = (s?: string) => {
  if (s === 'ACTIVE') return 'badge badge--green';
  if (s === 'CONFIGURED') return 'badge badge--blue';
  if (s === 'CANCELLED') return 'badge badge--red';
  return 'badge badge--gray'; // DRAFT, ENDED
};

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

/* T019 — designation status helpers */
const designationStatusText = (s?: string) => {
  if (s === 'PENDING') return '待指定';
  if (s === 'DESIGNATED') return '已指定';
  return '-';
};

const designationStatusBadgeClass = (s?: string) => {
  if (s === 'DESIGNATED') return 'badge badge--green';
  if (s === 'PENDING') return 'badge badge--orange';
  return 'badge badge--gray';
};

/* T016 — DesignatePrizeModal state */
const showDesignateModal = ref(false);
const designateTarget = ref<{
  id: string;
  title: string;
  maxDraws: number;
} | null>(null);

const openDesignateModal = (item: any) => {
  designateTarget.value = {
    id: item.id,
    title: item.title,
    maxDraws: item.maxDraws ?? 1,
  };
  showDesignateModal.value = true;
};

/* T018 — after successful designation */
const onDesignateSuccess = async () => {
  showDesignateModal.value = false;
  await openInfoDialog({
    title: '提示訊息',
    message: '指定大獎號碼成功',
    iconType: 'success',
  });
  await refresh();
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
  { field: 'status', label: '狀態', width: 100, sortable: true },
  { field: 'designationStatus', label: '指定狀態', width: 110, sortable: true },
  { field: 'updatedAt', label: '更新時間', width: 160, sortable: true },
  { field: 'actions', label: '操作', width: 280 },
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

const canDelete = computed(() => selectedRows.value.length > 0);

const refresh = async () => {
  const values = formRef.value?.values || initValues.value;
  await onSubmit(values);
  selectedIds.value = [];
};

/** 單列狀態變更 */
const changeStatus = async (
  item: any,
  newStatus: 'CONFIGURED' | 'ACTIVE' | 'ENDED' | 'CANCELLED' | 'DELETED',
  confirmMsg: string,
) => {
  const ok = await openConfirmDialog({
    title: '狀態確認',
    message: confirmMsg,
  });
  if (!ok) return;

  await executeApi({
    fn: async () => changeLotteryWithPrizesStatus(item.id, newStatus),
    onSuccess: async () => {
      await openInfoDialog({
        title: '提示訊息',
        message: '狀態更新成功',
        iconType: 'success',
      });
      await refresh();
    },
    showSuccessDialog: false,
  });
};

/** ✅ 批次刪除 */
const deleteSelected = async () => {
  if (!canDelete.value) return;

  // 篩出可刪除的（非 ACTIVE）
  const deletable = selectedRows.value.filter(
    (r: any) => r.status !== 'ACTIVE',
  );
  const activeCount = selectedRows.value.length - deletable.length;

  if (deletable.length === 0) {
    await openInfoDialog({
      title: '無法刪除',
      message: '選中的商品均為「抽獎中」狀態，請先結束抽獎後再刪除。',
      iconType: 'warning',
    });
    return;
  }

  const warningMsg =
    activeCount > 0
      ? `共選 ${selectedRows.value.length} 筆，其中 ${activeCount} 筆為「抽獎中」狀態無法刪除，確定要刪除其餘 ${deletable.length} 筆嗎？（刪除後無法復原）`
      : `確定要刪除選中的 ${deletable.length} 筆商品嗎？（刪除後無法復原）`;

  const ok = await openConfirmDialog({
    title: '刪除確認',
    message: warningMsg,
  });
  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(
        deletable.map((row: any) =>
          changeLotteryWithPrizesStatus(row.id, 'DELETED'),
        ),
      ),
    onSuccess: async (results: any[]) => {
      const okCount = results.filter(
        (x: any) => x.status === 'fulfilled',
      ).length;
      const failCount = results.length - okCount;
      await openInfoDialog({
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
.badge--red {
  background: #fee2e2;
  color: #991b1b;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 12px;
}
.badge--orange {
  background: #fff7e6;
  color: #d46b08;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 12px;
}
</style>

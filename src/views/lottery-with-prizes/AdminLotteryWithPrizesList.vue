<!-- src/views/lottery-with-prizes/AdminLotteryWithPrizesList.vue -->
<template>
  <!-- ===================== 查詢區 ===================== -->
  <MCard>
    <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
      <FormTitle title="商品與獎品管理" />

      <LotteryWithPrizesSearchForm
        :store-options="storeOptions"
        :status-options="statusOptions"
        :category-options="categoryOptions"
        :sub-category-options="subCategoryOptions"
        :designation-status-options="designationStatusOptions"
      />

      <div class="flex justify-center m-y-8">
        <MButton type="submit">
          <font-awesome-icon icon="fa-magnifying-glass" class="m-r-4" />
          查詢
        </MButton>
      </div>
    </Form>
  </MCard>

  <!-- ===================== 列表區 ===================== -->
  <div class="m-t-12">
    <MCard>
      <div class="lottery-with-prizes-list__toolbar">
        <MButton @click="navigateToAdd">
          <font-awesome-icon icon="fa-plus" class="m-r-4" />
          新增
        </MButton>

        <MButton
          class="mbtn--red"
          :disabled="!canDelete"
          @click="deleteSelected"
        >
          <font-awesome-icon icon="fa-trash" class="m-r-4" />
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
          <!-- 商品名稱 -->
          <template #cell-title="{ item }">
            <span class="clickable" @click="navigateToEdit(item)">
              {{ item.title || '-' }}
            </span>
          </template>

          <!-- 店家 -->
          <template #cell-storeName="{ item }">
            <span>{{ item.storeName || item.storeId || '-' }}</span>
          </template>

          <!-- 分類 -->
          <template #cell-category="{ item }">
            <span>{{ categoryText(item.category) }}</span>
          </template>

          <!-- 遊戲模式 -->
          <template #cell-gameMode="{ item }">
            <span>{{ gameModeText(item) }}</span>
          </template>

          <!-- 狀態 -->
          <template #cell-status="{ item }">
            <span :class="statusBadgeClass(item.status)">
              {{ statusText(item.status) }}
            </span>
          </template>

          <!-- 指定狀態 -->
          <template #cell-designationStatus="{ item }">
            <span
              v-if="item.gameMode === 'SCRATCH_STORE'"
              :class="designationStatusBadgeClass(item.designationStatus)"
            >
              {{ designationStatusText(item.designationStatus) }}
            </span>

            <span v-else>-</span>
          </template>

          <!-- 每抽價格 -->
          <template #cell-pricePerDraw="{ item }">
            <span>{{ formatMoney(item.pricePerDraw) }}</span>
          </template>

          <!-- 總抽數 -->
          <template #cell-maxDraws="{ item }">
            <span>{{ item.maxDraws ?? '-' }}</span>
          </template>

          <!-- 更新時間 -->
          <template #cell-updatedAt="{ item }">
            <span>{{ formatDateTime(item.updatedAt) }}</span>
          </template>

          <!-- 操作 -->
          <template #cell-actions="{ item }">
            <div class="lottery-with-prizes-list__actions">
              <!-- DRAFT → 上架 -->
              <MButton
                v-if="item.status === 'DRAFT'"
                size="sm"
                @click="
                  changeStatus(
                    item,
                    'ON_SHELF',
                    `確定要將「${item.title}」上架？`,
                  )
                "
              >
                上架
              </MButton>

              <!-- ON_SHELF → 下架 / 強制下架 -->
              <template v-if="item.status === 'ON_SHELF'">
                <MButton
                  size="sm"
                  class="mbtn--gray"
                  @click="
                    changeStatus(
                      item,
                      'OFF_SHELF',
                      `確定要將「${item.title}」下架？`,
                    )
                  "
                >
                  下架
                </MButton>

                <MButton
                  size="sm"
                  class="mbtn--red"
                  @click="
                    changeStatus(
                      item,
                      'FORCED_OFF',
                      `確定要強制下架「${item.title}」？`,
                    )
                  "
                >
                  強制下架
                </MButton>
              </template>

              <!-- OFF_SHELF → 重新上架 -->
              <MButton
                v-if="item.status === 'OFF_SHELF'"
                size="sm"
                @click="
                  changeStatus(
                    item,
                    'ON_SHELF',
                    `確定要將「${item.title}」重新上架？`,
                  )
                "
              >
                重新上架
              </MButton>

              <!-- FORCED_OFF → 轉回一般下架 -->
              <MButton
                v-if="item.status === 'FORCED_OFF'"
                size="sm"
                class="mbtn--gray"
                @click="
                  changeStatus(
                    item,
                    'OFF_SHELF',
                    `將商品 ${item.title} 轉回一般下架`,
                  )
                "
              >
                轉一般下架
              </MButton>

              <!-- 店家指定大獎 -->
              <MButton
                v-if="
                  item.gameMode === 'SCRATCH_STORE' && item.status !== 'DELETED'
                "
                size="sm"
                variant="secondary"
                @click="openDesignateModal(item)"
              >
                指定大獎
              </MButton>

              <!-- non-ON_SHELF → 刪除 -->
              <MButton
                v-if="item.status === 'DRAFT' || item.status === 'OFF_SHELF'"
                size="sm"
                class="mbtn--red"
                @click="
                  changeStatus(
                    item,
                    'DELETED',
                    `確定要刪除「${item.title}」？（此操作不可復原）`,
                  )
                "
              >
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
import { ref, computed, onMounted, nextTick } from 'vue';
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

import LotteryWithPrizesSearchForm from '@/components/lottery-with-prizes/LotteryWithPrizesSearchForm.vue';
import DesignatePrizeModal from '@/components/lottery-with-prizes/DesignatePrizeModal.vue';

import { executeApi } from '@/utils/executeApiUtils';

import { getStoreOptions } from '@/services/adminStoreService';
import {
  getAllLotteriesWithPrizes,
  changeLotteryWithPrizesStatus,
} from '@/services/adminLotteryWithPrizesService';

import { openInfoDialog } from '@/utils/dialog/infoDialog';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';

const router = useRouter();

/* ==============================
 * Types
 * ============================== */
interface SelectOption {
  label: string;
  value: any;
  description?: string;
}

/* ==============================
 * Form
 * ============================== */
const formRef = ref<FormContext | null>(null);

const initValues = ref({
  storeId: '',
  status: '',
  category: '',
  subCategory: '',
  title: '',
  priceMin: '',
  priceMax: '',
  designationStatus: '',
});

/* ==============================
 * Search Hook
 * ============================== */
const { list, hasData, isSearch, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

/* ==============================
 * Select Options
 * ============================== */
const storeOptions = ref<SelectOption[]>([]);

const statusOptions = ref<SelectOption[]>([
  { label: '草稿（DRAFT）', value: 'DRAFT' },
  { label: '待上架（WAITING_ON_SHELF）', value: 'WAITING_ON_SHELF' },
  { label: '上架中（ON_SHELF）', value: 'ON_SHELF' },
  { label: '下架（OFF_SHELF）', value: 'OFF_SHELF' },
  { label: '強制下架（FORCED_OFF）', value: 'FORCED_OFF' },
  { label: '大獎已抽完（GRAND_PRIZE_DRAWN）', value: 'GRAND_PRIZE_DRAWN' },
  { label: '全數已抽完（ALL_DRAWN）', value: 'ALL_DRAWN' },
  { label: '已刪除（DELETED）', value: 'DELETED' },
]);

const categoryOptions = ref<SelectOption[]>([
  { label: '官方一番賞', value: 'OFFICIAL_ICHIBAN' },
  { label: '扭蛋', value: 'GACHA' },
  { label: '卡牌', value: 'TRADING_CARD' },
  { label: '自製一番賞', value: 'CUSTOM_GACHA' },
]);

const subCategoryOptions = ref<SelectOption[]>([
  { label: '抽籤型', value: 'LOTTERY_MODE' },
  { label: '刮刮樂型', value: 'SCRATCH_MODE' },
]);

const designationStatusOptions = ref<SelectOption[]>([
  { label: '待指定（PENDING）', value: 'PENDING' },
  { label: '已指定（DESIGNATED）', value: 'DESIGNATED' },
]);

const mapEnumOptionsToSelect = (arr: any[] = []): SelectOption[] =>
  arr.map((item) => ({
    label: item?.label ?? item?.storeName ?? item?.name ?? '',
    value: item?.value ?? item?.id ?? '',
    ...(item?.description ? { description: item.description } : {}),
  }));

const loadStoreOptions = async () => {
  await executeApi<any[]>({
    fn: async () => getStoreOptions({ activeOnly: true }),
    onSuccess: (data: any) => {
      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];

      storeOptions.value = mapEnumOptionsToSelect(list);
    },
    showSuccessDialog: false,
  });
};

/* ==============================
 * Utils
 * ============================== */
const formatDateTime = (value?: string) => {
  if (!value) return '-';

  return String(value).replace('T', ' ');
};

const formatMoney = (value: any) => {
  if (value === null || value === undefined || value === '') return '-';

  const num = Number(value);

  if (Number.isNaN(num)) return value;

  return num.toLocaleString('zh-TW');
};

const statusText = (status?: string) => {
  if (status === 'DRAFT') return '草稿';
  if (status === 'WAITING_ON_SHELF') return '待上架';
  if (status === 'ON_SHELF') return '上架中';
  if (status === 'OFF_SHELF') return '下架';
  if (status === 'FORCED_OFF') return '強制下架';
  if (status === 'GRAND_PRIZE_DRAWN') return '大獎已抽完';
  if (status === 'ALL_DRAWN') return '全數已抽完';
  if (status === 'DELETED') return '已刪除';
  if (status === 'CONFIGURED') return '待上架';
  if (status === 'SOLD_OUT') return '全數已抽完';
  if (status === 'ENDED') return '已抽完';

  return status ? String(status) : '-';
};

const statusBadgeClass = (status?: string) => {
  if (status === 'WAITING_ON_SHELF') return 'badge badge--orange';
  if (status === 'ON_SHELF') return 'badge badge--green';
  if (status === 'OFF_SHELF') return 'badge badge--gray';
  if (status === 'FORCED_OFF') return 'badge badge--red';
  if (status === 'GRAND_PRIZE_DRAWN') return 'badge badge--blue';
  if (status === 'ALL_DRAWN') return 'badge badge--gray';
  if (status === 'DELETED') return 'badge badge--gray';
  if (status === 'CONFIGURED') return 'badge badge--orange';
  if (status === 'SOLD_OUT') return 'badge badge--blue';
  if (status === 'ENDED') return 'badge badge--gray';

  return 'badge badge--gray';
};

const categoryText = (category?: string) => {
  if (category === 'OFFICIAL_ICHIBAN') return '官方一番賞';
  if (category === 'GACHA') return '扭蛋';
  if (category === 'TRADING_CARD') return '卡牌';
  if (category === 'CUSTOM_GACHA') return '自製一番賞';

  return category ? String(category) : '-';
};

const gameModeText = (item: any) => {
  if (String(item?.playMode || '') !== 'SCRATCH_MODE') return '-';

  const mode = item?.gameMode;

  if (mode === 'RANDOM') return '隨機';
  if (mode === 'SCRATCH_STORE') return '店家指定';
  if (mode === 'SCRATCH_PLAYER') return '玩家指定';

  return mode ? String(mode) : '-';
};

const designationStatusText = (status?: string) => {
  if (status === 'PENDING') return '待指定';
  if (status === 'DESIGNATED') return '已指定';

  return '-';
};

const designationStatusBadgeClass = (status?: string) => {
  if (status === 'DESIGNATED') return 'badge badge--green';
  if (status === 'PENDING') return 'badge badge--orange';

  return 'badge badge--gray';
};

/* ==============================
 * DesignatePrizeModal
 * ============================== */
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
    compareByKeySmart(a, b, sortKey.value, sortOrder.value as 'asc' | 'desc', {
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

const handlePageLimitSizeChange = (value: number) => {
  pageLimitSize.value = value;
  goToPage(1);
};

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
 * Query
 * ============================== */
const onSubmit = async (values: any) => {
  const condition = {
    storeId: values.storeId ?? '',
    status: values.status ?? '',
    category: values.category ?? '',
    subCategory: values.subCategory ?? '',
    title: values.title ?? '',
    priceMin: values.priceMin ?? '',
    priceMax: values.priceMax ?? '',
    designationStatus: values.designationStatus ?? '',
  };

  await query(() =>
    getAllLotteriesWithPrizes({
      condition,
    }),
  );

  selectedIds.value = [];
  goToPage(1);
  isSearch.value = true;
};

const refresh = async () => {
  const values = formRef.value?.values || initValues.value;

  await onSubmit(values);
};

/* ==============================
 * Selection / Bulk Actions
 * ============================== */
const selectedIds = ref<string[]>([]);

const selectedRows = computed(() =>
  list.value.filter((row: any) => selectedIds.value.includes(row.id)),
);

const canDelete = computed(() =>
  selectedRows.value.some(
    (row: any) => row.status === 'DRAFT' || row.status === 'OFF_SHELF',
  ),
);

const changeStatus = async (
  item: any,
  newStatus:
    | 'ON_SHELF'
    | 'OFF_SHELF'
    | 'FORCED_OFF'
    | 'DRAFT'
    | 'DELETED',
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

const deleteSelected = async () => {
  if (!canDelete.value) return;

  const deletable = selectedRows.value.filter(
    (row: any) => row.status === 'DRAFT' || row.status === 'OFF_SHELF',
  );
  const activeCount = selectedRows.value.length - deletable.length;

  if (deletable.length === 0) {
    await openInfoDialog({
      title: '無法刪除',
      message: '選中的商品均為「上架中」狀態，請先下架後再刪除。',
      iconType: 'warning',
    });
    return;
  }

  const warningMsg =
    activeCount > 0
      ? `共選 ${selectedRows.value.length} 筆，其中 ${activeCount} 筆為「上架中」狀態無法刪除，確定要刪除其餘 ${deletable.length} 筆嗎？（刪除後無法復原）`
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
        (item: any) => item.status === 'fulfilled',
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
const navigateToAdd = () => {
  router.push('/home/lottery-with-prizes/add');
};

const navigateToEdit = (item: any) => {
  router.push(`/home/lottery-with-prizes/edit/${item.id}`);
};

/* ==============================
 * Lifecycle
 * ============================== */
onMounted(async () => {
  await loadStoreOptions();
  await nextTick();

  formRef.value?.setValues(initValues.value);

  await onSubmit(initValues.value);
});
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/assets/styles/base/tokens' as tokens;

.lottery-with-prizes-list {
  &__toolbar {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}

.clickable {
  cursor: pointer;
  text-decoration: underline;
}

.badge--red {
  border-radius: 4px;
  background: #fee2e2;
  color: #991b1b;
  padding: 2px 8px;
  font-size: 12px;
}

.badge--orange {
  border-radius: 4px;
  background: #fff7e6;
  color: #d46b08;
  padding: 2px 8px;
  font-size: 12px;
}

@media (max-width: 640px) {
  .lottery-with-prizes-list {
    &__toolbar {
      justify-content: flex-start;
    }
  }
}
</style>

<!-- src/views/emergencyAnnouncement/EmergencyAnnouncementList.vue -->
<template>
  <MCard>
    <Form ref="formRef" :initial-values="initValues" @submit="onSubmit">
      <FormTitle title="緊急公告管理" />

      <EmergencyAnnouncementSearchForm
        :status-options="statusOptions"
        :announcement-type-options="announcementTypeOptions"
      />

      <div class="flex justify-center m-y-8 gap-x-12 flex-wrap">
        <MButton type="submit">
          <font-awesome-icon icon="fa-magnifying-glass" class="m-r-4" />
          查詢
        </MButton>

        <MButton type="button" class="mbtn--gray" @click="resetFilters">
          <font-awesome-icon icon="fa-rotate-left" class="m-r-4" />
          清除
        </MButton>
      </div>
    </Form>
  </MCard>

  <div class="m-t-12">
    <MCard>
      <div class="emergency-announcement-list__toolbar">
        <MButton @click="navigateToAdd">
          <font-awesome-icon icon="fa-plus" class="m-r-4" />
          新增
        </MButton>

        <MButton :disabled="!canActivate" @click="activateSelected">
          <font-awesome-icon icon="fa-circle-check" class="m-r-4" />
          啟用
        </MButton>

        <MButton :disabled="!canDeactivate" @click="deactivateSelected">
          <font-awesome-icon icon="fa-ban" class="m-r-4" />
          停用
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
          <template #cell-title="{ item }">
            <span class="clickable" @click="navigateToEdit(item)">
              {{ item.title || '-' }}
            </span>
          </template>

          <template #cell-announcementType="{ item }">
            {{ announcementTypeText(item.announcementType) }}
          </template>

          <template #cell-status="{ item }">
            <span :class="statusBadgeClass(item.status)">
              {{ statusText(item.status) }}
            </span>
          </template>

          <template #cell-displayTime="{ item }">
            <span>
              {{ formatDateTime(item.displayStartTime) }}
              ～
              {{ formatDateTime(item.displayEndTime) }}
            </span>
          </template>

          <template #cell-maintenanceTime="{ item }">
            <span>
              {{ formatDateTime(item.maintenanceStartTime) }}
              ～
              {{ formatDateTime(item.maintenanceEndTime) }}
            </span>
          </template>

          <template #cell-forceShow="{ item }">
            <span>{{ item.forceShow ? '是' : '否' }}</span>
          </template>

          <template #cell-updatedAt="{ item }">
            <span>{{ formatDateTime(item.updatedAt) }}</span>
          </template>

          <template #cell-actions="{ item }">
            <div class="emergency-announcement-list__actions">
              <MButton size="sm" @click="navigateToEdit(item)"> 編輯 </MButton>

              <MButton
                v-if="item.status !== 'ACTIVE'"
                size="sm"
                @click="activateOne(item)"
              >
                啟用
              </MButton>

              <MButton
                v-if="item.status === 'ACTIVE'"
                size="sm"
                class="mbtn--gray"
                @click="deactivateOne(item)"
              >
                停用
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
import { ref, computed, onMounted, nextTick, watch } from 'vue';
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
import EmergencyAnnouncementSearchForm from '@/components/emergencyAnnouncement/EmergencyAnnouncementSearchForm.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';
import { useEmergencyAnnouncementStore } from '@/stores/emergencyAnnouncement/useEmergencyAnnouncementStore';

import {
  queryEmergencyAnnouncements,
  updateEmergencyAnnouncementStatus,
  deleteEmergencyAnnouncement,
} from '@/services/adminEmergencyAnnouncementService';

const router = useRouter();
const emergencyAnnouncementStore = useEmergencyAnnouncementStore();

/* --------------------------------------
 * Form
 * -------------------------------------- */
const formRef = ref<FormContext | null>(null);

const initValues = ref({
  status: '',
  announcementType: '',
  keyword: '',
  displayStartTime: '',
  displayEndTime: '',
});

/* --------------------------------------
 * Search list
 * -------------------------------------- */
const { list, hasData, isSearch, noDataMessage, query } = useSearchPage({
  useLocalList: true,
});

/* --------------------------------------
 * Options
 * -------------------------------------- */
const statusOptions = ref<SelectOption[]>([
  { label: '草稿', value: 'DRAFT' },
  { label: '啟用', value: 'ACTIVE' },
  { label: '停用', value: 'INACTIVE' },
]);

const announcementTypeOptions = ref<SelectOption[]>([
  { label: '維修公告', value: 'MAINTENANCE' },
  { label: '版本更新', value: 'UPDATE' },
  { label: '重要公告', value: 'NOTICE' },
]);

/* --------------------------------------
 * Utils
 * -------------------------------------- */
const formatDateTime = (value?: string) => {
  if (!value) return '-';

  return String(value).replace('T', ' ').slice(0, 16);
};

const statusText = (status?: string) => {
  if (status === 'DRAFT') return '草稿';
  if (status === 'ACTIVE') return '啟用';
  if (status === 'INACTIVE') return '停用';

  return status || '-';
};

const statusBadgeClass = (status?: string) => {
  if (status === 'ACTIVE') return 'badge badge--green';
  if (status === 'DRAFT') return 'badge badge--blue';
  return 'badge badge--gray';
};

const announcementTypeText = (type?: string) => {
  if (type === 'MAINTENANCE') return '維修公告';
  if (type === 'UPDATE') return '版本更新';
  if (type === 'NOTICE') return '重要公告';

  return type || '-';
};

const normalizeResponseList = (res: any) => {
  const data = res?.data ?? res;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.list)) return data.list;
  if (Array.isArray(res?.content)) return res.content;
  if (Array.isArray(res?.list)) return res.list;

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
 * Columns
 * -------------------------------------- */
const columns = [
  { field: 'title', label: '公告標題', width: 220, sortable: true },
  { field: 'announcementType', label: '公告類型', width: 120, sortable: true },
  { field: 'status', label: '狀態', width: 100, sortable: true },
  { field: 'displayTime', label: '公告顯示期間', width: 300 },
  { field: 'maintenanceTime', label: '維修/更新時間', width: 300 },
  { field: 'forceShow', label: '強制顯示', width: 100, sortable: true },
  { field: 'sortOrder', label: '排序', width: 80, sortable: true },
  { field: 'updatedAt', label: '更新時間', width: 160, sortable: true },
  { field: 'actions', label: '操作', width: 200 },
];

/* --------------------------------------
 * Query
 * -------------------------------------- */
const onSubmit = async (values: any) => {
  const condition = {
    status: values.status ?? '',
    announcementType: values.announcementType ?? '',
    keyword: values.keyword ?? '',
    displayStartTime: values.displayStartTime ?? '',
    displayEndTime: values.displayEndTime ?? '',
  };

  await query(async () => {
    const res = await queryEmergencyAnnouncements({
      page: 0,
      size: 9999,
      condition: {
        ...condition,
        sortBy: 'updatedAt',
        sortDir: 'DESC',
      },
    });

    return normalizeResponseList(res);
  });

  emergencyAnnouncementStore.setSearchCondition(condition);
  selectedIds.value = [];
  goToPage(1);
  isSearch.value = true;
};

const resetFilters = async () => {
  const values = {
    status: '',
    announcementType: '',
    keyword: '',
    displayStartTime: '',
    displayEndTime: '',
  };

  formRef.value?.setValues(values);
  await onSubmit(values);
};

const refresh = async () => {
  const values = formRef.value?.values || initValues.value;

  await onSubmit(values);
};

/* --------------------------------------
 * Selection
 * -------------------------------------- */
const selectedIds = ref<string[]>([]);

watch(
  selectedIds,
  (value) => {
    emergencyAnnouncementStore.setSelectedIds([...value]);
  },
  { deep: true },
);

const selectedRows = computed(() =>
  list.value.filter((row: any) => selectedIds.value.includes(row.id)),
);

const activateTargetRows = computed(() =>
  selectedRows.value.filter((row: any) => row.status !== 'ACTIVE'),
);

const deactivateTargetRows = computed(() =>
  selectedRows.value.filter((row: any) => row.status === 'ACTIVE'),
);

const canActivate = computed(() => activateTargetRows.value.length > 0);

const canDeactivate = computed(() => deactivateTargetRows.value.length > 0);

const canDelete = computed(() => selectedRows.value.length > 0);

/* --------------------------------------
 * Actions
 * -------------------------------------- */
const activateOne = async (item: any) => {
  if (!item?.id) return;

  const ok = await openConfirmDialog({
    title: '啟用確認',
    message: '確定要啟用此公告嗎？',
  });

  if (!ok) return;

  await executeApi({
    fn: async () => updateEmergencyAnnouncementStatus(item.id, 'ACTIVE'),
    successMessage: '啟用成功',
    showSuccessDialog: true,
    onSuccess: refresh,
  });
};

const deactivateOne = async (item: any) => {
  if (!item?.id) return;

  const ok = await openConfirmDialog({
    title: '停用確認',
    message: '確定要停用此公告嗎？',
  });

  if (!ok) return;

  await executeApi({
    fn: async () => updateEmergencyAnnouncementStatus(item.id, 'INACTIVE'),
    successMessage: '停用成功',
    showSuccessDialog: true,
    onSuccess: refresh,
  });
};

const activateSelected = async () => {
  if (!canActivate.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '請至少選擇一筆非啟用狀態的公告。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '啟用確認',
    message: `確定要啟用選中的 ${activateTargetRows.value.length} 筆公告嗎？`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(
        activateTargetRows.value.map((item: any) =>
          updateEmergencyAnnouncementStatus(item.id, 'ACTIVE'),
        ),
      ),
    onSuccess: async (results: PromiseSettledResult<any>[]) => {
      const okCount = results.filter(
        (item) => item.status === 'fulfilled',
      ).length;
      const failCount = results.length - okCount;

      await openInfoDialog({
        title: '提示訊息',
        message:
          failCount > 0
            ? `啟用完成：成功 ${okCount}、失敗 ${failCount}`
            : `啟用完成：成功 ${okCount}`,
        iconType: failCount > 0 ? 'warning' : 'success',
      });

      selectedIds.value = [];
      emergencyAnnouncementStore.clearSelectedIds();
      await refresh();
    },
    showSuccessDialog: false,
  });
};

const deactivateSelected = async () => {
  if (!canDeactivate.value) {
    await openInfoDialog({
      title: '提示訊息',
      message: '請至少選擇一筆啟用狀態的公告。',
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '停用確認',
    message: `確定要停用選中的 ${deactivateTargetRows.value.length} 筆公告嗎？`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(
        deactivateTargetRows.value.map((item: any) =>
          updateEmergencyAnnouncementStatus(item.id, 'INACTIVE'),
        ),
      ),
    onSuccess: async (results: PromiseSettledResult<any>[]) => {
      const okCount = results.filter(
        (item) => item.status === 'fulfilled',
      ).length;
      const failCount = results.length - okCount;

      await openInfoDialog({
        title: '提示訊息',
        message:
          failCount > 0
            ? `停用完成：成功 ${okCount}、失敗 ${failCount}`
            : `停用完成：成功 ${okCount}`,
        iconType: failCount > 0 ? 'warning' : 'success',
      });

      selectedIds.value = [];
      emergencyAnnouncementStore.clearSelectedIds();
      await refresh();
    },
    showSuccessDialog: false,
  });
};

const deleteSelected = async () => {
  if (!canDelete.value) return;

  const activeRows = selectedRows.value.filter(
    (row: any) => row.status === 'ACTIVE',
  );

  if (activeRows.length > 0) {
    await openInfoDialog({
      title: '提示訊息',
      message: `選中的 ${activeRows.length} 筆公告目前為啟用狀態，請先停用後再刪除。`,
      iconType: 'warning',
    });
    return;
  }

  const ok = await openConfirmDialog({
    title: '刪除確認',
    message: `確定要刪除選中的 ${selectedIds.value.length} 筆公告嗎？（刪除後無法復原）`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () =>
      Promise.allSettled(
        selectedIds.value.map((id) => deleteEmergencyAnnouncement(id)),
      ),
    onSuccess: async (results: PromiseSettledResult<any>[]) => {
      const okCount = results.filter(
        (item) => item.status === 'fulfilled',
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

      selectedIds.value = [];
      emergencyAnnouncementStore.clearSelectedIds();
      await refresh();
    },
    showSuccessDialog: false,
  });
};

/* --------------------------------------
 * Save state / Navigation
 * -------------------------------------- */
const saveListState = () => {
  emergencyAnnouncementStore.setList([...list.value]);
  emergencyAnnouncementStore.setSearchCondition(
    formRef.value?.values || initValues.value,
  );
  emergencyAnnouncementStore.setSort(sortKey.value, sortOrder.value);
  emergencyAnnouncementStore.setCurrentPage(currentPage.value);
  emergencyAnnouncementStore.setPageLimitSize(pageLimitSize.value);
  emergencyAnnouncementStore.setSelectedIds([...selectedIds.value]);
};

const navigateToEdit = (item: any) => {
  if (!item?.id) return;

  saveListState();
  router.push(`/home/emergency-announcements/edit/${item.id}`);
};

const navigateToAdd = () => {
  saveListState();
  router.push('/home/emergency-announcements/add');
};

/* --------------------------------------
 * Lifecycle
 * -------------------------------------- */
onMounted(async () => {
  if (
    emergencyAnnouncementStore.list.length > 0 &&
    !emergencyAnnouncementStore.shouldRefresh
  ) {
    list.value = [...emergencyAnnouncementStore.list];
    initValues.value = { ...emergencyAnnouncementStore.searchCondition };

    await nextTick();
    formRef.value?.setValues(emergencyAnnouncementStore.searchCondition);

    sortKey.value = emergencyAnnouncementStore.sortKey || '';
    sortOrder.value = emergencyAnnouncementStore.sortOrder || 'asc';
    pageLimitSize.value = emergencyAnnouncementStore.pageLimitSize;
    selectedIds.value = [...emergencyAnnouncementStore.selectedIds];

    await nextTick();
    goToPage(emergencyAnnouncementStore.currentPage);

    isSearch.value = true;
    emergencyAnnouncementStore.resetAll();
    return;
  }

  const condition = emergencyAnnouncementStore.shouldRefresh
    ? { ...emergencyAnnouncementStore.searchCondition }
    : { ...initValues.value };

  initValues.value = { ...condition };

  await nextTick();
  formRef.value?.setValues(condition);

  await onSubmit(condition);
  emergencyAnnouncementStore.resetAll();
});
</script>

<style scoped lang="scss">
.emergency-announcement-list {
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
</style>

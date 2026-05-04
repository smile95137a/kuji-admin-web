<!-- src/views/role/RolePermissions.vue -->
<template>
  <MCard>
    <FormTitle title="角色權限設定" />

    <div v-if="isAdminRole" class="adminRole__notice">
      <span>⚠️ 此角色為系統管理員，擁有全域權限，不可修改。</span>
    </div>

    <div v-if="isStoreEditorRole" class="storeEditor__notice">
      <span
        >ℹ️
        店家編輯（STORE_EDITOR）的權限範圍由後端依店家歸屬限制，前端設定僅供參考。</span
      >
    </div>

    <div class="flex justify-end gap-x-12 flex-wrap m-b-12">
      <MButton @click="save">儲存權限</MButton>
      <MButton variant="secondary" @click="goBack">返回</MButton>
    </div>

    <template v-if="menuTree.length === 0">
      <NoData message="查無選單樹資料" />
    </template>

    <template v-else>
      <ReportTable
        :columns="columns"
        :items="flatMenuRows"
        row-key="id"
        :useWidthClass="true"
      >
        <template #cell-name="{ item }">
          <div :style="{ paddingLeft: `${item.level * 18}px` }">
            {{ item.name || item.title || item.code || '-' }}
          </div>
        </template>

        <template #cell-view="{ item }">
          <input
            type="checkbox"
            v-model="permMap[item.id].canView"
            :disabled="isAdminRole"
          />
        </template>

        <template #cell-edit="{ item }">
          <input
            type="checkbox"
            v-model="permMap[item.id].canEdit"
            :disabled="isAdminRole"
            @change="onEditChange(item.id)"
          />
        </template>

        <template #cell-delete="{ item }">
          <input
            type="checkbox"
            v-model="permMap[item.id].canDelete"
            :disabled="isAdminRole"
            @change="onDeleteChange(item.id)"
          />
        </template>
      </ReportTable>
    </template>
  </MCard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import NoData from '@/components/common/NoData.vue';
import ReportTable from '@/components/common/ReportTable.vue';
import FormTitle from '@/components/common/FormTitle.vue';

import { useDialogStore } from '@/stores';
import { executeApi } from '@/utils/executeApiUtils';

import { getMenuTree } from '@/services/adminMenuService';
import {
  getRoleDetailById,
  setRoleMenuPermissions,
} from '@/services/adminRoleService';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

const route = useRoute();
const router = useRouter();
const dialogStore = useDialogStore();

const roleId = computed(() => String(route.params.id || ''));

const menuTree = ref<any[]>([]);
const roleDetail = ref<any>(null);
const isAdminRole = computed(
  () =>
    roleDetail.value?.code === 'ADMIN' ||
    roleDetail.value?.name === 'ADMIN' ||
    String(roleDetail.value?.code || '').toUpperCase() === 'ROLE_ADMIN',
);

const isStoreEditorRole = computed(
  () =>
    roleDetail.value?.code === 'STORE_EDITOR' ||
    String(roleDetail.value?.code || '').toUpperCase() === 'ROLE_STORE_EDITOR',
);

/**
 * permMap[menuId] = { canView, canEdit, canDelete }
 * 預設全 false，載入 roleDetail 後再覆蓋
 */
const permMap = ref<
  Record<string, { canView: boolean; canEdit: boolean; canDelete: boolean }>
>({});

const columns = [
  { field: 'name', label: '選單', width: 360 },
  { field: 'view', label: '查看', width: 90 },
  { field: 'edit', label: '編輯', width: 90 },
  { field: 'delete', label: '刪除', width: 90 },
];

const flattenTree = (nodes: any[], level = 0): any[] => {
  const rows: any[] = [];
  for (const n of nodes || []) {
    rows.push({ ...n, level });
    if (n.children?.length) rows.push(...flattenTree(n.children, level + 1));
  }
  return rows;
};

const flatMenuRows = computed(() => flattenTree(menuTree.value, 0));

const ensurePermRow = (menuId: string) => {
  if (!permMap.value[menuId]) {
    permMap.value[menuId] = {
      canView: false,
      canEdit: false,
      canDelete: false,
    };
  }
};

const loadData = async () => {
  // 1) menu tree
  await executeApi({
    fn: async () => getMenuTree(),
    onSuccess: async (res: any) => {
      const data = res?.data ?? res ?? [];
      menuTree.value = Array.isArray(data) ? data : [];
    },
    showSuccessDialog: false,
  });

  // 先把全部 menuId 初始化
  flatMenuRows.value.forEach((m: any) => ensurePermRow(m.id));

  // 2) role detail
  await executeApi({
    fn: async () => getRoleDetailById(roleId.value),
    onSuccess: async (res: any) => {
      roleDetail.value = res?.data ?? res;

      /**
       * 你後端 RoleDetailRes 欄位不確定
       * 這裡做「容錯」：支援 permissions / menuPermissions / permissionList 等常見命名
       */
      const perms =
        roleDetail.value?.permissions ||
        roleDetail.value?.menuPermissions ||
        roleDetail.value?.permissionList ||
        [];

      if (Array.isArray(perms)) {
        perms.forEach((p: any) => {
          const menuId = String(p.menuId || p.id || '');
          if (!menuId) return;
          ensurePermRow(menuId);

          permMap.value[menuId].canView = Boolean(
            p.canView ?? p.view ?? p.read ?? false,
          );
          permMap.value[menuId].canEdit = Boolean(
            p.canEdit ?? p.edit ?? p.write ?? false,
          );
          permMap.value[menuId].canDelete = Boolean(
            p.canDelete ?? p.delete ?? false,
          );
        });
      }
    },
    showSuccessDialog: false,
  });
};

const onEditChange = (menuId: string) => {
  if (permMap.value[menuId]?.canEdit) {
    permMap.value[menuId].canView = true;
  }
};

const onDeleteChange = (menuId: string) => {
  if (permMap.value[menuId]?.canDelete) {
    permMap.value[menuId].canView = true;
  }
};

const goBack = () => router.push('/home/roles');

const save = async () => {
  const ok = await openConfirmDialog({
    title: '儲存確認',
    message: '確定要儲存角色權限嗎？',
  });
  if (!ok) return;

  // 組 RoleMenuPermissionReq
  // 你後端格式未知，這裡用最常見的：
  // { roleId, permissions: [{ menuId, canView, canEdit, canDelete }] }
  const permissions = Object.entries(permMap.value).map(([menuId, v]) => ({
    menuId,
    canView: v.canView,
    canEdit: v.canEdit,
    canDelete: v.canDelete,
  }));

  await executeApi({
    fn: async () =>
      setRoleMenuPermissions({ roleId: roleId.value, permissions }),
    onSuccess: async () => {
      await openInfoDialog({
        title: '提示訊息',
        message: '儲存成功',
        iconType: 'success',
      });
    },
    showSuccessDialog: false,
  });
};

onMounted(async () => {
  await loadData();
});
</script>

<style scoped>
.adminRole__notice {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  padding: 10px 14px;
  margin-bottom: 12px;
  color: #92400e;
  font-size: 13px;
}

.storeEditor__notice {
  background: #eff6ff;
  border: 1px solid #3b82f6;
  border-radius: 6px;
  padding: 10px 14px;
  margin-bottom: 12px;
  color: #1e40af;
  font-size: 13px;
}
</style>

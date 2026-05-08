<!-- src/views/menu/MenuTree.vue -->
<template>
  <MCard>
    <FormTitle title="選單樹狀結構" />

    <div class="menu-tree-page__toolbar">
      <MButton v-if="isDirty" :disabled="isSaving" @click="saveOrder">
        <font-awesome-icon icon="fa-floppy-disk" class="m-r-4" />
        {{ isSaving ? '儲存中…' : '儲存排序' }}
      </MButton>

      <MButton
        class="mbtn--red"
        :disabled="!canDeleteSelected || isSaving"
        @click="deleteSelected"
      >
        <font-awesome-icon icon="fa-trash" class="m-r-4" />
        刪除選取
      </MButton>

      <MButton class="mbtn--gray" :disabled="isSaving" @click="refresh">
        <font-awesome-icon icon="fa-rotate-right" class="m-r-4" />
        重新載入
      </MButton>

      <MButton variant="secondary" @click="goBack">
        <font-awesome-icon icon="fa-arrow-left" class="m-r-4" />
        返回列表
      </MButton>
    </div>

    <div v-if="isDirty" class="menu-tree-page__notice">
      <font-awesome-icon icon="fa-triangle-exclamation" class="m-r-4" />
      有未儲存的排序變更，請點擊「儲存排序」確認，或「重新載入」放棄變更。
    </div>

    <div class="menu-tree-page__tip">
      <div class="menu-tree-page__tip-icon">⠿</div>

      <div>
        <p class="menu-tree-page__tip-title">拖曳排序說明</p>
        <p class="menu-tree-page__tip-text">
          拖曳左側排序把手可調整同層選單順序，左側數字為目前排序值。
          目前僅支援同層選單排序，不支援跨父層移動。
        </p>
      </div>
    </div>

    <div v-if="selectedIds.length" class="menu-tree-page__selected">
      已選取 {{ selectedIds.length }} 筆可刪除選單
      <button
        type="button"
        class="menu-tree-page__clear-selected"
        @click="clearSelected"
      >
        清除選取
      </button>
    </div>

    <template v-if="tree.length === 0">
      <NoData message="查無樹狀資料" />
    </template>

    <template v-else>
      <ul class="menuTree">
        <MenuTreeNode v-for="node in tree" :key="node.id" :node="node" />
      </ul>
    </template>
  </MCard>
</template>

<script setup lang="ts">
import { computed, onMounted, provide, ref } from 'vue';
import { useRouter } from 'vue-router';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import NoData from '@/components/common/NoData.vue';
import FormTitle from '@/components/common/FormTitle.vue';

import { executeApi } from '@/utils/executeApiUtils';
import {
  deleteMenu,
  getAllMenus,
  getMenuTree,
  updateMenu,
} from '@/services/adminMenuService';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';
import { openInfoDialog } from '@/utils/dialog/infoDialog';

import MenuTreeNode from '@/components/menu/MenuTreeNode.vue';

const router = useRouter();

const tree = ref<any[]>([]);
const menuMetaMap = ref<Record<string, any>>({});
const isDirty = ref(false);
const isSaving = ref(false);

const selectedIds = ref<string[]>([]);

const canDeleteSelected = computed(() => selectedIds.value.length > 0);

const goBack = () => {
  router.push('/home/menus');
};

/* -------------------------------------------------------
 * Checkbox 勾選刪除共用狀態
 * ------------------------------------------------------- */
const isNodeSelected = (nodeId: string) => {
  return selectedIds.value.includes(String(nodeId));
};

const toggleNodeSelected = (node: any) => {
  const menuId = String(node?.id ?? '').trim();

  if (!menuId) return;

  if (node?.children?.length) {
    return;
  }

  if (selectedIds.value.includes(menuId)) {
    selectedIds.value = selectedIds.value.filter((id) => id !== menuId);
    return;
  }

  selectedIds.value = [...selectedIds.value, menuId];
};

const clearSelected = () => {
  selectedIds.value = [];
};

const findNodeById = (nodeId: string, nodes: any[]): any | null => {
  for (const node of nodes) {
    if (String(node?.id) === String(nodeId)) return node;

    if (node?.children?.length) {
      const found = findNodeById(nodeId, node.children);

      if (found) return found;
    }
  }

  return null;
};

/* -------------------------------------------------------
 * Drag 共用狀態（透過 provide 傳給所有子孫 MenuTreeNode）
 * ------------------------------------------------------- */
const draggingId = ref<string | null>(null);
const draggingParentId = ref<string | null>(null);

const onDragStart = (id: string, parentId: string | null) => {
  draggingId.value = id;
  draggingParentId.value = parentId ?? null;
};

const onDragEnd = () => {
  draggingId.value = null;
  draggingParentId.value = null;
};

/* -------------------------------------------------------
 * 尋找節點所在的 siblings 陣列
 * ------------------------------------------------------- */
function findSiblings(
  nodeId: string,
  nodes: any[],
  siblings: any[],
): any[] | null {
  for (const node of nodes) {
    if (node.id === nodeId) return siblings;

    if (node.children?.length) {
      const found = findSiblings(nodeId, node.children, node.children);

      if (found) return found;
    }
  }

  return null;
}

/* -------------------------------------------------------
 * 拖曳放置：僅允許同層（同 parentId）交換位置
 * ------------------------------------------------------- */
const onReorder = (fromId: string, toId: string) => {
  if (fromId === toId) return;

  const fromSiblings = findSiblings(fromId, tree.value, tree.value);
  const toSiblings = findSiblings(toId, tree.value, tree.value);

  if (!fromSiblings || !toSiblings || fromSiblings !== toSiblings) return;

  const siblings = fromSiblings;
  const fromIdx = siblings.findIndex((node: any) => node.id === fromId);
  const toIdx = siblings.findIndex((node: any) => node.id === toId);

  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;

  const [moved] = siblings.splice(fromIdx, 1);
  siblings.splice(toIdx, 0, moved);

  siblings.forEach((node: any, index: number) => {
    node.orderNum = index + 1;
  });

  isDirty.value = true;
};

/* -------------------------------------------------------
 * 單筆刪除
 * ------------------------------------------------------- */
const deleteNode = async (node: any) => {
  const menuId = String(node?.id ?? '').trim();

  if (!menuId) {
    await openInfoDialog({
      title: '提示訊息',
      message: '查無選單 ID，無法刪除。',
      iconType: 'warning',
    });
    return;
  }

  if (node?.children?.length) {
    await openInfoDialog({
      title: '提示訊息',
      message: '此選單仍有子選單，請先刪除子選單後再刪除此選單。',
      iconType: 'warning',
    });
    return;
  }

  if (isDirty.value) {
    const continueDelete = await openConfirmDialog({
      title: '刪除確認',
      message:
        '目前有未儲存的排序變更，刪除後會重新載入資料並放棄未儲存排序。確定要繼續嗎？',
    });

    if (!continueDelete) return;
  }

  const ok = await openConfirmDialog({
    title: '刪除確認',
    message: `確定要刪除「${node?.name || '-'}」嗎？（刪除後無法復原）`,
  });

  if (!ok) return;

  await executeApi({
    fn: async () => deleteMenu(menuId),
    onSuccess: async () => {
      await openInfoDialog({
        title: '提示訊息',
        message: '刪除成功',
        iconType: 'success',
      });

      clearSelected();
      await refresh();
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

/* -------------------------------------------------------
 * 勾選批次刪除
 * ------------------------------------------------------- */
const deleteSelected = async () => {
  if (!selectedIds.value.length) return;

  const selectedNodes = selectedIds.value
    .map((id) => findNodeById(id, tree.value))
    .filter(Boolean);

  const hasChildren = selectedNodes.some((node: any) => node?.children?.length);

  if (hasChildren) {
    await openInfoDialog({
      title: '提示訊息',
      message: '選取資料中包含仍有子選單的項目，請先刪除子選單後再刪除父選單。',
      iconType: 'warning',
    });
    return;
  }

  if (isDirty.value) {
    const continueDelete = await openConfirmDialog({
      title: '刪除確認',
      message:
        '目前有未儲存的排序變更，刪除後會重新載入資料並放棄未儲存排序。確定要繼續嗎？',
    });

    if (!continueDelete) return;
  }

  const ok = await openConfirmDialog({
    title: '刪除確認',
    message: `確定要刪除選取的 ${selectedIds.value.length} 筆選單嗎？（刪除後無法復原）`,
  });

  if (!ok) return;

  const ids = [...selectedIds.value];

  await executeApi({
    fn: async () => Promise.allSettled(ids.map((id) => deleteMenu(id))),
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

      clearSelected();
      await refresh();
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

provide('menuTreeReorder', {
  draggingId,
  draggingParentId,
  selectedIds,
  onDragStart,
  onDragEnd,
  onReorder,
  deleteNode,
  isNodeSelected,
  toggleNodeSelected,
});

/* -------------------------------------------------------
 * 以完整平面資料為底，組出更新 payload
 * ------------------------------------------------------- */
const cleanOptionalText = (value: any) => {
  if (value === null || value === undefined || value === '') return null;

  const text = String(value).trim();

  return text || null;
};

const toBoolean = (value: any) => {
  if (value === true || value === false) return value;

  const text = String(value ?? '')
    .trim()
    .toLowerCase();

  if (text === 'true' || text === '1') return true;
  if (text === 'false' || text === '0') return false;

  return true;
};

const toMenuUpdatePayload = (node: any, parentId: string | null) => {
  const original = menuMetaMap.value[String(node?.id)] ?? {};

  return {
    id: original?.id ?? node?.id,
    name: String(original?.name ?? node?.name ?? '').trim(),
    code: String(original?.code ?? node?.code ?? '').trim(),
    path: cleanOptionalText(original?.path ?? node?.path),
    parentId,
    icon: cleanOptionalText(original?.icon ?? node?.icon),
    orderNum:
      node?.orderNum === '' ||
      node?.orderNum === null ||
      node?.orderNum === undefined
        ? null
        : Number(node.orderNum),
    isVisible: toBoolean(original?.isVisible ?? node?.isVisible),
  };
};

function flattenTree(nodes: any[], parentId: string | null = null): any[] {
  return nodes.flatMap((node) => {
    const currentId = String(node?.id ?? '');

    return [
      toMenuUpdatePayload(node, parentId),
      ...flattenTree(node.children ?? [], currentId || null),
    ];
  });
}

/* -------------------------------------------------------
 * 儲存排序
 * ------------------------------------------------------- */
const saveOrder = async () => {
  if (isSaving.value) return;

  const ok = await openConfirmDialog({
    title: '儲存確認',
    message: '確定要儲存目前選單排序嗎？',
  });

  if (!ok) return;

  isSaving.value = true;

  const allNodes = flattenTree(tree.value);

  await executeApi({
    fn: async () =>
      Promise.allSettled(allNodes.map((node) => updateMenu(node))),
    onSuccess: async (results: PromiseSettledResult<any>[]) => {
      const failCount = results.filter((result) => {
        return result.status === 'rejected';
      }).length;

      if (failCount > 0) {
        await openInfoDialog({
          title: '提示訊息',
          message: `有 ${failCount} 筆更新失敗，請重新整理後確認結果。`,
          iconType: 'warning',
        });

        return;
      }

      isDirty.value = false;

      await openInfoDialog({
        title: '提示訊息',
        message: '排序已儲存',
        iconType: 'success',
      });
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
    onFinally: () => {
      isSaving.value = false;
    },
  });
};

/* -------------------------------------------------------
 * 重新載入
 * ------------------------------------------------------- */
const refresh = async () => {
  if (isSaving.value) return;

  if (isDirty.value) {
    const ok = await openConfirmDialog({
      title: '重新載入確認',
      message: '目前有未儲存的排序變更，重新載入會放棄這些變更，確定要繼續嗎？',
    });

    if (!ok) return;
  }

  await executeApi({
    fn: async () => {
      const [treeRes, flatRes] = await Promise.all([
        getMenuTree(),
        getAllMenus(),
      ]);

      return { treeRes, flatRes };
    },
    onSuccess: async ({ treeRes, flatRes }: any) => {
      const treeData = treeRes?.data ?? treeRes ?? [];
      const flatData = flatRes?.data ?? flatRes ?? [];

      tree.value = Array.isArray(treeData) ? treeData : [];

      menuMetaMap.value = Array.isArray(flatData)
        ? flatData.reduce((acc: Record<string, any>, item: any) => {
            acc[String(item?.id ?? '')] = item;
            return acc;
          }, {})
        : {};

      isDirty.value = false;
      clearSelected();
    },
    showSuccessDialog: false,
    showFailDialog: true,
    showCatchDialog: true,
  });
};

onMounted(async () => {
  await refresh();
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/base/tokens' as tokens;

.menu-tree-page {
  &__toolbar {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  &__notice {
    display: flex;
    align-items: flex-start;
    gap: 4px;
    margin-bottom: 12px;
    padding: 10px 14px;
    border: 1px solid #f59e0b;
    border-radius: 10px;
    background: #fffbeb;
    color: #92400e;
    font-size: 13px;
    line-height: 1.5;
  }

  &__tip {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 12px;
    padding: 12px 14px;
    border: 1px solid color.mix(tokens.$form-border, #fff, 72%);
    border-radius: 14px;
    background: color.mix(tokens.$brand-light, #fff, 7%);
  }

  &__tip-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 28px;
    height: 28px;
    border-radius: 999px;
    background: color.mix(tokens.$brand-light, #fff, 22%);
    color: tokens.$brand-dark;
    font-size: 16px;
    font-weight: 800;
    line-height: 1;
  }

  &__tip-title {
    margin: 0;
    color: tokens.$form-text;
    font-size: 13px;
    font-weight: 800;
    line-height: 1.4;
  }

  &__tip-text {
    margin: 3px 0 0;
    color: tokens.$form-muted;
    font-size: 12px;
    line-height: 1.5;
  }

  &__selected {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    padding: 9px 12px;
    border: 1px solid color.mix(tokens.$brand-light, #fff, 45%);
    border-radius: 12px;
    background: color.mix(tokens.$brand-light, #fff, 18%);
    color: tokens.$brand-dark;
    font-size: 13px;
    font-weight: 700;
  }

  &__clear-selected {
    border: none;
    background: transparent;
    color: tokens.$brand;
    cursor: pointer;
    font-size: 13px;
    font-weight: 800;
    text-decoration: underline;

    &:hover {
      opacity: 0.75;
    }
  }
}

.menuTree {
  padding-left: 0;
  list-style: none;
}

@media (max-width: 640px) {
  .menu-tree-page {
    &__toolbar {
      justify-content: flex-start;
    }

    &__tip {
      flex-direction: column;
    }

    &__selected {
      align-items: flex-start;
      flex-direction: column;
    }
  }
}
</style>

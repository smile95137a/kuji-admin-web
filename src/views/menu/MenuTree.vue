<!-- src/views/menu/MenuTree.vue -->
<template>
  <MCard>
    <FormTitle title="選單樹狀結構" />

    <div class="flex justify-end gap-x-12 m-b-12">
      <MButton @click="refresh">重新載入</MButton>
      <MButton variant="secondary" @click="goBack">返回列表</MButton>
    </div>

    <template v-if="tree.length === 0">
      <NoData message="查無樹狀資料" />
    </template>

    <template v-else>
      <ul class="menuTree">
        <MenuTreeNode
          v-for="node in tree"
          :key="node.id"
          :node="node"
          @edit="onEdit"
        />
      </ul>
    </template>
  </MCard>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import NoData from '@/components/common/NoData.vue';
import FormTitle from '@/components/common/FormTitle.vue';

import { executeApi } from '@/utils/executeApiUtils';
import { getMenuTree } from '@/services/adminMenuService';

import MenuTreeNode from '@/components/menu/MenuTreeNode.vue';

const router = useRouter();
const tree = ref<any[]>([]);

const goBack = () => router.push('/home/menus');
const onEdit = (id: string) => router.push(`/home/menus/edit/${id}`);

const refresh = async () => {
  await executeApi({
    fn: async () => getMenuTree(),
    onSuccess: async (res: any) => {
      const data = res?.data ?? res ?? [];
      tree.value = Array.isArray(data) ? data : [];
    },
    showSuccessDialog: false,
  });
};

onMounted(async () => {
  await refresh();
});
</script>

<style scoped lang="scss">
.menuTree {
  padding-left: 18px;
}
</style>

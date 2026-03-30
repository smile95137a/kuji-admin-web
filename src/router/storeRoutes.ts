// src/router/storeRoutes.ts
import type { RouteRecordRaw } from 'vue-router';

import StoreList from '@/views/store/StoreList.vue';
import StoreDetail from '@/views/store/StoreDetail.vue';
import StoreEdit from '@/views/store/StoreEdit.vue';

const storeRoutes: RouteRecordRaw[] = [
  {
    path: 'stores',
    name: 'StoreList',
    component: StoreList,
  },
  {
    path: 'stores/:id',
    name: 'StoreDetail',
    component: StoreDetail,
  },
  {
    path: 'stores/:id/edit',
    name: 'StoreEdit',
    component: StoreEdit,
  },
  {
    // StoreOwner 編輯自家店家資訊
    path: 'store/profile',
    name: 'StoreProfile',
    component: StoreEdit,
  },
];

export default storeRoutes;

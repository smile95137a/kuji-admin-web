// src/router/orderRoutes.ts
import type { RouteRecordRaw } from 'vue-router';

import AdminOrderList from '@/views/order/AdminOrderList.vue';

const orderRoutes: RouteRecordRaw[] = [
  {
    path: 'order',
    name: 'AdminOrderList',
    component: AdminOrderList,
  },
];

export default orderRoutes;

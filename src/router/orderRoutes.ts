// src/router/orderRoutes.ts
import type { RouteRecordRaw } from 'vue-router';

import AdminOrderList from '@/views/order/AdminOrderList.vue';
import AdminOrderDetail from '@/views/order/AdminOrderDetail.vue';

const orderRoutes: RouteRecordRaw[] = [
  {
    path: 'order',
    name: 'AdminOrderList',
    component: AdminOrderList,
  },
  {
    path: 'order/:orderId',
    name: 'AdminOrderDetail',
    component: AdminOrderDetail,
  },
];

export default orderRoutes;

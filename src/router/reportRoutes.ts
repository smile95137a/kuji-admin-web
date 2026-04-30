import type { RouteRecordRaw } from 'vue-router';

export const reportRoutes: RouteRecordRaw[] = [
  {
    path: 'report/prize-shipment',
    name: 'PrizeShipmentReport',
    component: () => import('@/views/report/PrizeShipmentReport.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'report/member-growth',
    name: 'MemberGrowthReport',
    component: () => import('@/views/report/MemberGrowthReport.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'report/lottery-sales',
    name: 'LotterySalesReport',
    component: () => import('@/views/report/LotterySalesReport.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'report/store-performance',
    name: 'StorePerformanceReport',
    component: () => import('@/views/report/StorePerformanceReport.vue'),
    meta: { requiresAuth: true },
  },
];

export default reportRoutes;

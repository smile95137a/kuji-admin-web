// src/router/lotteryRoutes.ts
import type { RouteRecordRaw } from 'vue-router';

const lotteryRoutes: RouteRecordRaw[] = [
  {
    path: 'lottery',
    name: 'LotteryList',
    component: () => import('@/views/lottery/LotteryList.vue'),
  },
  {
    path: 'lottery/add',
    name: 'LotteryAdd',
    component: () => import('@/views/lottery/LotteryForm.vue'),
  },
  {
    path: 'lottery/edit/:id',
    name: 'LotteryEdit',
    component: () => import('@/views/lottery/LotteryForm.vue'),
  },
];

export default lotteryRoutes;

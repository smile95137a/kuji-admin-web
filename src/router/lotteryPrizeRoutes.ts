// src/router/lotteryPrizeRoutes.ts
import type { RouteRecordRaw } from 'vue-router';

const lotteryPrizeRoutes: RouteRecordRaw[] = [
  {
    path: 'lottery/:lotteryId/prizes',
    name: 'LotteryPrizeList',
    component: () => import('@/views/lotteryPrize/LotteryPrizeList.vue'),
  },
  {
    path: 'lottery/:lotteryId/prizes/add',
    name: 'LotteryPrizeAdd',
    component: () => import('@/views/lotteryPrize/LotteryPrizeForm.vue'),
  },
  {
    path: 'lottery/:lotteryId/prizes/edit/:prizeId',
    name: 'LotteryPrizeEdit',
    component: () => import('@/views/lotteryPrize/LotteryPrizeForm.vue'),
  },
];

export default lotteryPrizeRoutes;

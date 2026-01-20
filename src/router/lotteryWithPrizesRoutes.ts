// src/router/lotteryWithPrizesRoutes.ts
import type { RouteRecordRaw } from 'vue-router';

const lotteryWithPrizesRoutes: RouteRecordRaw[] = [
  {
    path: 'lottery-with-prizes',
    name: 'AdminLotteryWithPrizesList',
    component: () =>
      import('@/views/lottery-with-prizes/AdminLotteryWithPrizesList.vue'),
  },
  {
    path: 'lottery-with-prizes/add',
    name: 'AdminLotteryWithPrizesAdd',
    component: () =>
      import('@/views/lottery-with-prizes/AdminLotteryWithPrizesForm.vue'),
  },
  {
    path: 'lottery-with-prizes/edit/:id',
    name: 'AdminLotteryWithPrizesEdit',
    component: () =>
      import('@/views/lottery-with-prizes/AdminLotteryWithPrizesForm.vue'),
  },
];

export default lotteryWithPrizesRoutes;

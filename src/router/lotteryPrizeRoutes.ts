// src/router/lotteryPrizeRoutes.ts
import type { RouteRecordRaw } from 'vue-router';

const lotteryPrizeRoutes: RouteRecordRaw[] = [
  {
    path: 'lottery/:lotteryId/prizes',
    name: 'LotteryPrizeList',
    redirect: (to) => `/home/lottery-with-prizes/edit/${String(to.params.lotteryId || '')}`,
  },
  {
    path: 'lottery/:lotteryId/prizes/add',
    name: 'LotteryPrizeAdd',
    redirect: (to) => `/home/lottery-with-prizes/edit/${String(to.params.lotteryId || '')}`,
  },
  {
    path: 'lottery/:lotteryId/prizes/edit/:prizeId',
    name: 'LotteryPrizeEdit',
    redirect: (to) => `/home/lottery-with-prizes/edit/${String(to.params.lotteryId || '')}`,
  },
];

export default lotteryPrizeRoutes;

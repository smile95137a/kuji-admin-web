import type { RouteRecordRaw } from 'vue-router';

export const reportRoutes: RouteRecordRaw[] = [
  {
    path: 'report/revenue',
    name: 'RevenueReport',
    component: () => import('@/views/report/RevenueReport.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'report/lottery-result',
    name: 'LotteryResultReport',
    component: () => import('@/views/report/LotteryResultReport.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'report/referral',
    name: 'ReferralReport',
    component: () => import('@/views/report/ReferralReport.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'report/recharge',
    name: 'RechargeReport',
    component: () => import('@/views/report/RechargeReport.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'report/bonus',
    name: 'BonusReport',
    component: () => import('@/views/report/BonusReport.vue'),
    meta: { requiresAuth: true },
  },
];

export default reportRoutes;

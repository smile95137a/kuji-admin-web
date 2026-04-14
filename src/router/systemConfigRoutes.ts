import type { RouteRecordRaw } from 'vue-router';

export const systemConfigRoutes: RouteRecordRaw[] = [
  {
    path: 'system-config',
    name: 'SystemConfig',
    component: () => import('@/views/systemConfig/SystemConfigList.vue'),
    meta: { requiresAuth: true },
  },
];

export default systemConfigRoutes;

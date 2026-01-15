// src/router/systemLogRoutes.ts
import type { RouteRecordRaw } from 'vue-router';

const systemLogRoutes: RouteRecordRaw[] = [
  {
    path: 'system-log',
    name: 'SystemLogList',
    component: () => import('@/views/systemLog/SystemLogList.vue'),
  },
];

export default systemLogRoutes;

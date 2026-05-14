// src/router/categoryRoutes.ts
import type { RouteRecordRaw } from 'vue-router';

const categoryRoutes: RouteRecordRaw[] = [
  {
    path: 'categories',
    name: 'CategoryManagement',
    component: () => import('@/views/category/CategoryManagement.vue'),
    meta: { requiresAuth: true, title: '類別管理', layout: 'default' },
  },
];

export default categoryRoutes;

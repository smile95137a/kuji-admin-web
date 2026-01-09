// src/router/adminUserRoutes.ts
import type { RouteRecordRaw } from 'vue-router';

const adminUserRoutes: RouteRecordRaw[] = [
  {
    path: '/home/admin-users',
    name: 'AdminUserList',
    component: () => import('@/views/adminUser/AdminUserList.vue'),
    meta: { requiresAuth: true, layout: 'default' },
  },
  {
    path: '/home/admin-users/add-owner',
    name: 'AdminUserAddOwner',
    component: () => import('@/views/adminUser/AdminUserForm.vue'),
    meta: { requiresAuth: true, layout: 'default' },
  },
  {
    path: '/home/admin-users/add-editor',
    name: 'AdminUserAddEditor',
    component: () => import('@/views/adminUser/AdminUserForm.vue'),
    meta: { requiresAuth: true, layout: 'default' },
  },
  {
    path: '/home/admin-users/:id',
    name: 'AdminUserDetail',
    component: () => import('@/views/adminUser/AdminUserForm.vue'),
    meta: { requiresAuth: true, layout: 'default' },
  },
];

export default adminUserRoutes;

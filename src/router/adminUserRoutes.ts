// src/router/adminUserRoutes.ts
import type { RouteRecordRaw } from 'vue-router';

const adminUserRoutes: RouteRecordRaw[] = [
  {
    path: 'admin-users',
    name: 'AdminUserList',
    component: () => import('@/views/adminUser/AdminUserList.vue'),
    meta: { title: '後台帳號管理' },
  },
  {
    path: 'admin-users/add-owner',
    name: 'AdminUserAddOwner',
    component: () => import('@/views/adminUser/AdminUserForm.vue'),
    meta: { title: '新增店家負責人帳號' },
  },
  {
    path: 'admin-users/add-editor',
    name: 'AdminUserAddEditor',
    component: () => import('@/views/adminUser/AdminUserForm.vue'),
    meta: { title: '新增店家編輯帳號' },
  },
  {
    path: 'admin-users/edit/:id',
    name: 'AdminUserEdit',
    component: () => import('@/views/adminUser/AdminUserForm.vue'),
    meta: { title: '帳號詳情' },
  },
];

export default adminUserRoutes;

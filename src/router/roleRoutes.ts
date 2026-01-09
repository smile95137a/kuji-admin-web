// src/router/roleRoutes.ts
import type { RouteRecordRaw } from 'vue-router';

import RoleList from '@/views/role/RoleList.vue';
import RoleForm from '@/views/role/RoleForm.vue';
import RolePermissions from '@/views/role/RolePermissions.vue';

const roleRoutes: RouteRecordRaw[] = [
  {
    path: 'roles',
    name: 'RoleList',
    component: RoleList,
    meta: { requiresAuth: true, title: '角色管理', layout: 'default' },
  },
  {
    path: 'roles/add',
    name: 'RoleAdd',
    component: RoleForm,
    meta: { requiresAuth: true, title: '新增角色', layout: 'default' },
  },
  {
    path: 'roles/edit/:id',
    name: 'RoleEdit',
    component: RoleForm,
    meta: { requiresAuth: true, title: '編輯角色', layout: 'default' },
  },
  {
    path: 'roles/permissions/:id',
    name: 'RolePermissions',
    component: RolePermissions,
    meta: { requiresAuth: true, title: '角色權限設定', layout: 'default' },
  },
];

export default roleRoutes;

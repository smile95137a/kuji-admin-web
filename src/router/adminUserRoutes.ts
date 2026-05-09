// src/router/adminUserRoutes.ts
import type { RouteRecordRaw } from 'vue-router';

const adminUserRoutes: RouteRecordRaw[] = [
  {
    path: 'admin-users',
    name: 'AdminUserList',
    component: () => import('@/views/adminUser/AdminUserList.vue'),
    meta: { requiresAuth: true, layout: 'default' },
  },

  /**
   * 共用同一頁 AdminUserForm.vue
   *
   * action:
   * - add-owner  新增店家負責人
   * - add-editor 新增店家編輯
   * - detail     帳號詳情
   *
   * id:
   * - detail 模式才需要
   */
  {
    path: 'admin-users/form/:action/:id?',
    name: 'AdminUserForm',
    component: () => import('@/views/adminUser/AdminUserForm.vue'),
    meta: { requiresAuth: true, layout: 'default' },
    props: true,
  },
];

export default adminUserRoutes;

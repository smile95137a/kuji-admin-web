// src/router/frontendUserRoutes.ts
import type { RouteRecordRaw } from 'vue-router';

import FrontendUserList from '@/views/member/FrontendUserList.vue';
import FrontendUserEdit from '@/views/member/FrontendUserEdit.vue';

const frontendUserRoutes: RouteRecordRaw[] = [
  {
    path: 'member/list',
    name: 'FrontendUserList',
    component: FrontendUserList,
    meta: { requiresAuth: true, title: '會員列表', layout: 'default' },
  },
  {
    path: 'member/edit/:id',
    name: 'FrontendUserEdit',
    component: FrontendUserEdit,
    meta: { requiresAuth: true, title: '編輯會員', layout: 'default' },
  },
];

export default frontendUserRoutes;

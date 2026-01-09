// src/router/prizeBoxRoutes.ts
import type { RouteRecordRaw } from 'vue-router';

import AdminPrizeBox from '@/views/prizeBox/AdminPrizeBox.vue';

const prizeBoxRoutes: RouteRecordRaw[] = [
  {
    path: 'prize-box',
    name: 'AdminPrizeBox',
    component: AdminPrizeBox,
    meta: { requiresAuth: true, title: '賞品盒管理', layout: 'default' },
  },
];

export default prizeBoxRoutes;

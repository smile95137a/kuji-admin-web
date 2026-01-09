// src/router/walletRoutes.ts
import type { RouteRecordRaw } from 'vue-router';

import AdminWallet from '@/views/wallet/AdminWallet.vue';

const walletRoutes: RouteRecordRaw[] = [
  {
    path: 'wallet',
    name: 'AdminWallet',
    component: AdminWallet,
    meta: { requiresAuth: true, title: '錢包管理', layout: 'default' },
  },
];

export default walletRoutes;

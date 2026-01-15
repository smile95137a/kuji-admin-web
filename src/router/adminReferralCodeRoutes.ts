// src/router/referralCodeRoutes.ts
import type { RouteRecordRaw } from 'vue-router';

import AdminReferralCodeList from '@/views/referral/AdminReferralCodeList.vue';
import AdminReferralCodeEdit from '@/views/referral/AdminReferralCodeEdit.vue';

const referralCodeRoutes: RouteRecordRaw[] = [
  {
    path: 'referral-codes',
    name: 'AdminReferralCodeList',
    component: AdminReferralCodeList,
    meta: { requiresAuth: true, title: '推薦碼管理', layout: 'default' },
  },
  {
    path: 'referral-codes/add',
    name: 'AdminReferralCodeAdd',
    component: AdminReferralCodeEdit,
    meta: { requiresAuth: true, title: '新增推薦碼', layout: 'default' },
  },
  {
    path: 'referral-codes/edit/:id',
    name: 'AdminReferralCodeEdit',
    component: AdminReferralCodeEdit,
    meta: { requiresAuth: true, title: '編輯推薦碼', layout: 'default' },
  },
];

export default referralCodeRoutes;

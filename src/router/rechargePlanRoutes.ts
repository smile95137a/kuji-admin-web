// src/router/rechargePlanRoutes.ts
import type { RouteRecordRaw } from 'vue-router';

import RechargePlanList from '@/views/rechargePlan/RechargePlanList.vue';
import RechargePlanForm from '@/views/rechargePlan/RechargePlanForm.vue';

const rechargePlanRoutes: RouteRecordRaw[] = [
  {
    path: 'recharge-plan',
    name: 'RechargePlanList',
    component: RechargePlanList,
    meta: { requiresAuth: true, title: '儲值方案列表', layout: 'default' },
  },
  {
    path: 'recharge-plan/add',
    name: 'RechargePlanAdd',
    component: RechargePlanForm,
    meta: { requiresAuth: true, title: '新增儲值方案', layout: 'default' },
  },
  {
    path: 'recharge-plan/edit/:id',
    name: 'RechargePlanEdit',
    component: RechargePlanForm,
    meta: { requiresAuth: true, title: '編輯儲值方案', layout: 'default' },
  },
];

export default rechargePlanRoutes;

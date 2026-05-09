// src/router/cooperationInquiryRoutes.ts
import type { RouteRecordRaw } from 'vue-router';

const cooperationInquiryRoutes: RouteRecordRaw[] = [
  {
    path: 'cooperation-inquiries',
    name: 'CooperationInquiryList',
    component: () =>
      import('@/views/cooperationInquiry/CooperationInquiryList.vue'),
    meta: { requiresAuth: true, layout: 'default' },
  },
  {
    path: 'cooperation-inquiries/:id',
    name: 'CooperationInquiryDetail',
    component: () =>
      import('@/views/cooperationInquiry/CooperationInquiryForm.vue'),
    props: true,
    meta: { requiresAuth: true, layout: 'default' },
  },
];

export default cooperationInquiryRoutes;

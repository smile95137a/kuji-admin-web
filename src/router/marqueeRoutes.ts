import type { RouteRecordRaw } from 'vue-router';

const marqueeRoutes: RouteRecordRaw[] = [
  {
    path: 'marquee',
    name: 'MarqueeList',
    component: () => import('@/views/marquee/MarqueeList.vue'),
  },
  {
    path: 'marquee/add',
    name: 'MarqueeAdd',
    component: () => import('@/views/marquee/MarqueeForm.vue'),
  },
  {
    path: 'marquee/edit/:id',
    name: 'MarqueeEdit',
    component: () => import('@/views/marquee/MarqueeForm.vue'),
  },
];

export default marqueeRoutes;

import { RouteRecordRaw } from 'vue-router';

const bannerRoutes: Array<RouteRecordRaw> = [
  {
    path: 'banner',
    name: 'BannerList',
    component: () => import('@/views/banner/BannerList.vue'),
  },
  {
    path: 'banner/add',
    name: 'BannerAdd',
    component: () => import('@/views/banner/BannerForm.vue'),
  },
  {
    path: 'banner/edit/:id',
    name: 'BannerEdit',
    component: () => import('@/views/banner/BannerForm.vue'),
    props: true,
  },
];

export default bannerRoutes;

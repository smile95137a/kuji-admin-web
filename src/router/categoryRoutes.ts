import { RouteRecordRaw } from 'vue-router';

const categoryRoutes: Array<RouteRecordRaw> = [
  {
    path: 'category',
    name: 'CategoryList',
    component: () => import('@/views/category/CategoryList.vue'),
  },
  {
    path: 'category/add',
    name: 'CategoryAdd',
    component: () => import('@/views/category/CategoryForm.vue'),
  },
  {
    path: 'category/edit/:id',
    name: 'CategoryEdit',
    component: () => import('@/views/category/CategoryForm.vue'),
    props: true,
  },
];

export default categoryRoutes;

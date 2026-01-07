import { RouteRecordRaw } from 'vue-router';

const newsRoutes: Array<RouteRecordRaw> = [
  {
    path: 'news',
    name: 'NewsList',
    component: () => import('@/views/news/NewsList.vue'),
  },
  {
    path: 'news/add',
    name: 'NewsAdd',
    component: () => import('@/views/news/NewsForm.vue'),
  },
  {
    path: 'news/edit/:id',
    name: 'NewsEdit',
    component: () => import('@/views/news/NewsForm.vue'),
    props: true,
  },
];

export default newsRoutes;

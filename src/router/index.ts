import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

import Login from '@/views/Login.vue';
import Home from '@/views/Home.vue';
import NotFound from '@/views/NotFound.vue';

import bannerRoutes from './bannerRoutes';
import newsRoutes from './newsRoutes';
import adminUserRoutes from './adminUserRoutes';
import lotteryRoutes from './lotteryRoutes';

import { useAuthStore } from '@/stores';
import orderRoutes from './orderRoutes';
import rechargePlanRoutes from './rechargePlanRoutes';
import walletRoutes from './walletRoutes';
import frontendUserRoutes from './frontendUserRoutes';
import prizeBoxRoutes from './prizeBoxRoutes';
import menuRoutes from './menuRoutes';
import roleRoutes from './roleRoutes';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    component: Login,
    meta: { layout: 'default' },
  },

  {
    path: '/home',
    component: Home,
    meta: { layout: 'default' },
    children: [
      ...bannerRoutes,
      ...newsRoutes,
      ...adminUserRoutes,
      ...lotteryRoutes,
      ...orderRoutes,
      ...rechargePlanRoutes,
      ...walletRoutes,
      ...frontendUserRoutes,
      ...prizeBoxRoutes,
      ...menuRoutes,
      ...roleRoutes,
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: { layout: 'default' },
  },
];

const router = createRouter({
  history: createWebHistory('/kuji/'),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    return { top: 0 };
  },
});

router.beforeEach((to) => {
  const authStore = useAuthStore();

  const requiresAuth = Boolean(to.meta?.requiresAuth);

  if (requiresAuth && !authStore.isLogin) {
    return '/login';
  }

  if (to.path === '/login' && authStore.isLogin) {
    return '/home';
  }

  return true;
});

export default router;

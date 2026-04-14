import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

import Login from '@/views/Login.vue';
import Home from '@/views/Home.vue';
import NotFound from '@/views/NotFound.vue';
import ChangePassword from '@/views/ChangePassword.vue';

import bannerRoutes from './bannerRoutes';
import newsRoutes from './newsRoutes';
import adminUserRoutes from './adminUserRoutes';
import storeRoutes from './storeRoutes';

import { useAuthStore } from '@/stores';
import orderRoutes from './orderRoutes';
import rechargePlanRoutes from './rechargePlanRoutes';
import walletRoutes from './walletRoutes';
import frontendUserRoutes from './frontendUserRoutes';
import prizeBoxRoutes from './prizeBoxRoutes';
import menuRoutes from './menuRoutes';
import roleRoutes from './roleRoutes';
import referralCodeRoutes from './adminReferralCodeRoutes';
import lotteryPrizeRoutes from './lotteryPrizeRoutes';
import marqueeRoutes from './marqueeRoutes';
import systemLogRoutes from './systemLogRoutes';
import lotteryWithPrizesRoutes from './lotteryWithPrizesRoutes';

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
    path: '/change-password',
    component: ChangePassword,
    meta: { layout: 'default' },
  },

  {
    path: '/home',
    component: Home,
    meta: { layout: 'default', requiresAuth: true },
    children: [
      ...bannerRoutes,
      ...newsRoutes,
      ...adminUserRoutes,
      ...storeRoutes,
      ...lotteryPrizeRoutes,
      ...orderRoutes,
      ...rechargePlanRoutes,
      ...walletRoutes,
      ...frontendUserRoutes,
      ...prizeBoxRoutes,
      ...menuRoutes,
      ...roleRoutes,
      ...referralCodeRoutes,
      ...marqueeRoutes,
      ...systemLogRoutes,
      ...lotteryWithPrizesRoutes,
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

  // 首次登入強制修改密碼
  if (authStore.forceChangePassword && to.path !== '/change-password') {
    return '/change-password';
  }

  if (to.path === '/login' && authStore.isLogin) {
    return '/home';
  }

  return true;
});

export default router;

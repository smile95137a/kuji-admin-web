import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

import Login from '@/views/Login.vue';
import Home from '@/views/Home.vue';
import NotFound from '@/views/NotFound.vue';
import ChangePassword from '@/views/ChangePassword.vue';
import ForgotPassword from '@/views/ForgotPassword.vue';

import bannerRoutes from './bannerRoutes';
import newsRoutes from './newsRoutes';
import adminUserRoutes from './adminUserRoutes';
import storeRoutes from './storeRoutes';

import { useAuthStore } from '@/stores';
import orderRoutes from './orderRoutes';
import rechargePlanRoutes from './rechargePlanRoutes';
import frontendUserRoutes from './frontendUserRoutes';
import menuRoutes from './menuRoutes';
import roleRoutes from './roleRoutes';
import referralCodeRoutes from './adminReferralCodeRoutes';
import lotteryPrizeRoutes from './lotteryPrizeRoutes';
import marqueeRoutes from './marqueeRoutes';
import systemLogRoutes from './systemLogRoutes';
import lotteryWithPrizesRoutes from './lotteryWithPrizesRoutes';
import systemConfigRoutes from './systemConfigRoutes';
import reportRoutes from './reportRoutes';
import emergencyAnnouncementRoutes from './emergencyAnnouncementRoutes';
import cooperationInquiryRoutes from './cooperationInquiryRoutes';
import categoryRoutes from './categoryRoutes';

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
    path: '/forgot-password',
    component: ForgotPassword,
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
      ...frontendUserRoutes,
      ...menuRoutes,
      ...roleRoutes,
      ...referralCodeRoutes,
      ...marqueeRoutes,
      ...systemLogRoutes,
      ...lotteryWithPrizesRoutes,
      ...categoryRoutes,
      ...systemConfigRoutes,
      ...reportRoutes,
      ...emergencyAnnouncementRoutes,
      ...cooperationInquiryRoutes,
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

router.onError((error, to) => {
  const message = String((error as Error)?.message || '');
  const isChunkLoadError =
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('Loading chunk');

  if (!isChunkLoadError) return;

  const reloadFlag = 'kuji:chunk-reload-once';
  const hasReloaded = sessionStorage.getItem(reloadFlag) === '1';

  if (!hasReloaded) {
    sessionStorage.setItem(reloadFlag, '1');
    const target =
      to?.fullPath || window.location.pathname + window.location.search;
    window.location.replace(target);
    return;
  }

  sessionStorage.removeItem(reloadFlag);
  console.error('Dynamic import failed after retry:', error);
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  // F5 後 Pinia 歸零，先靜默嘗試用 refreshToken 恢復 accessToken
  await authStore.initializeAuth();

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

<!-- src/layouts/SidebarLayout.vue -->
<template>
  <div
    class="sidebar-layout"
    :class="{
      'sidebar-layout--open': !isMobile && sidebarVisible,
      'sidebar-open': !isMobile && sidebarVisible,
    }"
  >
    <div
      v-if="isMobile && sidebarVisible"
      class="sidebar-layout__overlay"
      @click="closeSidebar"
      aria-hidden="true"
    />

    <nav
      :class="[
        'sidebar-layout__sidebar',
        { 'sidebar-layout__sidebar--visible': sidebarVisible },
      ]"
      aria-label="主選單"
    >
      <ul class="sidebar-layout__menu">
        <li
          v-for="(item, index) in menuItems"
          :key="index"
          :class="[
            'sidebar-layout__item',
            {
              'sidebar-layout__item--active':
                activeIndex === index ||
                item.submenu?.some((s: any) => route.path.startsWith(s.route)),
            },
          ]"
        >
          <button
            type="button"
            class="sidebar-layout__link"
            @click="toggleSubmenu(index)"
          >
            <span>{{ item.title }}</span>

            <span
              v-if="item.submenu?.length"
              class="sidebar-layout__link-arrow"
              :class="{
                'sidebar-layout__link-arrow--open': activeIndex === index,
              }"
            >
              ▾
            </span>
          </button>

          <ul
            v-if="item.submenu?.length && activeIndex === index"
            class="sidebar-layout__submenu"
          >
            <li v-for="(subItem, subIndex) in item.submenu" :key="subIndex">
              <router-link
                :to="subItem.route"
                class="sidebar-layout__sublink"
                :class="{ active: route.path.startsWith(subItem.route) }"
                @click="setActiveSubmenu(index, subIndex)"
              >
                {{ subItem.title }}
              </router-link>
            </li>
          </ul>
        </li>
      </ul>
    </nav>

    <header class="sidebar-layout__header">
      <div class="sidebar-layout__left">
        <button
          type="button"
          class="sidebar-layout__toggle"
          @click="toggleSidebar"
          :aria-label="sidebarVisible ? '收合選單' : '開啟選單'"
        >
          <font-awesome-icon icon="fa-bars" />
        </button>

        <div class="sidebar-layout__logo">
          <img :src="logoImg" class="sidebar-layout__logo-img" alt="logo" />
        </div>
      </div>

      <div class="sidebar-layout__user-info">
        <span class="sidebar-layout__username">
          {{ userName }} 歡迎進入一番賞
        </span>

        <div class="sidebar-layout__actions">
          <select class="sidebar-layout__language-select">
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>

          <button
            type="button"
            class="sidebar-layout__logout"
            @click="handleLogout"
          >
            登出
          </button>
        </div>
      </div>
    </header>

    <div class="sidebar-layout__content">
      <main class="sidebar-layout__body">
        <div class="sidebar-layout__body-inner">
          <Breadcrumbs />
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import logoImg from '@/assets/image/logo.png';
import Breadcrumbs from '@/components/common/Breadcrumbs.vue';

import { useAuthStore, useBreadcrumbsStore, useDialogStore } from '@/stores';

import { executeApi } from '@/utils/executeApiUtils';
import { getAccessibleMenuTree } from '@/services/adminMenuService';
import { openConfirmDialog } from '@/utils/dialog/confirmDialog';

type MenuItem = {
  title: string;
  route?: string;
  submenu: Array<{
    title: string;
    route: string;
  }>;
};

const router = useRouter();
const route = useRoute();

const authStore = useAuthStore();
const dialogStore = useDialogStore();
const breadcrumbs = useBreadcrumbsStore();

const sidebarVisible = ref(true);
const activeIndex = ref<number | null>(null);
const activeSubmenuIndex = ref<number | null>(null);

const isMobile = ref(window.innerWidth <= 768);

const menuItems = ref<MenuItem[]>([]);

const userName = computed(
  () => authStore.user?.displayName || authStore.user?.username || '使用者',
);

/* --------------------------------------
 * Responsive
 * -------------------------------------- */
const handleResize = () => {
  isMobile.value = window.innerWidth <= 768;
  sidebarVisible.value = isMobile.value ? false : true;
};

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isMobile.value && sidebarVisible.value) {
    closeSidebar();
  }
};

watch([isMobile, sidebarVisible], ([mobile, open]) => {
  if (mobile && open) {
    document.body.classList.add('no-scroll');
  } else {
    document.body.classList.remove('no-scroll');
  }
});

/* --------------------------------------
 * Menu transform
 * -------------------------------------- */
const transformMenu = (raw: any[]): MenuItem[] => {
  return (Array.isArray(raw) ? raw : [])
    .filter((m) => m?.isVisible !== false)
    .sort((a, b) => (a?.orderNum ?? 9999) - (b?.orderNum ?? 9999))
    .map((m) => ({
      title: m?.name ?? '',
      route: m?.path ?? '',
      submenu: (Array.isArray(m?.children) ? m.children : [])
        .filter((c) => c?.isVisible !== false)
        .sort((a, b) => (a?.orderNum ?? 9999) - (b?.orderNum ?? 9999))
        .map((c) => ({
          title: c?.name ?? '',
          route: c?.path ?? '',
        })),
    }));
};

onMounted(async () => {
  window.addEventListener('resize', handleResize);
  window.addEventListener('keydown', handleKeydown);
  // 初始同步一次
  handleResize();
  initPrivilege();
  updateActiveMenu();

  await executeApi({
    fn: async () => getAccessibleMenuTree(),
    onSuccess: async (data) => {
      menuItems.value = transformMenu(data);

      // 重新同步目前路由的 active / breadcrumbs
      updateActiveMenu();
    },

    showSuccessDialog: false,
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('keydown', handleKeydown);
});

// 開關 body 滾動（避免手機打開側欄背景滾動）
watch([isMobile, sidebarVisible], ([mobile, open]) => {
  if (mobile && open) {
    document.body.classList.add('no-scroll');
  } else {
    document.body.classList.remove('no-scroll');
  }
});

// ----- Menu data -----

const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value;
};

const closeSidebar = () => {
  sidebarVisible.value = false;
};

const toggleSubmenu = (index: number) => {
  activeIndex.value = activeIndex.value === index ? null : index;
  activeSubmenuIndex.value = null;
};

const setActiveSubmenu = (menuIndex: number, submenuIndex: number) => {
  activeIndex.value = menuIndex;
  activeSubmenuIndex.value = submenuIndex;

  const parent = menuItems.value[menuIndex];
  const child = parent?.submenu?.[submenuIndex];

  if (parent && child) {
    breadcrumbs.setItems([
      { label: '首頁', to: '/' },
      { label: parent.title, to: '#' },
      { label: child.title, to: child.route },
    ]);
  }

  if (isMobile.value) closeSidebar();
};

/* --------------------------------------
 * Breadcrumb active
 * -------------------------------------- */
const updateActiveMenu = () => {
  const path = route.path;
  const breadcrumb = [{ label: '首頁', to: '/' }];

  const cleanPath = path.replace(/^\/home\//, '');
  const segments = cleanPath.split('/').filter(Boolean);

  if (segments.length === 0) {
    breadcrumbs.setItems(breadcrumb);
    activeIndex.value = null;
    activeSubmenuIndex.value = null;
    return;
  }

  for (const parent of menuItems.value) {
    const match = parent.submenu.find((sub) => path.startsWith(sub.route));

    if (match) {
      breadcrumb.push({ label: parent.title, to: '#' });
      breadcrumb.push({ label: match.title, to: match.route });
      breadcrumbs.setItems(breadcrumb);

      activeIndex.value = menuItems.value.indexOf(parent);
      activeSubmenuIndex.value = parent.submenu.indexOf(match);
      return;
    }
  }

  breadcrumbs.setItems(breadcrumb);
};

/* --------------------------------------
 * Init menu
 * -------------------------------------- */
const initPrivilege = async () => {
  await executeApi({
    fn: async () => getAccessibleMenuTree(),
    onSuccess: async (res: any) => {
      const data = res?.data ?? res ?? [];
      menuItems.value = transformMenu(data);
      updateActiveMenu();
    },
    showSuccessDialog: false,
  });
};

/* --------------------------------------
 * Logout
 * -------------------------------------- */
const handleLogout = async () => {
  const ok = await openConfirmDialog({
    title: '提示訊息',
    message: '確定要登出嗎？',
  });

  if (!ok) return;

  authStore.clearAuthData();
  router.replace('/login');
};

/* --------------------------------------
 * Lifecycle
 * -------------------------------------- */
onMounted(async () => {
  window.addEventListener('resize', handleResize);
  window.addEventListener('keydown', handleKeydown);

  handleResize();
  updateActiveMenu();

  await initPrivilege();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('keydown', handleKeydown);
  document.body.classList.remove('no-scroll');
});

watch(() => route.path, updateActiveMenu);
</script>

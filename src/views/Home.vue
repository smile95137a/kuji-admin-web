<template>
  <div
    class="sidebar-layout"
    :class="{ 'sidebar-open': !isMobile && sidebarVisible }"
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
        { 'sidebar-layout__sidebar--hidden': !sidebarVisible },
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
                item.submenu?.some((s) => route.path.startsWith(s.route)),
            },
          ]"
        >
          <span class="sidebar-layout__link" @click="toggleSubmenu(index)">
            {{ item.title }}
          </span>

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

    <div class="sidebar-layout__content">
      <header class="sidebar-layout__header">
        <div class="sidebar-layout__left">
          <button
            class="sidebar-layout__toggle"
            @click="toggleSidebar"
            :aria-label="sidebarVisible ? '收合選單' : '開啟選單'"
          >
            <font-awesome-icon icon="fa-bars" />
          </button>
          <div class="sidebar-layout__logo"></div>
        </div>

        <div class="sidebar-layout__user-info">
          <span class="sidebar-layout__username">
            {{ userName }} 歡迎進入一番賞
          </span>
          <div class="sidebar-layout__actions">
            <button class="sidebar-layout__logout" @click="handleLogout">
              登出
            </button>
          </div>
        </div>
      </header>

      <div class="sidebar-layout__body">
        <Breadcrumbs />
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import logoImg from '@/assets/image/logo.png';
import Breadcrumbs from '@/components/common/Breadcrumbs.vue';
import {
  useAuthStore,
  useBreadcrumbsStore,
  useDialogStore,
  useLoadingStore,
} from '@/stores';

const router = useRouter();
const route = useRoute();

const sidebarVisible = ref(true);
const activeIndex = ref<number | null>(null);
const activeSubmenuIndex = ref<number | null>(null);

// ----- Responsive -----
const isMobile = ref(window.innerWidth <= 768);
const handleResize = () => {
  isMobile.value = window.innerWidth <= 768;
  // 初次或視窗變換時：手機預設關閉、桌機預設開啟
  sidebarVisible.value = isMobile.value ? false : true;
};

// 鍵盤 ESC 關閉 (mobile)
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isMobile.value && sidebarVisible.value) {
    closeSidebar();
  }
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  window.addEventListener('keydown', handleKeydown);
  // 初始同步一次
  handleResize();
  initPrivilege();
  updateActiveMenu();
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
const menuItems = ref([
  {
    title: '系統設定',
    submenu: [
      { title: '選單管理', route: '/home/menus' },
      { title: '角色管理', route: '/home/roles' },
      { title: '系統日誌', route: '/home/system-log' },
    ],
  },
  {
    title: '商品管理（整合商品+獎品）',
    submenu: [
      { title: '商品與獎品列表', route: '/home/lottery-with-prizes' },
      { title: '新增商品與獎品', route: '/home/lottery-with-prizes/add' },
    ],
  },

  {
    title: '營運工具',
    submenu: [
      { title: '賞品盒管理', route: '/home/prize-box' },
      { title: '推薦碼管理', route: '/home/referral-codes' },
    ],
  },
  {
    title: '錢包管理',
    submenu: [
      { title: '錢包/交易紀錄', route: '/home/wallet' },
      { title: '儲值方案', route: '/home/recharge-plan' },
    ],
  },

  {
    title: '網站內容管理',
    submenu: [
      { title: 'Banner 列表', route: '/home/banner' },
      { title: '最新消息列表', route: '/home/news' },
      { title: '跑馬燈管理', route: '/home/marquee' },
    ],
  },

  {
    title: '會員管理',
    submenu: [
      { title: '會員列表', route: '/home/member/list' },
      // ⚠️ 你後端目前是 FrontendUser：list/edit/delete/activate/deactivate/suspend
      // 沒有「新增會員」API，所以先改成「編輯會員」由列表點進去
      // 如果你真的要新增會員，等你補後端 /admin/frontend-users POST 我再幫你補 route + 畫面
      // { title: '新增會員', route: '/home/member/add' },
    ],
  },

  {
    title: '後台使用者',
    submenu: [
      { title: '帳號列表', route: '/home/admin-users' },
      { title: '新增店家負責人', route: '/home/admin-users/add-owner' },
      { title: '新增店家編輯', route: '/home/admin-users/add-editor' },
    ],
  },

  {
    title: '商品管理（一番賞）',
    submenu: [
      { title: '商品列表', route: '/home/lottery' },
      { title: '新增商品', route: '/home/lottery/add' },
      { title: '獎項管理（從商品列表進入）', route: '/home/lottery' },
    ],
  },

  {
    title: '訂單管理',
    submenu: [{ title: '訂單列表', route: '/home/order' }],
  },
]);

const loadingStore = useLoadingStore();
const authStore = useAuthStore();
const dialogStore = useDialogStore();
const breadcrumbs = useBreadcrumbsStore();

const userName = computed(
  () => authStore.user?.displayName || authStore.user?.username || '使用者'
);

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
  const child = parent.submenu[submenuIndex];

  breadcrumbs.setItems([
    { label: '首頁', to: '/' },
    { label: parent.title, to: '#' },
    { label: child.title, to: child.route },
  ]);

  if (isMobile.value) closeSidebar();
};

const transformMenu = (rawMenu: any[]): any[] => {
  return rawMenu.map((menu) => ({
    title: menu.menuName,
    submenu: Array.isArray(menu.children)
      ? menu.children.map((sub) => ({
          title: sub.menuName,
          route: sub.url,
        }))
      : [],
  }));
};

const updateActiveMenu = () => {
  const path = route.path;

  // 預設首頁
  const breadcrumb = [{ label: '首頁', to: '/' }];

  // 移除開頭的 /home/
  const cleanPath = path.replace(/^\/home\//, '');
  // 例如 "/home/b04/b04005" → ["b04", "b04005"]
  const segments = cleanPath.split('/').filter(Boolean);

  if (segments.length === 0) {
    breadcrumbs.setItems(breadcrumb);
    return;
  }

  // 找出第一層對應的主選單
  for (const parent of menuItems.value) {
    const match = parent.submenu.find((sub) => path.startsWith(sub.route));
    if (match) {
      breadcrumb.push({ label: parent.title, to: '#' });
      breadcrumb.push({ label: match.title, to: match.route });
      breadcrumbs.setItems(breadcrumb);

      // 設定目前選單 active 狀態
      activeIndex.value = menuItems.value.indexOf(parent);
      activeSubmenuIndex.value = parent.submenu.indexOf(match);
      return;
    }
  }

  // 如果沒有任何匹配 → 回首頁
  breadcrumbs.setItems(breadcrumb);
};

const initPrivilege = async () => {};

const handleLogout = async () => {
  const ok = await dialogStore.openConfirmDialog({
    message: '確定要登出嗎？',
  });
  if (!ok) return;

  authStore.clearAuthData();

  router.replace('/login');
};

watch(() => route.path, updateActiveMenu);
</script>

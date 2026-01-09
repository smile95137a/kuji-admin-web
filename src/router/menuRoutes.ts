// src/router/menuRoutes.ts
import type { RouteRecordRaw } from 'vue-router';

import MenuList from '@/views/menu/MenuList.vue';
import MenuForm from '@/views/menu/MenuForm.vue';
import MenuTree from '@/views/menu/MenuTree.vue';

const menuRoutes: RouteRecordRaw[] = [
  {
    path: 'menus',
    name: 'MenuList',
    component: MenuList,
    meta: { requiresAuth: true, title: '選單管理', layout: 'default' },
  },
  {
    path: 'menus/add',
    name: 'MenuAdd',
    component: MenuForm,
    meta: { requiresAuth: true, title: '新增選單', layout: 'default' },
  },
  {
    path: 'menus/edit/:id',
    name: 'MenuEdit',
    component: MenuForm,
    meta: { requiresAuth: true, title: '編輯選單', layout: 'default' },
  },
  {
    path: 'menus/tree',
    name: 'MenuTree',
    component: MenuTree,
    meta: { requiresAuth: true, title: '選單樹', layout: 'default' },
  },
];

export default menuRoutes;

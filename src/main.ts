// src/main.ts
import { createApp } from 'vue';
import App from './App.vue';

import './assets/styles/main.scss';
import '@vuepic/vue-datepicker/dist/main.css';

import router from '@/router';
import { createPinia } from 'pinia';

import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import * as solidIcons from '@fortawesome/free-solid-svg-icons';
import '@fortawesome/fontawesome-free/css/all.css';

import { gsap, Draggable } from 'gsap/all';

gsap.registerPlugin(Draggable);

Object.values(solidIcons).forEach((icon: any) => {
  if (icon?.iconName) library.add(icon);
});

const app = createApp(App);

app.component('font-awesome-icon', FontAwesomeIcon);

window.__APP_CONTEXT__ = app._context;

app.use(createPinia()).use(router).mount('#app');

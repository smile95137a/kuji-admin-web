// src/router/emergencyAnnouncementRoutes.ts
import type { RouteRecordRaw } from 'vue-router';

const emergencyAnnouncementRoutes: RouteRecordRaw[] = [
  {
    path: 'emergency-announcements',
    name: 'EmergencyAnnouncementList',
    component: () =>
      import('@/views/emergencyAnnouncement/EmergencyAnnouncementList.vue'),
  },
  {
    path: 'emergency-announcements/add',
    name: 'EmergencyAnnouncementAdd',
    component: () =>
      import('@/views/emergencyAnnouncement/EmergencyAnnouncementForm.vue'),
  },
  {
    path: 'emergency-announcements/edit/:id',
    name: 'EmergencyAnnouncementEdit',
    component: () =>
      import('@/views/emergencyAnnouncement/EmergencyAnnouncementForm.vue'),
    props: true,
  },
];

export default emergencyAnnouncementRoutes;

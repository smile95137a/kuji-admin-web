// src/services/adminEmergencyAnnouncementService.ts
import { api } from './FrontAPI';

const basePath = '/admin/emergency-announcements';

interface RequestData {
  [key: string]: any;
}

export interface EmergencyAnnouncement {
  id?: string;
  title: string;
  content: string;
  announcementType: 'MAINTENANCE' | 'UPDATE' | 'NOTICE' | string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | string;
  displayStartTime: string;
  displayEndTime: string;
  maintenanceStartTime?: string | null;
  maintenanceEndTime?: string | null;
  forceShow?: boolean;
  sortOrder?: number | null;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface EmergencyAnnouncementQueryCondition {
  status?: string;
  announcementType?: string;
  keyword?: string;
  displayStartTime?: string;
  displayEndTime?: string;
  sortBy?: string;
  sortDir?: string;
}

/** 查詢緊急公告列表 */
export const queryEmergencyAnnouncements = async (
  req?: RequestData,
): Promise<ApiResponse<any>> => {
  try {
    /**
     * 後端：
     * GET /admin/emergency-announcements
     *
     * 目前後端 Controller 是用 @RequestParam：
     * page, size, status, announcementType, keyword,
     * displayStartTime, displayEndTime, sortBy, sortDir
     */
    const condition = req?.condition ?? req ?? {};

    const res = await api.get(`${basePath}`, {
      params: {
        page: req?.page ?? 0,
        size: req?.size ?? 9999,
        status: condition.status || undefined,
        announcementType: condition.announcementType || undefined,
        keyword: condition.keyword || undefined,
        displayStartTime: condition.displayStartTime || undefined,
        displayEndTime: condition.displayEndTime || undefined,
        sortBy: condition.sortBy || 'updatedAt',
        sortDir: condition.sortDir || 'DESC',
      },
    });

    return res.data;
  } catch (e) {
    console.error(
      'AdminEmergencyAnnouncement - queryEmergencyAnnouncements error:',
      e,
    );
    throw e;
  }
};

/** 查詢目前有效緊急公告 */
export const queryActiveEmergencyAnnouncements = async (): Promise<
  ApiResponse<any>
> => {
  try {
    /**
     * 後端：
     * GET /admin/emergency-announcements/active
     */
    const res = await api.get(`${basePath}/active`);
    return res.data;
  } catch (e) {
    console.error(
      'AdminEmergencyAnnouncement - queryActiveEmergencyAnnouncements error:',
      e,
    );
    throw e;
  }
};

/** 取得緊急公告詳情 */
export const getEmergencyAnnouncementById = async (
  id: string,
): Promise<ApiResponse<any>> => {
  try {
    /**
     * 後端：
     * GET /admin/emergency-announcements/{id}
     */
    const res = await api.get(`${basePath}/${id}`);
    return res.data;
  } catch (e) {
    console.error(
      'AdminEmergencyAnnouncement - getEmergencyAnnouncementById error:',
      e,
    );
    throw e;
  }
};

/** 新增緊急公告 */
export const createEmergencyAnnouncement = async (
  req: RequestData,
): Promise<ApiResponse<any>> => {
  try {
    /**
     * 後端：
     * POST /admin/emergency-announcements
     */
    const res = await api.post(`${basePath}`, req);
    return res.data;
  } catch (e) {
    console.error(
      'AdminEmergencyAnnouncement - createEmergencyAnnouncement error:',
      e,
    );
    throw e;
  }
};

/** 更新緊急公告 */
export const updateEmergencyAnnouncement = async (
  id: string,
  req: RequestData,
): Promise<ApiResponse<any>> => {
  try {
    /**
     * 後端：
     * PUT /admin/emergency-announcements/{id}
     */
    const res = await api.put(`${basePath}/${id}`, req);
    return res.data;
  } catch (e) {
    console.error(
      'AdminEmergencyAnnouncement - updateEmergencyAnnouncement error:',
      e,
    );
    throw e;
  }
};

/** 更新緊急公告狀態 */
export const updateEmergencyAnnouncementStatus = async (
  id: string,
  status: string,
): Promise<ApiResponse<any>> => {
  try {
    /**
     * 後端：
     * PUT /admin/emergency-announcements/{id}/status
     * body: { status: 'ACTIVE' | 'INACTIVE' | 'DRAFT' }
     */
    const res = await api.put(`${basePath}/${id}/status`, { status });
    return res.data;
  } catch (e) {
    console.error(
      'AdminEmergencyAnnouncement - updateEmergencyAnnouncementStatus error:',
      e,
    );
    throw e;
  }
};

/** 啟用緊急公告 */
export const activateEmergencyAnnouncement = async (
  id: string,
): Promise<ApiResponse<any>> => {
  try {
    /**
     * 後端目前沒有獨立 activate API，
     * 這裡統一走 PUT /{id}/status
     */
    const res = await api.put(`${basePath}/${id}/status`, {
      status: 'ACTIVE',
    });
    return res.data;
  } catch (e) {
    console.error(
      'AdminEmergencyAnnouncement - activateEmergencyAnnouncement error:',
      e,
    );
    throw e;
  }
};

/** 停用緊急公告 */
export const deactivateEmergencyAnnouncement = async (
  id: string,
): Promise<ApiResponse<any>> => {
  try {
    /**
     * 後端目前沒有獨立 deactivate API，
     * 這裡統一走 PUT /{id}/status
     */
    const res = await api.put(`${basePath}/${id}/status`, {
      status: 'INACTIVE',
    });
    return res.data;
  } catch (e) {
    console.error(
      'AdminEmergencyAnnouncement - deactivateEmergencyAnnouncement error:',
      e,
    );
    throw e;
  }
};

/** 刪除緊急公告 */
export const deleteEmergencyAnnouncement = async (
  id: string,
): Promise<ApiResponse<any>> => {
  try {
    /**
     * 後端：
     * DELETE /admin/emergency-announcements/{id}
     */
    const res = await api.delete(`${basePath}/${id}`);
    return res.data;
  } catch (e) {
    console.error(
      'AdminEmergencyAnnouncement - deleteEmergencyAnnouncement error:',
      e,
    );
    throw e;
  }
};

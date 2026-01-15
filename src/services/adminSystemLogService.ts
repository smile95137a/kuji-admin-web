// src/services/adminSystemLogService.ts
import { api } from './FrontAPI';

const basePath = '/admin/system-log';

interface RequestData {
  [key: string]: any;
}

/**
 * 依類型查詢日誌
 * GET /admin/system-log/type/{logType}?limit=100
 */
export const getSystemLogsByType = async (
  logType: string,
  limit = 100
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.get(
      `${basePath}/type/${encodeURIComponent(logType)}`,
      {
        params: { limit },
      }
    );
    return res.data;
  } catch (e) {
    console.error('SystemLog - getSystemLogsByType error:', e);
    throw e;
  }
};

/**
 * 依使用者查詢日誌
 * GET /admin/system-log/user/{userId}?limit=100
 */
export const getSystemLogsByUserId = async (
  userId: string,
  limit = 100
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.get(
      `${basePath}/user/${encodeURIComponent(userId)}`,
      {
        params: { limit },
      }
    );
    return res.data;
  } catch (e) {
    console.error('SystemLog - getSystemLogsByUserId error:', e);
    throw e;
  }
};

/**
 * 依時間範圍查詢日誌
 * GET /admin/system-log/date-range?start=...&end=...&limit=100
 *
 * 注意：後端 @DateTimeFormat(iso = ISO.DATE_TIME)
 * 建議用 2026-01-15T10:30:00 這種格式
 */
export const getSystemLogsByDateRange = async (
  start: string,
  end: string,
  limit = 100
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.get(`${basePath}/date-range`, {
      params: { start, end, limit },
    });
    return res.data;
  } catch (e) {
    console.error('SystemLog - getSystemLogsByDateRange error:', e);
    throw e;
  }
};

/**
 * 清除過期日誌
 * DELETE /admin/system-log/cleanup?days=90
 * 回傳 deleted count（int）
 */
export const cleanupOldSystemLogs = async (
  days = 90
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.delete(`${basePath}/cleanup`, {
      params: { days },
    });
    return res.data;
  } catch (e) {
    console.error('SystemLog - cleanupOldSystemLogs error:', e);
    throw e;
  }
};

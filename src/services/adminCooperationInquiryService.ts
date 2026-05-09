// src/services/adminCooperationInquiryService.ts
import { api } from './FrontAPI';

const basePath = '/admin/cooperation-inquiries';

interface RequestData {
  [key: string]: any;
}

/** 查詢合作洽談列表 */
export const queryCooperationInquiries = async (
  req?: RequestData,
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.get(`${basePath}`, {
      params: req ?? undefined,
    });

    return res.data;
  } catch (e) {
    console.error(
      'AdminCooperationInquiry - queryCooperationInquiries error:',
      e,
    );
    throw e;
  }
};

/** 取得合作洽談詳情 */
export const getCooperationInquiryById = async (
  id: string,
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.get(`${basePath}/${id}`);
    return res.data;
  } catch (e) {
    console.error(
      'AdminCooperationInquiry - getCooperationInquiryById error:',
      e,
    );
    throw e;
  }
};

/** 更新合作洽談狀態 */
export const updateCooperationInquiryStatus = async (
  id: string,
  req: RequestData,
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.put(`${basePath}/${id}/status`, req);
    return res.data;
  } catch (e) {
    console.error(
      'AdminCooperationInquiry - updateCooperationInquiryStatus error:',
      e,
    );
    throw e;
  }
};

/** 刪除合作洽談 */
export const deleteCooperationInquiry = async (
  id: string,
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.delete(`${basePath}/${id}`);

    return (
      res.data ?? {
        success: true,
        data: null,
        message: '刪除成功',
      }
    );
  } catch (e) {
    console.error(
      'AdminCooperationInquiry - deleteCooperationInquiry error:',
      e,
    );
    throw e;
  }
};

/** 快速產生合作洽談假資料 */
export const createMockCooperationInquiries = async (
  count = 100,
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}/mock`, null, {
      params: { count },
    });

    return res.data;
  } catch (e) {
    console.error(
      'AdminCooperationInquiry - createMockCooperationInquiries error:',
      e,
    );
    throw e;
  }
};

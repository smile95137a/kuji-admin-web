// src/services/adminContactInquiryService.ts
import { api } from './FrontAPI';

const basePath = '/admin/contact-inquiries';

interface RequestData {
  [key: string]: any;
}

/**
 * 查詢聯絡單列表（POST /admin/contact-inquiries/list）
 * condition 可用欄位：company, status（PENDING | PROCESSING | COMPLETED | REJECTED）, type, keyword, createdAtStart, createdAtEnd
 * ADMIN ONLY
 */
export const queryContactInquiries = async (
  req?: RequestData
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}/list`, req ?? null);
    return res.data;
  } catch (e) {
    console.error('AdminContactInquiry - queryContactInquiries error:', e);
    throw e;
  }
};

/** 取得單一聯絡單（GET /admin/contact-inquiries/{id}） */
export const getContactInquiryById = async (
  id: string
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.get(`${basePath}/${id}`);
    return res.data;
  } catch (e) {
    console.error('AdminContactInquiry - getContactInquiryById error:', e);
    throw e;
  }
};

/**
 * 更新聯絡單狀態（PUT /admin/contact-inquiries/{id}/status）
 * body: { status: 'PROCESSING' | 'COMPLETED' | 'REJECTED', remark: '備註' }
 */
export const updateContactInquiryStatus = async (
  id: string,
  req: { status: string; remark?: string }
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.put(`${basePath}/${id}/status`, req);
    return res.data;
  } catch (e) {
    console.error('AdminContactInquiry - updateContactInquiryStatus error:', e);
    throw e;
  }
};

/** 刪除聯絡單（DELETE /admin/contact-inquiries/{id}） */
export const deleteContactInquiry = async (
  id: string
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.delete(`${basePath}/${id}`);
    return res.data;
  } catch (e) {
    console.error('AdminContactInquiry - deleteContactInquiry error:', e);
    throw e;
  }
};

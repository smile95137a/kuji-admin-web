# Tasks — 訂單管理 (06-order-management)

**優先級說明**  
`[P0]` 資安或 runtime 致命問題 | `[P1]` 功能缺失 | `[P2]` 完善度 | `[DONE]` 已實作待驗收

---

## T-ORD-01 [P0] 修正取消訂單 HTTP Method

**檔案**：`src/services/adminOrderService.ts`

**問題**：`cancelOrderWithReason` 使用 `api.post(path, { cancelReason })`；後端確認為 `PUT /cancel` + body `{ reason }`

**修正**：
```typescript
export const cancelOrderWithReason = async (
  orderId: string,
  reason: string
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.put(`${basePath}/${orderId}/cancel`, { reason })
    return res.data
  } catch (e) {
    console.error('AdminOrder - cancelOrderWithReason error:', e)
    throw e
  }
}
```

**完成條件**：network tab 顯示 `PUT /api/admin/orders/{id}/cancel`，body 含 `{ reason }`

---

## T-ORD-02 [P1] 驗收訂單詳情頁完整性

**檔案**：`src/views/order/AdminOrderDetail.vue`

**驗收清單**（對照 spec）：
- [ ] 訂單基本資訊（orderNo、狀態 Badge、金額、玩家資訊）
- [ ] 收件人資訊（name、phone、address）
- [ ] 獎品列表 table（prizeName、prizeLevel、prizeImageUrl、quantity）
- [ ] 操作日誌 Timeline（operator、action、fromStatus → toStatus、timestamp）
- [ ] 依 status 顯示對應操作按鈕（見 spec 操作按鈕邏輯表）
- [ ] 取消訂單 Modal（reason textarea 必填，至多 200 字）
- [ ] 422 狀態機錯誤顯示 Toast「此狀態無法執行該操作」
- [ ] STORE_EDITOR 不顯示取消訂單按鈕

**完成條件**：上述清單全部通過

---

## T-ORD-03 [DONE] 訂單列表

**檔案**：`src/views/order/AdminOrderList.vue`  
**狀態**：已實作。驗收確認：狀態 Tab 篩選、搜尋、分頁正常；ADMIN 顯示店家名稱欄

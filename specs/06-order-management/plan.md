# Plan — 訂單管理 (06-order-management)

**狀態**：PARTIAL（列表/詳情/服務方法有；cancelOrder HTTP method 需修正）  
**影響範圍**：`src/services/adminOrderService.ts`、`src/views/order/`

---

## 現有實作狀態

| 功能 | 狀態 | 備註 |
|------|------|------|
| 訂單列表 | ✅ DONE | `AdminOrderList.vue` |
| 訂單詳情 | ✅ DONE | `AdminOrderDetail.vue` |
| `queryOrders` | ✅ DONE | |
| `getOrderDetail` | ✅ DONE | |
| `prepareShipping` | ✅ DONE | |
| `shipOrder` | ✅ DONE | |
| `completeOrder` | ✅ DONE | |
| `updateOrderStatus` | ✅ DONE | |
| `cancelOrderWithReason` | ⚠️ WRONG | 使用 `POST`；後端已確認為 `PUT /cancel` + body `{ reason }` |

---

## 技術決策

| 決策 | 結論 |
|------|------|
| 取消訂單 HTTP method | `PUT /admin/orders/{orderId}/cancel` + body `{ reason }`（後端確認）|
| 422 狀態機錯誤處理 | 捕捉 HTTP 422 + `errorCode === "INVALID_STATUS_TRANSITION"`，顯示 Toast「此狀態無法執行該操作」|
| 操作按鈕邏輯 | 依當前 `status` computed；`COMPLETED` 和 `CANCELLED` 無任何操作按鈕 |

# 06 - 訂單管理

> **路由前綴**：`/admin/orders`  
> **允許角色**：ADMIN / STORE_OWNER / STORE_EDITOR（資料依角色自動隔離）

---

## API 列表

| 方法 | 路徑 | 說明 | 需要角色 |
|------|------|------|---------|
| POST | `/admin/orders/list` | 查詢訂單列表 | 全角色 |
| GET | `/admin/orders/{orderId}` | 取得訂單詳情 | 全角色 |
| PUT | `/admin/orders/{orderId}/status` | 統一更新訂單狀態 | 全角色 |
| PUT | `/admin/orders/{orderId}/prepare` | 標記備貨完成 | 全角色 |
| PUT | `/admin/orders/{orderId}/ship` | 出貨（填物流單號）| 全角色 |
| PUT | `/admin/orders/{orderId}/cancel` | 取消訂單 | ADMIN / STORE_OWNER |

---

## 查詢訂單列表

```
POST /api/admin/orders/list
Authorization: Bearer {token}
```

### 請求
```typescript
interface OrderCondition {
  storeId?: string;         // ADMIN 可選；其他角色後端自動注入
  userId?: string;
  status?: string;
  orderNo?: string;
  createdAtStart?: string;
  createdAtEnd?: string;
}
```

### 回應
```typescript
interface OrderRes {
  id: string;
  orderNo: string;
  userId: string;
  username: string;
  storeId: string;
  storeName: string;
  lotteryId: string;
  lotteryTitle: string;
  status: OrderStatus;
  totalAmount: number;
  goldUsed: number;
  bonusUsed: number;
  items: OrderItemSummary[];
  shippingAddress: string;
  trackingNumber: string | null;
  createdAt: string;
  updatedAt: string;
}
```

---

## 取得訂單詳情

```
GET /api/admin/orders/{orderId}
Authorization: Bearer {token}
```

### 回應
```typescript
interface OrderDetailRes extends OrderRes {
  items: OrderItem[];
  recipient: {
    name: string;
    phone: string;
    address: string;
    zipCode: string;
  };
  logs: OrderLog[];
}

interface OrderItem {
  id: string;
  prizeId: string;
  prizeName: string;
  prizeLevel: string;
  prizeImageUrl: string;
  quantity: number;
}

interface OrderLog {
  operator: string;
  action: string;
  fromStatus: string;
  toStatus: string;
  remark: string;
  createdAt: string;
}
```

---

## 統一更新訂單狀態

```
PUT /api/admin/orders/{orderId}/status
Authorization: Bearer {token}
```

```typescript
interface UpdateOrderStatusReq {
  targetStatus: OrderStatus;
  remark?: string;
}
```

後端有狀態機驗證，不合法的狀態轉移回傳 `422 + { errorCode: "INVALID_STATUS_TRANSITION" }`。

---

## 備貨流程

```
PUT /api/admin/orders/{orderId}/prepare
Authorization: Bearer {token}
（無須 body）
```

狀態：`PAID` → `PREPARING`

---

## 出貨流程

```
PUT /api/admin/orders/{orderId}/ship
Authorization: Bearer {token}
```

```typescript
interface OrderShipReq {
  trackingNumber: string;         // 必填
  shippingCompany?: string;
  estimatedDeliveryDate?: string;
}
```

狀態：`PREPARING` → `SHIPPED`

---

## 取消訂單

```
PUT /api/admin/orders/{orderId}/cancel
Authorization: Bearer {token}（需 ADMIN 或 STORE_OWNER）
```

```typescript
interface CancelOrderReq {
  reason: string;   // 必填
}
```

⚠️ 取消後後端自動退回金幣/紅利（`@Transactional`）

---

## 訂單狀態機

```
PENDING_PAYMENT → PAID（玩家付款，自動）
PAID → PREPARING（確認訂單）
PREPARING → SHIPPED（出貨）
SHIPPED → DELIVERED（物流更新或手動確認）
DELIVERED → COMPLETED（玩家確認收貨）
* → CANCELLED（SHIPPED 前可取消）
COMPLETED → REFUNDED（有限制條件）
```

---

## 操作按鈕邏輯

| 當前狀態 | 顯示按鈕 |
|---------|---------|
| `PAID` | 確認備貨 |
| `PREPARING` | 填物流並出貨 |
| `SHIPPED` | 確認送達（手動）|
| 未完成狀態 | 取消訂單（需 ADMIN/STORE_OWNER）|
| `COMPLETED` / `CANCELLED` | 無操作按鈕 |

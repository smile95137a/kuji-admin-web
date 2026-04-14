# API Contract：指定大獎號碼（015）

**功能**：SCRATCH_STORE 後台指定大獎籤號  
**日期**：2026-04-07  
**狀態**：⚠️ 端點名稱假設，待後端確認

---

## 1. 指定大獎號碼

### Request

```
POST /api/admin/lottery/{id}/designate-prize
Authorization: Bearer {token}
Content-Type: application/json
```

**Path Params**

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `id` | string (UUID) | ✅ | 抽獎商品 ID |

**Body**

```json
{
  "designatedPrizeNumber": 42
}
```

| 欄位 | 型別 | 必填 | 驗證 | 說明 |
|------|------|------|------|------|
| `designatedPrizeNumber` | number (integer) | ✅ | min=1, max=maxDraws | 指定的大獎籤號 |

### Response 200

```json
{
  "success": true,
  "data": {
    "designationStatus": "COMPLETED"
  }
}
```

| 欄位 | 型別 | 說明 |
|------|------|------|
| `designationStatus` | `"COMPLETED"` | 指定後固定為 COMPLETED |

### Error Cases

| HTTP Status | 情況 | 前端處理 |
|-------------|------|---------|
| 400 | 號碼超出範圍 / 已被抽取 | Modal 保持開啟，顯示後端錯誤訊息 |
| 403 | 無權限操作此商品（非此店家） | Modal 保持開啟，executeApi 錯誤處理 |
| 409 | 已完成指定（重複操作） | Modal 關閉，refresh() 更新狀態 |

---

## 2. 商品列表（含 designationStatus）

### Request

```
POST /api/admin/lottery-with-prizes/list
Authorization: Bearer {token}
Content-Type: application/json
```

**Body**

```json
{
  "condition": {
    "designationStatus": "PENDING"
  },
  "sortBy": "createdAt",
  "sortOrder": "DESC"
}
```

新增篩選欄位：

| 欄位 | 型別 | 說明 |
|------|------|------|
| `condition.designationStatus` | `"PENDING" \| "COMPLETED" \| null` | 選填；省略時不篩選 |

### Response 200

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "刮刮樂示範商品",
      "playMode": "SCRATCH_MODE",
      "gameMode": "SCRATCH_STORE",
      "status": "CONFIGURED",
      "designationStatus": "PENDING",
      "maxDraws": 111
    }
  ]
}
```

新增 Response 欄位：

| 欄位 | 型別 | 說明 |
|------|------|------|
| `gameMode` | `"RANDOM" \| "SCRATCH_STORE" \| "SCRATCH_PLAYER"` | 現有欄位，確認列表 API 回傳 |
| `designationStatus` | `"PENDING" \| "COMPLETED" \| null` | 刮刮樂專屬；其他商品為 null |

---

## 3. 獎品新增（含 isGrandPrize）

### Request

```
POST /api/admin/lotteries/{lotteryId}/prizes
Authorization: Bearer {token}
Content-Type: application/json
```

**Body（新增欄位）**

```json
{
  "name": "一等獎",
  "level": "GRAND",
  "prizeType": "physical",
  "totalQuantity": 1,
  "isGrandPrize": true,
  "isLastPrize": false,
  "sortOrder": 1
}
```

新增欄位：

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `isGrandPrize` | boolean | ✅（刮刮樂必填） | 刮刮樂大獎標記；刮刮樂商品只能有 1 個 true |

---

## 4. 獎品更新（含 isGrandPrize）

### Request

```
PUT /api/admin/lotteries/prizes/{prizeId}
Authorization: Bearer {token}
Content-Type: application/json
```

**Body（新增欄位）**

同新增獎品，含 `isGrandPrize: boolean`。

---

## 5. 商品詳情（取得 gameMode）

```
GET /api/admin/lottery-with-prizes/{lotteryId}
Authorization: Bearer {token}
```

**Response 欄位確認**（LotteryPrizeForm 使用）：

| 欄位 | 型別 | 說明 |
|------|------|------|
| `gameMode` | string | `onMounted` 時用以判斷是否刮刮樂 |
| `maxDraws` | number | DesignatePrizeModal 的 max 值 |
| `designationStatus` | string | 顯示指定狀態 |

# 05 - 商品管理（Lottery）

> **路由前綴**：  
> - `/admin/lottery` — 商品基本 CRUD  
> - `/admin/lottery-with-prizes` — 商品 + 獎品整合 CRUD（**推薦使用**）  
> - `/admin/lotteries/{id}/prizes` — 獎品單獨管理  
>
> **允許角色**：ADMIN / STORE_OWNER / STORE_EDITOR

---

## ⚠️ 重要規則：不傳 playMode

`playMode` 由後端自動推算，**無論任何商品類型都不傳**。前端只傳 `category` + `subCategory` + `gameMode`：

| 商品類型 | `category` | `subCategory` | `gameMode` |
|---------|-----------|--------------|-----------|
| 官方一番賞 | `OFFICIAL_ICHIBAN` | — | — |
| 扭蛋 | `GACHA` | — | — |
| 集換式卡牌 | `TRADING_CARD` | — | — |
| 自製賞（抽籤型）| `CUSTOM_GACHA` | `LOTTERY_MODE` | — |
| 自製賞（刮刮樂-全隨機）| `CUSTOM_GACHA` | `SCRATCH_MODE` | `RANDOM` |
| 自製賞（刮刮樂-店家指定大獎）| `CUSTOM_GACHA` | `SCRATCH_MODE` | `SCRATCH_STORE` |
| 自製賞（刮刮樂-玩家指定大獎）| `CUSTOM_GACHA` | `SCRATCH_MODE` | `SCRATCH_PLAYER` |

---

## 整合 API：新增商品（含獎品一次完成）

```
POST /api/admin/lottery-with-prizes
Authorization: Bearer {token}
```

### 請求
```typescript
interface LotteryWithPrizesCreateReq {
  lottery: {
    storeId?: string;         // StoreOwner 不需傳；Admin 必填
    title: string;
    description?: string;
    imageUrl?: string;
    category: string;         // 必填，見上表
    subCategory?: string;     // 僅 CUSTOM_GACHA 必填
    gameMode?: string;        // 僅 SCRATCH_MODE 必填
    pricePerDraw: number;
    totalDraws: number;
    maxDrawsPerUser?: number; // null = 無限制
    scheduledAt?: string;
    grandPrizeAutoDiscount?: boolean;
    discountedPricePerDraw?: number;
  };
  prizes: PrizeCreateItem[];
}

interface PrizeCreateItem {
  name: string;
  description?: string;
  content?: string;           // 詳細說明（HTML）
  imageUrl?: string;
  level?: string;             // A/B/C/D/E/F/G/LAST/GRAND
  prizeNumber?: string;       // 籤號（刮刮樂使用）
  quantity: number;
  weight?: number;            // GACHA 用
  isGrandPrize?: boolean;     // SCRATCH_STORE/SCRATCH_PLAYER 時標記
  sortOrder?: number;
}
```

### 回應
```typescript
interface LotteryWithPrizesRes {
  id: string;
  storeId: string;
  title: string;
  category: string;
  subCategory: string;
  playMode: string;     // 後端推算（LOTTERY_MODE / SCRATCH_MODE）
  gameMode: string;
  pricePerDraw: number;
  totalDraws: number;
  remainingDraws: number;
  status: string;
  scheduledAt: string | null;
  createdAt: string;
  prizes: PrizeRes[];
}
```

---

## 整合 API：更新商品

```
PUT /api/admin/lottery-with-prizes/{id}
Authorization: Bearer {token}
```

若不傳 `prizes`，獎品保持不變；若傳了，**整個獎品列表替換**。

---

## 查詢商品列表

```
POST /api/admin/lottery/list
Authorization: Bearer {token}
```

```typescript
interface LotteryCondition {
  storeId?: string;
  title?: string;
  status?: string;
  category?: string;
  createdAtStart?: string;
  createdAtEnd?: string;
}
```

---

## 商品狀態管理

```
POST /api/admin/lottery/{id}/on-shelf     上架
POST /api/admin/lottery/{id}/off-shelf    下架
POST /api/admin/lottery/{id}/copy         複製（新商品狀態為 DRAFT）
DELETE /api/admin/lottery/{id}            刪除（僅限 DRAFT 狀態）
```

**上架前提**：
1. 狀態必須為 `DRAFT` 或 `OFF_SHELF`
2. 必須有至少一個獎品
3. `SCRATCH_STORE` 模式：大獎位置必須已指定

---

## 獎品單獨管理 API

```
GET    /api/admin/lotteries/{lotteryId}/prizes          取得獎品列表
POST   /api/admin/lotteries/{lotteryId}/prizes          新增獎品
PUT    /api/admin/lotteries/prizes/{prizeId}            更新獎品
DELETE /api/admin/lotteries/prizes/{prizeId}            刪除獎品
```

---

## 商品狀態機

```
DRAFT → ON_SHELF（上架）
ON_SHELF → OFF_SHELF（下架）
ON_SHELF → RUNNING（有玩家開始抽，後端自動轉）
RUNNING → COMPLETED（全部抽完，後端自動轉）
OFF_SHELF → ON_SHELF（重新上架）
DRAFT → 刪除（只有草稿可刪）
```

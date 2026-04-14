# 08 - 報表與統計分析

> **路由前綴**：`/admin/report`  
> **允許角色**：ADMIN / STORE_OWNER（STORE_EDITOR 無法查看報表）

---

## 資料隔離

- **ADMIN**：可查詢任何店家，`condition.storeId` 選填
- **STORE_OWNER**：只能查詢自己店家，後端強制注入 `storeId`，前端傳了也無效

---

## 共用查詢模式

所有報表均為 `POST + /list-path`，前端傳日期範圍：

```typescript
// 日期範圍快捷（前端 composable useReportFilter 提供）
type DatePreset = 'today' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'custom'
```

---

## 1. 營業額報表

```
POST /api/admin/report/revenue
Authorization: Bearer {token}
```

### 請求
```typescript
interface RevenueReportCondition {
  storeId?: string;
  startDate?: string;   // YYYY-MM-DD
  endDate?: string;
  groupBy?: 'DAY' | 'WEEK' | 'MONTH';  // 預設 DAY
}
```

### 回應
```typescript
interface RevenueReportRes {
  summary: {
    totalRevenue: number;      // 總營業額（金幣）
    totalOrders: number;
    totalDraws: number;
    avgRevenuePerDay: number;
  };
  daily: {
    date: string;              // YYYY-MM-DD
    revenue: number;
    orderCount: number;
    drawCount: number;
  }[];
  byStore?: {                  // ADMIN 才有
    storeId: string;
    storeName: string;
    revenue: number;
    orderCount: number;
  }[];
}
```

**圖表**：折線圖（日期 × 營業額，使用 vue-echarts）

---

## 2. 開獎結果報表

```
POST /api/admin/report/lottery-result
Authorization: Bearer {token}
```

### 請求
```typescript
interface LotteryResultReportCondition {
  storeId?: string;
  lotteryId?: string;
  startDate?: string;
  endDate?: string;
}
```

### 回應
```typescript
interface LotteryResultReportRes {
  summary: {
    totalDraws: number;
    totalGrandPrizes: number;
    completionRate: number;   // 完銷率（%）
  };
  prizeStats: {
    prizeId: string;
    prizeName: string;
    prizeLevel: string;
    totalQuantity: number;
    drawnQuantity: number;
    remainingQuantity: number;
    drawRate: number;         // 已抽出率（%）
  }[];
  lotteryStats: {
    lotteryId: string;
    lotteryTitle: string;
    totalDraws: number;
    revenue: number;
    isCompleted: boolean;
  }[];
}
```

---

## 3. 推薦碼報表

```
POST /api/admin/report/referral
Authorization: Bearer {token}
```

### 請求
```typescript
interface ReferralReportCondition {
  storeId?: string;
  startDate?: string;
  endDate?: string;
}
```

### 回應
```typescript
interface ReferralReportRes {
  summary: {
    totalReferrals: number;
    activeReferralCodes: number;
    totalRewardGiven: number;
  };
  daily: {
    date: string;
    referralCount: number;
    rewardGiven: number;
  }[];
  ranking: {
    referralCode: string;
    ownerName: string;
    referralCount: number;
    rewardGiven: number;
  }[];
}
```

---

## 4. 儲值報表

```
POST /api/admin/report/recharge
Authorization: Bearer {token}（需 ADMIN）
```

### 請求
```typescript
interface RechargeReportCondition {
  startDate?: string;
  endDate?: string;
  planId?: string;
}
```

### 回應
```typescript
interface RechargeReportRes {
  summary: {
    totalAmount: number;       // 實際收入（台幣）
    totalGoldIssued: number;
    totalBonusIssued: number;
    orderCount: number;
  };
  daily: {
    date: string;
    amount: number;
    goldIssued: number;
    orderCount: number;
  }[];
  planStats: {
    planId: string;
    planName: string;
    amount: number;
    orderCount: number;
  }[];
}
```

⚠️ 此報表的 `amount` 單位是**台幣**，其他報表金額單位為**金幣**

---

## 5. 贈送點數報表

```
POST /api/admin/report/bonus
Authorization: Bearer {token}
```

### 請求
```typescript
interface BonusReportCondition {
  storeId?: string;
  startDate?: string;
  endDate?: string;
}
```

### 回應
```typescript
// 以後端 BonusReportRes 為準，欄位待後端確認後補充
// 後端 controller 已確認存在（AdminReportController.getBonusReport）
interface BonusReportRes {
  // 補充中 — 請對照後端 BonusReportRes DTO
}
```

---

## 圖表策略

| 報表 | 圖表類型 | 使用元件 |
|------|---------|---------|
| 營業額 | 折線圖（日期 × 營業額）| vue-echarts LineChart |
| 儲值 | 折線圖（日期 × 金額）| vue-echarts LineChart |
| 開獎結果 | 長條圖（各商品抽取次數）| vue-echarts BarChart |
| 推薦碼 | 表格排行（前 10）| 純 table，不做圖表 |
| 贈送點數 | table | 待欄位確認後決定 |

**圖表庫**：`vue-echarts` + `echarts`（treeshaking 安裝，只 import 需要的 chart 類型）

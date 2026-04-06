# Data Model：刮刮樂獎項規則修正（015）— 後台前端

**日期**：2026-04-07

---

## 1. TypeScript Interfaces（新增 / 修改）

### 1.1 Lottery List Item（擴充）

```typescript
// 商品列表 API Response item（擴充後）
interface LotteryListItem {
  id: string;
  name: string;
  playMode: 'LOTTERY_MODE' | 'SCRATCH_MODE';
  gameMode: 'RANDOM' | 'SCRATCH_STORE' | 'SCRATCH_PLAYER';
  status: 'DRAFT' | 'CONFIGURED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
  designationStatus: 'PENDING' | 'COMPLETED' | null; // 新增：刮刮樂專屬
  maxDraws: number;                                  // 確認列表 API 回傳
  // ... 其餘現有欄位
}
```

### 1.2 Prize Payload（擴充）

```typescript
// 新增/更新獎品 Request Body（擴充後）
interface PrizePayload {
  name: string;
  level?: string;
  prizeType: 'physical' | 'digital' | 'point';
  pointValue?: number;
  totalQuantity: number;
  isGrandPrize?: boolean;   // 新增：刮刮樂必填，true 時 totalQuantity 鎖定 1
  isLastPrize?: boolean;
  sortOrder?: number;
  // ... 其餘現有欄位
}
```

### 1.3 Prize Response（確認欄位）

```typescript
// 獎品詳情 Response（確認 isGrandPrize 欄位）
interface PrizeDetail {
  id: string;
  name: string;
  level?: string;
  prizeType: string;
  totalQuantity: number;
  isGrandPrize: boolean;    // 確認後端 Prize entity 已有此欄位
  isLastPrize: boolean;
  // ... 其餘現有欄位
}
```

### 1.4 Designate Prize Request / Response

```typescript
// POST /api/admin/lottery/{id}/designate-prize
interface DesignatePrizeRequest {
  designatedPrizeNumber: number;  // min=1, max=maxDraws
}

interface DesignatePrizeResponse {
  designationStatus: 'COMPLETED';
}
```

---

## 2. Component Local State

### 2.1 DesignatePrizeModal.vue

```typescript
// Props
interface DesignatePrizeModalProps {
  show: boolean;
  lotteryId: string;
  lotteryName: string;
  maxDraws: number;
}

// Emits
// 'close'          → 關閉 Modal（不送出）
// 'success'        → 送出成功，父元件呼叫 refresh()

// Local state
const prizeNumber = ref<number | null>(null);
const inputError = ref<string>('');
const submitting = ref<boolean>(false);
```

### 2.2 LotteryPrizeForm.vue（擴充）

```typescript
// 新增 local state
const gameMode = ref<string>('');           // 從 API 取得
const isScratch = computed(() =>
  gameMode.value === 'SCRATCH_STORE' || gameMode.value === 'SCRATCH_PLAYER'
);
const isGrandPrize = ref<boolean>(false);   // 新增 isGrandPrize 欄位綁定
// isGrandPrize=true 時，totalQuantity 強制為 1（computed readonly）
```

### 2.3 AdminLotteryWithPrizesList.vue（擴充）

```typescript
// 篩選表單新增欄位
interface SearchCondition {
  // ... 現有欄位
  designationStatus?: 'PENDING' | 'COMPLETED' | '';  // 新增
}
```

---

## 3. UI 狀態邏輯（computed）

```typescript
// 列表頁 — ON_SHELF 按鈕是否 disabled
const isOnShelfDisabled = (item: LotteryListItem): boolean => {
  return item.gameMode === 'SCRATCH_STORE' && item.designationStatus === 'PENDING';
};

// 列表頁 — 是否顯示「指定大獎號碼」按鈕
const showDesignateBtn = (item: LotteryListItem): boolean => {
  return item.gameMode === 'SCRATCH_STORE' && item.designationStatus === 'PENDING';
};

// 獎品管理頁 — 完成配置按鈕啟用條件（刮刮樂）
const canConfigureScratch = (prizes: PrizeDetail[]): boolean => {
  return prizes.some(p => p.isGrandPrize === true);
};

// 獎品管理頁 — 已達大獎上限
const hasMaxGrandPrize = (prizes: PrizeDetail[]): boolean => {
  return prizes.filter(p => p.isGrandPrize === true).length >= 1;
};
```

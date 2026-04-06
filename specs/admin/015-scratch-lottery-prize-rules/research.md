# Research：刮刮樂獎項規則修正（015）— 後台前端

**功能分支**：`015-scratch-lottery-prize-rules`  
**日期**：2026-04-07  
**對應 Spec**：`specs/admin/015-scratch-lottery-prize-rules/spec.md`

---

## 1. 現有程式碼盤點

### 1.1 需修改的檔案

| 檔案 | 類型 | 修改幅度 | 說明 |
|------|------|---------|------|
| `src/views/lottery-with-prizes/AdminLotteryWithPrizesList.vue` | View | 中 | 新增 designationStatus 欄、篩選、指定按鈕、上架 disabled |
| `src/views/lottery-with-prizes/AdminLotteryWithPrizesForm.vue` | View | 小 | 新增 designation 狀態提示條（3 種） |
| `src/views/lotteryPrize/LotteryPrizeList.vue` | View | 小 | 刮刮樂時 disable「新增獎品」（已有 1 大獎時）；調整完成配置判斷邏輯 |
| `src/views/lotteryPrize/LotteryPrizeForm.vue` | View | 中 | 取得 gameMode、新增 isGrandPrize checkbox、level dropdown、totalQuantity lock |
| `src/services/adminLotteryWithPrizesService.ts` | Service | 小 | 新增 `designatePrize()` 函式 |
| `src/services/adminLotteryPrizeService.ts` | Service | 已備妥 | `isGrandPrize` 欄位藉 `RequestData` 動態傳遞，無需修改函式簽名 |

### 1.2 需新增的檔案

| 檔案 | 類型 | 說明 |
|------|------|------|
| `src/components/lottery-with-prizes/DesignatePrizeModal.vue` | Component | 指定大獎號碼 Modal（新增） |

### 1.3 無需修改的檔案

| 檔案 | 原因 |
|------|------|
| `src/constants/lotteryOptions.ts` | `levelOptions` 已包含 `GRAND`；`PrizeFormCard.vue` 已有 `isGrandPrize` FormSelect；無新增常數需求 |
| `src/services/adminLotteryPrizeService.ts` | 服務函式使用 `RequestData` interface，`isGrandPrize` 直接由 payload 傳入 |
| `src/router/lotteryWithPrizesRoutes.ts` | 無新路由，Modal 為 overlay |
| `src/router/lotteryPrizeRoutes.ts` | 路由不變 |

---

## 2. API 端點確認狀態

| API | 端點 | 狀態 | 備註 |
|-----|------|------|------|
| 指定大獎號碼 | `POST /api/admin/lottery/{id}/designate-prize` | ⚠️ 假設 | 端點名稱待後端確認；後端 spec 參考 `specs/015-scratch-lottery-prize-rules/spec.md` |
| 商品列表（含 designationStatus） | `POST /api/admin/lottery-with-prizes/list` | ✅ 現有 | 需確認 Response 中 `designationStatus`、`gameMode` 欄位是否已回傳 |
| 商品詳情（含 gameMode） | `GET /api/admin/lottery-with-prizes/{id}` | ✅ 現有 | `getLotteryWithPrizes()` 已在 service 中 |
| 新增獎品（含 isGrandPrize） | `POST /api/admin/lotteries/{lotteryId}/prizes` | ⚠️ 欄位待確認 | `isGrandPrize` 須由後端 Prize entity 支援 |
| 更新獎品（含 isGrandPrize） | `PUT /api/admin/lotteries/prizes/{prizeId}` | ⚠️ 欄位待確認 | 同上 |

---

## 3. 元件依賴分析

### 現有 `PrizeFormCard.vue` vs 本次目標 `LotteryPrizeForm.vue`

`PrizeFormCard.vue`（用於 `AdminLotteryWithPrizesForm.vue` 的行內獎品）**已有** `isGrandPrize` FormSelect（標籤「是否大賞（降價觸發）」）。本次修改的主要對象是**獨立的** `LotteryPrizeForm.vue`（路由 `/home/lottery/:lotteryId/prizes/add|edit/:prizeId`），此表單目前：

- `level` 欄位：`FormInput`（自由文字）→ 改為刮刮樂時 `FormSelect`（levelOptions）
- `isGrandPrize`：**不存在**→ 新增 `FormCheckbox` 或 `FormSelect`
- `totalQuantity`：`FormInput` type=number → isGrandPrize=true 時唯讀並鎖定為 1

`LotteryPrizeList.vue` 的「完成配置」按鈕：目前判斷條件不明確，需查看 source 確認後再修改為「已有 1 個 isGrandPrize=true」。

---

## 4. 狀態機（前端邏輯）

```
SCRATCH_STORE 商品：
  designationStatus = null → (not applicable, 非刮刮樂)
  designationStatus = PENDING →
    列表：橘色「待指定」徽章 + 「指定大獎號碼」按鈕 + ON_SHELF disabled
    編輯頁：橘色警告條 + 「前往指定」按鈕
  designationStatus = COMPLETED →
    列表：綠色「已完成」徽章（無指定按鈕）+ ON_SHELF 可點
    編輯頁：綠色提示條

SCRATCH_PLAYER 商品：
  designationStatus 不影響上架
  編輯頁：藍色說明條
  列表：不顯示 designationStatus 徽章（SCRATCH_PLAYER 無後台指定流程）

RANDOM / 非刮刮樂：
  designationStatus = null → 不顯示任何徽章
```

---

## 5. 決策記錄

| 決策 | 選項 | 採用 | 理由 |
|------|------|------|------|
| Modal 號碼選擇器 UI | Grid 點選 vs. 數字輸入框 | `<input type="number">` | 適用任意 maxDraws 大小、開發成本低 |
| gameMode 傳遞方式 | URL query param / Pinia / API 呼叫 | API 呼叫（onMounted） | 避免 URL 被篡改，資料來源可靠 |
| 刮刮樂 level 欄位形式 | 自由文字 / dropdown | Dropdown（isGrandPrize=true 時） | 後端 enum 約束 + 操作便利 |
| 指定成功後刷新策略 | 局部 in-memory / 全量 refresh() | 全量 refresh() | 與現有 changeStatus 邏輯一致，無需額外狀態管理 |
| STORE_OWNER 前端權限 | 前端 storeId 比對 / 後端 API 驗證 | 後端驗證 | 前端無 storeId 比對邏輯，依 executeApi 錯誤處理 |

# Implementation Plan：刮刮樂獎項規則修正（015）— 後台前端

**分支**：`015-scratch-lottery-prize-rules`  
**日期**：2026-04-07  
**Spec**：`specs/admin/015-scratch-lottery-prize-rules/spec.md`  
**狀態**：Ready to Implement

---

## Summary

後端已完成刮刮樂（SCRATCH_STORE / SCRATCH_PLAYER）的獎項規則強化，包含大獎數量驗證、SCRATCH_STORE 上架前置驗證、大獎號碼指定流程，以及新增 `designationStatus` 欄位。後台前端需對應 4 個主要修改點，並新增 1 個 Modal 元件：

1. **Service 層**：新增 `designatePrize()` API 函式
2. **商品列表頁**：新增 `designationStatus` 徽章欄、篩選、指定按鈕、上架 disabled guard
3. **商品編輯頁**：新增指定狀態提示條（3 種 variant）
4. **獎品管理頁**：新增 `isGrandPrize` 勾選、level dropdown、totalQuantity lock、完成配置條件修改
5. **新增元件**：`DesignatePrizeModal.vue`

**影響範圍**：修改 5 個現有檔案、新增 1 個元件，不新增路由。非刮刮樂商品的現有功能不受影響。

---

## Technical Context

| 項目                 | 值                                                                           |
| -------------------- | ---------------------------------------------------------------------------- |
| **Framework**        | Vue 3 + TypeScript（Composition API `<script setup>`）                       |
| **Build Tool**       | Vite 5                                                                       |
| **API 呼叫**         | `executeApi()` from `@/utils/executeApiUtils.ts`                             |
| **HTTP Client**      | Axios（`src/services/FrontAPI.ts`）                                          |
| **State Management** | Pinia（dialogStore, loadingStore）                                           |
| **UI Components**    | `MCard`, `MButton`, `FormInput`, `FormSelect`, `FormCheckbox`, `ReportTable` |
| **Imports**          | 使用 `@/` path alias                                                         |

---

## Project Structure（本次異動）

```text
src/
├── services/
│   └── adminLotteryWithPrizesService.ts     ← 新增 designatePrize()
├── views/
│   ├── lottery-with-prizes/
│   │   ├── AdminLotteryWithPrizesList.vue   ← 修改：designationStatus 欄、篩選、按鈕
│   │   └── AdminLotteryWithPrizesForm.vue   ← 修改：指定狀態提示條
│   └── lotteryPrize/
│       ├── LotteryPrizeList.vue             ← 修改：大獎上限 disable 新增按鈕、配置條件
│       └── LotteryPrizeForm.vue             ← 修改：isGrandPrize、level dropdown、totalQuantity lock
└── components/
    └── lottery-with-prizes/
        └── DesignatePrizeModal.vue          ← 新增

specs/admin/015-scratch-lottery-prize-rules/
├── plan.md              ← 本檔案
├── spec.md              ← 完整規格書（已含 5 輪澄清）
├── research.md          ← 技術決策與現有程式碼盤點
├── data-model.md        ← TypeScript interfaces + local state
├── quickstart.md        ← 本地測試指南
└── contracts/
    └── designation.md   ← API 合約（designate-prize + 擴充欄位）
```

---

## Assumptions & Blockers

| 項目                                                    | 狀態      | 說明                                                                                              |
| ------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------- |
| `POST /api/admin/lottery/{id}/designate-prize` 端點名稱 | ⚠️ 待確認 | 後端實際端點可能不同，調整 service 端點名稱即可，邏輯不變                                         |
| 列表 API Response 含 `designationStatus` + `gameMode`   | ⚠️ 待確認 | 需後端在列表查詢結果中回傳這兩個欄位                                                              |
| `isGrandPrize` 欄位存在於後端 Prize entity              | ⚠️ 待確認 | 前台已有 `PrizeFormCard.vue` 使用此欄位，但 `LotteryPrizeForm.vue` 對應的 GET 獎品 API 需確認回傳 |
| `levelOptions` 已含 GRAND                               | ✅ 已確認 | `src/constants/lotteryOptions.ts` 已有 GRAND 項目                                                 |
| `PrizeFormCard.vue` 已有 `isGrandPrize` FormSelect      | ✅ 已確認 | 行內獎品表單（AdminLotteryWithPrizesForm.vue 用）無需修改                                         |

---

## Implementation Phases

### Phase 0 — 後端確認（開始前）

> 執行實作前，先與後端確認以下 3 點，避免後續返工：

1. 確認指定大獎號碼的 API 端點名稱（假設：`POST .../designate-prize`）
2. 確認列表 API（`/list`）Response 是否已回傳 `designationStatus`、`gameMode`、`maxDraws` 欄位
3. 確認獎品詳情 GET API Response 是否回傳 `isGrandPrize` boolean 欄位

---

### Phase 1 — Service 層（無 UI 依賴，優先做）

**目標**：新增 `designatePrize()` 函式，其他頁面可引用

**任務**：

| ID    | 任務                    | 檔案                               | 說明                                                                                 |
| ----- | ----------------------- | ---------------------------------- | ------------------------------------------------------------------------------------ |
| T-001 | 新增 `designatePrize()` | `adminLotteryWithPrizesService.ts` | `POST /admin/lottery/{id}/designate-prize`，接收 `{ designatedPrizeNumber: number }` |

**驗收**：函式可 import、TypeScript 不報錯、console 可手動測試呼叫

---

### Phase 2 — 新增 DesignatePrizeModal 元件

**目標**：可獨立渲染與測試的 Modal 元件

**任務**：

| ID    | 任務                               | 說明                                                                             |
| ----- | ---------------------------------- | -------------------------------------------------------------------------------- |
| T-002 | 建立 `DesignatePrizeModal.vue`     | Props: `show`, `lotteryId`, `lotteryName`, `maxDraws`；Emits: `close`, `success` |
| T-003 | 號碼輸入框即時驗證                 | min=1, max=maxDraws，超出範圍顯示「請輸入 1 到 {maxDraws} 之間的號碼」           |
| T-004 | 二次確認 Dialog                    | 使用 `openConfirmDialog()`；確認文字含籤號與不可撤銷說明                         |
| T-005 | 呼叫 `designatePrize()` + 錯誤處理 | 使用 `executeApi()`；失敗時 Modal 保持開啟並顯示後端錯誤；成功 emit `success`    |
| T-006 | maxDraws=1 特殊提示                | 自動顯示「僅有 1 個籤號，已自動選取第 1 號」                                     |

**驗收**：Modal 可開關、驗證正常、成功/失敗 toast 顯示正確

---

### Phase 3 — 商品列表頁修改（AdminLotteryWithPrizesList.vue）

**目標**：列表頁顯示 designationStatus、支援篩選與指定操作

**任務**：

| ID    | 任務                            | 說明                                                                        |
| ----- | ------------------------------- | --------------------------------------------------------------------------- |
| T-007 | 新增 `designationStatus` 徽章欄 | `PENDING`→橘色「待指定」，`COMPLETED`→綠色「已完成」，`null`→空             |
| T-008 | 新增「指定狀態」篩選            | 下拉（全部 / 待指定 / 已完成），加入 searchCondition；僅 SCRATCH 模式有意義 |
| T-009 | 新增「指定大獎號碼」操作按鈕    | 僅 `gameMode=SCRATCH_STORE` + `designationStatus=PENDING` 時顯示            |
| T-010 | ON_SHELF 按鈕 disabled guard    | `SCRATCH_STORE` + `PENDING` 時 disabled + tooltip                           |
| T-011 | 整合 DesignatePrizeModal        | 傳入 `lotteryId`, `lotteryName`, `maxDraws`；成功後呼叫 `refresh()`         |

**驗收**：US2、US3、US4 驗收情境全部通過

---

### Phase 4 — 商品編輯頁修改（AdminLotteryWithPrizesForm.vue）

**目標**：已建立的刮刮樂商品編輯頁顯示指定狀態提示條

**任務**：

| ID    | 任務                             | 說明                                                                                           |
| ----- | -------------------------------- | ---------------------------------------------------------------------------------------------- |
| T-012 | 新增指定狀態提示條（3 variants） | SCRATCH_STORE+PENDING（橘色警告）/ SCRATCH_STORE+COMPLETED（綠色）/ SCRATCH_PLAYER（藍色說明） |
| T-013 | 「前往指定」按鈕開啟 Modal       | 整合 DesignatePrizeModal；SCRATCH_STORE+PENDING 時顯示按鈕                                     |
| T-014 | 指定成功後刷新表單資料           | 重新呼叫商品詳情 API 更新 `designationStatus` 顯示                                             |

**驗收**：US4 情境 3 通過；新增頁（無 id）不顯示提示條

---

### Phase 5 — 獎品管理頁修改

#### 5a — LotteryPrizeForm.vue

**目標**：刮刮樂獎品表單增加 isGrandPrize、level dropdown、totalQuantity lock

| ID    | 任務                                         | 說明                                                                      |
| ----- | -------------------------------------------- | ------------------------------------------------------------------------- |
| T-015 | `onMounted` 呼叫商品詳情 API 取得 `gameMode` | `GET /api/admin/lottery-with-prizes/{lotteryId}`，儲存至 local ref        |
| T-016 | 新增 `isGrandPrize` 勾選框                   | 僅 `isScratch=true` 時顯示；綁定至 prize payload                          |
| T-017 | `level` 欄位條件渲染                         | `isScratch && isGrandPrize`→FormSelect(levelOptions)；其他→現有 FormInput |
| T-018 | `totalQuantity` 鎖定                         | `isGrandPrize=true`→唯讀、強制設為 1、顯示說明文字                        |
| T-019 | 送出 payload 含 `isGrandPrize`               | 確認 `createPrize()` / `updatePrize()` 的 req 物件包含此欄位              |

#### 5b — LotteryPrizeList.vue

| ID    | 任務                            | 說明                                                      |
| ----- | ------------------------------- | --------------------------------------------------------- |
| T-020 | `onMounted` 取得 `gameMode`     | 同 T-015 邏輯（可共用 composable 或各自呼叫）             |
| T-021 | 刮刮樂說明橫幅                  | 頁面頂部藍色 info bar（`isScratch=true` 時顯示）          |
| T-022 | 「新增獎項」按鈕 disabled guard | 已有 1 個 `isGrandPrize=true` 的獎品時 disabled + tooltip |
| T-023 | 「完成配置」按鈕條件修改        | 刮刮樂商品：`hasGrandPrize=true`；非刮刮樂：維持原邏輯    |

**驗收**：US1 全部驗收情境通過；一番賞商品操作不受影響

---

### Phase 6 — 回歸測試

**目標**：確認現有功能不受影響

| 檢查項目                                                  |
| --------------------------------------------------------- |
| 一番賞 / 扭蛋商品的商品列表、新增、編輯、獎品管理流程正常 |
| 非刮刮樂商品的上架/下架流程正常                           |
| `isGrandPrize` 欄位在非刮刮樂商品的獎品表單中不顯示       |
| `designationStatus` 徽章在非刮刮樂商品列表中不顯示        |

---

## 任務依賴關係

```
T-001 (service)
  └→ T-002 (Modal) → T-003, T-004, T-005, T-006
       └→ T-011 (List - Modal 整合)
       └→ T-013 (Form - Modal 整合)

T-007, T-008, T-009, T-010 (List 修改，不依賴 Modal)

T-015 (取得 gameMode) → T-016, T-017, T-018, T-019 (PrizeForm 修改)
T-020 (取得 gameMode) → T-021, T-022, T-023 (PrizeList 修改)
```

**建議順序**：Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

---

## 成功標準對照

| SC     | 成功標準                                                          | 驗收方式                            |
| ------ | ----------------------------------------------------------------- | ----------------------------------- |
| SC-001 | SCRATCH_STORE 完整上架流程 5 分鐘內完成，無後端 BusinessException | 手動走完 quickstart.md 流程 1+2     |
| SC-002 | 50 筆列表載入 < 2 秒                                              | 瀏覽器 Network tab                  |
| SC-003 | SCRATCH_STORE+PENDING 上架按鈕保護 100% 生效                      | 手動驗證 disabled 狀態 + tooltip    |
| SC-004 | 大獎設定約束 100% 在前端阻止                                      | 嘗試新增第二個大獎，確認 UI 阻止    |
| SC-005 | 非刮刮樂商品現有功能不受影響                                      | 走 quickstart.md 流程 4（回歸測試） |

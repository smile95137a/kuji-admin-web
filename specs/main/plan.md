# Implementation Plan: KUJI Admin Panel — 10 Feature Modules

**Branch**: `main` | **Specs**: `specs/admin/*/spec.md`  
**Session**: 2026-03-30 (全規格澄清 + 實作差距分析)

---

## Summary

KUJI 後台管理介面（Admin Panel）是一套 Vue 3 SPA，涵蓋 10 個業務功能模組。大部分模組已有初步實作，本計畫聚焦於：
1. **補齊缺漏**：014 店家管理（無 UI）、002 出貨管理（不完整）
2. **修正差距**：對照各 spec 澄清結論，確認現有實作是否符合規格
3. **路由修復**：006 錢包路由已被從 router 移除，需修復

---

## Technical Context

**Language/Version**: TypeScript 5.x / Node 18+  
**Framework**: Vue 3.4 + Vite 5 + Pinia 2 + Vue Router 4  
**HTTP Client**: Axios 1.7（單一實例，`src/services/FrontAPI.ts`）  
**Form Validation**: vee-validate 4 + zod 3  
**Rich Text**: CKEditor 5（用於新聞內文）  
**Icons**: FontAwesome 7  
**Image Crop**: cropperjs 2  
**Date**: moment.js  
**UI Components**: 自定義元件（無 Element Plus / Naive UI）  
**Storage**: N/A（純前端 SPA；認證 token 存 localStorage）  
**Testing**: 無現行測試套件  
**Target Platform**: Browser（Admin Panel，Chromium-based 優先）

---

## 主要設計決策（澄清會議結論）

| 決策主題 | 確認結論 | 影響模組 |
|---------|---------|---------|
| 圖片上傳 | 前端 POST multipart → 各模組後端 endpoint → S3 → 回傳 `{ imageUrl }` | 001, 007, 011, 013, 014 |
| 列表分頁 | 後端支援 `page` + `size` 分頁，前端實作分頁元件，預設 20 筆/頁 | 全部 10 個模組 |
| DRAFT→CONFIGURED | 前端呼叫 `PUT /api/admin/lottery/{id}/status` with `status: "CONFIGURED"` | 011 |
| 店家停用 cascade | 同步停用所有相關 StoreOwner/StoreEditor，JWT 立即失效 | 013, 014 |
| RBAC ADMIN 保護 | 後端對 ADMIN 角色 `PUT .../permissions` 回傳 403 | 009 |
| 002 路由架構 | 出貨管理**整合進現有訂單管理**（擴充 `orderRoutes.ts`），不建立獨立出貨路由 | 002, 008 |
| 002 物流追蹤 | 前端**不整合**物流追蹤；配送資訊僅顯示收件資料，店家自行至物流官網查詢 | 002 |
| 002 statusHistory.operator | 後端回傳物件 `{ id, email, displayName }`；前端時間軸顯示 `displayName`（fallback to `email`） | 002 |
| 002 列表 prizes 欄位 | 後端回傳 `prizeCount: number`（精簡整數），前端直接渲染，不需 `.length` 計算 | 002 |
| 002 非法狀態轉換 | 後端回傳 HTTP 422 + `{ errorCode: "INVALID_STATUS_TRANSITION" }`；前端 Toast 顯示「此狀態無法執行該操作」 | 002 |

---

## 功能模組實作狀態

| 編號 | 功能 | Views | Routes | Service | 整體狀態 |
|------|------|-------|--------|---------|---------|
| 001 | Banner 管理 | ✅ BannerList / BannerForm | ✅ | ✅ | ✅ 已實作 |
| 002 | 出貨管理 | ⚠️ 僅列表（無詳情頁） | ⚠️ 僅列表路由 | ⚠️ 只有 prepareShipping | ❌ 待補齊 |
| 006 | 付款與點數 | ✅ AdminWallet / RechargePlanList/Form | ❌ walletRoutes 已從 router 移除 | ✅ | ⚠️ 路由待修復 |
| 007 | 新聞管理 | ✅ NewsList / NewsForm | ✅ | ✅ | ✅ 已實作 |
| 008 | 訂單管理 | ⚠️ 僅 AdminOrderList（無詳情） | ⚠️ 僅列表 | ✅ | ⚠️ 待驗證 |
| 009 | RBAC 權限 | ✅ RoleList / RoleForm / RolePermissions | ✅ | ✅ | ✅ 已實作 |
| 011 | 抽獎商品 | ✅ LotteryWithPrizesForm/List / PrizeForm/List | ✅ | ✅ | ✅ 已實作 |
| 012 | 推薦碼 | ✅ ReferralCodeList / Edit | ✅ | ✅ | ✅ 已實作 |
| 013 | 店家帳號管理 | ✅ AdminUserList / AdminUserForm | ✅ | ✅ | ✅ 已實作 |
| 014 | 店家管理 | ❌ 無任何 View | ❌ 無路由 | ✅ adminStoreService | ❌ **完全缺漏** |

---

## Project Structure

### Documentation

```text
specs/
├── main/
│   └── plan.md                  ← 本文件
└── admin/
    ├── research.md              ← 技術決策記錄
    ├── data-model.md            ← TypeScript 型別規格
    ├── quickstart.md            ← 遷移與設定指南
    ├── contracts/               ← API 合約
    │   ├── auth.md
    │   └── products.md
    ├── 001-banner-management/spec.md
    ├── 002-express-shipping/spec.md
    ├── 006-payment-points/spec.md
    ├── 007-news-management/spec.md
    ├── 008-order-management/spec.md
    ├── 009-rbac-permissions/spec.md
    ├── 011-product-lottery/spec.md
    ├── 012-referral-code/spec.md
    ├── 013-store-account-mgmt/spec.md
    └── 014-store-management/spec.md
```

### Source Code

```text
src/
├── assets/
├── components/           ← 共用元件（自定義 UI library）
├── constants/
├── hook/                 ← Composables
├── layouts/
├── router/
│   ├── index.ts          ← 主路由（children 集合）
│   ├── bannerRoutes.ts
│   ├── newsRoutes.ts
│   ├── orderRoutes.ts
│   ├── adminUserRoutes.ts
│   ├── roleRoutes.ts
│   ├── lotteryWithPrizesRoutes.ts
│   ├── adminReferralCodeRoutes.ts
│   ├── rechargePlanRoutes.ts
│   ├── walletRoutes.ts   ← ⚠️ 已建立但被 router/index.ts 移除
│   ├── frontendUserRoutes.ts
│   ├── prizeBoxRoutes.ts
│   ├── menuRoutes.ts
│   ├── marqueeRoutes.ts
│   ├── systemLogRoutes.ts
│   └── lotteryPrizeRoutes.ts
├── services/             ← API service modules（每個模組一個檔）
├── stores/               ← Pinia stores
├── types/
├── utils/
├── validators/
└── views/
    ├── Login.vue
    ├── Home.vue
    ├── NotFound.vue
    ├── adminUser/        ← 013 store-account-mgmt
    ├── banner/           ← 001 banner-management
    ├── lottery-with-prizes/  ← 011 product-lottery
    ├── lotteryPrize/     ← 011 prize management
    ├── news/             ← 007 news-management
    ├── order/            ← 008 + 002（訂單管理 + 出貨詳情，整合路由）
    ├── referral/         ← 012 referral-code
    ├── role/             ← 009 rbac-permissions
    ├── rechargePlan/     ← 006 payment-plans
    ├── wallet/           ← 006 wallet（路由已被移除）
    ├── member/           ← frontend user management
    ├── menu/
    ├── marquee/
    ├── prizeBox/
    └── systemLog/
    ← ❌ 缺少：store/（014 store-management）
```

---

## 實作計畫

### Phase 1 — 路由修復與補漏（P0）

**目標**：修復已有實作但無法存取的功能，以及補齊完全缺漏的 UI

#### Task 1.1 — 修復 006 錢包路由

- `router/index.ts` 重新引入 `walletRoutes`（目前被 comment out）
- 確認 `rechargePlanRoutes` 已正常掛載
- 驗證 `/home/wallet` 及 `/home/recharge-plan` 可以存取

#### Task 1.2 — 建立 014 店家管理 Views

- 新增 `src/views/store/StoreList.vue`
  - 列表 + 搜尋（店家名稱、狀態篩選）
  - 分頁（`page` + `size`，20 筆/頁）
  - 啟用/停用操作按鈕（含 Modal 警告：停用將連帶停用所有帳號，JWT 立即失效）
- 新增 `src/views/store/StoreForm.vue`
  - 新增／編輯店家資料
  - 圖片上傳（POST multipart → 後端 → S3 → imageUrl）
- 新增 `src/router/storeRoutes.ts` 並掛入 `router/index.ts`

#### Task 1.3 — 補齊 002 出貨管理（整合於訂單管理）

- 新增 `src/views/order/AdminOrderDetail.vue`（整合於現有 `/home/order/:orderId`）
  - 訂單基本資訊卡片（訂單編號、建立時間、狀態徽章）
  - 玩家資訊區塊（暱稱、Email）
  - 配送資訊區塊（依 `shippingMethod` 動態渲染）：
    - 超商取貨：超商類型、門市名稱、門市代碼、地址
    - 宅配：收件人姓名、電話、收件地址
    - **不提供物流追蹤**；說明文字引導店家至物流官網自行查詢
  - 獎品列表（表格：獎品圖片、名稱、等級）
  - 狀態歷程時間軸：顯示 `operator.displayName`（fallback to `operator.email`）+ 時間戳記
  - 操作區：「更新出貨狀態」下拉 + 確認按鈕（422 `INVALID_STATUS_TRANSITION` → Toast）
  - 取消訂單 Modal（原因輸入必填，最多 200 字）
- 擴充 `src/services/adminOrderService.ts`：
  - `getById(orderId)` → `GET /api/admin/orders/{id}`
  - `updateStatus(orderId, status)` → `PUT /api/admin/orders/{id}/status`（處理 422）
  - `cancelOrder(orderId, reason)` → `POST /api/admin/orders/{id}/cancel`
- 更新 `src/router/orderRoutes.ts`：新增 `{ path: 'order/:orderId', component: AdminOrderDetail }`
- 列表頁 `AdminOrderList.vue`：表格「獎品數量」欄改用 `prizeCount` 欄位（非 `prizes.length`）

---

### Phase 2 — Spec 合規驗證（P1）

**目標**：對照已澄清的 spec 逐一驗證現有實作是否符合規格

#### Task 2.1 — 001 Banner 管理

- 驗證圖片上傳是否走 `POST /api/admin/upload/banner` → 回傳 imageUrl 流程
- 驗證列表是否支援後端分頁（`page` + `size`）

#### Task 2.2 — 007 新聞管理

- 驗證圖片上傳流程（POST multipart → S3 URL）
- 驗證 CKEditor 5 整合是否正常（已安裝套件）

#### Task 2.3 — 008 訂單管理

- 驗證訂單列表支援後端分頁（`page` + `size`）
- 002 出貨詳情已整合至此路由（`/home/order/:orderId`），確認列表頁「查看詳情」連結正確導向

#### Task 2.4 — 009 RBAC 權限

- 驗證 ADMIN role 的權限編輯按鈕是否已 disabled
- 驗證收到 403 回應時的錯誤處理

#### Task 2.5 — 011 抽獎商品

- 驗證「完成配置」按鈕是否呼叫 `PUT /api/admin/lottery/{id}/status` with `status: "CONFIGURED"`
- 驗證獎品總數 = maxDraws 時按鈕才 enabled 的邏輯

#### Task 2.6 — 012 推薦碼

- 驗證列表支援後端分頁

#### Task 2.7 — 013 店家帳號管理

- 驗證圖片上傳流程（若有頭像）
- 驗證帳號停用後是否顯示 JWT 失效提示

---

### Phase 3 — Research.md 同步更新（P2）

**目標**：將澄清會議的結論同步回 `specs/admin/research.md`，消除文件矛盾

#### Task 3.1 — 修正分頁策略描述

`research.md` Section 4.1 目前說「後端不做分頁，前端負責分頁」——與澄清結論相反。更新為：
> 後端支援 `page` + `size` 分頁；前端實作 `usePagination` composable 傳入分頁參數，預設每頁 20 筆。

#### Task 3.2 — 更新圖片上傳 Action Items

`research.md` Section 5.1 的「Action needed」（選項 A/B/C）已確認為**選項 C（各資源各自的上傳端點）**。更新狀態為 ✅。

#### Task 3.3 — 更新 API 缺口紀錄

`research.md` Section 9 中已解決的項目（AV-001, AV-006 等）標記為 ✅。

---

## 實作優先序總覽

| 優先 | Task | Spec | 重要性 |
|------|------|------|-------|
| P0 🔴 | 1.2 建立 014 店家管理 Views + Routes | 014 | 完全缺漏，無法存取 |
| P0 🔴 | 1.1 修復 006 錢包路由 | 006 | 路由被移除，無法存取 |
| P0 🔴 | 1.3 補齊 002 出貨詳情 + 取消 Modal | 002 | 核心操作流程不完整 |
| P1 🟡 | 2.5 驗證 011 DRAFT→CONFIGURED 邏輯 | 011 | 核心業務流程 |
| P1 🟡 | 2.4 驗證 009 RBAC ADMIN 保護 | 009 | 安全性 |
| P1 🟡 | 2.1–2.7 Spec 合規驗證（全部） | 全部 | 功能正確性 |
| P2 🟢 | 3.1–3.3 Research.md 同步 | — | 文件一致性 |

---

## 注意事項

1. **`data-model.md` 中 PaginationState 備註**需更新：目前寫「前端分頁，後端不做分頁」——與澄清結論相反，應改為後端分頁。✅ 已更新
2. **`walletRoutes.ts` 存在**但已從 router 移除（有 comment `// walletRoutes 已移除（錢包功能已整合入會員中心）`）——需與 PM 確認是功能整合到會員中心，還是需要獨立路由。
3. **所有先前未解決的 ⚠️ 項目** — 已於 Session 2026-03-30 全部確認 ✅：
   - `businessHours` 格式：結構化 JSON `{ mon, tue, ..., sun }`，值為時間字串或 `"休息"`（014）
   - `storeIds[]`：陣列，支援多店家；API 表格原 `storeId` 為文件疏漏（013）
   - Transaction type enum：`RECHARGE` / `DRAW` / `RECYCLE` / `REFUND` / `ADMIN_ADJUST`（006）
   - Referral code 後端錯誤：HTTP 400 + `{ fieldErrors: { code: "..." } }`（012）
   - Menu icon 格式：後端回傳完整 FA class 字串（如 `"fa-solid fa-house"`），前端直接套用（009）
4. **002 AV-006**（取消後獎品退回確認）：後端保證，前端無法驗證退回結果，Deferred。

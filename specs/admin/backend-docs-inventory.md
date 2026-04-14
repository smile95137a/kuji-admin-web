# 後端邏輯文件總清單 × 前台對照報告

> 來源：`.github copy/` 資料夾（後端 Copilot 指南）  
> 對照：`kuji-admin-web` 前台管理系統（Vue 3 + TypeScript）  
> 產出日期：2025-07

---

## 目錄

1. [Skills 技能文件（10 份）](#1-skills-技能文件)
2. [Prompts 需求文件（13 份）](#2-prompts-需求文件)
3. [Instructions 開發指引（9 份）](#3-instructions-開發指引)
4. [Agents 代理人（2 份）](#4-agents-代理人)
5. [根設定文件](#5-根設定文件)
6. [前後端對照總表](#6-前後端對照總表)
7. [差異與建議](#7-差異與建議)

---

## 1. Skills 技能文件

Skills 為特定開發任務的操作手冊，描述後端具體實作步驟與規範。

| # | Skill 名稱 | 檔案路徑 | 簡介 | 對應前台模組 | 對齊狀態 |
|---|-----------|----------|------|-------------|---------|
| 1 | **add-feature-api** | `skills/add-feature-api/SKILL.md` | 新增 CRUD API 的完整開發流程：Entity → Mapper → Service → Controller，含 admin/api 雙路由範例 | 所有 Service 檔案共用此模式 | ✅ 一致 |
| 2 | **controller-testing** | `skills/controller-testing/SKILL.md` | Spring Boot Controller 測試規範：MockMvc + JUnit 5 + Mockito，涵蓋成功/驗證錯誤/404/非法輸入 | — （前台無測試框架） | ➖ 不適用 |
| 3 | **draw-flow** | `skills/draw-flow/SKILL.md` | 三種抽獎模式完整規格：一番賞（籤位制）、扭蛋（加權隨機）、刮刮樂（雙號碼機制），含點數扣除與 PrizeBox 寫入 | `adminLotteryWithPrizesService`、`adminLotteryPrizeService`、`AdminLotteryService`、Lottery views | ✅ 一致 |
| 4 | **jwt-dual-chain** | `skills/jwt-dual-chain/SKILL.md` | JWT 雙鏈安全架構：`/admin/**`（AdminJwtFilter）與 `/api/**`（ApiJwtFilter），含 UserPrincipal、SecurityUtils、403 除錯 | `FrontAPI.ts`（401 攔截 + refresh queue）、`AuthService.ts`、`authStore.ts` | ✅ 一致 |
| 5 | **mbg-workflow** | `skills/mbg-workflow/SKILL.md` | MyBatis Generator 工作流：DDL → generatorConfig → Entity/Mapper/Example 生成，含自訂 SQL 指引 | — （純後端工具） | ➖ 不適用 |
| 6 | **order-lifecycle** | `skills/order-lifecycle/SKILL.md` | 訂單狀態機 PENDING→PREPARING→SHIPPED→COMPLETED/CANCELLED，含 PrizeBox→Order 建立流程、運費規則、OrderItem 快照 | `adminOrderService.ts`（prepareShipping / shipOrder / completeOrder / cancelOrderWithReason）、Order views | ✅ 一致 |
| 7 | **rbac-menu-setup** | `skills/rbac-menu-setup/SKILL.md` | RBAC 角色與選單設定：ADMIN / STORE_OWNER / STORE_EDITOR 角色定義、選單樹、RoleMenu 權限綁定、新增選單步驟 | `adminRoleService.ts`、`adminMenuService.ts`、Role views、Menu views | ✅ 一致 |
| 8 | **s3-upload** | `skills/s3-upload/SKILL.md` | AWS S3 圖片上傳：資料夾結構（news/banner/lottery/prize/store/avatar）、檔案驗證規則、刪除處理 | `adminUploadService.ts`（uploadImage / uploadNewsImage / uploadBannerImage / uploadLotteryImage / uploadPrizeImage / deleteImage） | ✅ 一致 |
| 9 | **store-onboarding** | `skills/store-onboarding/SKILL.md` | 店家開通流程：StoreOwner 帳號建立（含交易完整性）、StoreEditor 新增、店家停用連帶商品下架、AdminUserStatus 狀態 | `adminUserService.ts`（createStoreOwner / createStoreEditor）、`adminStoreService.ts`（activate / deactivate）、AdminUser views、Store views | ✅ 一致 |
| 10 | **wallet-recharge-flow** | `skills/wallet-recharge-flow/SKILL.md` | Gold/Bonus 點數系統：點數類型與扣除規則、儲值流程、WalletTransaction 記錄、Admin 手動調整 API | `adminWalletService.ts`（getUserWallet / adjustWalletCoins / queryWalletTransactions）、`adminRechargePlanService.ts`、Wallet view | ✅ 一致 |

---

## 2. Prompts 需求文件

Prompts 為各業務模組的完整需求規格與設計原則。

| # | Prompt 名稱 | 檔案路徑 | 簡介 | 對應前台 Service | 對應前台 Views | 對齊狀態 |
|---|------------|----------|------|-----------------|---------------|---------|
| 1 | **banner** | `prompts/banner.prompt.md` | Banner 管理 v1.0：點擊導向店家頁面、店家綁定規則、首頁輪播、手動排序、上下架排程、僅 Admin 操作 | `adminBannerService.ts`（CRUD + publish/unpublish + updateOrder） | `banner/BannerList.vue`、`BannerForm.vue` | ✅ 完整 |
| 2 | **express** | `prompts/express.prompt.md` | 物流配送需求：超商取貨/宅配、玩家出貨流程、店家履約處理、取消規則、平台不介入原則 | `adminOrderService.ts`（shipOrder 含 trackingNo） | `order/AdminOrderDetail.vue` | ✅ 一致 |
| 3 | **game-management** | `prompts/game-management.prompt.md` | 抽獎遊戲管理框架：獎池概念、固定獎池/等機率機制、末獎/自動降價、保護鎖（首抽鎖定 5 分鐘）、併發控制 | `AdminLotteryService.ts`、`adminLotteryWithPrizesService.ts`、`adminLotteryPrizeService.ts` | `lottery-with-prizes/`、`lotteryPrize/` | ✅ 一致 |
| 4 | **game-to-order** | `prompts/game-to-order.prompt.md` | 玩家扭蛋完整流程：入場→抽獎→結果進 PrizeBox→選品出貨→填資訊→訂單追蹤、防作弊規則 | `adminPrizeBoxService.ts`、`adminOrderService.ts` | `prizeBox/AdminPrizeBox.vue`、`order/` | ✅ 一致 |
| 5 | **lottery-ticket-system** | `prompts/lottery-ticket-system.prompt.md` | 一番賞票號系統：ticketNumber vs revealedNumber 雙號碼機制、三種 gameMode、session 開局規則、免費抽機制、完整前端流 | `adminLotteryPrizeService.ts`（getAvailableNumbers） | `lotteryPrize/` | ✅ 一致 |
| 6 | **mastercard** | `prompts/mastercard.prompt.md` | 點數系統 v1.0：Gold/Bonus 雙幣種使用規則、儲值方式、交易類型、平台角色定義、退款原則 | `adminWalletService.ts`、`adminRechargePlanService.ts` | `wallet/AdminWallet.vue`、`rechargePlan/` | ✅ 一致 |
| 7 | **news** | `prompts/news.prompt.md` | 最新消息 v1.0：平台公告/活動說明、草稿/上架/下架狀態、排程機制、僅 Admin 操作、不含統計/分類/推播 | `adminNewsService.ts`（CRUD + publish/unpublish） | `news/NewsList.vue`、`NewsForm.vue` | ✅ 完整 |
| 8 | **order** | `prompts/order.prompt.md` | 後台訂單管理：訂單僅出貨時產生、店家強關聯、狀態機（PENDING→PREPARING→SHIPPED→COMPLETED/CANCELLED）、平台不介入 | `adminOrderService.ts`（6 支 API 完整覆蓋狀態轉換） | `order/AdminOrderList.vue`、`AdminOrderDetail.vue` | ✅ 完整 |
| 9 | **prize-box** | `prompts/prize-box.prompt.md` | 賞品盒（購物車）：抽獎結果容器、多獎品合併規則、出貨方式、訂單狀態機、玩家/店家可見規則 | `adminPrizeBoxService.ts`（getPrizeBoxByUserId / getPrizeBoxSummaryByStore） | `prizeBox/AdminPrizeBox.vue` | ✅ 一致 |
| 10 | **product-lottery** | `prompts/product-lottery.prompt.md` | 商品＋抽獎系統完整規格（Part 1 商品管理 + Part 2 扭蛋系統）：商品生命週期、獎池核心、特殊機制、刮刮樂 | `AdminLotteryService.ts`、`adminLotteryWithPrizesService.ts`、`adminLotteryPrizeService.ts` | `lottery-with-prizes/`、`lotteryPrize/` | ✅ 一致 |
| 11 | **referral** | `prompts/referral.prompt.md` | 推薦碼機制 v1.0：店家專屬、新會員註冊時填寫、推薦關係記錄（一次性不可變）、未來 Bonus 回饋預留 | `adminReferralCodeService.ts`（完整 CRUD + records + validate） | `referral/AdminReferralCodeList.vue`、`AdminReferralCodeEdit.vue` | ✅ 完整 |
| 12 | **store-account-management** | `prompts/store-account-management.prompt.md` | 後台帳號管理：DDL 設計、StoreOwner/StoreEditor 建立流程、權限管理、啟停用、首次登入改密、操作稽核 | `adminUserService.ts`（CRUD + activate/deactivate/resetPassword） | `adminUser/AdminUserList.vue`、`AdminUserForm.vue` | ✅ 完整 |
| 13 | **README** | `prompts/README.md` | `.github/` 目錄總覽：資料夾結構說明、檔案用途、開發工作流（DDL→MBG→Example）、常見錯誤、速查清單 | — （元文件） | — | ➖ 參考用 |

---

## 3. Instructions 開發指引

Instructions 為開發約束與技術規範，指導 AI Agent 的行為準則。

| # | Instruction 名稱 | 檔案路徑 | 簡介 | 涉及前台模組 | 對齊狀態 |
|---|-----------------|----------|------|-------------|---------|
| 1 | **architecture** | `instructions/architecture.instructions.md` | 專案架構與開發標準：技術棧、資料夾結構、MBG 設定、Entity/Mapper/Example 模式、AOP 回應包裝、常用命令 | `FrontAPI.ts`（API 回應解析 `res.data`） | ✅ 一致 |
| 2 | **backend** | `instructions/backend.instructions.md` | 後端開發核心清單：設計原則、模組分層、JWT 機制、Request/Response 設計、全域例外、點數/庫存/抽獎交易模式、冪等性/稽核/限流/軟刪除 | 前台 `executeApiUtils.ts` 配合統一錯誤處理 | ✅ 一致 |
| 3 | **gacha-random-draw** | `instructions/gacha-random-draw.instructions.md` | 扭蛋加權隨機實作：ICHIBAN vs GACHA 差異、加權演算法範例、抽獎流程、Controller/Service 技術細節、測試範例 | `adminLotteryPrizeService.ts`（weight 相關） | ✅ 一致 |
| 4 | **game** | `instructions/game.instructions.md` | 遊戲獎品管理規則：獎品欄位、固定獎池邏輯、機率原則（1/剩餘數）、刮刮樂機制、末獎規則、自動降價、保護鎖 | `adminLotteryPrizeService.ts`、`lotteryOptions.ts` | ✅ 一致 |
| 5 | **permissions** | `instructions/permissions.instructions.md` | RBAC 權限系統：Role/Menu/RoleMenu 定義、權限檢查機制、資料隔離原則、商品管理規則、API 功能需求、權限矩陣 | `adminRoleService.ts`、`adminMenuService.ts`、Role/Menu views | ✅ 一致 |
| 6 | **scratch-card-flow** | `instructions/scratch-card-flow.instructions.md` | 刮刮樂完整 API 指南：gameMode 說明、完整流程圖、API 呼叫序列、4 種情境 walkthrough、錯誤處理、前端狀態管理程式碼範例 | `adminLotteryPrizeService.ts`（getAvailableNumbers） | ✅ 一致 |
| 7 | **store-user** | `instructions/store-user.instructions.md` | 帳號/店家管理：系統概覽、架構原則、帳號建立/權限/店家資料/稽核日誌 主要功能、功能需求 | `adminUserService.ts`、`adminStoreService.ts`、Store/AdminUser views | ✅ 一致 |
| 8 | **store** | `instructions/store.instructions.md` | 店家模組標準：Store 資料欄位、前台顯示邏輯、模組關聯（Lottery/Banner/Reports）、建立/編輯/停用（連帶效果）、權限矩陣 | `adminStoreService.ts`（queryStores / update / activate / deactivate） | ✅ 一致 |
| 9 | **user** | `instructions/user.instructions.md` | 會員系統需求：前台玩家/後台管理員 雙角色、資料表設計、帳號建立流程、登入安全、Gold/Bonus 點數 | `adminFrontendUserService.ts`、`adminAuthService.ts`、`authStore.ts` | ✅ 一致 |

---

## 4. Agents 代理人

| # | Agent 名稱 | 檔案路徑 | 簡介 |
|---|-----------|----------|------|
| 1 | **controller-crud-test** | `agents/controller-crud-test.agent.md` | 自動撰寫 Controller CRUD 測試套件：Spring Boot / MockMvc / Mockito / JUnit 5，含成功/驗證錯誤/404/非法輸入/邊界案例 |
| 2 | **copilot-instructions** | `agents/copilot-instructions.md` | Agent 行為根設定，與根目錄 `copilot-instructions.md` 對應 |
| 3–11 | **speckit.\*** (9 支) | `agents/speckit.*.agent.md` | SpecKit 工作流代理人：analyze / checklist / clarify / constitution / implement / plan / specify / tasks / taskstoissues |

---

## 5. 根設定文件

| 檔案 | 簡介 |
|------|------|
| `copilot-instructions.md` | **主參考文件（3000+ lines）**：技術棧總覽、雙路由安全架構、JWT 結構、SecurityUtils 正確用法、AOP 統一回應、MyBatis 慣例、資料初始化、權限檢查模式、常見問題除錯、StoreID 自動帶入、Query API 設計模式（BaseCondition + QueryReq）、不可觸碰風險區、刮刮樂雙號碼架構 |

---

## 6. 前後端對照總表

### 按業務模組排序

| 業務模組 | 後端 Skill | 後端 Prompt | 後端 Instruction | 前台 Service | 前台 Views | 前台 Routes | 前台 Store |
|---------|-----------|------------|-----------------|-------------|-----------|-------------|-----------|
| **Auth 認證** | jwt-dual-chain | — | user | `adminAuthService` / `AuthService` / `FrontAPI` | `Login.vue` | index.ts | `authStore` |
| **Banner 管理** | s3-upload | banner | — | `adminBannerService` | `banner/` (2) | bannerRoutes | `useBannerStore` |
| **News 最新消息** | s3-upload | news | — | `adminNewsService` | `news/` (2) | newsRoutes | `useNewsStore` |
| **Lottery 抽獎** | draw-flow | game-management, product-lottery, lottery-ticket-system | gacha-random-draw, game | `AdminLotteryService` / `adminLotteryPrizeService` / `adminLotteryWithPrizesService` | `lottery-with-prizes/` (2), `lotteryPrize/` (2) | lotteryWithPrizesRoutes, lotteryPrizeRoutes | `useLotteryStore` |
| **PrizeBox 賞品盒** | draw-flow | game-to-order, prize-box | — | `adminPrizeBoxService` | `prizeBox/` (1) | prizeBoxRoutes | — |
| **Order 訂單** | order-lifecycle | order, express | — | `adminOrderService` | `order/` (2) | orderRoutes | — |
| **Wallet 錢包** | wallet-recharge-flow | mastercard | — | `adminWalletService` | `wallet/` (1) | walletRoutes | — |
| **Recharge 儲值方案** | wallet-recharge-flow | mastercard | — | `adminRechargePlanService` | `rechargePlan/` (2) | rechargePlanRoutes | — |
| **Store 店家** | store-onboarding | store-account-management | store, store-user | `adminStoreService` | `store/` (5) | storeRoutes | — |
| **AdminUser 帳號** | store-onboarding | store-account-management | store-user, user | `adminUserService` | `adminUser/` (2) | adminUserRoutes | `useAdminUserStore` |
| **RBAC 角色/選單** | rbac-menu-setup | — | permissions | `adminRoleService` / `adminMenuService` | `role/` (3), `menu/` (3) | roleRoutes, menuRoutes | — |
| **Referral 推薦碼** | — | referral | — | `adminReferralCodeService` | `referral/` (2) | adminReferralCodeRoutes | — |
| **Marquee 跑馬燈** | — | — | — | `adminMarqueeService` | `marquee/` (2) | marqueeRoutes | — |
| **Upload 上傳** | s3-upload | — | — | `adminUploadService` | — （嵌入各表單） | — | — |
| **Report 報表** | — | — | — | `adminReportService` | — （嵌入各頁面） | — | — |
| **SystemLog 日誌** | — | — | — | `adminSystemLogService` | `systemLog/` (1) | systemLogRoutes | — |
| **Frontend User 會員** | — | — | user | `adminFrontendUserService` | `member/` (2) | frontendUserRoutes | `useMemberStore` |
| **Category 分類** | — | — | — | `adminCategoryService` | — | — | — |
| **Contact 客服** | — | — | — | `adminContactInquiryService` | — | — | — |
| **Consumption 消費紀錄** | — | — | — | `adminConsumptionRecordService` | — | — | — |

---

## 7. 差異與建議

### 7.1 完全對齊的模組 ✅

以下模組的後端文件與前台實作完全對齊，API endpoint、狀態流轉、權限規則均一致：

- **Banner**: Service CRUD + publish/unpublish + order 均有對應
- **News**: Service CRUD + publish/unpublish 均有對應
- **Order**: 6 支 API 完整覆蓋後端 5 種狀態轉換（含 cancelWithReason）
- **Lottery/PrizeBox**: 三層服務（Lottery / LotteryPrize / LotteryWithPrizes）完整覆蓋後端三種抽獎模式
- **Wallet/Recharge**: 查詢錢包 / 手動調整 / 交易記錄 / 儲值方案 CRUD 均有對應
- **Store/AdminUser**: 帳號建立（Owner/Editor）、啟停用、店家 CRUD 完整
- **RBAC**: Role CRUD + setPermissions、Menu CRUD + getTree + getAccessibleTree 完整
- **Referral**: CRUD + records + validate 完整
- **Auth**: login / logout / refreshToken / changePassword / firstLoginChangePassword 完整

### 7.2 前台有但後端文件未涵蓋的模組 ⚠️

| 前台模組 | Service 存在 | 後端文件缺失 | 建議 |
|---------|-------------|-------------|------|
| **Marquee 跑馬燈** | `adminMarqueeService.ts`（6 支 API） | 無 Skill / Prompt / Instruction | 建議補寫 `marquee.prompt.md` 需求文件 |
| **SystemLog 系統日誌** | `adminSystemLogService.ts`（4 支 API） | 無 Skill / Prompt / Instruction | 建議補寫 `system-log.instructions.md` |
| **Report 報表** | `adminReportService.ts`（5 支 API） | 無 Skill / Prompt / Instruction | 建議補寫 `report.prompt.md` 需求文件 |
| **Category 分類** | `adminCategoryService.ts`（4 支 API） | 無 Skill / Prompt / Instruction | 建議補寫，或併入 product-lottery prompt |
| **ContactInquiry 客服** | `adminContactInquiryService.ts`（4 支 API） | 無 Skill / Prompt / Instruction | 建議補寫 `contact-inquiry.prompt.md` |
| **ConsumptionRecord 消費紀錄** | `adminConsumptionRecordService.ts`（1 支 API） | 無 Skill / Prompt / Instruction | 建議併入 wallet 或 order 相關文件 |
| **FrontendUser 前台會員** | `adminFrontendUserService.ts`（7 支 API） | 僅 `user.instructions.md` 概述 | 建議補寫 `frontend-user.prompt.md` |

### 7.3 後端文件有但前台暫未呈現的功能

| 後端描述 | 相關文件 | 前台現狀 | 備註 |
|---------|---------|---------|------|
| 刮刮樂完整前端狀態管理 | `scratch-card-flow.instructions.md` | 無獨立刮刮樂管理頁 | 目前整合在 LotteryWithPrizes 表單內，為前台玩家端功能 |
| 免費抽機制 | `lottery-ticket-system.prompt.md` | 前台管理端不需要 | 屬於前台玩家端 API |
| 保護鎖（5 分鐘首抽鎖定） | `game-management.prompt.md` | 前台管理端不需要 | 屬於後端自動機制 |
| 獨立 Lottery CRUD | `AdminLotteryService.ts` 有對應 | `lottery/` views 資料夾為空 | 已被 LotteryWithPrizes 組合模式取代 |

### 7.4 API 路徑對照確認

| 後端 basePath | 前台 Service basePath | 一致 |
|--------------|----------------------|------|
| `/admin/auth` | `/admin/auth` | ✅ |
| `/admin/banner` | `/admin/banner` | ✅ |
| `/admin/news` | `/admin/news` | ✅ |
| `/admin/lottery` | `/admin/lottery` | ✅ |
| `/admin/lotteries` | `/admin/lotteries` | ✅ |
| `/admin/lottery-with-prizes` | `/admin/lottery-with-prizes` | ✅ |
| `/admin/orders` | `/admin/orders` | ✅ |
| `/admin/wallet` | `/admin/wallet` | ✅ |
| `/admin/recharge-plan` | `/admin/recharge-plan` | ✅ |
| `/admin/stores` | `/admin/stores` | ✅ |
| `/admin/users` | `/admin/users` | ✅ |
| `/admin/roles` | `/admin/roles` | ✅ |
| `/admin/menus` | `/admin/menus` | ✅ |
| `/admin/referral-codes` | `/admin/referral-codes` | ✅ |
| `/admin/marquee` | `/admin/marquee` | ✅ |
| `/admin/upload` | `/admin/upload` | ✅ |
| `/admin/prize-box` | `/admin/prize-box` | ✅ |
| `/admin/system-log` | `/admin/system-log` | ✅ |
| `/admin/report` | `/admin/report` | ✅ |
| `/admin/category` | `/admin/category` | ✅ |
| `/admin/frontend-users` | `/admin/frontend-users` | ✅ |
| `/admin/contact-inquiries` | `/admin/contact-inquiries` | ✅ |
| `/admin/consumption-records` | `/admin/consumption-records` | ✅ |

### 7.5 訂單狀態 API 細節比對

| 後端 Skill 定義 | 前台 Service 實作 | 匹配 |
|---------------|-----------------|------|
| `PUT /admin/orders/{id}/preparing` | `prepareShipping` → `PUT /{id}/prepare` | ⚠️ 路徑差異：`preparing` vs `prepare` |
| `PUT /admin/orders/{id}/ship` (body: trackingNo) | `shipOrder` → `PUT /{id}/ship` (body) | ✅ |
| `PUT /admin/orders/{id}/complete` | `completeOrder` → `PUT /{id}/complete` | ✅ |
| `PUT /admin/orders/{id}/cancel` | `cancelOrderWithReason` → `POST /{id}/cancel` | ⚠️ 方法差異：`PUT` vs `POST` |

> **注意**：以上 2 處 API 差異需要確認後端最新實作。如果後端已更新，前台 Service 應一併調整。

---

## 附錄：檔案數量統計

| 類別 | 數量 |
|------|------|
| Skills（SKILL.md） | 10 |
| Prompts（.prompt.md） | 13 + 1 README |
| Instructions（.instructions.md） | 9 |
| Agents（.agent.md） | 2 + 9 SpecKit |
| 根設定 | 1 |
| **後端文件總計** | **36** |
| 前台 Service 檔案 | 25 |
| 前台 View 目錄 | 18 |
| 前台 Route 檔案 | 17 |
| 前台 Store 檔案 | 9 |

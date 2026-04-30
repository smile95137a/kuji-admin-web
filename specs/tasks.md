# Tasks: KUJI Admin Panel — 10 Feature Modules

**Plan reference**: `specs/main/plan.md`  
**Spec references**: `specs/admin/*/spec.md`  
**Generated**: 2026-03-30 / Updated: 2026-03-30 (Phase 11–17 added)  
**Total tasks**: 73  
**Tech stack**: Vue 3.4 + Vite 5 + Pinia 2 + Vue Router 4 + TypeScript 5 + Axios 1.7

---

## Legend

- `[P]` — Parallelizable (no dependency on in-progress sibling tasks)
- `[US1]` … `[US8]` — User story label (see mapping below)
- Tasks without `[US]` are Setup / Foundational / Polish phase tasks

### User Story Mapping

| Label | Module | 使用者故事 | 優先 |
|-------|--------|-----------|------|
| [US1] | 002 | 更新訂單狀態（待出貨 → 準備中 → 已出貨 → 已完成）| P1 |
| [US2] | 002 | 取消「待出貨」/「準備中」訂單 | P1 |
| [US3] | 002 | Admin 跨店家查看所有訂單列表 | P2 |
| [US4] | 014 | Admin 查看與搜尋所有店家列表 | P1 |
| [US5] | 014 | Admin 停用店家（含 cascade 警告 + 名稱確認）| P1 |
| [US6] | 014 | StoreOwner/Admin 編輯店家資訊（含 businessHours）| P1 |
| [US7] | 014 | Admin 啟用已停用店家 | P2 |
| [US8] | 006 | 錢包 / 儲值方案路由修復後可正常存取 | P0 |
| [US9] | 001 | Admin 新增廣告並發布 | P1 |
| [US10] | 001 | Admin 調整廣告顯示順序 | P2 |
| [US11] | 001 | Admin 取消發布 / 刪除廣告 | P2 |
| [US12] | 006 | Admin 管理儲值方案（CRUD + 啟停）| P1 |
| [US13] | 006 | Admin 手動調整玩家點數 | P1 |
| [US14] | 006 | Admin 查詢全站交易記錄 | P2 |
| [US15] | 007 | Admin 建立消息並立即發布 | P1 |
| [US16] | 007 | Admin 建立草稿並排程發布 | P1 |
| [US17] | 007 | Admin 封存舊消息 | P2 |
| [US18] | 009 | Admin 設定角色選單權限 | P1 |
| [US19] | 009 | 後台側邊欄依角色動態渲染 | P1 |
| [US20] | 011 | 建立抽獎商品並完成獎品配置（DRAFT→CONFIGURED）| P1 |
| [US21] | 011 | Admin 強制上架 / 下架商品 | P1 |
| [US22] | 012 | Admin 新增 / 停用推薦碼 | P1 |
| [US23] | 013 | Admin 建立店家管理員帳號與店家 | P1 |
| [US24] | 013 | Admin 停用 / 啟用帳號 | P1 |

---

## Phase 1 — Setup：路由修復（P0 Blocking）

> 無法存取的功能先通路，讓後續驗證可即時測試。依序執行，T003 depends on T002。

- [ ] T001 Re-enable `walletRoutes` in `src/router/index.ts` — 取消 comment，使 `/home/wallet` 及 `/home/recharge-plan` 可存取（注意：plan.md 注意事項 2 說明需 PM 確認此路由是否仍屬後台，若確認整合入會員中心則保留 comment 並記錄原因）
- [ ] T002 Create `src/router/storeRoutes.ts` — 定義 4 條路由：`{ path: 'stores', component: StoreList }`, `{ path: 'stores/:id', component: StoreDetail }`, `{ path: 'stores/:id/edit', component: StoreEdit }`, `{ path: 'store/profile', component: StoreEdit }`（roles: ROLE_STORE_OWNER）
- [ ] T003 Register `storeRoutes` in `src/router/index.ts` — 於 children array import 並加入 storeRoutes（與 adminUserRoutes 相鄰，保持命名一致性）

---

## Phase 2 — Foundational：Service 擴充

> T004 must complete before Phase 3 tasks that call order detail API.

- [ ] T004 Extend `src/services/adminOrderService.ts` — 新增三個方法：`getById(orderId: string)` → `GET /api/admin/orders/{id}`；`updateStatus(orderId: string, status: string)` → `PUT /api/admin/orders/{id}/status`（含 HTTP 422 錯誤捕捉 + 回傳 errorCode）；`cancelOrder(orderId: string, reason: string)` → `POST /api/admin/orders/{id}/cancel`

---

## Phase 3 — 002 出貨管理：US1 訂單詳情 + 狀態更新（P1）

> 建立 AdminOrderDetail.vue。T005 為骨架，T006–T009 為各區塊（可平行開發，最後整合）。

- [ ] T005 [US1] Create `src/views/order/AdminOrderDetail.vue` — 頁面骨架：返回按鈕、麵包屑、訂單基本資訊卡片（orderNo、建立時間、狀態徽章 per FR-UI-001 色碼）、玩家資訊區塊（nickname、email）；呼叫 `adminOrderService.getById` 初始化，loading spinner
- [ ] T006 [P] [US1] Add shipping info block to `src/views/order/AdminOrderDetail.vue` — 依 `shippingInfo.method` 條件渲染兩種格式：超商取貨（type、stationName、stationCode、address）/ 宅配（recipientName、phone、address）；顯示靜態說明文字「如需追蹤物流，請至各物流官網以收件資訊查詢」（FR-UI-005，AV-008）
- [ ] T007 [P] [US1] Add prize list table to `src/views/order/AdminOrderDetail.vue` — 表格欄位：獎品圖片（40×40 縮圖）、名稱、等級；超過 10 件加內部捲動
- [ ] T008 [P] [US1] Add status history timeline to `src/views/order/AdminOrderDetail.vue` — 垂直時間軸，最新在上；每筆顯示狀態名稱、`operator.displayName`（fallback to `operator.email`）、timestamp（FR-UI-004，AV-003）
- [ ] T009 [US1] Add status update action area to `src/views/order/AdminOrderDetail.vue` — 依當前狀態渲染對應按鈕（FR-UI-003：待出貨→「開始準備」、準備中→「標記已出貨」、已出貨→「確認完成」、已完成/已取消→無按鈕）；呼叫 `updateStatus`；捕捉 HTTP 422 + `errorCode === "INVALID_STATUS_TRANSITION"` 顯示 Toast「此狀態無法執行該操作」（SM-002，AV-005）

---

## Phase 4 — 002 出貨管理：US2 取消訂單（P1）

- [ ] T010 [US2] Add cancel order Modal to `src/views/order/AdminOrderDetail.vue` — 嵌入式 Modal：取消原因 textarea（必填，最多 200 字，vee-validate 驗證）、警告文字「取消後獎品將退回玩家的獎品箱，此操作無法復原」；「取消訂單」按鈕僅在狀態為 PENDING_SHIPMENT 或 PREPARING 時顯示（FR-UI-006）；呼叫 `cancelOrder`；成功後關閉 Modal + 重新載入頁面（SM-004）
- [ ] T011 Update `src/router/orderRoutes.ts` — 新增 child route：`{ path: ':orderId', name: 'AdminOrderDetail', component: AdminOrderDetail }`；確認 AdminOrderList.vue 的「查看詳情」操作連結使用 `router.push('/home/order/' + row.id)`
- [ ] T012 [US3] Fix `src/views/order/AdminOrderList.vue` — 將表格「獎品數量」欄改為讀取 `row.prizeCount`（而非 `row.prizes?.length`）；ROLE_ADMIN 顯示「店家名稱」欄，ROLE_STORE_OWNER 隱藏（FR-UI-007，AV-004）

---

## Phase 5 — 014 店家管理：US4 店家列表（P1）

- [ ] T013 [US4] Create `src/views/store/StoreList.vue` — 頁面標題「店家管理」；篩選列（狀態下拉：全部/啟用/停用、關鍵字搜尋 debounce 300ms）；呼叫 `adminStoreService.queryStores({ condition, page: 1, size: 20 })` 初始化；skeleton loading（SM-001）
- [ ] T014 [P] [US4] Add data table + pagination to `src/views/store/StoreList.vue` — 表格欄位：Logo 圓形縮圖 40×40（無圖則顯示店名首字）、店家名稱、簡短描述、管理員 Email、商品數量（可點擊跳轉）、狀態徽章（啟用綠/停用灰）、操作（查看詳情、編輯、啟用/停用）；分頁元件（page + size 傳入 API）；空狀態提示

---

## Phase 6 — 014 店家管理：US5 停用店家（P1）

- [ ] T015 [US5] Create `src/views/store/StoreDisableModal.vue` — Modal 含紅色 Header；cascade 影響清單（所有商品自動下架、廣告停用、相關帳號 JWT 立即失效）；「已成立的訂單不受影響」說明；「重新啟用不會自動恢復商品與廣告」說明；店家名稱輸入框（input event 即時比對，大小寫敏感，比對正確才 enable 確認按鈕）（FR-UI-002, FR-UI-003, SM-006）
- [ ] T016 [P] [US5] Create `src/views/store/StoreEnableModal.vue` — 確認 Modal：包含「注意：啟用後原有商品與廣告不會自動恢復，需店家管理員手動上架」提示（FR-UI-009）；一般確認/取消按鈕（無名稱輸入需求）
- [ ] T017 [US5] Wire disable/enable flow in `src/views/store/StoreList.vue` — 操作欄點擊「停用」開啟 StoreDisableModal，確認後呼叫 `adminStoreService.deactivateStore(id)`；點擊「啟用」開啟 StoreEnableModal，確認後呼叫 `adminStoreService.activateStore(id)`；成功後樂觀更新狀態徽章（SM-002）

---

## Phase 7 — 014 店家管理：US6 編輯店家資訊（P1）

- [ ] T018 [US6] Create `src/views/store/StoreEdit.vue` — 表單骨架：返回按鈕、頁面標題「編輯店家資訊」；基本資訊區塊（店家名稱必填、簡短描述必填最多 100 字含字數計數、完整描述富文本可選）；聯絡資訊（Email 格式驗證、電話、地址）；社群連結（Facebook、Instagram URL 格式驗證）；「儲存變更」/「取消」按鈕；離開前未儲存確認對話框（SM-004）；呼叫 `adminStoreService.getById(id)` 預填資料
- [ ] T019 [P] [US6] Add `businessHours` editor block to `src/views/store/StoreEdit.vue` — 7 列（mon/tue/wed/thu/fri/sat/sun 中文星期標籤）；每列含時間輸入框（如 "10:00-21:00"）+ 「休息」checkbox；勾選「休息」則 disable 時間輸入並設為 "休息"；PUT 時傳入完整 `businessHours` 物件（AV-004 確認格式）
- [ ] T020 [P] [US6] Add image upload to `src/views/store/StoreEdit.vue` — Logo 上傳區（建議尺寸說明、cropperjs 裁切、5MB 大小限制）+ 封面上傳區；上傳流程：POST `multipart/form-data` → 後端 → S3 → 回傳 `{ imageUrl }` → 存入表單欄位；上傳中顯示 loading，錯誤顯示 Toast（spec plan 圖片上傳決策）
- [ ] T021 [US6] Add STORE_EDITOR readonly mode to `src/views/store/StoreEdit.vue` — 若 `authStore.role === 'ROLE_STORE_EDITOR'`：顯示頂部橘色橫幅「您的角色無法編輯店家資訊」，所有表單欄位設為 disabled，隱藏「儲存變更」按鈕（頁面 5 spec，014 US3 AC2）
- [ ] T022 [US6] Register save action in `src/views/store/StoreEdit.vue` — 「儲存變更」觸發 vee-validate 全表單驗證；通過後呼叫 `adminStoreService.updateStore(id, formData)`；成功 Toast「店家資訊已更新」；Admin 路由（`/home/stores/:id/edit`）與 StoreOwner 路由（`/home/store/profile`）共用同一元件，依 `authStore` 取得 storeId

---

## Phase 8 — 014 店家管理：US7 店家詳情 + 啟用（P2）

- [ ] T023 [US7] Create `src/views/store/StoreDetail.vue` — 封面圖片橫幅（大圖）；Logo 圓形裁切 + 店家名稱 + 狀態徽章；簡短/完整描述（富文本渲染）；聯絡資訊 + 社群連結（icon + 新分頁開啟）；businessHours 唯讀展示（7 天表格）；管理員資訊（僅 ROLE_ADMIN 可見，點擊跳轉帳號詳情）；操作按鈕「編輯店家資訊」/ 「啟用/停用」；已停用店家頂部顯示全寬橘色警告橫幅「此店家已停用」（FR-UI-004）；商品數量點擊跳轉（FR-UI-008）
- [ ] T024 [US8] Wire enable/disable in `src/views/store/StoreDetail.vue` — 整合 StoreDisableModal + StoreEnableModal；StoreEnableModal 確認後呼叫 `activateStore`，成功後更新頁面狀態徽章 + 移除停用警告橫幅；觸發已啟用 Toast「店家已啟用，請提醒管理員手動重新上架商品」

---

## Phase 9 — Spec 合規驗證（現有模組）

> 每項為獨立驗證 + 修復任務，可全部平行執行。

- [ ] T025 [P] Verify `src/views/banner/` image upload in 001 — 確認 BannerForm.vue 圖片上傳呼叫 `POST /api/admin/upload/banner`（而非通用端點）且回傳 imageUrl；確認列表呼叫使用 `page` + `size` 參數；如有差異直接修正
- [ ] T026 [P] Verify `src/views/wallet/` routes accessible after T001 fix — 確認 `/home/wallet` 可導向 AdminWallet.vue；確認 `/home/recharge-plan` 可導向 RechargePlanList.vue；確認 006 交易記錄篩選下拉的 type 選項使用確認 enum（`RECHARGE/DRAW/RECYCLE/REFUND/ADMIN_ADJUST`）中文標籤
- [ ] T027 [P] Verify 011 lottery DRAFT→CONFIGURED flow in `src/views/lottery-with-prizes/` — 確認「完成配置」按鈕呼叫 `PUT /api/admin/lottery/{id}/status` with `{ status: "CONFIGURED" }`；確認按鈕啟用條件為已新增獎品數量 = maxDraws
- [ ] T028 [P] Verify 009 RBAC ADMIN protection in `src/views/role/` — 確認 ADMIN 角色的所有 permission checkbox 均為 disabled；確認收到 403 時顯示 Toast「系統管理員角色權限不可修改」；確認側邊欄 icon 渲染使用 `<i :class="item.icon">` 直接套用後端完整 FA class 字串（AV-003）
- [ ] T029 [P] Verify 013 StoreEditor creation form in `src/views/adminUser/` — 確認建立 StoreEditor 時 Request body 傳送 `storeIds: string[]`（而非單值 `storeId`）；確認關聯店家選擇器支援多選且送出時至少一間（AV-004 已更新）
- [ ] T030 [P] Verify 012 referral code error handling in `src/views/referral/` — 確認格式驗證為即時 client-side（regex：`/^[A-Z0-9]{6,12}$/`）；確認後端 HTTP 400 + `{ fieldErrors: { code: "..." } }` 時將 `fieldErrors.code` 訊息顯示在 code 欄位下方（AV-006）
- [ ] T031 [P] Verify 008 order list pagination in `src/views/order/AdminOrderList.vue` — 確認列表呼叫 `POST /api/admin/orders/list` 帶 `page` + `size` 參數；確認分頁元件存在且換頁觸發重新查詢

---

## Phase 10 — Polish & Documentation

- [ ] T032 Update `specs/admin/research.md` — Section 4.1 分頁說明改為後端分頁（已於 data-model.md 修正，同步 research.md）；Section 5.1 圖片上傳 Action Items 標記為 ✅ 選項 C；Section 9 AV 缺口表：已確認項目（enum、icon、storeIds、businessHours、referral error）全部標記 ✅
- [ ] T033 Final smoke test checklist — 人工確認以下路由均可正常存取：`/home/stores`（014 列表）、`/home/stores/1/edit`（014 編輯）、`/home/wallet`（006 錢包）、`/home/recharge-plan`（006 儲值方案）、`/home/order/1`（002 出貨詳情）；確認側邊欄動態選單顯示正確 icon；記錄任何 404 或空白頁問題

---

## Dependency Graph

```
T001 ──────────────────────────────► T026 (驗證 wallet 路由)
T002 ──► T003 (storeRoutes 掛入 router)
             │
             ▼
         T013 ──► T014 ──► T017 (disable/enable wired)
         T015 ─┘           │
         T016 ─┘           ▼
                       T023 ──► T024 (啟用流程)
                       T018 ──► T019 (可平行)
                       T018 ──► T020 (可平行)
                       T018 ──► T021
                       T021 ──► T022

T004 ──► T005 ──► T006 (可平行)
              ──► T007 (可平行)
              ──► T008 (可平行)
              ──► T009 ──► T010 ──► T011 ──► T012
```

## Parallel Execution Examples

### Sprint 1（P0）— 路由修復 + Service

```
Thread A: T001 → T026
Thread B: T002 → T003
Thread C: T004
```

### Sprint 2（P1）— 002 出貨詳情

```
Thread A: T005 → T009 → T010 → T011 → T012
Thread B: T006（T005 完成後即可開始）
Thread C: T007（T005 完成後即可開始）
Thread D: T008（T005 完成後即可開始）
```

### Sprint 3（P1）— 014 店家管理

```
Thread A: T013 → T014 → T017
Thread B: T015 → T017
Thread C: T016 → T017
Thread D: T018 → T022
Thread E: T019（T018 完成後，可與 T020/T021 平行）
Thread F: T020（T018 完成後）
Thread G: T021（T018 完成後）
```

### Sprint 4（P1/P2）— 驗證 + Polish

```
T023 → T024        （014 詳情頁）
T025 ~ T031       （全部平行）
T032 → T033       （最後收尾）
```

---

## Implementation Strategy

**MVP Scope（最小可驗收交付）**：完成 T001–T012 即可讓 002 出貨管理完整可用，006 錢包路由可存取。

**Increment 2**：T013–T024 完成 014 店家管理全模組。

**Increment 3**：T025–T031 Spec 合規確認，修正任何差異。

**Done**：T032–T033 文件更新 + 最終確認。

---

## Independent Test Criteria Per User Story

| US | 可獨立驗證的測試情境 |
|----|-------------------|
| US1 (002) | 進入 `/home/order/{id}` 顯示詳情；點擊「開始準備」API 呼叫成功；狀態徽章即時更新；422 回傳時 Toast 出現「此狀態無法執行該操作」 |
| US2 (002) | 點擊「取消訂單」出現 Modal；原因空白送出顯示驗證錯誤；已出貨訂單「取消訂單」按鈕 disabled |
| US3 (002) | Admin 角色列表顯示「店家名稱」欄；prizeCount 欄正確顯示整數 |
| US4 (014) | `/home/stores` 顯示列表；搜尋/篩選觸發 API 並更新結果；分頁元件功能正常 |
| US5 (014) | 停用 Modal 店家名稱未輸入時確認按鈕 disabled；正確輸入後確認成功；API `deactivateStore` 呼叫正確 |
| US6 (014) | 編輯表單預填資料；businessHours 7 天全部可輸入；圖片上傳後 imageUrl 帶入表單；儲存呼叫 PUT API |
| US7 (014) | StoreDetail 顯示全部資訊；已停用店家顯示橘色橫幅；點擊啟用後橫幅消失 |
| US8 (006) | `/home/wallet` 和 `/home/recharge-plan` 均可存取且不顯示 404 |
| US9 (001) | 新增廣告表單：店家必選、圖片必填；儲存後廣告出現在列表（未發布）；點擊「發布」後狀態變為已發布 |
| US10 (001) | 上移/下移按鈕功能正確；第一筆上移 disabled，最後一筆下移 disabled |
| US11 (001) | 已發布廣告點擊「取消發布」→ 狀態變未發布；點擊「刪除」出現確認 Dialog；已發布廣告刪除提示先取消發布 |
| US12 (006) | 新增方案表單驗證；停用方案以 PUT isActive:false 送出；刪除出現確認 Dialog |
| US13 (006) | 搜尋玩家後顯示餘額；調整金額正負值顏色正確；原因必填驗證；成功後餘額即時更新 |
| US14 (006) | 交易記錄列表顯示 5 種 type 中文標籤；篩選條件組合有效；金幣/贈點正負值顏色區分 |
| US15 (007) | 新增消息含 TipTap 編輯器；點擊「立即發布」→ 狀態 PUBLISHED；標題空白時驗證錯誤 |
| US16 (007) | 設定未來發布時間儲存草稿 → 狀態 SCHEDULED；下架時間早於發布時間顯示驗證錯誤 |
| US17 (007) | 點擊「封存」→ 狀態 ARCHIVED；取消發布 → 狀態 ARCHIVED（非 DRAFT）|
| US18 (009) | ADMIN 角色 checkbox 全部 disabled；STORE_OWNER 可勾選並儲存；403 時顯示對應 Toast |
| US19 (009) | 側邊欄 icon 使用後端 FA class 字串；STORE_EDITOR 超出 STORE_OWNER 權限時顯示 tooltip 提示 |
| US20 (011) | 獎品總數 = maxDraws 時「完成配置」啟用；點擊後呼叫 PUT status:CONFIGURED；狀態升為已配置 |
| US21 (011) | 上架呼叫 PUT status:ON_SHELF；下架呼叫 PUT status:OFF_SHELF；所有狀態由前端觸發 |
| US22 (012) | 推薦碼格式 `/^[A-Z0-9]{6,12}$/` 即時驗證；後端 400 fieldErrors.code 顯示於欄位下方；複製到剪貼板 Toast |
| US23 (013) | 2 步驟表單；步驟切換資料保留；建立成功 Toast 含 email；Email 重複顯示欄位錯誤 |
| US24 (013) | 停用帳號後狀態徽章變灰；停用自己帳號顯示錯誤；啟用後恢復正常 |

---

## Phase 11 — 001 橫幅廣告：Spec 合規修正

> `BannerList.vue` + `BannerForm.vue` 已存在，以下為 spec 合規補強。

- [ ] T034 [US9] Fix `src/views/banner/BannerForm.vue` — 確認表單欄位完整：店家選擇器（必選，`GET /api/admin/stores` 下拉搜尋）、圖片上傳調用 `POST /api/admin/upload/banner`（multipart → 回傳 imageUrl）、displayOrder 正整數驗證（最小 1）、publishTime / unpublishTime DateTimePicker（可選，支援清除）；下架時間早於發布時間顯示驗證錯誤（001 US2 AC3）
- [ ] T035 [P] [US9] Fix `src/views/banner/BannerList.vue` status badge — 狀態徽章三種：已發布（`PUBLISHED`，綠）、未發布（`UNPUBLISHED`，灰）、排程中（若 backend 確認有 `SCHEDULED` enum 則加藍；暫時以 `publishTime 存在且為未來時間` fallback 判斷）；修正空狀態文字為「尚無任何廣告，請點擊「新增廣告」建立第一筆廣告。」
- [ ] T036 [P] [US10] Add up/down ordering to `src/views/banner/BannerList.vue` — 每列操作區加「上移」/「下移」按鈕；第一列上移 disabled，最後一列下移 disabled（FR-UI-006）；點擊呼叫 `PUT /api/admin/banners/{id}` 更新 displayOrder（與相鄰項交換值）；不做拖曳排序
- [ ] T037 [P] [US11] Fix publish / unpublish / delete in `src/views/banner/BannerList.vue` — 發布：`POST /api/admin/banners/{id}/publish`，成功後 optimistic 更新狀態徽章（SM-004）；取消發布：`POST /api/admin/banners/{id}/unpublish`；刪除：先檢查狀態，若為 `PUBLISHED` 顯示提示「請先取消發布再刪除」（AV-009），未發布則開確認 Dialog（FR-UI-007）再呼叫 `DELETE /api/admin/banners/{id}`

---

## Phase 12 — 006 付款與點數：新頁面 + Spec 合規

> `RechargePlanList.vue`、`RechargePlanForm.vue`、`AdminWallet.vue` 已存在；`AdminWalletTransactions.vue` 需新建。

- [ ] T038 [US12] Fix `src/views/rechargePlan/RechargePlanList.vue` + `RechargePlanForm.vue` — 確認表單欄位：goldAmount（正整數）、bonusAmount（正整數，0=無贈送）、price（正整數）、isActive（Toggle）、即時預覽卡片（FR-UI-002）；停用方案使用 `PUT /api/admin/recharge/plans/{id}` 帶 `isActive: false`（非獨立 endpoint，AV-007）；刪除確認 Dialog 文字符合 FR-UI-008；後端 `isActive` 切換失敗時回滾（SM-004）
- [ ] T039 [US13] Fix `src/views/wallet/AdminWallet.vue` — 玩家搜尋 debounce 300ms（SM-005）；搜尋後顯示玩家點數資訊卡片（金幣餘額黃色 icon、贈點餘額藍色 icon）（FR-UI-004）；呼叫 `GET /api/admin/wallet/{userId}`（假設端點存在，AV-004）取餘額；手動調整 Modal：金幣/贈點輸入支援正負值、正數綠色/負數紅色（FR-UI-003）、原因必填 200 字、警告文字「此操作將直接修改玩家帳戶餘額，請謹慎操作。」；成功後即時更新卡片餘額（SM-003）
- [ ] T040 [US14] Create `src/views/wallet/AdminWalletTransactions.vue` — 新頁面：全站交易記錄；篩選列（玩家 Email/ID、交易類型下拉含 5 種 enum 中文標籤）、日期範圍；表格欄位：時間、玩家 Email、交易類型（FR-UI-006 中文）、金幣變動（+綠/-紅，FR-UI-005）、贈點變動、備註；呼叫 `POST /api/admin/wallet/transactions`；空狀態提示；分頁
- [ ] T041 [P] Add `walletTransactionsRoute` to router — 在 walletRoutes.ts（或新建）加入 `{ path: 'wallet/transactions', name: 'AdminWalletTransactions', component: AdminWalletTransactions }`；確認現有 `/home/wallet` 和 `/home/recharge-plan` 路由已正常掛入（T026 驗證前置）

---

## Phase 13 — 007 最新消息：TipTap 整合 + Spec 合規

> `NewsList.vue` + `NewsForm.vue` 已存在；需安裝 TipTap 並整合進 NewsForm。

- [ ] T042 Install TipTap dependencies — `yarn add @tiptap/vue-3 @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image`；確認安裝後 build 無錯誤
- [ ] T043 [US15] [US16] Fix `src/views/news/NewsForm.vue` rich text editor — 以 TipTap 取代現有 textarea（若有）作為消息內文；支援 H2/H3、粗體、斜體、有序/無序列表、超連結插入（FR-UI-005）；標題最多 100 字即時字數提示；封面圖片上傳（後端上傳端點待確認，暫用 `POST /api/admin/upload/news`）；發布時間留空 = 立即發布（FR-UI-006）；下架時間早於發布時間驗證錯誤；「儲存草稿」/「立即發布」/「取消」三個底部按鈕（頁面 2 spec）；離開前未儲存確認（SM-002）
- [ ] T044 [P] [US15] Fix publish flow in `src/views/news/NewsList.vue` — 發布：`POST /api/admin/news/{id}/publish`，即時更新狀態徽章（SM-003）；刪除：已發布狀態先提示「請先取消發布或封存再刪除」（邊界情況）；確認 Dialog 符合 FR-UI-008
- [ ] T045 [P] [US17] Fix unpublish → ARCHIVED in `src/views/news/NewsList.vue` — 取消發布呼叫 `POST /api/admin/news/{id}/unpublish`，**成功後狀態設為 ARCHIVED**（非 DRAFT，已確認）；狀態徽章顯示：草稿（灰）、排程中（藍邊框白底）、已發布（綠）、已封存（橘）（FR-UI-002）
- [ ] T046 [P] [US16] Fix category + isImportant in `src/views/news/NewsList.vue` + `NewsForm.vue` — category 徽章：公告（藍）、活動（紫）、系統（橘）（FR-UI-001）；重要消息 Toggle：勾選後列表顯示黃色 ⭐（FR-UI-003）；篩選列加入 isImportant 篩選開關（FR-UI-008）

---

## Phase 14 — 009 RBAC 權限管理：Spec 合規修正

> `RoleList.vue`、`RoleForm.vue`、`RolePermissions.vue` 已存在，以下為 spec 合規補強。

- [ ] T047 [US18] Fix `src/views/role/RolePermissions.vue` ADMIN readonly — ADMIN 角色所有 checkbox 設為 disabled；頁面頂部顯示說明「此角色擁有全域權限，不可修改」（FR-UI-002）；若繞過前端 disabled 收到後端 403，Toast「系統管理員角色權限不可修改」（邊界情況）
- [ ] T048 [P] [US18] Fix canEdit/canDelete → canView auto-check in `src/views/role/RolePermissions.vue` — 勾選「可編輯」時自動勾選「可檢視」（FR-UI-005）；勾選「可刪除」時自動勾選「可檢視」（FR-UI-006）；每列有「全選」快捷按鈕（FR-UI-004）；儲存按鈕出現「有未儲存的變更」橘色邊框提示（FR-UI-009）
- [ ] T049 [P] [US19] Fix sidebar icon rendering — 確認側邊欄選單 icon 渲染使用 `<i :class="item.icon">` 直接套用後端回傳的完整 FA class 字串（如 `"fa-solid fa-house"`），不做前端 mapping 轉換（FR-UI-008，AV-003）；側邊欄快取機制：登入後存入 localStorage（TTL 5 分鐘，SM-001）；權限更新後清除快取（SM-002）
- [ ] T050 [P] [US19] Fix STORE_EDITOR constraint tooltip in `src/views/role/RolePermissions.vue` — STORE_EDITOR 權限設定頁：某項 STORE_OWNER 未開放的 checkbox disabled，tooltip「STORE_OWNER 未開放此權限，STORE_EDITOR 不可超過 STORE_OWNER」；前端僅提示，不阻擋送出（已確認決策）

---

## Phase 15 — 011 商品抽獎：Spec 合規修正

> `AdminLotteryWithPrizesList.vue`、`AdminLotteryWithPrizesForm.vue`、`LotteryPrizeList.vue`、`LotteryPrizeForm.vue` 已存在。

- [ ] T051 [US20] Fix `AdminLotteryWithPrizesForm.vue` CONFIGURED flow — 確認「完成配置」按鈕的啟用條件：獎品總數量 = maxDraws（前端即時計算，SM-002）；點擊後呼叫 `PUT /api/admin/lottery/{id}/status` with `{ status: "CONFIGURED" }`（AV-006 確認，FR-UI-006）；成功後狀態徽章更新為「已配置（藍）」，「上架」按鈕啟用
- [ ] T052 [P] [US21] Fix all status transitions in `AdminLotteryWithPrizesList.vue` — 所有狀態轉換由前端呼叫 `PUT /api/admin/lottery/{id}/status`（已確認決策）；上架 → `ON_SHELF`、下架 → `OFF_SHELF`；確認 7 種狀態徽章顏色符合 FR-UI-001；刪除限草稿狀態（邊界情況：非草稿顯示提示）
- [ ] T053 [P] [US20] Fix prize count progress indicator — 獎品管理頁顯示「目前總數：{sum} / {maxDraws}」進度條（FR-UI-003）；超過或不足以紅色顯示；獎品等級徽章顏色：FINAL（金）、A（紅）、B（橘）、C（藍）、D（灰）（FR-UI-002）
- [ ] T054 [P] Add auto-discount UI placeholder to `AdminLotteryWithPrizesForm.vue` — 在編輯表單加入「自動折扣設定」區塊：啟用 Toggle + 說明文字「API 欄位名稱待後端確認」；資料不傳入 PUT payload（等後端確認欄位名後補完）（AV-007 決策：做 UI，API 欄位 TBD）

---

## Phase 16 — 012 推薦碼管理：Spec 合規修正

> `AdminReferralCodeList.vue`、`AdminReferralCodeEdit.vue` 已存在。

- [ ] T055 [US22] Fix `src/views/referral/AdminReferralCodeList.vue` + Edit — 推薦碼格式即時驗證（regex `/^[A-Z0-9]{6,12}$/`，FR-UI-002）；後端 HTTP 400 + `{ fieldErrors: { code: "..." } }` 時將 `fieldErrors.code` 訊息顯示在 code 輸入欄位下方（AV-006，邊界情況）；輸入框留空時顯示佔位文字「留空則系統自動生成」（FR-UI-003）
- [ ] T056 [P] [US22] Fix clipboard copy + optimistic toggle in `src/views/referral/AdminReferralCodeList.vue` — 推薦碼旁複製 icon：呼叫 `navigator.clipboard.writeText()`，成功後 Toast「已複製到剪貼板」2 秒消失（SM-004，FR-UI-001）；啟用/停用使用 optimistic update（SM-002）；關聯店家已停用時顯示警告 icon + tooltip（FR-UI-006）
- [ ] T057 [P] [US22] Verify stats page `src/views/referral/AdminReferralCodeEdit.vue` — 確認統計詳情顯示 totalReferred、referrals 列表；玩家 Email 顯示遮罩（`ab****@domain.com`，FR-UI-004）；無推薦記錄顯示空狀態（US3 AC3）

---

## Phase 17 — 013 店家帳號管理：Spec 合規修正

> `AdminUserList.vue`、`AdminUserForm.vue` 已存在。

- [ ] T058 [US23] Fix `src/views/adminUser/AdminUserForm.vue` 2-step wizard — 新增 StoreOwner 時使用 2 步驟表單（步驟 1：帳號資訊；步驟 2：店家資訊），進度指示器顯示當前步驟（FR-UI-003）；步驟切換時資料保留（SM-004）；送出呼叫 `POST /api/admin/users/store-owner`（含完整帳號 + 店家欄位原子操作）
- [ ] T059 [P] [US23] Fix StoreEditor `storeIds[]` in `AdminUserForm.vue` — 建立 StoreEditor 時：關聯店家改為**多選**選擇器（至少一間）；Request body 送出 `storeIds: string[]`（非單值 storeId，AV-004 已確認）；列表「關聯店家」欄位若多店家顯示「{第一個} 等 {N} 間店家」+ hover tooltip 顯示全部（FR-UI-007）
- [ ] T060 [P] [US24] Fix `src/views/adminUser/AdminUserList.vue` self-disable guard — 停用操作前比對 `authStore.user.id === targetUserId`；若相同則 disabled 停用按鈕並 tooltip「不可停用當前登入帳號」（US3 AC3，AV-007）；停用/啟用成功後 optimistic 更新狀態徽章（SM-003）
- [ ] T061 [P] [US23] Fix status badges + roles display in `AdminUserList.vue` — 帳號狀態徽章：待啟用（黃，`PENDING`）、啟用（綠，`ACTIVE`）、停用（灰，`INACTIVE`）（FR-UI-001）；roles 欄位為 `string[]`（如 `['ROLE_STORE_OWNER']`）渲染角色徽章（AV-006 確認 string[] 格式）；最後登入時間為 null 顯示「尚未登入」（FR-UI-004）

---

## Phase 18 — 2026-04-30 後端改動對接（報表 + 抽獎商品規則）

> 來源：`newbackend.md`，詳見 `specs/admin/backend-change-2026-04-30-scope.md`

- [X] T062 [P1] Extend `src/services/adminReportService.ts` — 新增四支 API 對接：`POST /admin/report/prize-shipment`、`/member-growth`、`/lottery-sales`、`/store-performance`；payload 統一 `QueryReq<Condition>`（`sortBy`/`sortOrder`/`condition`）
- [X] T063 [P1] Update `src/router/reportRoutes.ts` — 新增四支報表路由，並確認側邊欄與權限可訪問（保留舊報表或下線策略需與 PM 決策後同步）
- [X] T064 [P1] Create report views for new endpoints — 建立對應頁面與表格：`PrizeShipmentReport.vue`、`MemberGrowthReport.vue`、`LotterySalesReport.vue`、`StorePerformanceReport.vue`
- [X] T065 [P1] Update `src/components/report/ReportFilterBar.vue` role guard — `ROLE_STORE_OWNER` 不提供跨店查詢 UI（或固定值 disabled），避免前端主動送跨店條件
- [X] T066 [P1] Add 403 explicit handling in report views — 報表 API 回傳 403（越權店家查詢）時顯示明確提示，不僅使用通用錯誤訊息
- [ ] T067 [P1] Update `src/components/lottery-with-prizes/AdminLotteryWithPrizesBasicFields.vue` — 新增「是否啟用免費抽機制」與 `freeDrawThreshold` 欄位；未啟用時送 `null`；啟用時才顯示門檻輸入
- [ ] T068 [P1] Update `src/validators/lotteryWithPrizesSchema.ts` — 增加條件式驗證：啟用免費抽時 `freeDrawThreshold >= 1`；未啟用時允許 `null`
- [ ] T069 [P1] Update `src/views/lottery-with-prizes/AdminLotteryWithPrizesForm.vue` payload — `freeDrawThreshold` 正確送 `null | number`；欄位錯誤可回填到表單
- [ ] T070 [P1] Restrict payment type in lottery form — `paymentType` 僅顯示 `GOLD` / `BONUS`；若 `status !== 'DRAFT'`，欄位鎖定不可編輯
- [ ] T071 [P2] Deprecate old multi-draw dependency — `allowMultiDraw` / `multiDrawOptions` 不再作為新流程判斷依據，僅做相容讀取（必要時）
- [ ] T072 [P1] Backend validation mapping — 將後端回傳的 `freeDrawThreshold` 驗證錯誤顯示為欄位級訊息（非只顯示 toast）
- [ ] T073 [P2] Cross-project coordination (frontend app) — 前台抽獎/消費紀錄顯示改為依 `costType/paymentType` 呈現 `GOLD/BONUS`，且 `freeDrawThreshold = null` 不顯示門檻文案（此項為跨 repo 追蹤）

---

## Dependency Graph（完整）

```
T001 ──────────────────────────────────────────► T026 (驗證 wallet 路由)
T002 ──► T003
             │
             ▼
         T013 ──► T014 ──► T017
         T015 ─┘
         T016 ─┘           ▼
                       T023 ──► T024
                       T018 ──► T019 (可平行)
                       T018 ──► T020 (可平行)
                       T018 ──► T021 ──► T022

T004 ──► T005 ──► T006 (可平行)
              ──► T007 (可平行)
              ──► T008 (可平行)
              ──► T009 ──► T010 ──► T011 ──► T012

T034 ──► T035 (可平行)          [001]
T034 ──► T036 (可平行)
T034 ──► T037 (可平行)

T038 (獨立)                      [006]
T039 (獨立)
T040 ──► T041

T042 ──► T043 ──► T044 (可平行) [007]
         T043 ──► T045 (可平行)
         T043 ──► T046 (可平行)

T047 ──► T048 (可平行)          [009]
T049 (獨立)
T050 (獨立)

T051 ──► T052 (可平行)          [011]
T053 (獨立)
T054 (獨立)

T055 ──► T056 (可平行)          [012]
T057 (獨立)

T058 ──► T059 (可平行)          [013]
T060 (獨立)
T061 (獨立)
```

---

## Phase Summary

| Phase | 模組 | Tasks | 狀態 |
|-------|------|-------|------|
| 1–2 | Setup + Service | T001–T004 | ✅ Done |
| 3–4 | 002 出貨管理 | T005–T012 | ✅ Done |
| 5–8 | 014 店家管理 | T013–T024 | ✅ Done |
| 9–10 | 驗證 + Polish | T025–T033 | 🔲 Pending |
| 11 | 001 橫幅廣告 | T034–T037 | 🔲 Pending |
| 12 | 006 付款點數 | T038–T041 | 🔲 Pending |
| 13 | 007 最新消息 | T042–T046 | 🔲 Pending |
| 14 | 009 RBAC | T047–T050 | 🔲 Pending |
| 15 | 011 抽獎商品 | T051–T054 | 🔲 Pending |
| 16 | 012 推薦碼 | T055–T057 | 🔲 Pending |
| 17 | 013 店家帳號 | T058–T061 | 🔲 Pending |
| 18 | 2026-04-30 後端改動對接 | T062–T073 | 🔲 Pending |

# 前端規格書（後台）：刮刮樂獎項規則修正與指定流程

**功能分支**：`015-scratch-lottery-prize-rules`  
**對應後端 Spec**：`specs/015-scratch-lottery-prize-rules/spec.md`  
**建立日期**：2026-04-06  
**狀態**：草稿  
**介面類型**：後台管理介面（Admin Panel）  
**存取角色**：ROLE_ADMIN、ROLE_STORE_OWNER

---

## 背景說明

後端已完成以下邏輯修正，後台前端需對應調整 UI，使店家可操作新流程：

1. **Prize 驗證強化**：刮刮樂（SCRATCH_STORE / SCRATCH_PLAYER）商品現在嚴格要求「大獎數量 = 1」（`isGrandPrize=true`，`totalQuantity=1`）且不允許其他非大獎獎品；後端會拋出 BusinessException 若違反。
2. **SCRATCH_STORE 上架前置驗證**：SCRATCH_STORE 商品若 `designatedPrizeNumbers` 未設定，後端會拒絕 ON_SHELF 請求；上架按鈕必須在前台有對應的 guard。
3. **大獎號碼指定流程**：SCRATCH_STORE 需要後台提供指定入口；SCRATCH_PLAYER 的指定由前台玩家在遊戲中完成，後台僅需顯示狀態說明。
4. **`designationStatus` 欄位**：後端在刮刮樂商品上新增此欄位（`PENDING` / `COMPLETED`），後台需顯示並支援篩選。

---

## Clarifications

### Session 2026-04-06

- Q: 指定大獎號碼 Modal 中，號碼選擇器的 UI 形式為何（輸入框 vs. 點選 grid）？ → A: 純數字輸入框（`type="number"`，min=1，max=maxDraws），前端即時驗證範圍，適用任何 maxDraws 大小。
- Q: 獎品管理頁（LotteryPrizeForm）如何取得父商品的 `gameMode`？ → A: 進入獎品頁時呼叫商品詳情 API（`GET /api/admin/lottery-with-prizes/{id}`，即現有 `getLotteryWithPrizes()` 服務函式），從 response 取 `gameMode`；不依賴 URL query param 或 Pinia store。
- Q: 刮刮樂大獎的「等級（level）」欄位形式？ → A: 刮刮樂商品（isGrandPrize=true）改為下拉選單（A / B / C … Z / GRAND），非刮刮樂商品維持現有自由文字輸入。
- Q: 指定大獎號碼成功後，列表頁資料更新方式？ → A: 呼叫現有 `refresh()` 全量重新查詢，與 `changeStatus` 成功後行為一致。
- Q: ROLE_STORE_OWNER 執行「指定大獎號碼」的前端權限判斷方式？ → A: 後端 API 負責驗證（STORE_OWNER 只能操作自己店家商品）；前端不做額外 ownership check，直接呼叫 API，依後端錯誤回應顯示錯誤訊息。

---

## 頁面與介面清單

### 頁面 1 — 商品列表頁（修改現有）

- **路由**：`/home/lottery-with-prizes`（現有 `AdminLotteryWithPrizesList.vue`）
- **變更項目**：
  - 新增篩選條件：「指定狀態」下拉（全部 / 待指定 / 已完成），常態顯示於查詢表單
  - 列表新增「指定狀態」欄位（徽章）：僅對刮刮樂商品顯示；`PENDING`→橘色「待指定」，`COMPLETED`→綠色「已完成」
  - 操作欄新增「指定大獎號碼」按鈕：僅對 `SCRATCH_STORE` + `designationStatus=PENDING` 的商品顯示
  - SCRATCH_STORE + PENDING 狀態的商品，「完成配置」→「開始抽獎」（ON_SHELF）按鈕需 disabled，tooltip 顯示「請先完成大獎號碼指定才能上架」；編輯頁 `onSubmit` 若選擇 ON_SHELF 亦同步阻止並提示

### 頁面 2 — 新增 / 編輯商品頁（修改現有）

- **路由**：`/home/lottery-with-prizes/add` / `/home/lottery-with-prizes/edit/:id`（現有 `AdminLotteryWithPrizesForm.vue`）
- **變更項目**：
  - 新增「指定狀態提示區塊」（僅在已建立的刮刮樂商品上顯示，新增時不顯示）：
    - `SCRATCH_STORE` + `PENDING`：橘色警告條「⚠ 尚未指定大獎號碼，SCRATCH_STORE 商品上架前必須完成指定。」+ 「前往指定」按鈕
    - `SCRATCH_STORE` + `COMPLETED`：綠色提示條「✔ 大獎號碼已指定完成，可上架。」
    - `SCRATCH_PLAYER`：藍色說明條「ℹ 大獎號碼將由第一位開套玩家在遊戲中指定，商品可直接上架。」

### 頁面 3 — 獎品管理頁（修改現有）

- **路由**：`/home/lottery/:id/prizes`（現有 `LotteryPrizeForm.vue`）
- **變更項目**：
  - 獎品頁於 `onMounted` 時呼叫 `GET /api/admin/lottery/{id}` 取得商品詳情（含 `gameMode`），依此判斷是否為刮刮樂商品並顯示對應 UI；`gameMode` 不從 URL query param 傳入。
  - 刮刮樂商品的獎品頁頂部顯示說明橫幅：「刮刮樂模式：大獎數量固定為 1（totalQuantity = 1），其餘 N-1 個籤位將自動設為銘謝惠顧，無需另行設定。」
  - `isGrandPrize` 欄位（刮刮樂專用）：
    - 新增「此為大獎（isGrandPrize）」勾選框，僅在 SCRATCH_STORE / SCRATCH_PLAYER 商品的獎品表單中顯示
    - 若已有一個 `isGrandPrize=true` 的獎品，新增按鈕需 disabled，tooltip 顯示「刮刮樂商品只允許一個大獎，請先刪除現有大獎再重新設定」
  - 刮刮樂商品的「等級（level）」欄位：當商品為刮刮樂且 `isGrandPrize=true` 時，改為下拉選單，選項為 A / B / C … Z / GRAND；非刮刮樂商品維持自由文字輸入（現狀不變）。
  - 刮刮樂商品的「總數量（totalQuantity）」欄位：當 `isGrandPrize=true` 時，自動鎖定為 1（唯讀）並顯示說明文字「大獎數量固定為 1」
  - 「完成配置」按鈕邏輯調整：刮刮樂商品不以「獎品總數 = maxDraws」判斷，改為「已設定 1 個大獎」即可啟用（因其餘為自動生成的銘謝惠顧）

### 頁面 4（新增）— 指定大獎號碼 Modal

- **觸發方式**：從商品列表頁「指定大獎號碼」按鈕，或商品編輯頁「前往指定」按鈕開啟
- **僅適用於**：`SCRATCH_STORE` 且 `designationStatus=PENDING` 的商品
- **UI 元件**：
  - Modal 標題：「指定大獎號碼 — {商品名稱}」
  - 說明文字：「請選擇大獎對應的籤號（1 ~ {maxDraws}），指定後無法更改。」
  - 號碼選擇器：純數字輸入框（`type="number"`，min=1，max=maxDraws），前端即時顯示驗證錯誤
  - 確認按鈕 + 取消按鈕
  - 確認後顯示二次確認：「確定將第 {N} 號指定為大獎？指定後系統將自動將其餘籤號設為銘謝惠顧，且此操作不可撤銷。」
  - 成功後：關閉 Modal，刷新商品資料，designationStatus 更新為 COMPLETED，顯示成功 Toast

---

## 使用者情境與測試

### 使用者故事 1 — 店家新增刮刮樂商品並設定大獎（Priority: P1）

店家在後台新增 SCRATCH_STORE 或 SCRATCH_PLAYER 商品時，進入獎品頁只允許設定 1 個大獎，`totalQuantity` 鎖定為 1，其餘籤位說明由系統自動填充。

**此優先級的原因**：此為刮刮樂商品設定的核心入口，無此約束前端就會允許設定非法的獎品結構，後端再拋錯會造成不好的使用者體驗。

**獨立測試**：以 StoreOwner 身份建立一個 `SCRATCH_STORE` 商品，進入獎品管理頁，嘗試新增兩個大獎，確認系統於 UI 層就阻止，無需等後端錯誤回應。

**驗收情境**：

1. **Given** 商品為 SCRATCH_STORE 模式，**When** 店家進入獎品管理頁，**Then** 頁面頂部顯示說明橫幅「大獎數量固定為 1，其餘自動為銘謝惠顧」，且「新增獎品」按鈕顯示「isGrandPrize」勾選框。
2. **Given** 店家勾選「此為大獎」並填寫獎品資料，**When** 成功儲存第一個大獎，**Then** 「新增獎品」按鈕自動 disabled，tooltip 說明原因。
3. **Given** 店家勾選「此為大獎」，**When** `isGrandPrize=true` 時，**Then** totalQuantity 欄位自動設為 1 並鎖定（唯讀）。
4. **Given** 已設定 1 個大獎，**When** 店家點擊「完成配置」，**Then** 系統允許送出（不需獎品總數 = maxDraws），狀態升為 CONFIGURED。

---

### 使用者故事 2 — 店家在後台完成 SCRATCH_STORE 大獎號碼指定（Priority: P1）

SCRATCH_STORE 商品建立後，店家必須透過後台指定大獎籤號，完成後才可上架。

**此優先級的原因**：這是 SCRATCH_STORE 模式的必要流程，缺少此 UI 則 SCRATCH_STORE 商品完全無法正常上架。

**獨立測試**：建立 SCRATCH_STORE 商品並完成配置（CONFIGURED 狀態），在列表頁找到該商品，點擊「指定大獎號碼」，選擇號碼後確認；確認後 designationStatus 由 PENDING 更新為 COMPLETED，列表中的「指定大獎號碼」按鈕消失，ON_SHELF 按鈕啟用。

**驗收情境**：

1. **Given** SCRATCH_STORE 商品 `designationStatus=PENDING`，**When** 店家在列表頁或編輯頁開啟「指定大獎號碼」Modal，**Then** Modal 顯示商品名稱、說明文字，以及 1~maxDraws 的號碼選擇器。
2. **Given** 店家在 Modal 中選擇號碼並按確認，**When** 二次確認後送出，**Then** 系統顯示 loading，API 成功後 Toast「大獎號碼指定成功」，designationStatus 更新為 COMPLETED。
3. **Given** 指定成功後，**When** 店家回到商品列表，**Then** 該商品的指定狀態徽章從「待指定（橘）」變為「已完成（綠）」，「指定大獎號碼」按鈕消失，ON_SHELF 操作按鈕可點擊。
4. **Given** 店家輸入超出範圍的籤號（例如 0 或 > maxDraws），**When** 嘗試送出，**Then** 前端立即顯示驗證錯誤「請輸入 1 到 {maxDraws} 之間的號碼」，不呼叫 API。

---

### 使用者故事 3 — 上架保護：SCRATCH_STORE 未指定前無法上架（Priority: P1）

後端已對未指定大獎號碼的 SCRATCH_STORE 商品拒絕 ON_SHELF，前台也需在 UI 層阻止，避免店家觸發無效請求。

**此優先級的原因**：上架保護是系統防呆的最後一道防線，前後端需同步一致，避免店家看到按鈕卻觸發後端錯誤，影響使用體驗。

**驗收情境**：

1. **Given** SCRATCH_STORE + `designationStatus=PENDING` 的商品，**When** 店家在列表頁看到 ON_SHELF 動作按鈕，**Then** 按鈕為 disabled，hover tooltip 顯示「請先完成大獎號碼指定才能上架」；**When** 店家在編輯頁的狀態下拉選擇 ON_SHELF 並按儲存，**Then** `onSubmit` 中斷並顯示提示「請先完成大獎號碼指定才能上架」。
2. **Given** SCRATCH_STORE + `designationStatus=COMPLETED`，**When** 店家看到 ON_SHELF 按鈕，**Then** 按鈕正常可點擊，流程與其他商品一致。
3. **Given** SCRATCH_PLAYER 商品（無論 designationStatus），**When** 店家看到 ON_SHELF 按鈕，**Then** 按鈕正常可點擊（SCRATCH_PLAYER 不受指定狀態限制上架）。

---

### 使用者故事 4 — 商品列表與詳情顯示指定狀態（Priority: P2）

店家與管理員可在商品列表快速識別哪些刮刮樂商品尚待指定大獎號碼，也可篩選找出這批商品。

**驗收情境**：

1. **Given** 商品列表有多個刮刮樂商品，**When** 頁面載入，**Then** `designationStatus` 欄位顯示於刮刮樂商品旁；一番賞、扭蛋商品此欄位為空（不顯示）。
2. **Given** 店家在篩選列選擇「待指定」，**When** 按查詢，**Then** 列表只顯示 `designationStatus=PENDING` 的商品。
3. **Given** 商品編輯頁載入一個 SCRATCH_PLAYER 商品，**When** 頁面渲染，**Then** 顯示藍色說明條「大獎號碼將由第一位開套玩家在遊戲中指定，商品可直接上架。」

---

### 邊界情況

- 若 API 指定失敗（例如號碼衝突），Modal 顯示後端錯誤訊息，不關閉 Modal，保留已選號碼讓店家重選。
- 刪除刮刮樂商品（`CANCELLED` 狀態）時，不需確認 designationStatus，直接允許取消。
- 刮刮樂商品在 `ACTIVE`（抽獎中）狀態後，禁止再次開啟「指定大獎號碼」Modal（按鈕不顯示）。
- 店家在獎品管理頁刪除唯一大獎後，「完成配置」按鈕需再次 disabled。
- 若 `maxDraws=1`（總抽數為 1），號碼選擇器只有一個選項（1），系統自動選取並顯示「僅有 1 個籤號，已自動選取第 1 號」。

---

## API 串接規格

### 新增 / 修改 API

| 動作 | Method | 端點 | 主要 Request 欄位 | 主要 Response 欄位 | 前端 UI 狀態 |
|------|--------|------|------------------|--------------------|-------------|
| 指定大獎號碼 | POST | `/api/admin/lottery/{id}/designate-prize` | `{ designatedPrizeNumber: number }` | `{ designationStatus: "COMPLETED" }` | Modal loading → Toast → 刷新列表 |
| 查詢商品列表（含 designationStatus） | POST | `/api/admin/lottery-with-prizes/list` | `condition: { ..., designationStatus?: "PENDING"\|"COMPLETED" }` | `[{ ..., designationStatus, gameMode }]` | loading → 表格渲染 |

### 修改現有 API 請求欄位

| 端點 | 新增欄位 | 說明 |
|------|---------|------|
| `POST /api/admin/lottery/{id}/prizes`（新增獎品） | `isGrandPrize: boolean` | 標記是否為刮刮樂大獎；刮刮樂商品必填 |
| `PUT /api/admin/prize/{id}`（更新獎品） | `isGrandPrize: boolean` | 同上 |
| `POST /api/admin/lottery-with-prizes/list`（列表查詢） | `condition.designationStatus` | 篩選指定狀態 |

### Response 欄位更新

商品列表及詳情 Response 需包含以下新欄位：

| 欄位 | 型別 | 說明 |
|------|------|------|
| `designationStatus` | `"PENDING" \| "COMPLETED" \| null` | 刮刮樂商品專屬；一番賞/扭蛋為 null |
| `gameMode` | `string` | 已有欄位，確認列表 API 有回傳 |

---

## 功能需求（後台前端 UI）

### 商品列表

- **FR-UI-001**：`designationStatus` 徽章：`PENDING`→橘色「待指定」，`COMPLETED`→綠色「已完成」，`null`（非刮刮樂）→不顯示。
- **FR-UI-002**：「指定大獎號碼」操作按鈕僅在 `gameMode=SCRATCH_STORE` 且 `designationStatus=PENDING` 時顯示；前端不做 store 擁有權比對，若呼叫 API 時後端回傳權限錯誤，以現有 `executeApi` 錯誤處理顯示訊息。
- **FR-UI-003**：`SCRATCH_STORE` + `PENDING` 商品的上架觸發按鈕（ACTIVE / ON_SHELF）設為 `disabled`，tooltip 說明原因。
- **FR-UI-004**：新增「指定狀態」篩選下拉至查詢表單（全部 / 待指定 PENDING / 已完成 COMPLETED）。

### 獎品管理（刮刮樂專用）

- **FR-UI-005**：刮刮樂商品獎品頁頂部顯示說明橫幅（藍色 info bar），說明「大獎數量固定為 1，其餘自動為銘謝惠顧」；`gameMode` 由頁面 `onMounted` 呼叫商品詳情 API 取得，非 URL 傳入。
- **FR-UI-006**：獎品表單新增「此為大獎（isGrandPrize）」勾選框，僅在刮刮樂商品中出現。
- **FR-UI-006b**：刮刮樂商品且 `isGrandPrize=true` 時，`level` 欄位改為下拉選單，選項為 A / B / C … Z / GRAND（共 27 個）；非刮刮樂商品 `level` 維持自由文字輸入（現狀不變）。
- **FR-UI-007**：`isGrandPrize=true` 時，`totalQuantity` 欄位自動填 1 並鎖定唯讀。
- **FR-UI-008**：當已存在 1 個 `isGrandPrize=true` 的獎品時，「新增獎品」按鈕 disabled，tooltip 提示「已達大獎上限（1 個）」。
- **FR-UI-009**：刮刮樂商品的「完成配置」按鈕啟用條件改為「已存在 1 個 isGrandPrize=true 的獎品」（非「獎品總數 = maxDraws」）。

### 指定大獎號碼 Modal

- **FR-UI-010**：Modal 開啟時顯示商品名稱與 maxDraws；號碼欄位為 `type="number"` 輸入框（min=1，max=maxDraws），前端即時驗證並顯示錯誤訊息，不呼叫 API。
- **FR-UI-011**：確認送出前顯示二次確認 Dialog（使用現有 `dialogStore.openConfirmDialog`）。
- **FR-UI-012**：送出成功後呼叫 Toast 並自動刷新商品列表資料（同現有 `refresh()` 流程）。
- **FR-UI-013**：送出失敗時，Modal 保持開啟，顯示後端錯誤訊息，號碼輸入欄位保留原值。

### 商品編輯頁指定狀態提示

- **FR-UI-014**：商品編輯頁依 `gameMode` + `designationStatus` 顯示對應提示條（3 種情況如「頁面與介面清單」所述），新增時不顯示。

### 狀態管理

- **SM-001**：指定大獎號碼成功後，呼叫現有 `refresh()` 全量重新查詢列表，與 `changeStatus` 成功後行為一致；不做局部 in-memory 更新。
- **SM-002**：獎品管理頁的「大獎已設定」狀態即時計算（前端 computed，依 `isGrandPrize=true` 的獎品是否存在）。

---

## 成功標準

### 可量化的成果

- **SC-001**：店家在後台新增 SCRATCH_STORE 商品、設定大獎、指定大獎號碼到完成上架的完整流程，在 5 分鐘內可完成，且全程無需看到後端 BusinessException 錯誤（前端已做好防呆）。
- **SC-002**：商品列表在含 `designationStatus` 欄位的情況下，50 筆資料載入時間不超過 2 秒。
- **SC-003**：SCRATCH_STORE + PENDING 商品的上架按鈕保護（disabled + tooltip）100% 生效，不允許店家觸發無效的上架 API 請求。
- **SC-004**：獎品管理頁的大獎設定約束（isGrandPrize=true 限制 1 個）100% 在前端層阻止非法操作，後端 BusinessException 不應出現在正常操作流程中。
- **SC-005**：一番賞與扭蛋商品的現有操作流程不受本次修改影響，狀態流轉、獎品設定、上架邏輯均與修改前一致。

---

## Assumptions

- 指定大獎號碼的後端端點為 `POST /api/admin/lottery/{id}/designate-prize`，接收 `{ designatedPrizeNumber: number }`；若後端實際端點不同，前端 service 調整端點名稱即可，邏輯不變。
- 商品列表 API（`/api/admin/lottery-with-prizes/list`）的 Response 已包含 `designationStatus` 與 `gameMode` 欄位，若沒有則需與後端確認加入。
- 現有 `LotteryPrizeForm.vue` 為獨立的獎品新增/編輯頁，`isGrandPrize` 欄位的顯示條件依據 `gameMode` 判斷；**`gameMode` 由頁面 `onMounted` 呼叫 `GET /api/admin/lottery-with-prizes/{id}`（現有 `getLotteryWithPrizes()` 服務函式）取得**，不從 URL query param 傳入。
- 刮刮樂商品的獎品管理頁中，`isGrandPrize` 為後端 Prize 實體已有的 boolean 欄位，前端只需在表單中增加對應 UI 並在 payload 中傳送。
- 「指定大獎號碼」操作完成後，後端已確保其餘籤號自動設為銘謝惠顧，前端無需額外觸發任何籤號補齊 API。
- 「指定大獎號碼」操作的權限驗證由後端 API 負責（ROLE_STORE_OWNER 只能操作自己店家商品）；前端不做額外 `storeId` 比對，API 失敗時依現有 `executeApi` 錯誤處理流程顯示訊息。
- SCRATCH_PLAYER 商品在後台不需要「指定大獎號碼」入口；玩家指定流程完全由前台（player-facing app）處理，後台僅顯示狀態說明。

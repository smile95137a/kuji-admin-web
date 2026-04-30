# Backend Change Scope Update (2026-04-30)

## 1) 影響清單

- 報表 API 已新增 4 支後台端點：`/admin/report/prize-shipment`、`/admin/report/member-growth`、`/admin/report/lottery-sales`、`/admin/report/store-performance`，前端需補齊 service、route、view 與 table schema。
- 報表查詢請求格式需統一為 `QueryReq<Condition>`，保留 `sortBy` / `sortOrder` / `condition`。
- 權限隔離更新：`ROLE_ADMIN` 可查全平台，`ROLE_STORE_OWNER` 只能查自己的店；前端需避免跨店查詢 UI（或只讀不可改），並處理 403 提示。
- 抽獎商品建立/編輯規則更新：
  - `freeDrawThreshold` 改為可為 `null`（未啟用免費抽機制）
  - 僅啟用免費抽時才驗證 `freeDrawThreshold >= 1`
  - `paymentType` 僅 `GOLD` / `BONUS`（移除 `FREE`）
  - 非 `DRAFT` 狀態不得修改 `paymentType`
  - `allowMultiDraw` / `multiDrawOptions` 為 deprecated，不可作為新流程核心依賴
- 前台顯示規則更新（跨專案協作項）：
  - 抽獎與消費紀錄需依 `costType` / `paymentType` 顯示 `GOLD` 或 `BONUS`
  - `freeDrawThreshold = null` 時不顯示免費抽門檻文案

## 2) 必改頁面與欄位

- 後台報表
  - `src/services/adminReportService.ts`
  - `src/router/reportRoutes.ts`
  - `src/views/report/*`（新增/替換為四張新報表頁）
  - `src/components/report/ReportFilterBar.vue`（StoreOwner 視角限制店家篩選）
- 後台抽獎商品建立/編輯
  - `src/components/lottery-with-prizes/AdminLotteryWithPrizesBasicFields.vue`
  - `src/views/lottery-with-prizes/AdminLotteryWithPrizesForm.vue`
  - `src/validators/lotteryWithPrizesSchema.ts`
  - 必改欄位：`freeDrawThreshold`、`paymentType`、`status` 連動邏輯
- 錯誤處理
  - 403 越權報表查詢：頁面級明確提示（不可僅 generic error）
  - 欄位驗證錯誤：`freeDrawThreshold` 顯示欄位級錯誤

## 3) API 對接程式碼調整點

- 報表 service 改造
  - 新增方法：`getPrizeShipmentReport`、`getMemberGrowthReport`、`getLotterySalesReport`、`getStorePerformanceReport`
  - 每支 API payload 改用：
    - `condition: { ... }`
    - `sortBy: string`
    - `sortOrder: 'ASC' | 'DESC'`
- 報表路由與畫面
  - 新增四支路由並移除/降級舊報表頁依賴（revenue / referral / recharge / bonus / lottery-result 視產品決策保留或下線）
  - `ROLE_STORE_OWNER` 不提供跨店查詢（不渲染店家選擇器，或固定值且 disabled）
- 抽獎商品 payload/驗證
  - `freeDrawThreshold`：
    - 未啟用免費抽 → 送 `null`
    - 啟用免費抽 → 必填且 `>= 1`
  - `paymentType`：
    - 選項只保留 `GOLD` / `BONUS`
    - 編輯頁若 `status !== 'DRAFT'`，前端鎖定欄位
  - deprecated 欄位：
    - `allowMultiDraw` / `multiDrawOptions` 不再作為新流程判斷來源
- 錯誤映射
  - 403：顯示「無權查詢其他店家報表」等明確訊息
  - 後端欄位錯誤（例如 `freeDrawThreshold`）映射至對應 form field

## 4) 驗收測試清單

- [ ] `freeDrawThreshold = null` 可成功建立刮刮樂商品
- [ ] 啟用免費抽且 `freeDrawThreshold < 1` 時，前端欄位驗證阻擋送出，並顯示錯誤訊息
- [ ] 商品非 `DRAFT` 狀態時，`paymentType` 欄位不可編輯；強行送出變更會被後端拒絕並正確提示
- [ ] `paymentType` 只出現 `GOLD` / `BONUS`，不再出現 `FREE`
- [ ] `ROLE_STORE_OWNER` 嘗試跨店查詢報表時，回應 403 並顯示明確提示
- [ ] 新四張報表（prize-shipment / member-growth / lottery-sales / store-performance）可查詢並正確渲染表格
- [ ] 報表查詢請求皆符合 `QueryReq<Condition>`（含 `sortBy` / `sortOrder` / `condition`）
- [ ] 前台抽獎/消費紀錄在 `GOLD` / `BONUS` 兩種支付模式顯示正確（跨專案驗收）
- [ ] 前台免費抽門檻在 `freeDrawThreshold = null` 時不顯示文案（跨專案驗收）

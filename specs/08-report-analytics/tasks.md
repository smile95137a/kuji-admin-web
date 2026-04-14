# Tasks — 報表與統計分析 (08-report-analytics)

**優先級說明**  
`[P0]` 資安或 runtime 致命問題 | `[P1]` 功能缺失 | `[P2]` 完善度 | `[DONE]` 已實作待驗收

---

## T-RPT-01 [P1] 安裝 vue-echarts + echarts

**命令**：
```bash
npm install vue-echarts echarts
```

**設定**：在 Vue app 全域（`src/main.ts`）或各報表 view 中局部 `use()` treeshaking 設定（見 plan.md 安裝說明）

**完成條件**：`import VChart from 'vue-echarts'` 不報錯；TypeScript 型別正確

---

## T-RPT-02 [P1] 建立 useReportFilter composable

**檔案**：`src/composables/useReportFilter.ts`（新建）

**職責**：5 個報表頁面共用的日期篩選狀態與邏輯

```typescript
// composable 提供的 state 和 method
const { startDate, endDate, preset, setPreset, dateRange } = useReportFilter()
```

**Preset 選項**：
- `today`：今天
- `thisWeek`：本週（週一起算）
- `thisMonth`：當月 1 號 ~ 今天
- `lastMonth`：上個月完整月份
- `custom`：使用者自選（呼叫 `setCustomRange(start, end)`）

**完成條件**：composable 有 TypeScript 型別；日期格式為 `YYYY-MM-DD`；preset 切換後 `startDate`/`endDate` 自動更新

---

## T-RPT-03 [P1] 建立 ReportFilterBar 元件

**檔案**：`src/components/report/ReportFilterBar.vue`（新建）

**職責**：顯示日期快捷按鈕 + 自訂日期輸入（含 Admin 的店家篩選下拉）

**Props**：
```typescript
interface Props {
  showStoreFilter: boolean  // ADMIN 傳 true；STORE_OWNER 傳 false
}
```

**Emits**：`update:filter`（傳出篩選條件給父 view）

**完成條件**：5 個報表 view 可共用此元件；STORE_OWNER 時不顯示店家下拉

---

## T-RPT-04 [P1] 建立 RevenueReport 頁面

**檔案**：`src/views/report/RevenueReport.vue`（新建）

**區塊**：
1. `ReportFilterBar`（含店家篩選，ADMIN 顯示）
2. Summary 卡片：totalRevenue、totalOrders、totalDraws、avgRevenuePerDay
3. 折線圖（vue-echarts）：x 軸日期、y 軸 revenue，對應 `daily[]`
4. 詳細 table：date / revenue / orderCount / drawCount
5. （ADMIN 限）byStore table：storeName / revenue / orderCount

**呼叫**：`adminReportService.getRevenueReport(condition)`

**完成條件**：日期篩選後資料正確刷新；圖表與 table 同步

---

## T-RPT-05 [P1] 建立 LotteryResultReport 頁面

**檔案**：`src/views/report/LotteryResultReport.vue`（新建）

**區塊**：
1. `ReportFilterBar`（含商品 ID 篩選）
2. Summary 卡片：totalDraws、totalGrandPrizes、completionRate
3. prizeStats table：prizeName / prizeLevel / drawnQuantity / totalQuantity / drawRate
4. lotteryStats table：lotteryTitle / totalDraws / revenue / isCompleted

**完成條件**：API 呼叫成功，table 資料顯示正確

---

## T-RPT-06 [P1] 建立 ReferralReport 頁面

**檔案**：`src/views/report/ReferralReport.vue`（新建）

**區塊**：
1. `ReportFilterBar`
2. Summary 卡片：totalReferrals、activeReferralCodes、totalRewardGiven
3. ranking table（前 10）：referralCode / ownerName / referralCount / rewardGiven
4. daily table：date / referralCount / rewardGiven

**完成條件**：ranking table 依 referralCount 降序顯示

---

## T-RPT-07 [P1] 建立 RechargeReport 頁面

**檔案**：`src/views/report/RechargeReport.vue`（新建）

**區塊**：
1. `ReportFilterBar`（含儲值方案篩選下拉，ADMIN 限）
2. Summary 卡片：totalAmount（台幣）、totalGoldIssued、totalBonusIssued、orderCount
3. 折線圖：x 軸日期、y 軸 amount
4. planStats table：planName / amount / orderCount

⚠️ `totalAmount` 單位為台幣（不是金幣），顯示時加 NT$ 前綴

**完成條件**：金額單位顯示正確（台幣 vs 金幣區分清楚）

---

## T-RPT-08 [P1] 建立 BonusReport 頁面

**檔案**：`src/views/report/BonusReport.vue`（新建）

⚠️ **`BonusReportRes` 欄位待後端確認**。先以 summary 卡片 + raw data table 骨架呈現，資料欄位確認後更新。

**完成條件**：頁面可訪問，API 呼叫 `POST /api/admin/report/bonus`，不報 TypeScript 錯誤

---

## T-RPT-09 [P1] 建立報表路由

**檔案**：`src/router/reportRoutes.ts`（新建），並在 `src/router/index.ts` 中引入

```typescript
export const reportRoutes: RouteRecordRaw[] = [
  { path: 'report/revenue', component: () => import('@/views/report/RevenueReport.vue'), meta: { requiresAuth: true } },
  { path: 'report/lottery-result', component: () => import('@/views/report/LotteryResultReport.vue'), meta: { requiresAuth: true } },
  { path: 'report/referral', component: () => import('@/views/report/ReferralReport.vue'), meta: { requiresAuth: true } },
  { path: 'report/recharge', component: () => import('@/views/report/RechargeReport.vue'), meta: { requiresAuth: true } },
  { path: 'report/bonus', component: () => import('@/views/report/BonusReport.vue'), meta: { requiresAuth: true } },
]
```

**完成條件**：5 個報表路由可正常訪問，layout sidebar 正確顯示

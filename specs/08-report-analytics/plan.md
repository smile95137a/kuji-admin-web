# Plan — 報表與統計分析 (08-report-analytics)

**狀態**：MISSING（Service 有 5 個方法；View 和 Route 完全缺失）  
**影響範圍**：`src/views/report/`（新建）、`src/router/reportRoutes.ts`（新建）

---

## 現有實作狀態

| 功能 | 狀態 | 備註 |
|------|------|------|
| `getRevenueReport` | ✅ DONE | service 有 |
| `getReferralReport` | ✅ DONE | service 有 |
| `getLotteryResultReport` | ✅ DONE | service 有 |
| `getRechargeReport` | ✅ DONE | service 有 |
| `getBonusReport` | ✅ DONE | service 有；後端 controller 已確認存在 |
| 報表 View | ❌ MISSING | 5 個報表頁面全部未建立 |
| 報表 Route | ❌ MISSING | `reportRoutes.ts` 不存在 |

---

## 技術決策

| 決策 | 結論 |
|------|------|
| 圖表庫 | `vue-echarts` + `echarts`，treeshaking 安裝 |
| 初始版 | 先做 table（確保資料正確）；圖表在 table 之上加 `ReportChart.vue` |
| `BonusReportRes` | 欄位待後端確認後補 spec；先以 UI 骨架 + table 佔位 |
| 日期篩選 | 抽出 `useReportFilter.ts` composable，5 個頁面共用 |
| Admin vs StoreOwner | ADMIN 顯示店家下拉篩選；STORE_OWNER 不顯示（後端自動注入）|

---

## 元件邊界規劃

```
src/views/report/
  ├── RevenueReport.vue          折線圖 + summary 卡片 + daily table
  ├── LotteryResultReport.vue    長條圖 + prizeStats table + lotteryStats table
  ├── ReferralReport.vue         summary 卡片 + ranking table + daily table
  ├── RechargeReport.vue         折線圖 + summary 卡片 + planStats table
  └── BonusReport.vue            summary + table（欄位待確認）

src/components/report/
  ├── ReportFilterBar.vue        日期快捷選擇（今天/本週/本月/上月/自訂）
  ├── ReportSummaryCards.vue     summary 數字卡片（共用）
  └── ReportChart.vue            vue-echarts 折線/長條圖（依 props 切換）

src/composables/
  └── useReportFilter.ts         日期範圍 state + preset 邏輯（5 頁共用）
```

---

## 安裝需求

```bash
npm install vue-echarts echarts
```

**treeshaking 使用方式**：
```typescript
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'
use([CanvasRenderer, LineChart, BarChart, GridComponent, TitleComponent, TooltipComponent, LegendComponent])
```

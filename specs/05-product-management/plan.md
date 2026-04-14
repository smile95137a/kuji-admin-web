# Plan — 商品管理 (05-product-management)

**狀態**：DONE（此模組為專案中最完整的模組）  
**影響範圍**：`src/services/AdminLotteryService.ts`、`src/services/adminLotteryWithPrizesService.ts`、`src/services/adminLotteryPrizeService.ts`、`src/services/adminCategoryService.ts`

---

## 現有實作狀態

| 功能 | 狀態 | 備註 |
|------|------|------|
| 商品列表 | ✅ DONE | `AdminLotteryWithPrizesList.vue` |
| 新增商品（含獎品整合）| ✅ DONE | `AdminLotteryWithPrizesForm.vue` |
| 編輯商品 | ✅ DONE | |
| 獎品列表 | ✅ DONE | `LotteryPrizeList.vue` |
| 新增/編輯獎品 | ✅ DONE | `LotteryPrizeForm.vue` |
| 路由設定 | ✅ DONE | `lotteryWithPrizesRoutes.ts`、`lotteryPrizeRoutes.ts` |
| `constants/lotteryOptions.ts` | ✅ DONE | 枚舉常數定義 |
| `adminCategoryService.ts` | ⚠️ 待確認 | 有 service 但 spec 使用 inline enum；確認是否有對應後端 API |

---

## 技術決策

| 決策 | 結論 |
|------|------|
| 商品類型選擇 | 用 `constants/lotteryOptions.ts` 的 enum 驅動表單 section 顯隱（`v-if category === 'CUSTOM_GACHA'`）|
| `playMode` | 前端絕對不傳，後端自動推算 |
| 獎品列表整合 vs 單獨 | Form 頁支援整合 API（`lottery-with-prizes`）；若需補充獎品則走獨立 prize 路由 |

---

## 待確認項目

**T-PROD-01**：`adminCategoryService.ts` 呼叫的 `/admin/categories` 端點，確認後端是否有此路由。  
若無，此 service 應移除（避免呼叫不存在的 API）；若有，補充 spec 說明。

# Tasks — 商品管理 (05-product-management)

**優先級說明**  
`[P0]` 資安或 runtime 致命問題 | `[P1]` 功能缺失 | `[P2]` 完善度 | `[DONE]` 已實作待驗收

---

## T-PROD-01 [P2] 確認 adminCategoryService 後端端點

**檔案**：`src/services/adminCategoryService.ts`

**確認**：`adminCategoryService.ts` 呼叫 `GET /admin/categories`（或類似路徑）。需確認後端是否有此端點。

**處理方式**：
- 若後端**有**此 API：保留 service，補充 spec 說明（此 spec 以 inline enum 為主，API 為動態選項來源）
- 若後端**無**此 API：移除 `adminCategoryService.ts`，使用 `src/constants/lotteryOptions.ts` 的靜態 enum

**完成條件**：確認後端端點存在或移除 service

---

## T-PROD-02 [DONE] 商品 CRUD（含獎品整合）

**檔案**：`src/views/lottery-with-prizes/Admin LotteryWithPrizesList.vue`、`AdminLotteryWithPrizesForm.vue`  
**狀態**：已實作。驗收確認：建立商品含獎品一次送出，列表分頁，狀態操作正常

---

## T-PROD-03 [DONE] 獎品單獨管理

**檔案**：`src/views/lotteryPrize/LotteryPrizeList.vue`、`LotteryPrizeForm.vue`  
**狀態**：已實作。驗收確認：從商品路由進入獎品管理，CRUD 正常

---

## T-PROD-04 [DONE] 商品狀態操作（上架/下架）

**狀態**：已實作。驗收確認：上架前提條件驗證（後端 400 錯誤）有對應顯示

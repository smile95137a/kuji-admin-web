# Tasks — 前台玩家管理 (07-frontend-user-management)

**優先級說明**  
`[P0]` 資安或 runtime 致命問題 | `[P1]` 功能缺失 | `[P2]` 完善度 | `[DONE]` 已實作待驗收

---

## T-MEM-01 [P1] 移除錢包調點 UI

**檔案**：`src/views/member/FrontendUserEdit.vue`（及所有 member 相關 view）

**移除項目**：
1. 調整點數按鈕（調整金幣/紅利）
2. 調整點數表單/Modal
3. 錢包交易記錄 table/section
4. 任何呼叫 `adminWalletService.adjustWalletCoins` 的程式碼
5. 任何呼叫 `adminWalletService.queryWalletTransactions` 的程式碼

**保留項目**：
- `goldCoins`/`bonusCoins` 欄位的**唯讀顯示**（不附操作按鈕）

**完成條件**：玩家頁面無任何調點按鈕；餘額欄位顯示正確（唯讀）

---

## T-MEM-02 [P2] 確認獎品盒路由狀態

**檔案**：`src/router/prizeBoxRoutes.ts`、`src/views/prizeBox/AdminPrizeBox.vue`

**確認**：`/home/prize-box` 路由目前是獨立頁面（非 per-user 查詢）。確認頁面能正常顯示，並決定是否後續整合進玩家詳情的 tab。

**處理**：目前維持現狀（保留獨立頁面），等使用者確認整合方案後再動

**完成條件**：`/home/prize-box` 可正常訪問，頁面無 console error

---

## T-MEM-03 [DONE] 玩家列表

**檔案**：`src/views/member/FrontendUserList.vue`  
**狀態**：已實作。驗收確認：搜尋、狀態 Badge、啟用/停用快速操作正常

---

## T-MEM-04 [DONE] 玩家編輯

**檔案**：`src/views/member/FrontendUserEdit.vue`  
**狀態**：已實作。待 T-MEM-01 移除錢包 UI 後重新驗收

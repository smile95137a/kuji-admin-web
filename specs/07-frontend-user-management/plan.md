# Plan — 前台玩家管理 (07-frontend-user-management)

**狀態**：PARTIAL（列表/編輯有；錢包 UI 需移除；獎品盒路由確認）  
**影響範圍**：`src/views/member/`、`src/services/adminWalletService.ts`

---

## 現有實作狀態

| 功能 | 狀態 | 備註 |
|------|------|------|
| 玩家列表 | ✅ DONE | `FrontendUserList.vue` |
| 玩家編輯 | ✅ DONE | `FrontendUserEdit.vue` |
| 啟用/停用/暫停 | ✅ DONE | service 有對應方法 |
| 餘額顯示（goldCoins/bonusCoins）| ⚠️ 待確認 | 列表頁有顯示欄位，確認是否唯讀 |
| 錢包調點 UI | ❌ 需移除 | 使用者確認錢包功能不做；移除所有調點/充值 UI |
| 錢包交易記錄 | ❌ 需移除 | 同上 |
| 獎品盒路由 `/home/prize-box` | ⚠️ 待觀察 | 獨立頁面保留，待使用者確認是否整合進玩家詳情 |

---

## 技術決策

| 決策 | 結論 |
|------|------|
| 錢包功能 | **完全移除** UI；`adminWalletService.ts` 保留（不刪 service，避免破壞 import），但不在任何 view 中使用 |
| 獎品盒 | 獨立頁面 `/home/prize-box` 暫時保留，觀察後再決定 |
| 餘額顯示 | `goldCoins`/`bonusCoins` 欄位保留唯讀顯示，不附帶任何操作按鈕 |

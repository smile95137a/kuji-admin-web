# Quickstart：015 刮刮樂獎項規則修正 — 本地測試指南

**日期**：2026-04-07

---

## 前置條件

- 後端服務已啟動（`015-scratch-lottery-prize-rules` 分支）
- 後台前端 `npm run dev:local` 已啟動
- 已有測試帳號：ROLE_ADMIN 或 ROLE_STORE_OWNER

---

## 測試流程 1：設定刮刮樂大獎（核心流程）

1. 登入後台，前往「抽獎商品管理」→「新增」
2. 選擇 `playMode = SCRATCH_MODE`，`gameMode = SCRATCH_STORE`，填寫 `maxDraws`（建議 10）
3. 儲存後進入「獎品管理」頁
4. 確認頁面頂部顯示藍色說明橫幅（「大獎數量固定為 1…」）
5. 點擊「新增獎項」，勾選「此為大獎（isGrandPrize）」
   - `totalQuantity` 應自動鎖定為 1（唯讀）
   - `level` 欄位應變為下拉選單（A~Z + GRAND）
6. 填寫其餘欄位並儲存
7. 確認「新增獎項」按鈕變為 disabled（tooltip：「已達大獎上限（1 個）」）
8. 確認「完成配置」按鈕由 disabled 轉為 enabled

---

## 測試流程 2：指定大獎號碼（SCRATCH_STORE）

1. 完成流程 1，商品狀態升為 CONFIGURED
2. 回到商品列表，確認：
   - `designationStatus` 欄顯示橘色「待指定」徽章
   - 操作欄有「指定大獎號碼」按鈕
   - 「開始抽獎」按鈕為 disabled（hover 顯示 tooltip）
3. 點擊「指定大獎號碼」，開啟 Modal
4. 輸入籤號（1 ~ maxDraws），確認即時驗證正常
5. 點擊「確認」，出現二次確認 Dialog
6. 確認後送出，確認：
   - Toast 顯示「大獎號碼指定成功」
   - Modal 關閉
   - 列表刷新：`designationStatus` 徽章變為綠色「已完成」
   - 「指定大獎號碼」按鈕消失
   - 「開始抽獎」按鈕恢復可點擊

---

## 測試流程 3：SCRATCH_PLAYER 商品（無需後台指定）

1. 新增 `playMode = SCRATCH_MODE`，`gameMode = SCRATCH_PLAYER` 的商品
2. 進入商品編輯頁，確認顯示藍色說明條（「大獎號碼將由第一位開套玩家指定…」）
3. 在商品列表確認此商品**不顯示**「指定大獎號碼」按鈕
4. 確認「開始抽獎」按鈕正常可點擊（不受 designationStatus 限制）

---

## 測試流程 4：回歸測試（非刮刮樂商品）

1. 開啟一番賞（LOTTERY_MODE）商品的編輯頁，確認無 designation 提示條
2. 開啟一番賞商品的獎品管理頁，確認 `isGrandPrize` 勾選框不顯示，`level` 維持自由文字輸入
3. 確認一番賞商品列表中 `designationStatus` 欄位為空

---

## 驗證邊界情況

| 情境 | 操作 | 預期結果 |
|------|------|---------|
| Modal 輸入超出範圍（如 0 或 > maxDraws） | 嘗試送出 | 前端驗證錯誤，不呼叫 API |
| maxDraws=1 | 開啟 Modal | 只有一個選項，自動選取，顯示提示 |
| 指定 API 失敗（模擬 403） | 送出 | Modal 保持開啟，顯示錯誤訊息，號碼保留 |
| 刮刮樂商品已有 1 大獎，嘗試新增第二個 | 獎品頁 | 「新增獎項」按鈕 disabled |

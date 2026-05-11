# AI 接手指引（admin-web）

最後更新：2026-05-11

## 接手起點

1. 目前已是乾淨接手點（`main...origin/main`）。
2. 下一位 AI 直接從會員契約驗收與 smoke 開始。

## 一句話

會員前後端契約同步已啟動，請延續 `list/detail` DTO 對齊，避免擴散到非會員模組。

## 本包邊界

1. 僅處理 `src/services/adminFrontendUserService.ts` 與會員頁面相關引用。
2. 不新增頁面，不改路由，不改視覺風格。
3. 所有變更完成後需 `commit + push`。

## 驗證

1. 至少執行一次 build 或 typecheck。
2. 若有既有 warning，可記錄但不在本包擴修。
3. 回報：已完成 / 待評估 / 下一包。
4. 收尾：更新 handoff 並執行 `commit + push`。

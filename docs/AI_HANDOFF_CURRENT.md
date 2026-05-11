# AI 交接現況（admin-web）

最後更新：2026-05-11

## 本輪重點

1. 已啟動與後端 `kuji-admin` 的會員契約同步（`/admin/frontend-users`）。
2. `src/services/adminFrontendUserService.ts` 已補強型別：
   - `FrontendUserListRes`
   - `FrontendUserDetailRes`
   - `FrontendUserQueryReq`
3. 現有頁面持續沿用同一 API 路由，不改動既有 UX。

## 目前狀態

1. 工作樹包含會員模組同步檔案（list/edit/member picker/search dialog）。
2. 建置可啟動但有既有 Sass deprecation warning（非阻斷）。
3. 尚待最終 `commit + push` 節點。

## 下一步（接手者）

1. 先確認 `FrontendUserList.vue` / `FrontendUserEdit.vue` 的欄位是否完全對應 list/detail DTO。
2. 若僅型別調整，避免改動 UI 行為與欄位呈現順序。
3. 完成後更新本檔並執行 `commit + push`。

# Tasks — 內容管理 (09-content-management)

**優先級說明**  
`[P0]` 資安或 runtime 致命問題 | `[P1]` 功能缺失 | `[P2]` 完善度 | `[DONE]` 已實作待驗收

---

## T-CMS-01 [P2] 確認並補齊 Banner 拖曳排序

**檔案**：`src/views/banner/BannerList.vue`

**確認**：檢查 BannerList.vue 是否有拖曳排序 UI，以及是否呼叫 `PUT /admin/banner/reorder`

**若缺失，補實作**：
1. 使用瀏覽器原生 `dragstart`/`dragover`/`drop` events（不引入新庫）
2. 拖曳後更新本地順序，呼叫 `adminBannerService.reorderBanners(ids: string[])` → `PUT /admin/banner/reorder`
3. 樂觀更新排序，API 失敗時回滾

**完成條件**：可拖曳調整 Banner 順序，儲存後排序持久化

---

## T-CMS-02 [P1] 確認富文本編輯器並移除 TipTap

**確認**：
1. 開啟 `src/views/news/NewsForm.vue`，確認使用 `CKEditor5` 還是 `TipTap`
2. 開啟 `src/views/banner/BannerForm.vue`，確認是否有富文本需求

**若確認使用 CKEditor5**：
1. 從 `package.json` 移除所有 TipTap 依賴：
   - `@tiptap/vue-3`
   - `@tiptap/starter-kit`
   - `@tiptap/extension-image`
   - `@tiptap/extension-link`（注意：這些在 package.json 有重複，一次清除）
2. 執行 `npm install` 更新 lock file

**完成條件**：`package.json` 中無 TipTap 依賴；NewsForm.vue CKEditor5 正常運作；bundle 大小縮小

---

## T-CMS-03 [DONE] Banner CRUD

**檔案**：`src/views/banner/BannerList.vue`、`BannerForm.vue`  
**狀態**：已實作。驗收確認：新增/編輯/刪除/發布正常；圖片上傳功能正常

---

## T-CMS-04 [DONE] 新聞 CRUD

**檔案**：`src/views/news/NewsList.vue`、`NewsForm.vue`  
**狀態**：已實作。驗收確認：富文本編輯正常；草稿/發布狀態切換正常

---

## T-CMS-05 [DONE] 跑馬燈 CRUD

**檔案**：`src/views/marquee/MarqueeList.vue`、`MarqueeForm.vue`  
**狀態**：已實作。驗收確認：type 對應顏色標籤顯示正確；啟用/停用正常

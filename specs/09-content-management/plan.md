# Plan — 內容管理 (09-content-management)

**狀態**：DONE（三個模組均有 CRUD 實作）；Banner 拖曳排序待確認；雙富文本問題待清理  
**影響範圍**：`src/views/banner/`、`src/views/news/`、`src/views/marquee/`

---

## 現有實作狀態

| 功能 | 狀態 | 備註 |
|------|------|------|
| Banner 列表/新增/編輯/刪除 | ✅ DONE | `BannerList.vue`、`BannerForm.vue` |
| Banner 發布/下線 | ✅ DONE | |
| Banner 拖曳排序（`PUT /banner/reorder`）| ⚠️ 待確認 | 未確認 `BannerList.vue` 是否有拖曳排序 UI |
| 新聞 CRUD + 發布/下線 | ✅ DONE | `NewsList.vue`、`NewsForm.vue` |
| 富文本編輯器 | ⚠️ 待清理 | CKEditor5 和 TipTap 3 同時安裝；確認 NewsForm 用哪個 |
| 跑馬燈 CRUD + 啟停用 | ✅ DONE | `MarqueeList.vue`、`MarqueeForm.vue` |
| 圖片上傳 | ✅ DONE | `adminUploadService.ts` |

---

## 技術決策

| 決策 | 結論 |
|------|------|
| 富文本編輯器 | 確認後保留 CKEditor5（Spec 09 指定）；移除 TipTap 依賴（約 3–5MB bundle 節省）|
| 拖曳實作 | 若缺少，使用瀏覽器原生 Drag and Drop API 或 `@vueuse/core` useDraggable（不引入新庫）|

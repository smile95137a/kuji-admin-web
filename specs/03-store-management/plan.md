# Plan — 店家管理 (03-store-management)

**狀態**：PARTIAL（列表/詳情/啟停用 UI 有；新增店家完全缺失；啟停用 API 端點不符）  
**影響範圍**：`src/services/adminStoreService.ts`、`src/views/store/`、`src/router/storeRoutes.ts`

---

## 現有實作狀態

| 功能 | 狀態 | 備註 |
|------|------|------|
| 店家列表（`POST /list`）| ✅ DONE | `StoreList.vue` |
| 店家詳情（`GET /{id}`）| ✅ DONE | `StoreDetail.vue` |
| 更新店家資訊（`PUT /{id}`）| ✅ DONE | `StoreEdit.vue` |
| 啟用店家 | ⚠️ WRONG | 呼叫 `POST /{id}/activate`；後端已改為 `PUT /{id}/status + { status: "ACTIVE" }` |
| 停用店家 | ⚠️ WRONG | 呼叫 `POST /{id}/deactivate`；後端已改為 `PUT /{id}/status + { status: "INACTIVE" }` |
| 新增店家（`POST /`）| ❌ MISSING | service 無 `createStore()`；無 `StoreCreate.vue`；無路由 |
| 停用確認 Modal | ✅ DONE | `StoreDisableModal.vue`（含連動說明）|
| 啟用確認 Modal | ✅ DONE | `StoreEnableModal.vue` |

---

## 技術決策

| 決策 | 結論 |
|------|------|
| 啟停用合併端點 | `updateStoreStatus(storeId, status)` → `PUT /admin/stores/{id}/status + { status, reason? }` |
| 新增店家含 nested owner | `CreateStoreReq` 傳 `owner?` nested object；後端 transactional |
| StoreCreate 表單 | 分兩個 section：基本資訊 + Optional 負責人帳號；送出前用 vee-validate 驗證 |

---

## 元件邊界規劃（新增店家）

```
src/views/store/StoreCreate.vue
  ├── 子元件：StoreBasicForm.vue（店家基本欄位）
  ├── 子元件：StoreOwnerForm.vue（負責人帳號，選填）
  ├── composable：useStoreCreate（API 呼叫 + 驗證邏輯）
  └── 職責：整合兩個 form section，送出 CreateStoreReq
```

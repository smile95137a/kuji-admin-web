# Tasks — 後台帳號管理 (04-account-management)

**優先級說明**  
`[P0]` 資安或 runtime 致命問題 | `[P1]` 功能缺失 | `[P2]` 完善度 | `[DONE]` 已實作待驗收

---

## T-ACC-01 [P1] 修正 adminUserRoutes.ts 絕對路徑

**檔案**：`src/router/adminUserRoutes.ts`

**問題**：路由 `path` 使用絕對路徑（`/home/admin-users`），其他模組全使用相對路徑（`admin-users`）。在 `children` 陣列中使用絕對路徑可能導致 layout（`Home.vue`的 `<router-view>`）被繞過。

**修正**：將所有 `path` 中的 `/home/` 前綴移除：
```typescript
// 修正前
{ path: '/home/admin-users', ... }
{ path: '/home/admin-users/add-owner', ... }

// 修正後
{ path: 'admin-users', ... }
{ path: 'admin-users/add-owner', ... }
```

**完成條件**：訪問 `/home/admin-users` 時 `Home.vue` layout（sidebar + header）正常顯示

---

## T-ACC-02 [P2] 確認 GET /admin/users/me 使用情境

**檔案**：`src/stores/authStore.ts` 或登入流程

**確認**：頁面重整後（authStore 從 localStorage 還原），是否需要呼叫 `GET /admin/users/me` 確認 session 仍有效並刷新 user 資料？

**目前狀況**：`adminUserService.ts`（或類似 service）有此方法，但未在任何初始化流程中呼叫

**建議**：在 `App.vue` 的 `onMounted` 中，若 `authStore.isLogin`，呼叫 `/me` 確認 session 並更新 user 資料（若 token 過期則由 refresh interceptor 處理）

**完成條件**：重整頁面後 user 資料為最新狀態

---

## T-ACC-03 [DONE] 帳號 CRUD UI

**檔案**：`src/views/adminUser/AdminUserList.vue`、`src/views/adminUser/AdminUserForm.vue`  
**狀態**：已實作。驗收確認：建立 StoreOwner / StoreEditor、停用/啟用、刪除皆正常

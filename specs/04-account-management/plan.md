# Plan — 後台帳號管理 (04-account-management)

**狀態**：PARTIAL（核心 UI 有；路由絕對路徑 bug；GET /me 未被使用）  
**影響範圍**：`src/router/adminUserRoutes.ts`、`src/views/adminUser/`

---

## 現有實作狀態

| 功能 | 狀態 | 備註 |
|------|------|------|
| 帳號列表 | ✅ DONE | `AdminUserList.vue` |
| 建立 StoreOwner 帳號 | ✅ DONE | `AdminUserForm.vue` |
| 建立 StoreEditor 帳號 | ✅ DONE | `AdminUserForm.vue` |
| 更新帳號 | ✅ DONE | |
| 停用/啟用帳號 | ✅ DONE | |
| 刪除帳號 | ✅ DONE | |
| 路由設定 | ⚠️ BUG | `adminUserRoutes.ts` 使用**絕對路徑**（`/home/admin-users`），其他模組用相對路徑 |
| `GET /admin/users/me` | ⚠️ PARTIAL | service 有此方法，但未在 authStore 初始化流程中使用 |

---

## 技術決策

| 決策 | 結論 |
|------|------|
| 路由路徑風格 | 統一使用**相對路徑**（`admin-users` 而非 `/home/admin-users`），與其他路由模組一致 |
| `GET /me` 使用時機 | 頁面重整後（authStore 從 localStorage 還原時）可用此 API 確認 session 仍有效並刷新 user 資料 |

---

## 已知 Bug 詳情

`src/router/adminUserRoutes.ts` 中路由路徑為：
```typescript
{ path: '/home/admin-users', ... }   // ❌ 絕對路徑
```

應改為：
```typescript
{ path: 'admin-users', ... }         // ✅ 相對路徑（在 /home children 內）
```

影響：在某些 Vue Router 版本中，`children` 內使用絕對路徑可能導致路由不匹配或 layout 被繞過。

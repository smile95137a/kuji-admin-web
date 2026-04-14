# Plan — 角色與權限 (02-roles-and-permissions)

**狀態**：PARTIAL（Role CRUD + Menu 後台管理 DONE；動態 sidebar 端點錯誤；router guard 無角色檢查）  
**影響範圍**：`src/views/Home.vue`、`src/router/index.ts`

---

## 現有實作狀態

| 功能 | 狀態 | 備註 |
|------|------|------|
| Role CRUD（列表/新增/編輯/刪除）| ✅ DONE | `src/views/role/`、`src/services/adminRoleService.ts` |
| Role 權限設定頁 | ✅ DONE | `src/views/role/RolePermissions.vue` |
| Menu 後台管理（CRUD + TreeView）| ✅ DONE | `src/views/menu/`、`src/services/adminMenuService.ts` |
| Sidebar 動態渲染 | ⚠️ PARTIAL | `Home.vue` 有呼叫 API，但呼叫 `/tree`（全部）而非 `/accessible`（角色過濾）|
| 靜態路由（全員可見）| ⚠️ PARTIAL | 路由全靜態，策略正確（不做動態路由），但需補 `meta.requiresAuth` |
| 按鈕級權限（`canEdit`/`canDelete`）| ❌ MISSING | 靜態路由的 `meta.permissions` 未設定 |
| Router guard 角色檢查 | ❌ MISSING | 目前只檢查 `isLogin`，無角色過濾 |

---

## 技術決策

| 決策 | 結論 | 理由 |
|------|------|------|
| 動態路由 vs 靜態路由 | **靜態路由**（保持現況）| 動態路由需重構路由架構，成本高；由 sidebar 控制哪些選單可見即達到 RBAC 效果 |
| Sidebar 選單來源 | 優先用 `authStore.menus`（登入時取得）；`Home.vue onMounted` 呼叫 `getAccessibleMenuTree()` 取即時版 | `menus` 需先存入 authStore（見 01-auth T-AUTH-03）|
| Router guard | 僅補 `meta.requiresAuth` 檢查，不加角色守衛 | 角色控制由 sidebar 顯示隱藏決定，後端 API 有 `@PreAuthorize` 二次保護 |
| `ROLE_ADMIN` 保護 | 後端對 ADMIN 操作 `PUT .../permissions` 回傳 403；前端顯示對應錯誤 | 已確認後端有 `@PreAuthorize` |

---

## 已知差距

| 差距 | 嚴重度 |
|------|--------|
| Sidebar 呼叫 `/tree` 而非 `/accessible` → STORE_OWNER 但看到所有選單 | 🔴 高 |
| 所有 `/home` 子路由缺少 `meta.requiresAuth: true` → guard 無效 | 🟡 中 |

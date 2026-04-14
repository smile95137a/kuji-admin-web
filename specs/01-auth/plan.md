# Plan — 後台認證流程 (01-auth)

**狀態**：PARTIAL（Token 流程有，但 mustChangePassword 導向缺失、menus 被棄用）  
**影響範圍**：`src/stores/authStore.ts`、`src/services/adminAuthService.ts`、`src/router/index.ts`

---

## 現有實作狀態

| 功能 | 狀態 | 備註 |
|------|------|------|
| 登入 API 呼叫 | ✅ DONE | `adminAuthService.adminLogin()` |
| Token 儲存到 Pinia | ✅ DONE | 但同時也寫入 localStorage（違反 Spec）|
| `firstLoginChangePassword` | ✅ DONE | `adminAuthService.firstLoginChangePassword()` |
| `changePassword` | ✅ DONE | `adminAuthService.changePassword()` |
| `refreshToken` | ✅ DONE | `adminAuthService.refreshToken()` |
| `adminLogout` | ✅ DONE | `adminAuthService.adminLogout()` |
| `mustChangePassword` 強制導向 | ❌ MISSING | `forceChangePassword` flag 存入 store 但 router guard 沒有攔截 |
| `menus` 儲存 | ❌ MISSING | 登入回傳的 `menus` 被完全忽略，未存入 authStore |
| `ChangePassword.vue` 頁面 | ❌ MISSING | 沒有首次改密碼的 View |
| `accessToken` 不寫 localStorage | ❌ MISSING | 目前仍寫入（見 T-ARCH-03）|

---

## 技術決策

| 決策 | 結論 |
|------|------|
| `menus` 存放位置 | Pinia `authStore.menus`，並同步 localStorage（供 sidebar `onMounted` 初始渲染用）|
| Sidebar menus 來源 | 登入時優先用 login response 的 `menus`；`Home.vue onMounted` 再呼叫 `getAccessibleMenuTree()` 取即時版 |
| 首次改密碼頁路由 | `/change-password`（獨立路由，不在 `/home` children 內，不需 layout）|
| `mustChangePassword` 攔截位置 | `router.beforeEach`：登入且 `forceChangePassword === true` 且目標非 `/change-password` → 強制跳轉 |
| 改密碼成功後 | 清除 `forceChangePassword` flag，用新 token 更新 store，導向 `/home` |

---

## 元件邊界規劃

```
src/views/ChangePassword.vue
  ├── 子元件：無（頁面簡單，不需拆分）
  ├── composable：useChangePassword（封裝 API 呼叫 + vee-validate 邏輯）
  └── 職責：首次登入改密碼表單，成功後導向 /home
```

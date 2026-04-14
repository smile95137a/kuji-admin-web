# Tasks — 後台認證流程 (01-auth)

**優先級說明**  
`[P0]` 資安或 runtime 致命問題 | `[P1]` 功能缺失 | `[P2]` 完善度 | `[DONE]` 已實作待驗收

---

## T-AUTH-01 [P1] 建立首次改密碼頁面

**檔案**：`src/views/ChangePassword.vue`（新建）  
**路由**：`/change-password`（加入 `src/router/index.ts`，不在 `/home` children 內）

**元件職責**：首次登入強制改密碼表單

**欄位**：
- 舊密碼（`oldPassword`）
- 新密碼（`newPassword`，至少 8 字元）
- 確認新密碼（`confirmPassword`，需與 `newPassword` 一致）

**行為**：
1. 呼叫 `adminAuthService.firstLoginChangePassword(req)`（`POST /admin/auth/first-login/change-password`）
2. 成功後：用回傳的新 LoginRes 更新 `authStore`，清除 `forceChangePassword: false`，導向 `/home`
3. 失敗顯示 `error.message`

**完成條件**：`mustChangePassword=true` 的帳號登入後被強制留在此頁，改密碼成功後可進入 `/home`

---

## T-AUTH-02 [P0] Router Guard 補上 forceChangePassword 攔截

**檔案**：`src/router/index.ts`

**修正**：在現有 `router.beforeEach` 中補上：
```typescript
// 已登入但需要改密碼：強制導向改密碼頁
if (authStore.forceChangePassword && to.path !== '/change-password') {
  return '/change-password'
}
```

**位置**：緊接在 `requiresAuth && !isLogin` 判斷之後

**完成條件**：`forceChangePassword=true` 時，任何路由導向均被攔截至 `/change-password`

---

## T-AUTH-03 [P1] authStore 補存 menus 欄位

**檔案**：`src/stores/authStore.ts`

**修正**：
1. 新增 `menus` state（型別 `MenuNode[]`，預設 `[]`）
2. `setAuthFromLogin(data)` 中補存 `menus: data.menus ?? []`
3. `clearAuthData()` 中補清除 `menus`
4. `menus` 同步 localStorage（供 `Home.vue` 初始渲染 fallback 用）

**完成條件**：登入後 `authStore.menus` 有後端回傳的選單樹；重整頁面後 sidebar 能從 localStorage 初始顯示

---

## T-AUTH-04 [P0] accessToken 不寫 localStorage

**依賴**：見 `specs/00-architecture/tasks.md` → T-ARCH-03  
**此 Task 標記為 BLOCKED，待 T-ARCH-03 完成後自動解除**

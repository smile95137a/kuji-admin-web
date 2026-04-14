# Tasks — 整體架構 (00-architecture)

**優先級說明**  
`[P0]` 資安或 runtime 致命問題 | `[P1]` 功能缺失 | `[P2]` 完善度 | `[DONE]` 已實作待驗收

---

## T-ARCH-01 [P0] 修正 Token Refresh 端點路徑

**檔案**：`src/services/FrontAPI.ts`  
**問題**：401 攔截器呼叫 `POST /api/admin/auth/refresh-token`，後端實際路徑為 `/api/admin/auth/refresh`  
**修正**：將 refresh 請求路徑由 `/admin/auth/refresh-token` 改為 `/admin/auth/refresh`  
**同步**：`_retry` guard 的比對字串也需一起更新（避免 refresh 請求本身觸發無限 retry）

**完成條件**：`401` 時 network tab 顯示呼叫 `/api/admin/auth/refresh`，且能成功取得新 token

---

## T-ARCH-02 [P1] 修正 Axios Timeout

**檔案**：`src/services/FrontAPI.ts`  
**問題**：現有 `timeout: 1000000`（約 16 分鐘），等同沒有 timeout  
**修正**：改為 `timeout: 30000`（30 秒）

**完成條件**：Axios 實例 timeout 設定為 30000

---

## T-ARCH-03 [P0] accessToken 改存 Pinia Memory

**檔案**：`src/stores/authStore.ts`、`src/services/FrontAPI.ts`、`src/services/AuthService.ts`  
**問題**：`accessToken` 目前寫入 `localStorage`，有 XSS 風險；Spec 01 明確規定存記憶體  
**修正**：
1. `authStore.ts`：`token`（accessToken）只存 Pinia state，`saveState()` 時不寫 `localStorage`
2. `FrontAPI.ts` request interceptor：從 `authStore.token`（Pinia）讀取，而非 `AuthService.getAuthToken()`（localStorage）
3. `refreshToken`、`tokenType`、`expiresIn` 仍可留 localStorage（需跨頁面持久化）

**完成條件**：登入後 `localStorage.getItem('token')` 為 `null`；重整頁面後透過 refresh 自動取得新 token

---

## T-ARCH-04 [P2] 確認 pinia-plugin-persistedstate 使用狀況

**檔案**：`src/main.ts`、`src/stores/authStore.ts`  
**問題**：`package.json` 安裝了 `pinia-plugin-persistedstate`，但 `authStore` 自行管理 localStorage，可能造成雙重寫入  
**確認**：檢查 `main.ts` 是否有 `app.use(piniaPluginPersistedstate)`；若有，確認 authStore 是否同時設定了 `persist: true`  
**修正**：若發現雙重寫入衝突，移除 plugin 的 `persist` 設定，以 authStore 自行管理為準

**完成條件**：無雙重寫入；authStore 行為一致

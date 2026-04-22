# F5 重整後登出 / 403 問題修復紀錄

## 問題描述

按下 F5 重整頁面後：
1. 系統立刻被登出（跳回登入頁）
2. 或出現 403（元件 `onMounted` 的 API 在 token 恢復前就打出去）
3. 無 token 時也無法自動導向登入頁面

## 根本原因

`accessToken` 為了防止 XSS 攻擊，**刻意只存在 Pinia 記憶體（不寫 localStorage）**。

| 儲存位置 | F5 後 |
|---------|-------|
| Pinia memory | 歸零 ❌ |
| localStorage | 保留 ✅ |
| sessionStorage | 保留（關閉分頁才清除） ✅ |

F5 後 Pinia 歸零 → `token = null` → `isLogin = false` → router guard 直接導向 `/login`，同時頁面上所有 `onMounted` 的 API 因為拿不到 token 而回傳 403。

`refreshToken` 原本存在 `localStorage`，理論上可以靜默換回 `accessToken`，但啟動流程沒有這個恢復機制，且 `localStorage` 的 refreshToken 在關閉瀏覽器後仍然存在（不符合預期：關閉瀏覽器應回到登入頁）。

## 解決方案

### 設計決策

| 項目 | 決策 |
|------|------|
| `accessToken` 儲存 | 繼續只存 Pinia memory（防 XSS） |
| `refreshToken` 儲存 | **改存 `sessionStorage`**（F5 保留 / 關閉分頁清除） |
| F5 後行為 | 靜默呼叫 refresh API 換回 accessToken，停留在原頁面 |
| 關閉瀏覽器後重開 | sessionStorage 清空 → refresh 失敗 → 回到登入頁 |
| 強制登出時 | 同時清除 sessionStorage + localStorage |

### 流程圖

```
F5 / 頁面初始化
        │
        ▼
router.beforeEach()
        │
        ▼
authStore.initializeAuth()
        │
        ├── token 已在 Pinia ──────────────────→ [標記 initialized，繼續]
        │
        ├── sessionStorage 有 refreshToken ──→ POST /admin/auth/refresh
        │       │
        │       ├── 成功 ──→ 寫入 Pinia token，更新 sessionStorage refreshToken
        │       │
        │       └── 失敗 ──→ clearAuthData() → router guard 導向 /login
        │
        └── 無 refreshToken ──────────────────→ [標記 initialized，繼續]
                                                    │
                                                    └── requiresAuth? → /login
```

## 修改檔案清單

| 檔案 | 說明 |
|------|------|
| `src/utils/SessionStorage.ts` | **新建**：`loadSession`, `saveSession`, `removeSession`, `removeAllSession` |
| `src/stores/authStore.ts` | `refreshToken` 改用 `saveSession`；新增 `authInitialized` 和 `initializeAuth()` |
| `src/services/AuthService.ts` | `getRefreshToken()` 改讀 `loadSession` |
| `src/services/FrontAPI.ts` | 所有強制登出處補 `removeAllSession()`；`refreshToken` 更新改用 `saveSession` |
| `src/services/adminAuthService.ts` | 修正 refresh 路徑：`/refresh-token` → `/refresh` |
| `src/router/index.ts` | `beforeEach` 改為 `async`，加上 `await authStore.initializeAuth()` |

## 驗證步驟

1. `npm run dev` 登入後，按 F5 → 應停留在原頁面，不被登出
2. 登入後關閉瀏覽器 → 重新開啟 → 應回到登入頁
3. 同一分頁開啟多個路由，F5 任一頁 → 應恢復到該頁
4. Token 過期後打 API → 仍觸發 401 → refreshToken 換新 → 請求重試
5. 無 refreshToken 直接輸入受保護路由 → 導向 `/login`
6. 正常點「登出」→ 導向 `/login`，再 F5 → 仍在 `/login`

## 安全性備註

- `accessToken` 繼續不寫任何持久化儲存（防 XSS），只存記憶體
- `refreshToken` 存 `sessionStorage` 而非 `localStorage`，關閉分頁即清除
- `initializeAuth()` 使用 **raw axios**（不走 `api` 實例的攔截器），避免 401 response interceptor 觸發無限 refresh 循環
- 內部有 promise dedupe（`_initPromise`），多次呼叫不會重複打 refresh API

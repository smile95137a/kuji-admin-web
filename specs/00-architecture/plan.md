# Plan — 整體架構 (00-architecture)

**狀態**：PARTIAL（Axios refresh 路徑錯誤、timeout 過大、accessToken 存 localStorage）  
**影響範圍**：全系統（所有 API 請求、認證流程）

---

## 技術決策

| 決策 | 結論 | 理由 |
|------|------|------|
| `accessToken` 儲存位置 | **Pinia store（記憶體）** | 避免 XSS 攻擊；Spec 01 明確規定不存 localStorage |
| `refreshToken` 儲存位置 | `localStorage` | 需跨頁面持久化 |
| Axios timeout | `30000`ms（30 秒） | 現有值 `1000000`ms（~16 分鐘）等同沒有 timeout |
| Token refresh 端點 | `POST /api/admin/auth/refresh` | 後端已確認路徑；現有程式碼錯誤呼叫 `/refresh-token` |
| 全域錯誤處理 | 401 queue-based refresh；其他狀態碼在 interceptor 顯示 toast | 避免每個 view 各自處理 HTTP 錯誤 |
| 分頁策略 | 後端回傳全量 List，前端 `Array.slice` 分頁 | Spec 00 確認設計 |

---

## 已知風險

| 風險 | 嚴重度 | 狀態 |
|------|--------|------|
| `accessToken` 存 localStorage → XSS 可竊取 | 🔴 高 | 待修正（T-ARCH-03）|
| refresh 端點路徑錯誤 → 401 後無法自動刷新 | 🔴 高 | 待修正（T-ARCH-01）|
| Axios timeout `1000000ms` → 網路問題時使用者無反饋 | 🟡 中 | 待修正（T-ARCH-02）|
| `pinia-plugin-persistedstate` 安裝但 authStore 自行 localStorage 操作 → 雙重寫入 | 🟡 中 | 確認後清理 |

---

## 現有實作狀態

| 項目 | 狀態 | 備註 |
|------|------|------|
| Axios 單一實例（`FrontAPI.ts`）| ✅ DONE | `baseURL` 從環境變數讀取 |
| Request interceptor（注入 Authorization）| ✅ DONE | 但從 localStorage 讀取，需改為 Pinia |
| Response interceptor（401 queue-based refresh）| ✅ DONE | 路徑錯誤，需修正 |
| 環境多模式支援（dev/uat/production）| ✅ DONE | Vite mode 切換 |
| `ApiResponse<T>` 型別宣告 | ✅ DONE | `src/types/global.d.ts` |
| `accessToken` 存 Pinia memory | ❌ MISSING | 目前存 localStorage |
| Axios timeout 合理值 | ❌ MISSING | 目前 `1000000`ms |
| refresh 端點正確路徑 | ❌ MISSING | 目前 `/refresh-token` |

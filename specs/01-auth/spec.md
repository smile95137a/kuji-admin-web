# 01 - 後台認證流程

> **路由前綴**：`/admin/auth`  
> **允許角色**：無角色限制（登入前呼叫）

---

## 登入

```
POST /api/admin/auth/login
Content-Type: application/json
（不需要 Authorization Header）
```

### 請求
```typescript
interface AdminLoginReq {
  username: string;  // Email
  password: string;
}
```

### 回應
```typescript
interface LoginRes {
  accessToken: string;          // 短效 JWT（約 30 分鐘）
  refreshToken: string;         // 長效刷新 Token（約 7 天）
  tokenType: 'Bearer';
  expiresIn: number;            // accessToken 有效秒數
  user: {
    id: string;
    username: string;           // Email
    displayName: string;
    roles: string[];            // ["ROLE_ADMIN"] 或 ["ROLE_STORE_OWNER"]
    mustChangePassword: boolean; // true = 首次登入，必須改密碼
    storeIds: string[];         // 關聯的店家 ID 列表（ADMIN 為空陣列）
  };
  menus: MenuNode[];            // 當前使用者有權限的選單樹（後端依角色過濾）
}

interface MenuNode {
  id: string;
  name: string;
  path: string;           // 對應 Vue Router path
  icon: string;
  orderNum: number;
  children: MenuNode[];
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
}
```

### 前端流程

```
1. 呼叫 POST /admin/auth/login
2. 成功後：
   a. 儲存 accessToken 到 Pinia store（記憶體，不寫 localStorage）
   b. 儲存 refreshToken 到 localStorage（持久化）
   c. 儲存 user 資訊（角色、storeIds）到 Pinia + localStorage
   d. 儲存 menus 到 Pinia + localStorage（供 sidebar 初始渲染）
   e. 檢查 mustChangePassword：
      - true  → router 強制導向「首次改密碼」頁面 /change-password
      - false → 正常導向 /home
```

---

## 首次登入改密碼

新帳號首次登入後**強制改密碼**。

```
POST /api/admin/auth/first-login/change-password
Authorization: Bearer {accessToken}
```

### 請求
```typescript
interface FirstLoginChangePasswordReq {
  oldPassword: string;     // 初始密碼
  newPassword: string;     // 新密碼（至少 8 字元）
  confirmPassword: string;
}
```

### 回應
回傳新的 `LoginRes`（含新 Token），前端用新 token 替換舊 token，清除 `mustChangePassword` flag，導向 `/home`。

---

## 一般改密碼

```
POST /api/admin/auth/change-password
Authorization: Bearer {accessToken}
```

請求結構同首次改密碼。

---

## Token 刷新

```
POST /api/admin/auth/refresh
Content-Type: application/json
（不需要 Authorization Header）
```

### 請求
```typescript
interface RefreshTokenReq {
  refreshToken: string;
}
```

### 回應
```typescript
interface RefreshRes {
  accessToken: string;
  refreshToken: string;  // 新的 refreshToken（舊的失效，需更新 localStorage）
  expiresIn: number;
}
```

### 自動刷新邏輯（Axios Interceptor）

```typescript
// 回應攔截器：遇到 401 自動 refresh
if (error.response?.status === 401) {
  const refreshToken = localStorage.getItem('refreshToken');
  // queue-based：防止並發多次 refresh
  // 成功後：更新 Pinia accessToken + localStorage refreshToken
  // 失敗後：清除所有 store + localStorage，window.location 導向 /login
}
```

⚠️ **注意**：refresh 請求本身若 401，不可再次 refresh（設 `_retry` flag 防止無限迴圈）

---

## 登出

```
POST /api/admin/auth/logout
Authorization: Bearer {accessToken}
```

### 前端登出流程
1. 呼叫 `POST /admin/auth/logout`（後端使 refreshToken 失效）
2. 清除 Pinia store 中的 `accessToken`、`user`、`menus`
3. 清除 localStorage 中的所有 auth 相關 key
4. 導向 `/login`

---

## 錯誤碼

| 狀態碼 | 錯誤碼 | 說明 |
|--------|--------|------|
| 401 | `INVALID_CREDENTIALS` | 帳號或密碼錯誤 |
| 403 | `ACCOUNT_INACTIVE` | 帳號已停用 |
| 400 | `MUST_CHANGE_PASSWORD` | 首次登入需改密碼 |
| 400 | `WRONG_OLD_PASSWORD` | 舊密碼錯誤 |
| 401 | `TOKEN_EXPIRED` | Token 過期 |
| 401 | `INVALID_TOKEN` | Token 無效 |

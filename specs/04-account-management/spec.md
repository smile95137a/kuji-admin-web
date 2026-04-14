# 04 - 後台帳號管理

> **路由前綴**：`/admin/users`  
> **允許角色**：ADMIN（全部操作）；StoreEditor 無法訪問此模組

---

## API 列表

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/admin/users/store-owner` | 建立店家負責人帳號 |
| POST | `/admin/users/store-editor` | 建立店家編輯帳號 |
| GET | `/admin/users` | 查詢後台帳號列表 |
| GET | `/admin/users/{id}` | 取得帳號詳情 |
| PUT | `/admin/users/{id}` | 更新帳號資訊 |
| PUT | `/admin/users/{id}/status` | 停用/啟用帳號 |
| DELETE | `/admin/users/{id}` | 刪除帳號 |
| GET | `/admin/users/me` | 取得當前登入帳號資訊 |

---

## 回應型別

```typescript
interface AdminUserRes {
  id: string;
  username: string;        // Email
  displayName: string;
  roles: RoleInfo[];
  status: 'ACTIVE' | 'INACTIVE' | 'FIRST_LOGIN';
  mustChangePassword: boolean;
  storeIds: string[];      // 已關聯的店家 ID 列表
  createdAt: string;
  lastLoginAt: string | null;
}

interface RoleInfo {
  id: string;
  code: string;   // ROLE_STORE_OWNER / ROLE_STORE_EDITOR
  name: string;
}
```

---

## 建立店家負責人（StoreOwner）

```
POST /api/admin/users/store-owner
Authorization: Bearer {token}（需 ADMIN）
```

```typescript
interface CreateStoreOwnerReq {
  email: string;           // 登入 Email（唯一）
  password?: string;       // 不填則後端自動生成
  displayName?: string;
}
```

---

## 建立店家編輯（StoreEditor）

```
POST /api/admin/users/store-editor
Authorization: Bearer {token}（需 ADMIN）
```

```typescript
interface CreateStoreEditorReq {
  email: string;
  password?: string;
  displayName?: string;
  storeId: string;        // 必填：指定歸屬的店家 ID
}
```

⚠️ StoreEditor 建立時**必須指定 `storeId`**

---

## 查詢帳號列表

```
GET /api/admin/users?storeId=&role=&status=
Authorization: Bearer {token}（需 ADMIN）
```

| 參數 | 說明 |
|------|------|
| `storeId` | 篩選特定店家的帳號 |
| `role` | 篩選角色（如 `ROLE_STORE_OWNER`）|
| `status` | 篩選狀態（`ACTIVE`/`INACTIVE`/`FIRST_LOGIN`）|

---

## 停用/啟用帳號

```
PUT /api/admin/users/{id}/status
Authorization: Bearer {token}（需 ADMIN）
```

```typescript
interface UpdateStatusReq {
  status: 'ACTIVE' | 'INACTIVE';
  reason?: string;
}
```

⚠️ **帳號停用後**：相關 JWT Token 立即失效；帳號無法再登入；商品、訂單記錄保留

---

## 取得當前登入帳號資訊

```
GET /api/admin/users/me
Authorization: Bearer {token}
```

回傳當前登入帳號的完整資訊，包含 `storeIds` 和 `roles`。  
**建議**：登入後呼叫此 API 補充完整使用者資料，確保 authStore 資訊最新。

---

## 業務規則

| 規則 | 說明 |
|------|------|
| StoreOwner 無法新增帳號 | 只有 Admin 可建立所有帳號 |
| StoreEditor 無法查看此模組 | 頁面層級隱藏 |
| 帳號 Email 唯一 | 重複回傳 `409 Conflict` |
| 刪除帳號條件 | 需確認沒有進行中訂單（後端驗證）|

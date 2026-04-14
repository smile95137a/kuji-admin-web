# 07 - 前台玩家管理

> **路由前綴**：`/admin/frontend-users`  
> **允許角色**：ADMIN（全部操作）

---

## API 列表

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/admin/frontend-users/list` | 查詢玩家列表 |
| GET | `/admin/frontend-users/{id}` | 取得玩家詳情 |
| PUT | `/admin/frontend-users/{id}` | 更新玩家資訊 |
| POST | `/admin/frontend-users/{id}/activate` | 啟用玩家帳號 |
| POST | `/admin/frontend-users/{id}/deactivate` | 停用玩家帳號 |
| POST | `/admin/frontend-users/{id}/suspend` | 暫停玩家帳號 |

---

## 查詢玩家列表

```
POST /api/admin/frontend-users/list
Authorization: Bearer {token}（需 ADMIN）
```

### 請求
```typescript
interface QueryReq<FrontendUserCondition> {
  condition?: {
    keyword?: string;          // 暱稱/Email 模糊搜尋
    status?: string;
    createdAtStart?: string;
    createdAtEnd?: string;
    hasReferralCode?: boolean;
  };
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
```

### 回應
```typescript
interface FrontendUserRes {
  id: string;
  email: string;
  nickname: string;
  avatarUrl: string;
  provider: 'EMAIL' | 'GOOGLE';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  goldCoins: number;        // 金幣餘額（唯讀顯示）
  bonusCoins: number;       // 紅利點數餘額（唯讀顯示）
  referralCode: string | null;
  referredByCode: string | null;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
  lastLoginAt: string | null;
}
```

---

## 更新玩家資訊

```
PUT /api/admin/frontend-users/{id}
Authorization: Bearer {token}（需 ADMIN）
```

```typescript
interface FrontendUserUpdateReq {
  nickname?: string;
  status?: string;
  remark?: string;
}
```

⚠️ **不可修改**：email、provider  
⚠️ **金幣/紅利不在此操作**（錢包功能已移除，餘額唯讀顯示）

---

## 帳號狀態管理

| 狀態 | 說明 | 可登入 |
|------|------|--------|
| `ACTIVE` | 正常 | ✅ |
| `INACTIVE` | 停用 | ❌ |
| `SUSPENDED` | 暫停（違規）| ❌ |

```
POST /api/admin/frontend-users/{id}/activate
POST /api/admin/frontend-users/{id}/deactivate
POST /api/admin/frontend-users/{id}/suspend
Authorization: Bearer {token}（需 ADMIN）
```

---

## 玩家獎品盒（Admin 查詢）

```
GET /api/admin/prize-box/{userId}           玩家獎品盒內容
GET /api/admin/prize-box/summary/{userId}   按店家分組摘要
Authorization: Bearer {token}（需 ADMIN）
```

⚠️ **錢包功能已移除**（後端相關 endpoint 存在但前端不實作）  
⚠️ **獎品盒**：目前為獨立頁面（`/home/prize-box`），後續確認是否整合進玩家詳情

---

## 余額顯示規範（唯讀）

玩家列表和詳情頁顯示：
- `goldCoins`：金幣餘額（唯讀，不可操作）
- `bonusCoins`：紅利點數餘額（唯讀，不可操作）

不顯示任何調整/充值按鈕。

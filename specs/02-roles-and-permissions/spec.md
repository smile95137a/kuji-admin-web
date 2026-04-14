# 02 - 角色與權限 (RBAC)

> **路由前綴**：`/admin/roles`、`/admin/menus`  
> **允許角色**：ADMIN（管理操作）；所有角色均可讀取自己的選單

---

## 後台角色定義

| 角色代碼 | 顯示名稱 | 功能範疇 |
|---------|---------|---------|
| `ROLE_ADMIN` | 系統管理員 | 全系統所有功能，可見所有店家資料 |
| `ROLE_STORE_OWNER` | 店家負責人 | 自己店家的商品、訂單、報表 |
| `ROLE_STORE_EDITOR` | 店家編輯 | 商品管理、部分訂單（無報表、無帳號管理）|

---

## 功能權限矩陣

| 功能模組 | ADMIN | STORE_OWNER | STORE_EDITOR |
|---------|-------|-------------|--------------|
| 登入/改密碼 | ✅ | ✅ | ✅ |
| 查看自己的店家資料 | ✅ | ✅ | ✅ |
| 新增/刪除店家 | ✅ | ❌ | ❌ |
| 停用/啟用店家 | ✅ | ❌ | ❌ |
| 建立 StoreOwner/StoreEditor 帳號 | ✅ | ❌ | ❌ |
| 商品列表查詢 | ✅（全部） | ✅（自己店家）| ✅（自己店家）|
| 新增/編輯商品 | ✅ | ✅ | ✅ |
| 刪除商品 | ✅ | ✅ | ❌ |
| 上架/下架商品 | ✅ | ✅ | ❌ |
| 訂單查詢 | ✅（全部）| ✅（自己店家）| ✅（自己店家）|
| 訂單狀態更新/出貨 | ✅ | ✅ | ✅ |
| 取消訂單 | ✅ | ✅ | ❌ |
| 報表查詢 | ✅（全部）| ✅（自己店家）| ❌ |
| Banner/新聞/跑馬燈 | ✅ | ❌ | ❌ |
| 前台玩家管理 | ✅ | ❌ | ❌ |
| 推薦碼管理 | ✅ | ❌ | ❌ |
| 系統參數 | ✅ | ❌ | ❌ |

---

## 選單 API

### 取得當前使用者可存取的選單樹

```
GET /api/admin/menus/accessible
Authorization: Bearer {token}
```

回傳已依角色過濾的選單樹。  
⚠️ **使用此端點**（不是 `/tree`，後者回傳全部選單給 ADMIN 管理用）

### 回應格式

```typescript
interface MenuNode {
  id: string;
  name: string;
  path: string;       // 對應 Vue Router path
  icon: string;
  orderNum: number;   // 排序（小的在前）
  children: MenuNode[];
  isVisible: boolean;
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
}
```

---

## 角色管理 API

```
GET    /api/admin/roles              取得全部角色
POST   /api/admin/roles              新增角色
PUT    /api/admin/roles/{id}         更新角色
DELETE /api/admin/roles/{id}         刪除角色
GET    /api/admin/roles/{id}         取得角色詳情
GET    /api/admin/roles/{id}/detail  取得角色含權限詳情
```

```typescript
interface RoleRes {
  id: string;
  name: string;
  code: string;       // ROLE_ADMIN / ROLE_STORE_OWNER / ROLE_STORE_EDITOR
  description: string;
  permissions?: RolePermission[];
}
```

---

## 選單管理 API（後台管理 DB 選單資料用）

```
GET    /api/admin/menus              取得全部選單（平面）
POST   /api/admin/menus              新增選單
PUT    /api/admin/menus              更新選單
DELETE /api/admin/menus/{id}         刪除選單
GET    /api/admin/menus/{id}         依 ID 查詢
GET    /api/admin/menus/tree         取得完整選單樹（ADMIN 管理用）
GET    /api/admin/menus/accessible   取得當前使用者可存取選單（Sidebar 渲染用）
```

---

## 按鈕級權限控制

頁面內編輯/刪除按鈕根據 `route.meta.permissions` 控制顯示：

```vue
<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const canEdit = computed(() => route.meta.permissions?.canEdit ?? false)
const canDelete = computed(() => route.meta.permissions?.canDelete ?? false)
</script>

<template>
  <button v-if="canEdit" @click="handleEdit">編輯</button>
  <button v-if="canDelete" @click="handleDelete">刪除</button>
</template>
```

---

## 資料隔離規則

### StoreOwner / StoreEditor
- 查詢商品、訂單時**不傳 `storeId`**，後端從 JWT 自動解析
- 帳號沒有關聯任何店家時，API 回傳空列表（不報錯）

### Admin
- 查詢無店家限制，可看全部資料
- **新增商品時必須明確傳 `storeId`**（Admin 沒有預設店家）

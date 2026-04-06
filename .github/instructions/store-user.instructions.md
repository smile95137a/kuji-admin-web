---
description: "Use when working on store user management, StoreOwner/StoreEditor accounts, first-login password change, or store data authorization."
applyTo: "**"
---

# 店家帳號管理規範

## 一、帳號管理

### 帳號建立
- store_owner（店家主帳）：Admin 建立（需搭配新增店家）
- store_editor（店家小編）：Admin 建立
- 帳號建立資料：email / password / 暱稱 / 指定角色

### 帳號欄位
- admin_user 表：id, email (唯一), password (BCrypt), nickname, status (ACTIVE / INACTIVE)
- 關聯：admin_user_role (角色)、admin_user_store (所屬店家)

### 首次登入密碼變更
- Admin 建立帳號時設定初始密碼
- 帳號被標記 force_change_password = true
- 首次登入成功後強制跳轉「變更密碼」頁面
- 變更成功後 force_change_password → false

## 二、權限管理

### StoreOwner 權限
- 查看自己店家的商品、訂單
- 查看自己店家的報表
- 編輯自己店家資料（Logo、描述、地址等）

### StoreEditor 權限
- 商品上下架、編輯獎品
- 不可查看報表
- 不可管理權限
- **權限必為 StoreOwner 的子集**

### Admin 操作
- Admin 可建立 / 停用任一帳號
- 停用後帳號無法登入，token 失效
- Admin 可指派 / 移除角色

## 三、店家資料管理

### 資料隔離
- StoreOwner / StoreEditor 僅可存取自己所屬店家的資料
- 查詢 API 後端自動注入 storeId
- Admin 可跨店家查詢

### 報表授權
- StoreOwner 僅可查看自己店家的報表
- Admin 可查看全部報表

## 四、操作紀錄
- 所有帳號管理操作（建立、停用、角色指派）需記錄 system_log
- 紀錄包含：操作者 ID、被操作帳號、操作類型、時間

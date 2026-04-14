---
description: "Use when working on user system, member registration, OAuth login, user profiles, or the Gold/Bonus point system."
applyTo: "**"
---

# 後台管理者與前台用戶系統規範

## 一、角色分類

### 後台管理者（AdminUser）
| 角色 | 說明 | 權限 |
|------|------|------|
| Admin | 系統管理員 | 所有功能 |
| StoreOwner | 店家負責人 | 管理自己店家、查看報表 |
| StoreEditor | 店家編輯者 | 管理商品、不可看報表 |

### 前台用戶（User）
- 前台功能使用者（扭蛋 / 一番賞 / 商城會員）

## 二、功能需求

### 1. 會員資料管理
- 用戶條件查詢：暱稱、手機、Email、性別、年齡範圍
- 查看用戶詳情（不可修改敏感欄位）
- 帳號啟用 / 停用
- 匯出報表（CSV）

### 2. 後台帳號建立
- Admin 建立 StoreOwner / StoreEditor 帳號
- 設定初始密碼、暱稱、角色
- 首次登入需強制改密碼

### 3. 登入 / 安全
- JWT 雙 token：accessToken + refreshToken
- 401 自動 refresh，刷新失敗導到 login
- OAuth 支援：LINE / Google / Apple
- 登入限流、IP 異常偵測

### 4. 點數系統
| 欄位 | 說明 | 使用規則 |
|------|------|---------|
| gold | 儲值金 | 優先扣除 |
| bonus | 紅利金 | gold 不足時從 bonus 扣除 |

- 每次消費先扣 gold → 不足再扣 bonus
- 儲值方案由 rechargePlan 管理

## 三、需求摘要

| 功能 | StoreOwner 可用 | StoreEditor 可用 | Admin 可用 |
|------|:---:|:---:|:---:|
| 查看會員列表 | ✖ | ✖ | ✔ |
| 查看會員詳情 | ✖ | ✖ | ✔ |
| 帳號啟用/停用 | ✖ | ✖ | ✔ |
| 匯出會員報表 | ✖ | ✖ | ✔ |
| 調整點數 | ✖ | ✖ | ✔ |

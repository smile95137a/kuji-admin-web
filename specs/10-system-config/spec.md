# 10 - 系統參數管理

> **路由前綴**：`/admin/system-config`  
> **允許角色**：ADMIN

---

## API 列表

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/admin/system-config` | 查詢所有參數（可依 group 篩選）|
| POST | `/admin/system-config` | 新增參數 |
| PUT | `/admin/system-config/{id}` | 更新參數 |
| DELETE | `/admin/system-config/{id}` | 刪除參數 |

---

## 資料結構

```typescript
interface SystemConfigRes {
  id: string;
  configKey: string;      // 唯一識別碼（如 "DRAW_PROTECTION_MINUTES"）
  configValue: string;    // 字串值（前端依 type 顯示對應輸入框）
  configType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  group: string;          // 分組（如 "GAME", "NOTIFY", "PAYMENT"）
  description: string;
  isEditable: boolean;    // false = 唯讀，灰色顯示
  updatedAt: string;
}
```

---

## 查詢參數

```
GET /api/admin/system-config?group=GAME
Authorization: Bearer {token}（需 ADMIN）
```

不傳 `group` 則返回全部。

---

## 新增參數

```
POST /api/admin/system-config
Authorization: Bearer {token}（需 ADMIN）
```

```typescript
interface SystemConfigCreateReq {
  configKey: string;      // 必填，英文大寫 + 底線
  configValue: string;    // 必填
  configType: string;     // 必填
  group: string;          // 必填
  description?: string;
}
```

---

## 更新參數

```
PUT /api/admin/system-config/{id}
Authorization: Bearer {token}（需 ADMIN）
```

```typescript
interface SystemConfigUpdateReq {
  configValue: string;
  description?: string;
}
```

⚠️ `configKey` 和 `configType` 建立後不可修改

---

## 前端 configType 對應輸入框

| configType | 輸入元件 | 說明 |
|-----------|---------|------|
| `STRING` | `<input type="text">` | 一般文字 |
| `NUMBER` | `<input type="number">` | 數字，驗證為合法數值 |
| `BOOLEAN` | Toggle switch | 顯示 true / false |
| `JSON` | `<textarea>` | 多行文字；送出前可做 JSON.parse 驗證 |

`isEditable: false` → 所有 input 顯示為 `disabled`（灰色），不出現儲存按鈕

---

## 常用參數說明

| Group | Key | 說明 | 預設值 |
|-------|-----|------|--------|
| GAME | `DRAW_PROTECTION_MINUTES` | 抽獎保護時間（分鐘）| `5` |
| GAME | `MAX_DRAWS_PER_SESSION` | 每場最大抽取數 | null（無限制）|
| GAME | `SCRATCH_DESIGNATION_MINUTES` | 刮刮樂玩家指定大獎倒數（分鐘）| `10` |
| PAYMENT | `MIN_RECHARGE_AMOUNT` | 最低儲值金額（台幣）| `100` |
| NOTIFY | `MARQUEE_DURATION_SECONDS` | 跑馬燈播放秒數 | `30` |

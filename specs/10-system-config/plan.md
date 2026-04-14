# Plan — 系統參數管理 (10-system-config)

**狀態**：MISSING（service / view / route 全部缺失）  
**影響範圍**：`src/services/adminSystemConfigService.ts`（新建）、`src/views/systemConfig/`（新建）、`src/router/systemConfigRoutes.ts`（新建）

---

## 現有實作狀態

| 功能 | 狀態 | 備註 |
|------|------|------|
| `adminSystemConfigService.ts` | ❌ MISSING | |
| `SystemConfigList.vue` | ❌ MISSING | |
| `systemConfigRoutes.ts` | ❌ MISSING | |

---

## 技術決策

| 決策 | 結論 |
|------|------|
| JSON 編輯器 | `<textarea>`（不引入 Monaco，避免 ~2MB 依賴）；送出前 `JSON.parse` 驗證格式 |
| 列表分組 | 依 `group` 顯示 Tab（tab 從 API 回傳的 group 值動態生成）|
| Inline 編輯 | 每行有「編輯」按鈕切換 edit mode；`isEditable: false` 的行全程 disabled |
| 修改確認 | 送出前顯示確認 modal「系統參數異動影響全系統，確認修改？」|
| CRUD 策略 | 一般使用以「更新」為主；新增/刪除保留但在進階操作區 |

---

## 元件邊界規劃（Composition API + `<script setup lang="ts">`）

```
src/views/systemConfig/
  └── SystemConfigList.vue
        ├── composable：useSystemConfig（API 呼叫 + inline edit state）
        ├── 子元件：SystemConfigTable.vue（依 group 顯示 table rows）
        ├── 子元件：SystemConfigEditor.vue（inline 編輯 cell，依 configType 切換輸入元件）
        └── 子元件：SystemConfigConfirmModal.vue（修改確認 dialog）
```

**useSystemConfig composable 職責**：
- `configs`：全部參數資料（reactive）
- `groupedConfigs`：computed，依 group 分組
- `editingId`：當前 inline 編輯的 id
- `fetchConfigs(group?)`：呼叫 `GET /admin/system-config`
- `updateConfig(id, value)`：呼叫 `PUT /admin/system-config/{id}`
- `createConfig(req)`：呼叫 `POST /admin/system-config`
- `deleteConfig(id)`：呼叫 `DELETE /admin/system-config/{id}`

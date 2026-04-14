# Tasks — 系統參數管理 (10-system-config)

**優先級說明**  
`[P0]` 資安或 runtime 致命問題 | `[P1]` 功能缺失 | `[P2]` 完善度 | `[DONE]` 已實作待驗收

---

## T-CFG-01 [P1] 建立 adminSystemConfigService.ts

**檔案**：`src/services/adminSystemConfigService.ts`（新建）

```typescript
const basePath = '/admin/system-config'

export const getSystemConfigs = async (group?: string): Promise<ApiResponse<SystemConfigRes[]>> => {
  const res = await api.get(`${basePath}`, { params: group ? { group } : {} })
  return res.data
}

export const createSystemConfig = async (req: SystemConfigCreateReq): Promise<ApiResponse<SystemConfigRes>> => {
  const res = await api.post(`${basePath}`, req)
  return res.data
}

export const updateSystemConfig = async (id: string, req: SystemConfigUpdateReq): Promise<ApiResponse<SystemConfigRes>> => {
  const res = await api.put(`${basePath}/${id}`, req)
  return res.data
}

export const deleteSystemConfig = async (id: string): Promise<ApiResponse<void>> => {
  const res = await api.delete(`${basePath}/${id}`)
  return res.data
}
```

**完成條件**：TypeScript 型別正確，4 個 CRUD 方法可正常呼叫

---

## T-CFG-02 [P1] 建立 useSystemConfig composable

**檔案**：`src/composables/useSystemConfig.ts`（新建）

**提供**：
```typescript
// state
const configs = ref<SystemConfigRes[]>([])
const isLoading = ref(false)
const editingId = ref<string | null>(null)

// computed
const groupedConfigs = computed(() => ...)  // Record<string, SystemConfigRes[]>
const groups = computed(() => ...)          // string[]（去重 group 列表）

// methods
async function fetchConfigs(group?: string)
async function updateConfig(id: string, configValue: string)
async function createConfig(req: SystemConfigCreateReq)
async function deleteConfig(id: string)
function startEdit(id: string)
function cancelEdit()
```

**完成條件**：composable 可在 `SystemConfigList.vue` 中使用，TypeScript 型別無錯誤

---

## T-CFG-03 [P1] 建立 SystemConfigList 頁面

**檔案**：`src/views/systemConfig/SystemConfigList.vue`（新建）

**元件結構**（遵從 vue-best-practices skill）：
```
SystemConfigList.vue          ← 路由 view，組合層
  ├── SystemConfigTable.vue   ← 單一 group 的 table（prop: configs: SystemConfigRes[]）
  ├── SystemConfigEditor.vue  ← inline 編輯 cell（依 configType 切換輸入元件）
  └── SystemConfigConfirmModal.vue ← 修改確認 dialog
```

**SystemConfigList.vue 職責**：
- 使用 `useSystemConfig` composable
- Tab 切換依 `groups` computed 動態生成
- 每個 tab 渲染對應的 `SystemConfigTable`

**SystemConfigEditor.vue props**：
```typescript
interface Props {
  config: SystemConfigRes
  isEditing: boolean
}
```
依 `config.configType` 渲染對應輸入 widget；`config.isEditable === false` 時全程 disabled

**JSON type 處理**：
- 顯示：`<textarea>` 預填 `config.configValue`
- 送出前：`JSON.parse(value)` 驗證，失敗顯示「JSON 格式有誤」錯誤

**完成條件**：可依 group Tab 瀏覽；inline 編輯儲存成功；`isEditable: false` 的行無法編輯；JSON 格式驗證正常

---

## T-CFG-04 [P1] 建立系統設定路由

**檔案**：`src/router/systemConfigRoutes.ts`（新建），並在 `src/router/index.ts` 中引入

```typescript
export const systemConfigRoutes: RouteRecordRaw[] = [
  {
    path: 'system-config',
    name: 'SystemConfig',
    component: () => import('@/views/systemConfig/SystemConfigList.vue'),
    meta: { requiresAuth: true }
  }
]
```

**完成條件**：`/home/system-config` 可正常訪問，layout 正確顯示

# Tasks — 店家管理 (03-store-management)

**優先級說明**  
`[P0]` 資安或 runtime 致命問題 | `[P1]` 功能缺失 | `[P2]` 完善度 | `[DONE]` 已實作待驗收

---

## T-STORE-01 [P0] 修正啟停用 API 端點

**檔案**：`src/services/adminStoreService.ts`  
**問題**：`activateStore(id)` 呼叫 `POST /{id}/activate`、`deactivateStore(id)` 呼叫 `POST /{id}/deactivate`；後端實際為 `PUT /{id}/status`

**修正**：
1. 移除 `activateStore` 和 `deactivateStore` 方法
2. 新增：
```typescript
export const updateStoreStatus = async (
  storeId: string,
  status: 'ACTIVE' | 'INACTIVE',
  reason?: string
): Promise<ApiResponse<any>> => {
  try {
    const res = await api.put(`${basePath}/${storeId}/status`, { status, reason })
    return res.data
  } catch (e) {
    console.error('AdminStore - updateStoreStatus error:', e)
    throw e
  }
}
```

**完成條件**：`network tab` 顯示 `PUT /api/admin/stores/{id}/status`，body 含 `{ status: "ACTIVE" }` 或 `{ status: "INACTIVE" }`

---

## T-STORE-02 [P0] 修正所有呼叫端

**檔案**：`src/views/store/StoreDisableModal.vue`、`src/views/store/StoreEnableModal.vue`、`src/views/store/StoreList.vue`

**修正**：將 `adminStoreService.activateStore(id)` 改為 `adminStoreService.updateStoreStatus(id, 'ACTIVE')`；  
`adminStoreService.deactivateStore(id, reason)` 改為 `adminStoreService.updateStoreStatus(id, 'INACTIVE', reason)`

**完成條件**：停用/啟用操作後 network tab 路徑正確，響應成功

---

## T-STORE-03 [P1] 新增 createStore service 方法

**檔案**：`src/services/adminStoreService.ts`

**新增**：
```typescript
export const createStore = async (req: CreateStoreReq): Promise<ApiResponse<any>> => {
  try {
    const res = await api.post(`${basePath}`, req)
    return res.data
  } catch (e) {
    console.error('AdminStore - createStore error:', e)
    throw e
  }
}
```

**完成條件**：service 方法存在，TypeScript 型別正確

---

## T-STORE-04 [P1] 建立 StoreCreate 頁面

**檔案**：`src/views/store/StoreCreate.vue`（新建）

**元件職責**：新增店家表單，分兩個 section：
1. **店家基本資訊**（storeName 必填，其餘 optional）
2. **建立負責人帳號**（可選，勾選 checkbox 才展開；username 必填，password 可選）

**行為**：
1. 用 vee-validate + zod 驗證 `storeName` 必填
2. 若有 owner section，驗證 `username` 必填且為合法 Email
3. 呼叫 `adminStoreService.createStore(req)`
4. 成功後導向 `stores` 列表並顯示成功提示

**完成條件**：可正常送出表單，API 呼叫 `POST /api/admin/stores`，成功後導向列表

---

## T-STORE-05 [P1] 新增路由

**檔案**：`src/router/storeRoutes.ts`

**修正**：確認路由包含所有必要路徑，並補上 `stores/add`：
```typescript
{ path: 'stores/add', name: 'StoreCreate', component: () => import('@/views/store/StoreCreate.vue'), meta: { requiresAuth: true } }
```

同時確認現有 `stores`、`stores/:id`、`stores/:id/edit`、`store/profile` 路由已正確定義。

**完成條件**：`/home/stores/add` 可正常訪問

---

## T-STORE-06 [DONE] 店家列表

**檔案**：`src/views/store/StoreList.vue`  
**狀態**：已實作。驗收確認：列表顯示、篩選、分頁正常

---

## T-STORE-07 [DONE] 店家詳情/編輯

**檔案**：`src/views/store/StoreDetail.vue`、`src/views/store/StoreEdit.vue`  
**狀態**：已實作。驗收確認：編輯儲存後資料更新正確

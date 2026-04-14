# Tasks — 角色與權限 (02-roles-and-permissions)

**優先級說明**  
`[P0]` 資安或 runtime 致命問題 | `[P1]` 功能缺失 | `[P2]` 完善度 | `[DONE]` 已實作待驗收

---

## T-RBAC-01 [P0] Sidebar 改呼叫 /accessible 端點

**檔案**：`src/views/Home.vue`

**問題**：`onMounted` 呼叫 `getMenuTree()`（路徑 `/admin/menus/tree`，回傳全部選單），導致所有角色看到相同選單  
**修正**：改呼叫 `getAccessibleMenuTree()`（路徑 `/admin/menus/accessible`，依角色過濾）

**行為**：
1. `menuItems` 初始值先讀 `authStore.menus`（登入時存入，避免 `onMounted` API 回來前閃白）
2. `onMounted` 呼叫 `getAccessibleMenuTree()`，回來後更新 `menuItems`
3. API 失敗時，fallback 維持 `authStore.menus`（不清空）

**完成條件**：STORE_OWNER 登入後 sidebar 只顯示後端授權的選單；ADMIN 登入後顯示完整選單

---

## T-RBAC-02 [P1] 所有 /home 子路由補上 meta.requiresAuth

**檔案**：所有 `src/router/` 底下的路由檔案  
**問題**：目前子路由沒有 `meta.requiresAuth: true`，`router.beforeEach` 的 auth guard 對子路由無效

**修正**：在每個路由模組的 `RouteRecordRaw` 中加入：
```typescript
meta: { requiresAuth: true }
```

**受影響的路由檔案**（逐一確認）：
- `adminUserRoutes.ts`
- `bannerRoutes.ts`
- `frontendUserRoutes.ts`
- `lotteryPrizeRoutes.ts`
- `lotteryWithPrizesRoutes.ts`
- `marqueeRoutes.ts`
- `menuRoutes.ts`
- `newsRoutes.ts`
- `orderRoutes.ts`
- `prizeBoxRoutes.ts`
- `rechargePlanRoutes.ts`
- `adminReferralCodeRoutes.ts`
- `roleRoutes.ts`
- `storeRoutes.ts`
- `systemLogRoutes.ts`
- `walletRoutes.ts`

**完成條件**：未登入時直接訪問 `/home/order` 等路徑，被 redirect 至 `/login`

---

## T-RBAC-03 [DONE] Role CRUD UI

**檔案**：`src/views/role/`（RoleList.vue、RoleForm.vue、RolePermissions.vue）  
**狀態**：已實作。驗收確認：列表、新增、編輯、權限設定流程可正常運作

---

## T-RBAC-04 [DONE] Menu 後台管理 UI

**檔案**：`src/views/menu/`（MenuList.vue、MenuForm.vue、MenuTree.vue）  
**狀態**：已實作。驗收確認：選單 CRUD 可正常運作，TreeView 顯示正確

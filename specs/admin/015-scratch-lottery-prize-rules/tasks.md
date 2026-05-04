# Tasks: 刮刮樂獎項規則修正（015）— 後台前端

**Input**: `specs/admin/015-scratch-lottery-prize-rules/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅  
**Tests**: 無測試框架（本專案未配置），驗收以 quickstart.md 手動流程為主

**Organization**: 6 phases；任務依 User Story 分組，每個 Story 可獨立驗收。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可平行執行（不同檔案、無相依）
- **[Story]**: 對應 spec.md 的 User Story（US1–US4）
- 每個任務包含精確的檔案路徑與實作說明

---

## Phase 1: Setup（驗證基準）

**Purpose**: 確認修改前 build 通過，建立 baseline

- [ ] T001 在 `kuji-admin-web` 根目錄執行 `npm run build`，確認目前 build 無錯誤後再開始修改；若有既有錯誤先記錄，不修正與本功能無關的問題。**同步確認後端三項 assumption**：① `POST /admin/lottery/{id}/designate-prize` 端點名稱 ② 列表 API（`/list`）Response 已包含 `designationStatus`、`gameMode`、`maxDraws` 欄位 ③ Prize entity 已有 `isGrandPrize: boolean` 欄位；若任一項未就緒，在本 Task 備注並等後端完成後再推進

---

## Phase 2: Foundational（Service + Modal）

**Purpose**: 新增 designatePrize API 函式與 DesignatePrizeModal 元件，US2/US3 均依賴這兩項

**⚠️ CRITICAL**: US2、US3 及商品編輯頁的指定入口均依賴此 Phase 完成

- [ ] T002 在 `src/services/adminLotteryWithPrizesService.ts` 末尾新增 `designatePrize` 函式：`export const designatePrize = async (lotteryId: string, body: { designatedPrizeNumber: number }): Promise<ApiResponse<any>> => { try { const res = await api.post(\`/admin/lottery/\${lotteryId}/designate-prize\`, body); return res.data; } catch (e) { console.error('...', e); throw e; } }`（與現有 `changeLotteryWithPrizesStatus` 函式結構相同）

- [ ] T003 建立 `src/components/lottery-with-prizes/DesignatePrizeModal.vue`：定義 Props `{ show: boolean, lotteryId: string, lotteryName: string, maxDraws: number }`，Emits `['close', 'success']`；template 以 `v-if="show"` 控制顯示，包含 Modal 標題「指定大獎號碼 — {lotteryName}」、說明文字「請選擇大獎對應的籤號（1 ~ {maxDraws}），指定後無法更改。」、`<input type="number">` 號碼輸入框、確認按鈕、取消按鈕

- [ ] T004 [P] `src/components/lottery-with-prizes/DesignatePrizeModal.vue`：新增 `prizeNumber` ref（`ref<number | null>(null)`）與 `inputError` ref（`ref('')`）；在 input 上綁定 `v-model` 並加 `@input` 驗證：當值 < 1 或 > maxDraws 時設 `inputError = "請輸入 1 到 {maxDraws} 之間的號碼"`，否則清空；確認按鈕加 `:disabled="!prizeNumber || !!inputError || submitting"`；取消按鈕呼叫 `emit('close')`

- [ ] T005 [P] `src/components/lottery-with-prizes/DesignatePrizeModal.vue`：處理 `maxDraws === 1` 特殊情境——在 `watch(show)` 或 `onMounted` 中，當 `maxDraws === 1` 時自動設 `prizeNumber.value = 1` 並顯示提示文字「僅有 1 個籤號，已自動選取第 1 號」（用 `v-if="maxDraws === 1"` 顯示在輸入框上方）

- [ ] T006 `src/components/lottery-with-prizes/DesignatePrizeModal.vue`：import `useDialogStore`、`executeApi`、`designatePrize`；新增 `submitting` ref；確認按鈕 click handler 先呼叫 `openConfirmDialog({ title: '確認指定', message: \`確定將第 \${prizeNumber.value} 號指定為大獎？指定後系統將自動將其餘籤號設為銘謝惠顧，且此操作不可撤銷。\` })`；若確認成功則執行 `executeApi({ fn: () => designatePrize(lotteryId, { designatedPrizeNumber: prizeNumber.value! }), onSuccess: () => emit('success'), showSuccessDialog: false })`；`executeApi`若失敗則保持 Modal 開啟並將後端錯誤訊息顯示於`inputError`

**Checkpoint**: DesignatePrizeModal 可獨立 import 與渲染，確認按鈕流程邏輯完整

---

## Phase 3: User Story 1 — 刮刮樂獎品設定約束（Priority: P1）🎯 MVP

**Goal**: 刮刮樂商品獎品頁限制只能設定 1 個大獎、totalQuantity 鎖定為 1、level 改下拉選單、完成配置條件符合刮刮樂規則

**Independent Test**: 建立 SCRATCH_STORE 商品後進入獎品管理頁，確認①頂部顯示藍色說明橫幅②已有大獎時「新增獎項」disabled③大獎的 level 為下拉選單、totalQuantity 唯讀固定為 1；接著完成設定後「完成配置」按鈕可點擊並成功升至 CONFIGURED 狀態

### Implementation for User Story 1

- [ ] T007 [P] [US1] `src/views/lotteryPrize/LotteryPrizeForm.vue`：在 `<script setup>` 新增 `gameMode` ref (`ref('')`) 與 `isScratch` computed (`gameMode.value === 'SCRATCH_STORE' || gameMode.value === 'SCRATCH_PLAYER'`)；import `getLotteryWithPrizes` from `@/services/adminLotteryWithPrizesService`；在 `onMounted` 的 `loadDetail()` 呼叫之後，新增對 `getLotteryWithPrizes(lotteryId.value)` 的呼叫（包在 try/catch），從 response 的 `data.gameMode` 設定 `gameMode.value`

- [ ] T008 [P] [US1] `src/views/lotteryPrize/LotteryPrizeList.vue`：新增 `gameMode` ref、`lotteryStatus` ref（`ref('')`）、`isScratch` computed；import `getLotteryWithPrizes` and `changeLotteryWithPrizesStatus` from `@/services/adminLotteryWithPrizesService`；在 `onMounted` 的 `load()` 之後，呼叫 `getLotteryWithPrizes(lotteryId.value)` 取得 `gameMode` 與 `status`（含 try/catch）

- [ ] T009 [US1] `src/views/lotteryPrize/LotteryPrizeForm.vue`：新增 `isGrandPrize` ref（`ref(false)`）；在 template 的表單欄位區塊新增 `<div v-if="isScratch" class="w-50 w-md-100 p-6">` 包裝的 `<FormSelect label="此為大獎（isGrandPrize）" v-model="isGrandPrize" :options="boolOptions" />`；import `boolOptions` from `@/constants/lotteryOptions`；在 `loadDetail` 的 `setValues` 呼叫後新增 `isGrandPrize.value = d?.isGrandPrize ?? false`

- [ ] T010 [US1] `src/views/lotteryPrize/LotteryPrizeForm.vue`：將 template 中現有的 `<FormInput label="獎項等級（level）" ...>` 替換為條件渲染：`<FormSelect v-if="isScratch && isGrandPrize" label="等級" v-model="level" :options="levelOptions" placeholder="A / B / ... / GRAND" /><FormInput v-else label="獎項等級（level）" v-model="level" :error="errors.level" placeholder="例如：A / B / C / D / LAST" required />`；import `levelOptions` from `@/constants/lotteryOptions`

- [ ] T011 [US1] `src/views/lotteryPrize/LotteryPrizeForm.vue`：當 `isGrandPrize` 為 true 時，totalQuantity 欄位鎖定為 1（唯讀）；新增 `watch(isGrandPrize, (val) => { if (val) totalQuantity.value = 1; })`；在 totalQuantity 的 `<FormInput>` 加上 `:disabled="isGrandPrize"`；在 totalQuantity 欄位下方加入 `<p v-if="isGrandPrize" class="form__text m-t-4">大獎數量固定為 1</p>`

- [ ] T012 [US1] `src/views/lotteryPrize/LotteryPrizeForm.vue`：在 `onSubmit` 的 `payload` 物件中新增 `isGrandPrize: isGrandPrize.value`（位於 `weight` 欄位旁），確保 `createPrize` / `updatePrize` 呼叫時都包含此欄位

- [ ] T013 [US1] `src/views/lotteryPrize/LotteryPrizeList.vue`：在 template 的 MCard 最頂部（`<FormTitle>` 前面）新增刮刮樂說明橫幅：`<div v-if="isScratch" class="info-bar info-bar--blue m-b-12" style="padding:12px;background:#e8f4fd;border-left:4px solid #1890ff;border-radius:4px;">刮刮樂模式：大獎數量固定為 1（totalQuantity = 1），其餘 N-1 個籤位將自動設為銘謝惠顧，無需另行設定。</div>`

- [ ] T014 [US1] `src/views/lotteryPrize/LotteryPrizeList.vue`：新增 `hasGrandPrize` computed：`list.value.some((p: any) => p.isGrandPrize === true)`；修改「新增獎項」MButton 加上 `:disabled="isScratch && hasGrandPrize"` 與 `:title="isScratch && hasGrandPrize ? '刮刮樂商品只允許一個大獎，請先刪除現有大獎再重新設定' : ''"`

- [ ] T015 [US1] `src/views/lotteryPrize/LotteryPrizeList.vue`：在操作按鈕區新增「完成配置」按鈕，條件 `v-if="isScratch && lotteryStatus === 'DRAFT'"` + `:disabled="!hasGrandPrize"` + `title="請先設定大獎才能完成配置"`；按鈕 click 呼叫 `executeApi({ fn: () => changeLotteryWithPrizesStatus(lotteryId.value, 'CONFIGURED'), onSuccess: () => { openInfoDialog({...}); router.push('/home/lottery-with-prizes'); }, showSuccessDialog: false })`

**Checkpoint**: US1 全部驗收情境通過；一番賞/扭蛋商品的獎品管理頁不受影響

---

## Phase 4: User Story 2 + 3 — 指定大獎號碼 + 上架保護（Priority: P1）

**Goal**: 店家可在商品列表頁對 SCRATCH_STORE+PENDING 商品執行指定大獎號碼操作；指定前「開始抽獎」按鈕被 disabled 保護

**Independent Test**: SCRATCH_STORE+PENDING 商品→列表頁有「指定大獎號碼」按鈕，「開始抽獎」disabled；點擊指定→Modal 可操作→送出成功→Modal 關閉，列表刷新，「開始抽獎」可點擊

### Implementation for User Story 2 + 3

- [ ] T016 [P] [US2] [US3] `src/views/lottery-with-prizes/AdminLotteryWithPrizesList.vue`：import `DesignatePrizeModal` from `@/components/lottery-with-prizes/DesignatePrizeModal.vue`；新增 `showDesignateModal` ref（`ref(false)`）與 `designateTarget` ref（`ref<any>(null)`）；新增 `openDesignateModal(item: any)` 函式：`designateTarget.value = item; showDesignateModal.value = true;`

- [ ] T017 [P] [US3] `src/views/lottery-with-prizes/AdminLotteryWithPrizesList.vue`：在 `#cell-actions` template 的「開始抽獎」`MButton`（`item.status === 'CONFIGURED'`）加上 `:disabled="item.gameMode === 'SCRATCH_STORE' && item.designationStatus === 'PENDING'"` 與 `:title="item.gameMode === 'SCRATCH_STORE' && item.designationStatus === 'PENDING' ? '請先完成大獎號碼指定才能上架' : ''"`

- [ ] T018 [US2] `src/views/lottery-with-prizes/AdminLotteryWithPrizesList.vue`：在 `#cell-actions` template 中，在「完成配置」MButton 之後新增：`<MButton v-if="item.gameMode === 'SCRATCH_STORE' && item.designationStatus === 'PENDING'" size="sm" @click="openDesignateModal(item)">指定大獎號碼</MButton>`；在 template 末尾（`</template>` 前）新增 `<DesignatePrizeModal :show="showDesignateModal" :lotteryId="designateTarget?.id ?? ''" :lotteryName="designateTarget?.title ?? ''" :maxDraws="designateTarget?.maxDraws ?? 1" @close="showDesignateModal = false" @success="onDesignateSuccess" />`；新增 `onDesignateSuccess()` 函式：`showDesignateModal.value = false; designateTarget.value = null; await openInfoDialog({ title: '提示訊息', message: '大獎號碼指定成功', iconType: 'success' }); await refresh();`（確認 `useDialogStore` 已在此檔案 import；若未 import 則加入）

**Checkpoint**: US2 + US3 全部驗收情境通過；非刮刮樂商品操作不受影響

---

## Phase 5: User Story 4 — 指定狀態顯示（Priority: P2）

**Goal**: 商品列表顯示 designationStatus 徽章欄位與篩選器；商品編輯頁依 gameMode+designationStatus 顯示對應提示條

**Independent Test**: 列表頁有「指定狀態」欄顯示橘/綠徽章；篩選「待指定」後僅顯示 PENDING 商品；SCRATCH_STORE+PENDING 編輯頁顯示橘色警告條，SCRATCH_PLAYER 顯示藍色說明條

### Implementation for User Story 4

- [ ] T019 [P] [US4] `src/views/lottery-with-prizes/AdminLotteryWithPrizesList.vue`：在 `columns` 陣列的 `status` 欄後方新增 `{ field: 'designationStatus', label: '指定狀態', width: 110 }`；在 template 新增 `#cell-designationStatus` slot：`<span v-if="item.designationStatus" :class="designationStatusBadgeClass(item.designationStatus)">{{ designationStatusText(item.designationStatus) }}</span><span v-else>-</span>`；在 script 新增 `designationStatusText` helper（PENDING→'待指定', COMPLETED→'已完成'）與 `designationStatusBadgeClass` helper（PENDING→`'badge badge--orange'`，COMPLETED→`'badge badge--green'`）（⚠ 實作前確認 `.badge--orange` 已定義於 `src/assets/styles/`；若不存在，在 badge SCSS 新增 `.badge--orange { background: #ff8c00; color: #fff; }` 或改用 inline style）

- [ ] T020 [P] [US4] `src/views/lottery-with-prizes/AdminLotteryWithPrizesList.vue`：在 `initValues` 新增 `designationStatus: ''`；新增 `defineField('designationStatus')` 與 `const [designationStatus] = defineField('designationStatus')`；在查詢表單（Form 區塊）新增 `<div class="w-50 w-md-100 p-6"><FormSelect label="指定狀態" v-model="designationStatus" :options="[{label:'待指定（PENDING）',value:'PENDING'},{label:'已完成（COMPLETED）',value:'COMPLETED'}]" :showAll="true" allLabel="全部" :allValue="''" /></div>`；在 `onSubmit` 的 `req` 物件確認 `condition` 包含 `designationStatus`（因現有邏輯是 `condition: values`，此欄位自動包含）

- [ ] T021 [US4] `src/views/lottery-with-prizes/AdminLotteryWithPrizesForm.vue`：在 `loadDetail` 的 `setValues(...)` 後，新增讀取並儲存 `designationStatus` 的邏輯：在 script 頂部新增 `const lotteryDesignationStatus = ref<string | null>(null)`，在 `loadDetail` 中新增 `lotteryDesignationStatus.value = data?.designationStatus ?? null`；取得目前 `gameMode` 欄位值（透過 `const [gameMode] = defineField('gameMode')` 取得 ref，直接使用 `gameMode.value`）；在商品資訊 MCard 底部（送出按鈕前）新增三種提示條（`v-if="isEdit"`）：①SCRATCH_STORE+PENDING→`<div style="padding:12px;background:#fff7e6;border-left:4px solid #faad14;border-radius:4px;">⚠ 尚未指定大獎號碼，SCRATCH_STORE 商品上架前必須完成指定。</div>` ②SCRATCH_STORE+COMPLETED→`<div style="padding:12px;background:#f6ffed;border-left:4px solid #52c41a;border-radius:4px;">✔ 大獎號碼已指定完成，可上架。</div>` ③SCRATCH_PLAYER→`<div style="padding:12px;background:#e6f7ff;border-left:4px solid #1890ff;border-radius:4px;">ℹ 大獎號碼將由第一位開套玩家在遊戲中指定，商品可直接上架。</div>`

- [ ] T021b [US3] `src/views/lottery-with-prizes/AdminLotteryWithPrizesForm.vue`：在 `onSubmit` 的表單驗證通過後、API 呼叫前，加入上架保護檢查：`const statusValue = (values as any).status; if (statusValue === 'ON_SHELF' && gameMode.value === 'SCRATCH_STORE' && lotteryDesignationStatus.value === 'PENDING') { await openInfoDialog({ title: '無法上架', message: '請先完成大獎號碼指定才能上架', iconType: 'warning' }); return; }`（依賴 T021 已定義的 `lotteryDesignationStatus` ref 與 `gameMode` ref；確認 `dialogStore` 已 import）

- [ ] T022 [US4] `src/views/lottery-with-prizes/AdminLotteryWithPrizesForm.vue`：在 SCRATCH_STORE+PENDING 提示條中加入「前往指定」按鈕：import `DesignatePrizeModal`；新增 `showDesignateModal` ref（`ref(false)`）；按鈕 `@click="showDesignateModal = true"`；在 template 尾部（isEdit 條件內）新增 `<DesignatePrizeModal :show="showDesignateModal" :lotteryId="id ?? ''" :lotteryName="title ?? ''" :maxDraws="Number(maxDraws ?? 1)" @close="showDesignateModal = false" @success="onDesignateSuccess" />`；新增 `onDesignateSuccess()` 函式：`showDesignateModal.value = false; await loadDetail();`（讓 `lotteryDesignationStatus` 重新從 API 刷新）；`title` 與 `maxDraws` 使用現有 `defineField` refs（`const [title] = defineField('title')`、`const [maxDraws] = defineField('maxDraws')`）直接存取

**Checkpoint**: US4 全部驗收情境通過；新增商品頁（isEdit=false）不顯示任何提示條

---

## Phase 6: Polish & 回歸驗證

**Purpose**: 確認 TypeScript build clean、非刮刮樂商品流程不受影響

- [ ] T023 執行 `npm run build` 確認 0 TypeScript errors；重點檢查：`DesignatePrizeModal.vue` 的 Props 型別、`LotteryPrizeForm.vue` 的 `isGrandPrize` ref、`AdminLotteryWithPrizesForm.vue` 的 `lotteryDesignationStatus` ref

- [ ] T024 [P] 回歸測試：開啟一番賞（LOTTERY_MODE）商品的獎品管理頁（`LotteryPrizeForm.vue`），確認①`isGrandPrize` 勾選框不顯示②`level` 欄位為自由文字輸入③`totalQuantity` 無 disabled；開啟一番賞商品列表，確認無「指定大獎號碼」按鈕、designationStatus 欄為空

- [ ] T025 [P] 依照 `specs/admin/015-scratch-lottery-prize-rules/quickstart.md` 手動執行：流程 1（設定刮刮樂大獎）、流程 2（指定大獎號碼）、流程 3（SCRATCH_PLAYER 上架）、流程 4（回歸測試），全部通過後任務完成

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
  └→ Phase 2 (Foundational: Service + Modal)
       ├→ Phase 3 (US1: LotteryPrizeForm + LotteryPrizeList) — 獨立，無需等 Modal
       ├→ Phase 4 (US2+US3: 列表頁指定流程 + 上架保護) — 需要 DesignatePrizeModal (T003-T006)
       └→ Phase 5 (US4: 狀態顯示 + 編輯頁 Banner) — 部分需要 DesignatePrizeModal (T022)
Phase 6 (Polish) — 所有 Phase 完成後執行
```

### Within Phase Dependencies

```
T003 (Modal skeleton) → T004, T005 [P]
T004, T005 → T006 → T007 (Modal complete)
T007 → T018 (list modal integration)
T007 → T022 (form modal integration)

T007 (LotteryPrizeForm gameMode) → T009, T010, T011, T012, T013
T008 (LotteryPrizeList gameMode) → T013, T014, T015

T016 (list modal import+ref) → T017, T018 [P available]
T016, T017, T018 → Phase 4 complete

T021 (form designationStatus ref + gameMode ref) → T021b, T022
T021b (form onSubmit guard) — 依賴 T021 的 lotteryDesignationStatus ref
```

### Parallel Opportunities

Phase 2（T004、T005 可平行）  
Phase 3（T007、T008 可平行先取得各頁 gameMode，其後各頁任務相互獨立）  
Phase 4（T016、T017 可平行，T018 依賴兩者）  
Phase 5（T019、T020 可平行）  
Phase 6（T024、T025 可平行）

---

## Parallel Examples

### Phase 3（US1）可平行啟動

```
[Parallel A]: T007 - LotteryPrizeForm gameMode fetch
[Parallel B]: T008 - LotteryPrizeList gameMode fetch
→ 完成後各自繼續後續任務（T009-T013 on Form, T013-T015 on List）
```

### Phase 5（US4）可平行

```
[Parallel A]: T019 - 列表頁 designationStatus 欄 + helpers
[Parallel B]: T020 - 列表頁 designationStatus 篩選
→ T021, T022 (Form banner) 獨立平行進行
```

---

## Implementation Strategy

### MVP First（US1 + US2 + US3，P1 全部）

1. Complete Phase 1: Setup（build baseline）
2. Complete Phase 2: Foundational（service + modal）
3. Complete Phase 3: US1（prize form constraints）
4. Complete Phase 4: US2+US3（designation flow + shelf guard）
5. **STOP and VALIDATE**: 走 quickstart.md 流程 1 + 2 + 3
6. 若通過，繼續 Phase 5（US4）

### Incremental Delivery

1. Phase 1+2 → Foundation ready
2. Phase 3 → US1 ready（store owner can set grand prize correctly）
3. Phase 4 → US2+US3 ready（全 P1 完成，SCRATCH_STORE 完整上架流程可運作）
4. Phase 5 → US4 ready（status visibility enhancement）
5. Phase 6 → Build clean + regression pass

---

## Notes

- [P] 任務 = 不同檔案、無相依，可同時執行
- [Story] label 對應 spec.md 中的 User Story 編號
- `levelOptions`（含 GRAND）已在 `src/constants/lotteryOptions.ts` 存在，無需新增
- `PrizeFormCard.vue`（在 `AdminLotteryWithPrizesForm.vue` 使用的行內獎品卡）已有 `isGrandPrize` FormSelect，**無需修改**
- `adminLotteryPrizeService.ts` 使用 `RequestData` interface，`isGrandPrize` 欄位直接由 payload 傳入，**無需修改函式簽名**
- 指定 API 端點假設為 `POST /admin/lottery/{id}/designate-prize`；若後端實際端點不同，僅需修改 T002 的 URL 字串
- `gameMode` fetch 使用現有 `getLotteryWithPrizes(id)` 函式（`GET /admin/lottery-with-prizes/{id}`），T007 / T008 均如此
- **T021b 依賴 T021**：必須先完成 T021（建立 `lotteryDesignationStatus` ref 與 `gameMode` ref），才能在 T021b 中使用
- `.badge--orange` CSS class 在實作 T019 前須確認存在；現有確認的有 badge--red / green / blue / gray
- **後端三項 assumption**（已列於 T001）若未就緒，T002 / T007 / T008 / T009 無法正確實作——請於 T001 完成後再推進

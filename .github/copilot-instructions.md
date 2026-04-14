# Copilot Instructions for `kuji-admin-web`

## Project Snapshot
- Stack: Vue 3 + TypeScript + Vite + Pinia + Vue Router + VeeValidate (`package.json`).
- App base path is `/kuji/` in both build and router history (`vite.config.ts`, `src/router/index.ts`).
- API base is `${VITE_BASE_API_URL}/api` (`src/services/FrontAPI.ts`, `.env.dev`).
- API contract source of truth for this migration: `.github/ADMIN_FRONTEND_API_COMPLETE.md` (2026-03-02 major revision).

## Run & Build (use these scripts)
- `npm run dev` (default mode)
- `npm run dev:local` / `npm run dev:uat` / `npm run dev:prod`
- `npm run build` / `npm run build:dev` / `npm run build:uat` / `npm run build:prod`
- `npm run preview`
- No test framework is configured in this repository (no test scripts / spec files).

## Core Architecture (how features are wired)
- Views are under `src/views/<module>/...`; reusable UI is under `src/components/...`.
- Routes are split by module and merged in `src/router/index.ts` (example: `src/router/lotteryWithPrizesRoutes.ts`).
- API calls live in `src/services/*Service.ts`, all through shared Axios instance `api` (`src/services/FrontAPI.ts`).
- Shared page behavior is implemented with hooks (`src/hook/useSearchPage.ts`, `src/hook/usePagination.ts`).
- Global app state uses Pinia stores (`src/stores/*`), especially auth + dialog + loading.

## API/Response Handling Rules (critical)
- Backend returns wrapped responses; service methods should return `res.data` as `ApiResponse<T>` (see `src/services/adminLotteryWithPrizesService.ts`).
- In page logic, call APIs via `executeApi(...)` (`src/utils/executeApiUtils.ts`) to keep loading/dialog/error behavior consistent.
- Use `onSuccess`/`onFail` inside `executeApi`; avoid ad-hoc alert/error handling.
- New auth payload uses `token` + `adminUser` + `isFirstLogin`; keep backward compatibility for legacy `accessToken` + `user` + `forceChangePassword` during migration.

## Auth & Token Flow
- Do not manually attach auth headers per request.
- `FrontAPI` request interceptor injects `Authorization` from localStorage via `AuthService`.
- 401 handling with refresh queue is centralized in `src/services/FrontAPI.ts`; if refresh fails, it clears storage and redirects to `/login`.
- Persist auth fields via `useAuthStore` (`src/stores/authStore.ts`) with keys: `token`, `refreshToken`, `tokenType`, `expiresIn`, `user`, `forceChangePassword`.

## Feature Implementation Pattern (copy this)
- Service file: define `basePath`, expose typed CRUD/list methods, return `res.data`, and rethrow errors after logging.
- List page pattern: form fields + `useSearchPage` + `usePagination` + `ReportTable` + `Pagination` (see `src/views/lottery-with-prizes/AdminLotteryWithPrizesList.vue`).
- Query APIs are mostly POST `/list` with `{ condition, sortBy, sortOrder }`; backend returns full list, frontend paginates.
- Uploads must use multipart `file` field and existing upload service helpers (`src/services/adminUploadService.ts`).

## UI & Styling Conventions
- Reuse existing common components first (`MCard`, `MButton`, `FormInput`, `FormSelect`, `ReportTable`, `NoData`, `Pagination`).
- Use shared utility classes (`w-50`, `p-6`, `m-t-12`, etc.) seen across views.
- Keep styles aligned with central SCSS entry `src/assets/styles/main.scss` and tokenized theme files.

## Practical Notes for Agents
- Prefer path alias `@/` for imports (configured in `vite.config.ts`).
- For browser compatibility, avoid relying on `crypto.randomUUID()` directly; use project fallback utility (`src/utils/RandomUtils.ts`).
- Preserve existing Chinese UI copy and naming style unless task explicitly requests rewrites.

## Backend Contract Reference — 後端契約速查
Below are key backend conventions the frontend must align with. For full details see `.github/ADMIN_FRONTEND_API_COMPLETE.md` and the files under `.github/instructions/`, `.github/skills/`, `.github/prompts/`.

- **JWT Token Payload**: `{ sub, userId, userType: "admin"|"user", roles: ["ROLE_ADMIN"], exp, iat }`. Frontend stores `token` / `refreshToken` via `useAuthStore`; the interceptor in `FrontAPI.ts` attaches the `Authorization` header automatically.
- **Unified Response Envelope**: All backend endpoints return `{ success: boolean, data: T | null, error: { message, code } | null, meta: { timestamp, requestId } }`. The AOP layer auto-wraps; service methods should type against `ApiResponse<T>`.
- **Role Constants**: `ROLE_ADMIN` / `ROLE_STORE_OWNER` / `ROLE_STORE_EDITOR`. The DB stores the full `ROLE_` prefix; frontend route guards and UI toggles should compare against these exact strings.
- **QueryReq Pattern**: List APIs expect POST `{ condition: T, sortBy?: string, sortOrder?: "ASC"|"DESC" }`. `condition` extends `BaseCondition { createdAtStart?, createdAtEnd?, keyword? }`.
- **StoreID Auto-Inject**: For StoreOwner/StoreEditor, the backend resolves `storeId` from the JWT via `SecurityUtils.getCurrentUserPrimaryStoreId()`. The frontend must **not** send `storeId` in query params for these roles; it is injected server-side.
- **Order State Machine**: `PENDING → PREPARING → SHIPPED → COMPLETED` (forward only). Cancellation (`CANCELLED`) is allowed from `PENDING` or `PREPARING` only. Frontend order status badges and action buttons must follow this flow.

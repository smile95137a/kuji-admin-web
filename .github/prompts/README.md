# kuji-admin-web `.github/` 目錄總覽

## 📁 目錄結構

```
.github/
├── copilot-instructions.md              # 主要 Copilot 指南（自動載入）
├── ADMIN_FRONTEND_API_COMPLETE.md       # 前後端 API 契約完整文件
├── admin_manager_prompt.md              # Admin 管理者 Prompt
├── agents/                              # 自訂 Agent（SpecKit 工作流）
│   └── speckit.*.agent.md
├── prompts/                             # 功能需求 Prompt（可透過 / 呼叫）
│   ├── banner.prompt.md                 # Banner 管理
│   ├── express.prompt.md                # 運送管理
│   ├── game-management.prompt.md        # 抽獎遊戲管理
│   ├── game-to-order.prompt.md          # 抽獎→訂單流程
│   ├── lottery-ticket-system.prompt.md  # 籤位系統設計
│   ├── mastercard.prompt.md             # 金流/點數系統
│   ├── news.prompt.md                   # 最新消息
│   ├── order.prompt.md                  # 訂單管理
│   ├── prize-box.prompt.md              # 賞品盒流程
│   ├── product-lottery.prompt.md        # 一番賞整合平台
│   ├── referral.prompt.md               # 推薦碼機制
│   ├── store-account-management.prompt.md # 店家帳號管理
│   └── speckit.*.prompt.md              # SpecKit 工作流
├── instructions/                        # 領域知識（applyTo 載入）
│   ├── permissions.instructions.md      # 權限系統 (RBAC)
│   ├── game.instructions.md             # 遊戲獎項規則
│   ├── scratch-card-flow.instructions.md# 刮刮樂流程
│   ├── store.instructions.md            # 店家管理
│   ├── store-user.instructions.md       # 店家帳號管理
│   └── user.instructions.md             # 會員系統
└── skills/                              # 多步驟工作流 Skill
    ├── draw-flow/SKILL.md               # 抽獎流程（三種模式）
    ├── order-lifecycle/SKILL.md         # 訂單生命週期
    ├── rbac-menu-setup/SKILL.md         # RBAC 選單設定
    ├── s3-upload/SKILL.md               # S3 上傳規範
    ├── store-onboarding/SKILL.md        # 店家入駐流程
    └── wallet-recharge-flow/SKILL.md    # 儲值流程
```

## 🎯 各類型用途

| 類型 | 載入方式 | 用途 |
|------|---------|------|
| **Instructions** | `applyTo` 匹配或 on-demand | 領域知識，編輯相關檔案時自動載入 |
| **Prompts** | 輸入 `/` 選擇 | 單一功能需求的開發任務模板 |
| **Agents** | 選擇 Agent 模式 | 自訂 AI Agent（SpecKit 工作流） |
| **Skills** | 輸入 `/` 選擇 | 多步驟工作流（含參考文件） |

## 📋 開發流程
1. 先讀 `copilot-instructions.md` → 核心架構與前端規範
2. 再讀 `instructions/` → 領域規則
3. 使用 `prompts/` → 了解業務需求
4. 參考 `ADMIN_FRONTEND_API_COMPLETE.md` → API 契約

## 📌 專案資訊
- **專案**: kuji-admin-web（前端管理後台）
- **技術棧**: Vue 3 + TypeScript + Vite + Pinia + Vue Router + VeeValidate
- **基礎路徑**: `/kuji/`

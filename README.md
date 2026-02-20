# Chips App Settings

薯片生态设置面板（`chips-official.ecosystem-settings`）是运行在 Chips Host 内的标准应用插件，用于：

- 运行状态概览（Host / Kernel / 控制平面）
- 插件管理（安装、启用/禁用、卸载）
- 通用设置（语言、主题、工作区、策略开关）

## 技术栈

- Vue 3 + TypeScript (Strict)
- Pinia
- `@chips/sdk`
- `@chips/components`
- Vitest

## 快速开始

```bash
pnpm install
pnpm dev
```

## 质量检查

```bash
pnpm type-check
pnpm test
pnpm build
```

## 关键约束

- 所有底层能力调用必须通过 `window.chips.invoke`
- 禁止直接调用 Node/Electron API
- 面向用户文本全部走 i18n 词条
- 界面交互优先使用 `@chips/components`

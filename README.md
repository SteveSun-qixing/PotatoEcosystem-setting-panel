# Chips App Settings

薯片生态设置面板（`chips-official.ecosystem-settings`）是运行在 Chips Host 内的标准应用插件，用于：

- 运行状态概览（Host / Kernel / 控制平面）
- 插件管理（安装、启用/禁用、卸载）
- 通用设置（语言、主题、工作区、策略开关）

## 技术栈

- React 18 + TypeScript (Strict)
- `@chips/sdk`
- `@chips/component-library`
- Vitest

## 运行链路

- 主入口：`index.html -> src/main.tsx -> src/App.tsx`
- 能力调用：`UI -> ecosystem-settings-service -> runtime-gateway -> @chips/sdk Runtime Client/Hooks`
- Vue 遗留实现已归档到 `src/archive/legacy-vue/`，不参与主路径构建与测试。

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

- 不允许在业务代码中直连 `window.chips.invoke`
- 所有底层能力调用必须通过 `src/services/runtime-gateway.ts`
- 禁止直接调用 Node/Electron API
- 面向用户文本全部走 i18n 词条
- 界面交互优先使用 `@chips/component-library`

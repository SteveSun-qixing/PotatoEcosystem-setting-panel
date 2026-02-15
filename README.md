# 薯片生态应用插件标准模板

这是薯片生态的应用插件标准模板，提供了一个完整的、可独立运行的 Vue 3 应用插件项目。

## 特性

- ✅ Vue 3 + TypeScript + Vite
- ✅ 完整的项目结构和配置
- ✅ Bridge API 调用示例
- ✅ 无头组件库集成
- ✅ 多语言支持（三级继承）
- ✅ 主题系统集成
- ✅ 状态管理（Pinia）
- ✅ 路由管理（Vue Router）
- ✅ 完整的测试套件（Vitest）
- ✅ TypeScript Strict 模式
- ✅ 零硬编码文本
- ✅ 零内联样式

## 项目结构

```
chips-template-app/
├── manifest.yaml                    # 应用插件清单
├── package.json                     # 项目配置
├── tsconfig.json                    # TypeScript 配置
├── vite.config.ts                   # Vite 构建配置
├── vitest.config.ts                 # Vitest 测试配置
├── index.html                       # 应用入口 HTML
├── src/
│   ├── main.ts                      # Vue 应用入口
│   ├── App.vue                      # 根组件
│   ├── views/                       # 视图组件
│   │   ├── HomeView.vue             # 首页视图
│   │   └── AboutView.vue            # 关于视图
│   ├── components/                  # 可复用组件
│   │   └── SampleCard.vue           # 示例组件
│   ├── composables/                 # 组合式函数
│   │   └── use-sample.ts            # 示例 composable
│   ├── stores/                      # Pinia 状态管理
│   │   └── app.ts                   # 应用状态
│   ├── router/                      # Vue Router 配置
│   │   └── index.ts                 # 路由定义
│   └── types/                       # 类型定义
│       └── index.ts                 # 项目类型
├── locales/                         # 多语言文件
│   ├── dev_i18n.yaml                # 开发阶段人类可读 key
│   ├── vocabulary.yaml              # 插件词汇表
│   ├── zh-CN.yaml                   # 中文语言包
│   ├── en-US.yaml                   # 英文语言包
│   └── ja-JP.yaml                   # 日文语言包
├── assets/                          # 静态资源
│   ├── icon.png                     # 插件图标
│   └── preview.png                  # 插件预览图
├── tests/                           # 测试文件
│   ├── app.test.ts                  # 应用初始化测试
│   ├── home-view.test.ts            # 首页视图测试
│   ├── about-view.test.ts           # 关于视图测试
│   ├── sample-card.test.ts          # 示例组件测试
│   ├── composable.test.ts           # Composable 测试
│   ├── router.test.ts               # 路由测试
│   ├── store.test.ts                # 状态管理测试
│   └── i18n.test.ts                 # 多语言集成测试
└── README.md                        # 项目说明
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建

```bash
pnpm build
```

### 运行测试

```bash
pnpm test
```

### 代码检查

```bash
pnpm lint
pnpm type-check
```

## 使用说明

### SDK 初始化

在 `src/main.ts` 中，SDK 会在应用挂载前初始化：

```typescript
const sdk = new ChipsSDK({
  autoConnect: true,
  debug: import.meta.env.DEV,
});

sdk.initialize().then(() => {
  app.mount('#app');
});
```

### Bridge API 调用

通过 `window.chips.invoke()` 调用 Bridge API：

```typescript
const result = await window.chips.invoke('file', 'read', { path: '/example.txt' });
```

### 多语言使用

所有文本使用编码 key：

```vue
<template>
  <div>{{ t('i18n.plugin.600001') }}</div>
</template>

<script setup>
const { t } = useSample();
</script>
```

### 无头组件

组件只包含结构和逻辑，样式由主题包提供：

```vue
<template>
  <button class="chips-button chips-button--primary">
    {{ t('i18n.core.000003') }}
  </button>
</template>
```

## 开发规范

### 硬性要求

1. **零硬编码文本**：所有面向用户的文本必须使用多语言系统
2. **零内联样式**：所有样式通过 CSS 类名控制
3. **Bridge 隔离**：只能通过 `window.chips.*` 访问系统能力
4. **TypeScript Strict**：必须使用 TypeScript strict 模式
5. **测试覆盖**：每个功能模块必须有对应的测试

### 命名规范

- 文件名：kebab-case（`sample-card.vue`）
- 组件名：PascalCase（`SampleCard`）
- CSS 类名：BEM 命名（`chips-button--primary`）
- 类型文件：`types.ts`
- 测试文件：`.test.ts`

## 打包部署

### 打包为 .cpk

```bash
pnpm build
chipsd pack
```

### 验证插件

```bash
chipsd validate
```

## 许可证

MIT License

## 作者

Chips Official

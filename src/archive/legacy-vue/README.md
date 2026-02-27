# legacy-vue 归档说明

> 更新日期：2026-02-26
> 归档原因：阶段07主路径收敛到 React 单入口，Vue 历史链路退出运行态。

## 来源路径（迁移前）

- `src/main.ts`
- `src/App.vue`
- `src/router/**`
- `src/views/**`
- `src/domains/**`
- `src/stores/**`
- `src/composables/**`
- `src/components/SampleCard.vue`

## 关联工单

- 工单-2026-02-26-064
- 工单-2026-02-26-065
- 工单-2026-02-26-068

## 归档约束

1. 本目录仅用于历史追溯，不参与 `index.html -> src/main.tsx -> src/App.tsx` 主路径。
2. 禁止在主路径重新引入 `.vue`、`main.ts`、Vue Router、Pinia 旧链路。
3. 如需恢复能力，必须先提新工单并完成架构裁决。

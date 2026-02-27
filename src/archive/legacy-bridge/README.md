# legacy-bridge 归档说明

> 更新日期：2026-02-26
> 归档原因：主路径统一到 `runtime-gateway -> SDK Runtime Client/Hooks`，本地 bridge-client 退出主路径。

## 来源路径（迁移前）

- `src/services/bridge-client.ts`

## 当前保留文件

- `bridge-client.ts`

## 关联工单

- 工单-2026-02-26-065

## 归档约束

1. 本目录代码不可被 `src/**` 主路径 import。
2. 运行时桥接调用必须经 `src/services/runtime-gateway.ts`。
3. 仅允许用于历史实现追溯和故障证据比对。

/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ChipsBridgeAPI {
  invoke(namespace: string, action: string, params?: unknown): Promise<unknown>;
  on?(event: string, handler: (payload: unknown) => void): (() => void) | void;
  once?(event: string, handler: (payload: unknown) => void): (() => void) | void;
}

interface Window {
  chips: ChipsBridgeAPI;
}

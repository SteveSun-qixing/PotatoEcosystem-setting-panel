/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
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
  invoke(service: string, action: string, params?: Record<string, unknown>): Promise<unknown>;
}

interface Window {
  chips: ChipsBridgeAPI;
}

/// <reference types="vite/client" />

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

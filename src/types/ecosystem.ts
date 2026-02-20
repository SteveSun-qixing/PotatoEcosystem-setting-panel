export type PluginType = 'app' | 'card' | 'layout' | 'module' | 'theme';

export interface RuntimeOverview {
  hostVersion: string;
  hostPid: number;
  uptimeMs: number;
  platform: string;
  nodeVersion: string;
  routeCount: number;
  namespaceCount: number;
  p95LatencyMs: number;
  errorCount: number;
  controlPlaneOnline: boolean;
}

export interface RuntimeHealthCheck {
  id: string;
  healthy: boolean;
  message: string;
}

export interface RuntimeHealthSnapshot {
  healthy: boolean;
  checks: RuntimeHealthCheck[];
}

export interface RuntimeLogQueryParams {
  level?: 'debug' | 'info' | 'warn' | 'error';
  query?: string;
  limit?: number;
}

export interface RuntimeLogQueryResult {
  logs: Array<Record<string, unknown>>;
  total: number;
}

export interface PluginRecord {
  id: string;
  name: string;
  version: string;
  type: PluginType;
  publisher: string;
  installPath: string;
  description?: string;
  enabled: boolean;
}

export interface GeneralSettings {
  locale: string;
  themeId: string;
  workspacePath: string;
  autoStart: boolean;
  allowExternalLinks: boolean;
}

export interface ThemeOption {
  id: string;
  name: string;
  version?: string;
}

export interface SelectOptionItem {
  value: string;
  label: string;
}

export interface BundleStatus {
  requiredTypes: Array<'card' | 'layout' | 'module'>;
  installedCount: number;
  healthy: boolean;
}

export interface WorkspaceExchangePolicy {
  mode: 'link' | 'copy';
  conflict: 'overwrite' | 'skip' | 'rename';
}

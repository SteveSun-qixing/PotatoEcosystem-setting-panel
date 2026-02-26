import type {
  BundleStatus,
  GeneralSettings,
  PluginRecord,
  RuntimeHealthSnapshot,
  RuntimeLogQueryParams,
  RuntimeLogQueryResult,
  RuntimeOverview,
  ThemeOption,
  WorkspaceExchangePolicy
} from '@/types';
import { DEFAULT_THEME_ID } from '@/constants/theme';
import {
  applyThemeCssLayers,
  normalizeThemeCssLayers,
  type ThemeCssLayerMap
} from '@/utils/theme-style';

import { runtimeGateway } from './runtime-gateway';

interface SysStatusResponse {
  host?: {
    version?: string;
    pid?: number;
    uptimeMs?: number;
    platform?: string;
    nodeVersion?: string;
  };
  kernel?: {
    routes?: number;
    namespaces?: string[];
    routerMetrics?: {
      p95LatencyMs?: number;
      errorCount?: number;
    };
  };
  controlPlane?: {
    listening?: boolean;
  } | null;
}

interface PluginListResponse {
  plugins?: Array<Record<string, unknown>>;
}

interface ThemeListResponse {
  themes?: Array<Record<string, unknown>>;
}

interface ThemeCurrentResponse {
  id?: string;
  themeId?: string;
  name?: string;
}

interface ThemeAllCssResponse {
  css?: Record<string, unknown>;
}

interface ConfigListResponse {
  items?: Array<{ key: string; value: unknown }>;
}

interface RuntimeHealthResponse {
  healthy?: boolean;
  checks?: Array<{
    id?: string;
    healthy?: boolean;
    message?: string;
  }>;
}

interface RuntimeLogResponse {
  logs?: Array<Record<string, unknown>>;
  items?: Array<Record<string, unknown>>;
  total?: number;
}

interface RuntimeLifecycleResponse {
  accepted?: boolean;
  state?: 'running' | 'stopped';
  requestedAt?: string;
}

const CONFIG_KEYS = {
  locale: 'ecosystem.settings.locale',
  themeId: 'ecosystem.settings.themeId',
  workspacePath: 'ecosystem.settings.workspacePath',
  autoStart: 'ecosystem.settings.autoStart',
  allowExternalLinks: 'ecosystem.settings.allowExternalLinks',
  pluginEnabledPrefix: 'ecosystem.settings.plugin.enabled.',
  workspaceRootPath: 'workspace.rootPath',
  workspaceExchangeMode: 'workspace.exchange.mode',
  workspaceExchangeConflict: 'workspace.exchange.conflict'
} as const;

const DEFAULT_SETTINGS: GeneralSettings = {
  locale: 'zh-CN',
  themeId: DEFAULT_THEME_ID,
  workspacePath: '',
  autoStart: true,
  allowExternalLinks: false
};

const DEFAULT_LOCALES = [
  'zh-CN',
  'zh-TW',
  'en-US',
  'es-ES',
  'fr-FR',
  'de-DE',
  'ja-JP',
  'ko-KR',
  'pt-PT',
  'pt-BR',
  'ru-RU',
  'it-IT'
] as const;

function normalizePathFragment(input: string): string {
  return input.replace(/\\/g, '/').replace(/\/+$/, '');
}

function joinPortablePath(...segments: string[]): string {
  const normalized = segments
    .map((segment) => normalizePathFragment(segment))
    .filter((segment) => segment.length > 0);

  if (normalized.length === 0) {
    return '';
  }

  const [head, ...rest] = normalized;
  return [head, ...rest.map((segment) => segment.replace(/^\/+/, ''))].join('/');
}

function sanitizeFileName(fileName: string): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return safe.length > 0 ? safe : 'package.cpk';
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizePluginType(value: unknown): PluginRecord['type'] {
  if (value === 'card' || value === 'layout' || value === 'module' || value === 'theme') {
    return value;
  }

  return 'app';
}

function mapPluginRecord(raw: Record<string, unknown>): PluginRecord {
  const id = asString(raw.id ?? raw.plugin_id);

  return {
    id,
    name: asString(raw.name, id),
    version: asString(raw.version, '0.0.0'),
    type: normalizePluginType(raw.type),
    publisher: asString(raw.publisher, 'unknown'),
    installPath: asString(raw.installPath ?? raw.install_path),
    description: asString(raw.description),
    enabled: asBoolean(raw.enabled, true)
  };
}

function normalizeRuntimeOverview(payload: SysStatusResponse): RuntimeOverview {
  const namespaces = payload.kernel?.namespaces ?? [];

  return {
    hostVersion: asString(payload.host?.version, 'unknown'),
    hostPid: asNumber(payload.host?.pid),
    uptimeMs: asNumber(payload.host?.uptimeMs),
    platform: asString(payload.host?.platform, 'unknown'),
    nodeVersion: asString(payload.host?.nodeVersion, 'unknown'),
    routeCount: asNumber(payload.kernel?.routes),
    namespaceCount: namespaces.length,
    p95LatencyMs: asNumber(payload.kernel?.routerMetrics?.p95LatencyMs),
    errorCount: asNumber(payload.kernel?.routerMetrics?.errorCount),
    controlPlaneOnline: payload.controlPlane?.listening === true
  };
}

export class EcosystemSettingsService {
  public async resolveInstallPackagePath(file: File): Promise<string> {
    const candidate = file as File & { path?: string };
    if (typeof candidate.path === 'string' && candidate.path.length > 0) {
      return candidate.path;
    }

    if (!file.name.toLowerCase().endsWith('.cpk')) {
      throw {
        code: 'PACKAGE_EXTENSION_INVALID',
        message: 'Only .cpk package files are supported.'
      };
    }

    const workspacePath = (await this.getWorkspacePath()).trim();
    const rootDir = workspacePath.length > 0 ? workspacePath : '/tmp';
    const uploadsDir = joinPortablePath(rootDir, '.chips', 'cache', 'package-uploads');
    const targetPath = joinPortablePath(
      uploadsDir,
      `${Date.now()}-${Math.random().toString(16).slice(2)}-${sanitizeFileName(file.name)}`
    );

    try {
      const binary = await file.arrayBuffer();
      const content = arrayBufferToBase64(binary);
      await runtimeGateway.invoke('file', 'write', {
        path: targetPath,
        content,
        encoding: 'base64',
        overwrite: true,
        createDirs: true
      });
      return targetPath;
    } catch (error: unknown) {
      throw {
        code: 'FILE_READ_FAILED',
        message: 'Unable to persist selected package file.',
        details: {
          fileName: file.name,
          cause: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  public async getRuntimeOverview(): Promise<RuntimeOverview> {
    const response = await runtimeGateway.invoke<SysStatusResponse>('runtime', 'status', {});
    return normalizeRuntimeOverview(response);
  }

  public async getRuntimeHealth(): Promise<RuntimeHealthSnapshot> {
    const response = await runtimeGateway.invoke<RuntimeHealthResponse>('runtime', 'health', {});
    return {
      healthy: asBoolean(response.healthy, false),
      checks: (response.checks ?? []).map((item) => ({
        id: asString(item.id, 'unknown'),
        healthy: asBoolean(item.healthy, false),
        message: asString(item.message, '')
      }))
    };
  }

  public async queryRuntimeLogs(params: RuntimeLogQueryParams): Promise<RuntimeLogQueryResult> {
    const response = await runtimeGateway.invoke<RuntimeLogResponse>('runtime', 'log.query', params);
    const logs = response.logs ?? response.items ?? [];

    return {
      logs,
      total: asNumber(response.total, logs.length)
    };
  }

  public async exportRuntimeReport(): Promise<Record<string, unknown>> {
    return runtimeGateway.invoke<Record<string, unknown>>('runtime', 'report.export', {});
  }

  public async restartHost(reason: string): Promise<void> {
    await runtimeGateway.invoke('runtime', 'restart', { reason });
  }

  public async startHost(): Promise<RuntimeLifecycleResponse> {
    return runtimeGateway.invoke<RuntimeLifecycleResponse>('runtime', 'start', {});
  }

  public async stopHost(): Promise<RuntimeLifecycleResponse> {
    return runtimeGateway.invoke<RuntimeLifecycleResponse>('runtime', 'stop', {});
  }

  public async listPlugins(): Promise<PluginRecord[]> {
    const response = await runtimeGateway.invoke<PluginListResponse>('plugin', 'list', {
      includeManifest: false
    });

    const plugins = (response.plugins ?? []).map((item) => mapPluginRecord(item));
    const overrides = await this.getPluginEnableOverrides();

    return plugins.map((plugin) => {
      const override = overrides.get(plugin.id);
      if (override === undefined) {
        return plugin;
      }

      return {
        ...plugin,
        enabled: override
      };
    });
  }

  public async checkPluginUpdates(): Promise<Array<Record<string, unknown>>> {
    const response = await runtimeGateway.invoke<{ updates?: Array<Record<string, unknown>> }>('plugin', 'update.check', {});
    return response.updates ?? [];
  }

  public async applyPluginUpdates(pluginIds: string[]): Promise<Array<Record<string, unknown>>> {
    const response = await runtimeGateway.invoke<{ updated?: Array<Record<string, unknown>> }>('plugin', 'update.apply', {
      ...(pluginIds.length > 0 ? { pluginIds } : {})
    });
    return response.updated ?? [];
  }

  public async installPlugin(packagePath: string, force: boolean): Promise<void> {
    await runtimeGateway.invoke('plugin', 'install', {
      packagePath,
      ...(force ? { force: true } : {})
    });
  }

  public async uninstallPlugin(plugin: PluginRecord): Promise<void> {
    await runtimeGateway.invoke('plugin', 'uninstall', {
      pluginId: plugin.id,
      type: plugin.type
    });

    await this.clearPluginEnabledOverride(plugin.id);
  }

  public async setPluginEnabled(plugin: PluginRecord, enabled: boolean): Promise<void> {
    const action = enabled ? 'enable' : 'disable';

    await runtimeGateway.invoke('plugin', action, {
      pluginId: plugin.id,
      type: plugin.type
    });

    await this.setConfigValue(`${CONFIG_KEYS.pluginEnabledPrefix}${plugin.id}`, enabled);
  }

  public async listLocales(): Promise<string[]> {
    const response = await runtimeGateway.i18n.list();
    const locales = response.locales ?? [];
    return locales.length > 0 ? locales : [...DEFAULT_LOCALES];
  }

  public async getCurrentLocale(): Promise<string> {
    const response = await runtimeGateway.i18n.getCurrent();
    return asString(response.locale, DEFAULT_SETTINGS.locale);
  }

  public async setCurrentLocale(locale: string): Promise<void> {
    await runtimeGateway.i18n.setCurrent(locale, { persist: true });
  }

  public async updateDictionary(
    entries?: Record<string, Record<string, string>>,
    pluginId?: string
  ): Promise<{ updated: boolean; registered: number }> {
    if (!entries || Object.keys(entries).length === 0) {
      return {
        updated: false,
        registered: 0
      };
    }

    const response = await runtimeGateway.i18n.registerVocabulary({
      pluginId: pluginId ?? 'chips.settings.manual',
      entries
    });

    return {
      updated: asNumber(response.registered) > 0,
      registered: asNumber(response.registered)
    };
  }

  public async loadGeneralSettings(): Promise<GeneralSettings> {
    const locale = await this.readLocale();
    const themeId = await this.readThemeId();

    const [workspacePath, autoStart, allowExternalLinks] = await Promise.all([
      this.getConfigValue(CONFIG_KEYS.workspacePath, DEFAULT_SETTINGS.workspacePath),
      this.getConfigValue(CONFIG_KEYS.autoStart, DEFAULT_SETTINGS.autoStart),
      this.getConfigValue(CONFIG_KEYS.allowExternalLinks, DEFAULT_SETTINGS.allowExternalLinks)
    ]);

    return {
      locale: asString(locale, DEFAULT_SETTINGS.locale),
      themeId: asString(themeId, DEFAULT_SETTINGS.themeId),
      workspacePath: asString(workspacePath, DEFAULT_SETTINGS.workspacePath),
      autoStart: asBoolean(autoStart, DEFAULT_SETTINGS.autoStart),
      allowExternalLinks: asBoolean(allowExternalLinks, DEFAULT_SETTINGS.allowExternalLinks)
    };
  }

  public async saveGeneralSettings(settings: GeneralSettings): Promise<void> {
    await Promise.all([
      this.setConfigValue(CONFIG_KEYS.locale, settings.locale),
      this.setConfigValue(CONFIG_KEYS.themeId, settings.themeId),
      this.setConfigValue(CONFIG_KEYS.workspacePath, settings.workspacePath),
      this.setConfigValue(CONFIG_KEYS.autoStart, settings.autoStart),
      this.setConfigValue(CONFIG_KEYS.allowExternalLinks, settings.allowExternalLinks)
    ]);

    await this.persistLanguage(settings.locale);
  }

  public async listThemeOptions(): Promise<ThemeOption[]> {
    const response = await runtimeGateway.invoke<ThemeListResponse>('theme', 'list', {});

    const themes = response.themes ?? [];
    return themes
      .map((item) => ({
        id: asString(item.id),
        name: asString(item.name, asString(item.id)),
        version: asString(item.version)
      }))
      .filter((theme) => theme.id.length > 0);
  }

  public async getCurrentThemeId(): Promise<string> {
    const response = await runtimeGateway.theme.getCurrent({});
    return asString(response.themeId, DEFAULT_THEME_ID);
  }

  public async applyTheme(themeId: string): Promise<void> {
    await runtimeGateway.theme.apply(themeId);
    await this.refreshThemeCss();
  }

  public async installTheme(packagePath: string, overwrite: boolean): Promise<void> {
    await runtimeGateway.invoke('theme', 'install', {
      packagePath,
      ...(overwrite ? { overwrite: true } : {})
    });
  }

  public async uninstallTheme(themeId: string): Promise<void> {
    await runtimeGateway.invoke('theme', 'uninstall', {
      themeId
    });

    await this.refreshThemeCss();
  }

  public async refreshThemeCss(): Promise<ThemeCssLayerMap> {
    const response = await runtimeGateway.theme.getAllCss({}) as ThemeAllCssResponse;
    const layers = normalizeThemeCssLayers(response.css);
    applyThemeCssLayers(layers);
    return layers;
  }

  public async getBundleStatus(): Promise<BundleStatus> {
    const response = await runtimeGateway.invoke<BundleStatus>('bundle', 'status', {});

    return {
      requiredTypes: response.requiredTypes ?? ['card', 'layout', 'module'],
      installedCount: asNumber(response.installedCount),
      healthy: asBoolean(response.healthy, false)
    };
  }

  public async updateBundle(): Promise<void> {
    await runtimeGateway.invoke('bundle', 'update', {});
  }

  public async repairBundle(): Promise<void> {
    await runtimeGateway.invoke('bundle', 'repair', {});
  }

  public async getWorkspacePath(): Promise<string> {
    const response = await runtimeGateway.invoke<{ path?: string }>('workspace', 'get', {});
    return asString(response.path, '');
  }

  public async setWorkspacePath(path: string): Promise<void> {
    await runtimeGateway.invoke('workspace', 'set', { path });
  }

  public async getWorkspaceExchangePolicy(): Promise<WorkspaceExchangePolicy> {
    const response = await runtimeGateway.invoke<WorkspaceExchangePolicy>('workspace', 'exchange.getPolicy', {});

    return {
      mode: response.mode === 'link' ? 'link' : 'copy',
      conflict:
        response.conflict === 'overwrite' || response.conflict === 'skip' || response.conflict === 'rename'
          ? response.conflict
          : 'rename'
    };
  }

  public async setWorkspaceExchangePolicy(policy: WorkspaceExchangePolicy): Promise<void> {
    await runtimeGateway.invoke('workspace', 'exchange.setPolicy', policy);
  }

  private async persistLanguage(locale: string): Promise<void> {
    await runtimeGateway.i18n.setCurrent(locale, { persist: true });
  }

  private async readLocale(): Promise<unknown> {
    try {
      const response = await runtimeGateway.i18n.getCurrent();
      if (typeof response.locale === 'string') {
        return response.locale;
      }
    } catch {
      // Ignore fallback.
    }

    return this.getConfigValue(CONFIG_KEYS.locale, DEFAULT_SETTINGS.locale);
  }

  private async readThemeId(): Promise<unknown> {
    try {
      const response = await runtimeGateway.theme.getCurrent({}) as ThemeCurrentResponse;
      if (typeof response.id === 'string') {
        return response.id;
      }

      if (typeof response.themeId === 'string') {
        return response.themeId;
      }
    } catch {
      // Ignore fallback.
    }

    return this.getConfigValue(CONFIG_KEYS.themeId, DEFAULT_SETTINGS.themeId);
  }

  private async getConfigValue(key: string, fallback: unknown): Promise<unknown> {
    try {
      return await runtimeGateway.getConfigValue(key, fallback);
    } catch {
      return fallback;
    }
  }

  private async setConfigValue(key: string, value: unknown): Promise<void> {
    await runtimeGateway.setConfigValue(key, value, 'user');
  }

  private async getPluginEnableOverrides(): Promise<Map<string, boolean>> {
    const map = new Map<string, boolean>();

    try {
      const response = await runtimeGateway.invoke<ConfigListResponse>('config', 'list', {
        prefix: CONFIG_KEYS.pluginEnabledPrefix,
        scope: 'effective'
      });

      for (const item of response.items ?? []) {
        if (!item.key.startsWith(CONFIG_KEYS.pluginEnabledPrefix)) {
          continue;
        }

        const pluginId = item.key.slice(CONFIG_KEYS.pluginEnabledPrefix.length);
        map.set(pluginId, asBoolean(item.value, true));
      }
    } catch {
      // Ignore fallback.
    }

    return map;
  }

  private async clearPluginEnabledOverride(pluginId: string): Promise<void> {
    try {
      await runtimeGateway.invoke('config', 'delete', {
        key: `${CONFIG_KEYS.pluginEnabledPrefix}${pluginId}`,
        scope: 'user'
      });
    } catch {
      // Ignore cleanup failures.
    }
  }
}

export const ecosystemSettingsService = new EcosystemSettingsService();

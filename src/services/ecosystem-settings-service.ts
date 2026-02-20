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

import { invokeBridge, invokeFirstSuccessful, isRouteMissingError } from './bridge-client';

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

interface LegacySystemStatusResponse {
  uptime?: number;
  loaded_modules?: number;
  active_connections?: number;
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

interface ConfigGetResponse {
  value?: unknown;
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
  workspaceExchangeConflict: 'workspace.exchange.conflict',
  themeGlobal: 'theme.global'
} as const;

const DEFAULT_SETTINGS: GeneralSettings = {
  locale: 'zh-CN',
  themeId: DEFAULT_THEME_ID,
  workspacePath: '',
  autoStart: true,
  allowExternalLinks: false
};

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

function normalizeRuntimeOverview(payload: SysStatusResponse | LegacySystemStatusResponse): RuntimeOverview {
  if ('host' in payload || 'kernel' in payload) {
    const current = payload as SysStatusResponse;
    const namespaces = current.kernel?.namespaces ?? [];

    return {
      hostVersion: asString(current.host?.version, 'unknown'),
      hostPid: asNumber(current.host?.pid),
      uptimeMs: asNumber(current.host?.uptimeMs),
      platform: asString(current.host?.platform, 'unknown'),
      nodeVersion: asString(current.host?.nodeVersion, 'unknown'),
      routeCount: asNumber(current.kernel?.routes),
      namespaceCount: namespaces.length,
      p95LatencyMs: asNumber(current.kernel?.routerMetrics?.p95LatencyMs),
      errorCount: asNumber(current.kernel?.routerMetrics?.errorCount),
      controlPlaneOnline: current.controlPlane?.listening === true
    };
  }

  const legacy = payload as LegacySystemStatusResponse;
  return {
    hostVersion: 'legacy',
    hostPid: 0,
    uptimeMs: asNumber(legacy.uptime) * 1000,
    platform: 'unknown',
    nodeVersion: 'unknown',
    routeCount: asNumber(legacy.loaded_modules),
    namespaceCount: asNumber(legacy.active_connections),
    p95LatencyMs: 0,
    errorCount: 0,
    controlPlaneOnline: false
  };
}

export class EcosystemSettingsService {
  public async getRuntimeOverview(): Promise<RuntimeOverview> {
    const response = await invokeFirstSuccessful<SysStatusResponse | LegacySystemStatusResponse>([
      { namespace: 'runtime', action: 'status', params: {} },
      { namespace: 'sys', action: 'status', params: {} },
      { namespace: 'system', action: 'status', params: {} }
    ]);

    return normalizeRuntimeOverview(response);
  }

  public async getRuntimeHealth(): Promise<RuntimeHealthSnapshot> {
    try {
      const response = await invokeBridge<RuntimeHealthResponse>('runtime', 'health', {});
      return {
        healthy: asBoolean(response.healthy, false),
        checks: (response.checks ?? []).map((item) => ({
          id: asString(item.id, 'unknown'),
          healthy: asBoolean(item.healthy, false),
          message: asString(item.message, '')
        }))
      };
    } catch (error: unknown) {
      if (!isRouteMissingError(error)) {
        throw error;
      }

      const overview = await this.getRuntimeOverview();
      return {
        healthy: overview.routeCount > 0,
        checks: [
          {
            id: 'runtime.status',
            healthy: overview.routeCount > 0,
            message: overview.routeCount > 0 ? 'Runtime status route is available.' : 'Runtime status route unavailable.'
          }
        ]
      };
    }
  }

  public async queryRuntimeLogs(params: RuntimeLogQueryParams): Promise<RuntimeLogQueryResult> {
    try {
      const response = await invokeBridge<RuntimeLogResponse>('runtime', 'log.query', params);
      const logs = response.logs ?? response.items ?? [];
      return {
        logs,
        total: asNumber(response.total, logs.length)
      };
    } catch (error: unknown) {
      if (!isRouteMissingError(error)) {
        throw error;
      }

      const fallback = await invokeBridge<RuntimeLogResponse>('log', 'query', {
        level: params.level,
        query: params.query,
        limit: params.limit
      });
      const logs = fallback.items ?? fallback.logs ?? [];
      return {
        logs,
        total: logs.length
      };
    }
  }

  public async exportRuntimeReport(): Promise<Record<string, unknown>> {
    try {
      return await invokeBridge<Record<string, unknown>>('runtime', 'report.export', {});
    } catch (error: unknown) {
      if (!isRouteMissingError(error)) {
        throw error;
      }

      const [status, health, logs] = await Promise.all([
        this.getRuntimeOverview(),
        this.getRuntimeHealth(),
        this.queryRuntimeLogs({ limit: 50 })
      ]);

      return {
        generatedAt: new Date().toISOString(),
        status,
        health,
        logs
      };
    }
  }

  public async restartHost(reason: string): Promise<void> {
    await invokeFirstSuccessful([
      { namespace: 'runtime', action: 'restart', params: { reason } },
      { namespace: 'sys', action: 'restart', params: { reason } }
    ]);
  }

  public async startHost(): Promise<RuntimeLifecycleResponse> {
    try {
      return await invokeBridge<RuntimeLifecycleResponse>('runtime', 'start', {});
    } catch (error: unknown) {
      if (!isRouteMissingError(error)) {
        throw error;
      }

      return {
        accepted: true,
        state: 'running',
        requestedAt: new Date().toISOString()
      };
    }
  }

  public async stopHost(): Promise<RuntimeLifecycleResponse> {
    try {
      return await invokeBridge<RuntimeLifecycleResponse>('runtime', 'stop', {});
    } catch (error: unknown) {
      if (!isRouteMissingError(error)) {
        throw error;
      }

      return {
        accepted: true,
        state: 'stopped',
        requestedAt: new Date().toISOString()
      };
    }
  }

  public async listPlugins(): Promise<PluginRecord[]> {
    const response = await invokeFirstSuccessful<PluginListResponse>([
      {
        namespace: 'plugin',
        action: 'list',
        params: { includeManifest: false }
      },
      {
        namespace: 'plugin',
        action: 'list',
        params: {}
      }
    ]);

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
    try {
      const response = await invokeBridge<{ updates?: Array<Record<string, unknown>> }>('plugin', 'update.check', {});
      return response.updates ?? [];
    } catch (error: unknown) {
      if (!isRouteMissingError(error)) {
        throw error;
      }

      return [];
    }
  }

  public async applyPluginUpdates(pluginIds: string[]): Promise<Array<Record<string, unknown>>> {
    try {
      const response = await invokeBridge<{ updated?: Array<Record<string, unknown>> }>('plugin', 'update.apply', {
        ...(pluginIds.length > 0 ? { pluginIds } : {})
      });
      return response.updated ?? [];
    } catch (error: unknown) {
      if (!isRouteMissingError(error)) {
        throw error;
      }

      return [];
    }
  }

  public async installPlugin(sourcePath: string, force: boolean): Promise<void> {
    await invokeFirstSuccessful([
      {
        namespace: 'plugin',
        action: 'install',
        params: { sourcePath, force }
      },
      {
        namespace: 'plugin',
        action: 'install',
        params: { source: sourcePath, auto_enable: true }
      }
    ]);
  }

  public async uninstallPlugin(plugin: PluginRecord): Promise<void> {
    await invokeBridge('plugin', 'uninstall', {
      pluginId: plugin.id,
      type: plugin.type
    });

    await this.clearPluginEnabledOverride(plugin.id);
  }

  public async setPluginEnabled(plugin: PluginRecord, enabled: boolean): Promise<void> {
    const action = enabled ? 'enable' : 'disable';

    try {
      await invokeBridge('plugin', action, {
        pluginId: plugin.id,
        type: plugin.type
      });
    } catch (error: unknown) {
      if (!isRouteMissingError(error)) {
        throw error;
      }
    }

    await this.setConfigValue(`${CONFIG_KEYS.pluginEnabledPrefix}${plugin.id}`, enabled);
  }

  public async listLocales(): Promise<string[]> {
    try {
      const response = await invokeBridge<{ locales?: string[] }>('i18n', 'list', {});
      const locales = response.locales ?? [];
      return locales.length > 0 ? locales : ['zh-CN', 'en-US', 'ja-JP'];
    } catch (error: unknown) {
      if (!isRouteMissingError(error)) {
        throw error;
      }

      return ['zh-CN', 'en-US', 'ja-JP'];
    }
  }

  public async getCurrentLocale(): Promise<string> {
    try {
      const response = await invokeBridge<{ locale?: string }>('i18n', 'getCurrent', {});
      if (response.locale) {
        return response.locale;
      }
    } catch (error: unknown) {
      if (!isRouteMissingError(error)) {
        throw error;
      }
    }

    return this.readLocale().then((value) => asString(value, DEFAULT_SETTINGS.locale));
  }

  public async setCurrentLocale(locale: string): Promise<void> {
    await invokeFirstSuccessful([
      {
        namespace: 'i18n',
        action: 'setCurrent',
        params: { locale }
      },
      {
        namespace: 'i18n',
        action: 'setLanguage',
        params: { locale, persist: true }
      }
    ]);
  }

  public async updateDictionary(
    entries?: Record<string, Record<string, string>>,
    pluginId?: string
  ): Promise<{ updated: boolean; registered: number }> {
    try {
      const response = await invokeBridge<{ updated?: boolean; registered?: number }>(
        'i18n',
        'dictionary.update',
        {
          ...(pluginId ? { pluginId } : {}),
          ...(entries ? { entries } : {})
        }
      );
      return {
        updated: asBoolean(response.updated, false),
        registered: asNumber(response.registered)
      };
    } catch (error: unknown) {
      if (!isRouteMissingError(error) || !entries) {
        throw error;
      }

      const response = await invokeBridge<{ registered?: number }>('i18n', 'registerVocabulary', {
        pluginId: pluginId ?? 'chips.settings.manual',
        entries
      });
      return {
        updated: asNumber(response.registered) > 0,
        registered: asNumber(response.registered)
      };
    }
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
    const response = await invokeFirstSuccessful<ThemeListResponse>([
      { namespace: 'theme', action: 'list', params: {} },
      { namespace: 'theme', action: 'list' }
    ]);

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
    try {
      const response = await invokeBridge<ThemeCurrentResponse>('theme', 'getCurrent', {});
      return asString(response.id ?? response.themeId, DEFAULT_THEME_ID);
    } catch (error: unknown) {
      if (!isRouteMissingError(error)) {
        const message = error instanceof Error ? error.message.toLowerCase() : '';
        if (message.includes('current') || message.includes('not set') || message.includes('not configured')) {
          const fallback = await this.getConfigValue(CONFIG_KEYS.themeGlobal, DEFAULT_THEME_ID);
          return asString(fallback, DEFAULT_THEME_ID);
        }

        throw error;
      }
    }

    try {
      const legacy = await invokeBridge<ThemeCurrentResponse>('theme', 'getCurrentTheme', {});
      return asString(legacy.id ?? legacy.themeId, DEFAULT_THEME_ID);
    } catch (legacyError: unknown) {
      if (!isRouteMissingError(legacyError)) {
        throw legacyError;
      }
    }

    const fallback = await this.getConfigValue(CONFIG_KEYS.themeGlobal, DEFAULT_THEME_ID);
    return asString(fallback, DEFAULT_THEME_ID);
  }

  public async applyTheme(themeId: string): Promise<void> {
    try {
      await invokeBridge('theme', 'apply', { id: themeId });
      return;
    } catch (error: unknown) {
      if (!isRouteMissingError(error)) {
        throw error;
      }
    }

    await this.setConfigValue(CONFIG_KEYS.themeGlobal, themeId);
  }

  public async installTheme(packagePath: string, overwrite: boolean): Promise<void> {
    await invokeBridge('theme', 'install', {
      packagePath,
      ...(overwrite ? { overwrite: true } : {})
    });
  }

  public async uninstallTheme(themeId: string): Promise<void> {
    await invokeFirstSuccessful([
      {
        namespace: 'theme',
        action: 'uninstall',
        params: { themeId }
      },
      {
        namespace: 'theme',
        action: 'uninstall',
        params: { id: themeId }
      }
    ]);
  }

  public async getBundleStatus(): Promise<BundleStatus> {
    try {
      const response = await invokeBridge<BundleStatus>('bundle', 'status', {});
      return {
        requiredTypes: response.requiredTypes ?? ['card', 'layout', 'module'],
        installedCount: asNumber(response.installedCount),
        healthy: asBoolean(response.healthy, false)
      };
    } catch (error: unknown) {
      if (!isRouteMissingError(error)) {
        throw error;
      }

      const plugins = await this.listPlugins();
      const installedCount = plugins.filter((plugin) => ['card', 'layout', 'module'].includes(plugin.type)).length;
      return {
        requiredTypes: ['card', 'layout', 'module'],
        installedCount,
        healthy: installedCount > 0
      };
    }
  }

  public async updateBundle(): Promise<void> {
    await invokeBridge('bundle', 'update', {});
  }

  public async repairBundle(): Promise<void> {
    await invokeBridge('bundle', 'repair', {});
  }

  public async getWorkspacePath(): Promise<string> {
    try {
      const response = await invokeBridge<{ path?: string }>('workspace', 'get', {});
      return asString(response.path, '');
    } catch (error: unknown) {
      if (!isRouteMissingError(error)) {
        throw error;
      }

      const value = await this.getConfigValue(CONFIG_KEYS.workspaceRootPath, '');
      return asString(value, '');
    }
  }

  public async setWorkspacePath(path: string): Promise<void> {
    try {
      await invokeBridge('workspace', 'set', { path });
      return;
    } catch (error: unknown) {
      if (!isRouteMissingError(error)) {
        throw error;
      }
    }

    await this.setConfigValue(CONFIG_KEYS.workspaceRootPath, path);
  }

  public async getWorkspaceExchangePolicy(): Promise<WorkspaceExchangePolicy> {
    try {
      const response = await invokeBridge<WorkspaceExchangePolicy>('workspace', 'exchange.getPolicy', {});
      return {
        mode: response.mode === 'link' ? 'link' : 'copy',
        conflict:
          response.conflict === 'overwrite' || response.conflict === 'skip' || response.conflict === 'rename'
            ? response.conflict
            : 'rename'
      };
    } catch (error: unknown) {
      if (!isRouteMissingError(error)) {
        throw error;
      }

      const [mode, conflict] = await Promise.all([
        this.getConfigValue(CONFIG_KEYS.workspaceExchangeMode, 'copy'),
        this.getConfigValue(CONFIG_KEYS.workspaceExchangeConflict, 'rename')
      ]);

      return {
        mode: mode === 'link' ? 'link' : 'copy',
        conflict:
          conflict === 'overwrite' || conflict === 'skip' || conflict === 'rename'
            ? conflict
            : 'rename'
      };
    }
  }

  public async setWorkspaceExchangePolicy(policy: WorkspaceExchangePolicy): Promise<void> {
    try {
      await invokeBridge('workspace', 'exchange.setPolicy', policy);
      return;
    } catch (error: unknown) {
      if (!isRouteMissingError(error)) {
        throw error;
      }
    }

    await Promise.all([
      this.setConfigValue(CONFIG_KEYS.workspaceExchangeMode, policy.mode),
      this.setConfigValue(CONFIG_KEYS.workspaceExchangeConflict, policy.conflict)
    ]);
  }

  private async persistLanguage(locale: string): Promise<void> {
    await invokeFirstSuccessful([
      {
        namespace: 'i18n',
        action: 'setLanguage',
        params: {
          locale,
          persist: true
        }
      },
      {
        namespace: 'i18n',
        action: 'setLocale',
        params: {
          locale
        }
      }
    ]);
  }

  private async readLocale(): Promise<unknown> {
    try {
      const response = await invokeBridge<{ locale?: string }>('i18n', 'getCurrentLanguage', {});
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
      const response = await invokeBridge<ThemeCurrentResponse>('theme', 'getCurrent', {});
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
      const response = await invokeBridge<ConfigGetResponse>('config', 'get', {
        key,
        fallback
      });
      return response.value ?? fallback;
    } catch {
      return fallback;
    }
  }

  private async setConfigValue(key: string, value: unknown): Promise<void> {
    await invokeBridge('config', 'set', {
      key,
      value,
      scope: 'user'
    });
  }

  private async getPluginEnableOverrides(): Promise<Map<string, boolean>> {
    const map = new Map<string, boolean>();

    try {
      const response = await invokeBridge<ConfigListResponse>('config', 'list', {
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
      await invokeBridge('config', 'delete', {
        key: `${CONFIG_KEYS.pluginEnabledPrefix}${pluginId}`,
        scope: 'user'
      });
    } catch {
      // Ignore cleanup failures.
    }
  }
}

export const ecosystemSettingsService = new EcosystemSettingsService();

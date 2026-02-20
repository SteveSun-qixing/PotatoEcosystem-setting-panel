import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EcosystemSettingsService } from '@/services/ecosystem-settings-service';
import type { PluginRecord } from '@/types';

function mockInvoke(implementation: (namespace: string, action: string, params?: unknown) => unknown | Promise<unknown>) {
  const invoke = vi.fn(implementation);
  Object.assign(window, {
    chips: {
      invoke
    }
  });
  return invoke;
}

describe('EcosystemSettingsService', () => {
  let service: EcosystemSettingsService;

  beforeEach(() => {
    service = new EcosystemSettingsService();
  });

  it('reads runtime overview from sys.status', async () => {
    mockInvoke((namespace, action) => {
      if (namespace === 'sys' && action === 'status') {
        return {
          host: {
            version: '1.2.0',
            pid: 9527,
            uptimeMs: 1000,
            platform: 'darwin',
            nodeVersion: 'v22.0.0'
          },
          kernel: {
            routes: 30,
            namespaces: ['sys', 'plugin', 'config'],
            routerMetrics: {
              p95LatencyMs: 20,
              errorCount: 1
            }
          },
          controlPlane: {
            listening: true
          }
        };
      }

      throw new Error('unexpected invoke');
    });

    const overview = await service.getRuntimeOverview();

    expect(overview.hostVersion).toBe('1.2.0');
    expect(overview.routeCount).toBe(30);
    expect(overview.namespaceCount).toBe(3);
    expect(overview.controlPlaneOnline).toBe(true);
  });

  it('falls back to config override when enable/disable route is missing', async () => {
    const invoke = mockInvoke((namespace, action, params) => {
      if (namespace === 'plugin' && action === 'disable') {
        throw Object.assign(new Error('route not found'), { code: 'ROUTE_NOT_FOUND' });
      }

      if (namespace === 'config' && action === 'set') {
        return {
          updated: true,
          params
        };
      }

      throw new Error(`unexpected invoke ${namespace}.${action}`);
    });

    const plugin: PluginRecord = {
      id: 'chips.test.plugin',
      name: 'demo',
      version: '1.0.0',
      type: 'app',
      publisher: 'test',
      installPath: '/tmp/chips.test.plugin',
      enabled: true
    };

    await service.setPluginEnabled(plugin, false);

    expect(invoke).toHaveBeenCalledWith('plugin', 'disable', {
      pluginId: 'chips.test.plugin',
      type: 'app'
    });
    expect(invoke).toHaveBeenCalledWith('config', 'set', {
      key: 'ecosystem.settings.plugin.enabled.chips.test.plugin',
      value: false,
      scope: 'user'
    });
  });

  it('merges plugin list with local enable overrides', async () => {
    mockInvoke((namespace, action) => {
      if (namespace === 'plugin' && action === 'list') {
        return {
          plugins: [
            {
              id: 'chips.a',
              name: 'A',
              version: '1.0.0',
              type: 'app',
              publisher: 'chips',
              installPath: '/tmp/chips.a',
              enabled: true
            }
          ]
        };
      }

      if (namespace === 'config' && action === 'list') {
        return {
          items: [
            {
              key: 'ecosystem.settings.plugin.enabled.chips.a',
              value: false
            }
          ]
        };
      }

      throw new Error('unexpected invoke');
    });

    const plugins = await service.listPlugins();

    expect(plugins).toHaveLength(1);
    expect(plugins[0].enabled).toBe(false);
  });
});

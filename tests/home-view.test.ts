import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { ecosystemSettingsService } from '@/services/ecosystem-settings-service';
import { useOverviewStore } from '@/stores/overview';

describe('overview store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it('refreshes runtime snapshot', async () => {
    vi.spyOn(ecosystemSettingsService, 'getRuntimeOverview').mockResolvedValue({
      hostVersion: '1.0.0',
      hostPid: 1,
      uptimeMs: 100,
      platform: 'darwin',
      nodeVersion: 'v22',
      routeCount: 3,
      namespaceCount: 2,
      p95LatencyMs: 12,
      errorCount: 0,
      controlPlaneOnline: true
    });
    vi.spyOn(ecosystemSettingsService, 'getRuntimeHealth').mockResolvedValue({
      healthy: true,
      checks: [
        {
          id: 'runtime.status',
          healthy: true,
          message: 'ok'
        }
      ]
    });

    const store = useOverviewStore();
    await store.refresh();

    expect(store.snapshot?.hostVersion).toBe('1.0.0');
    expect(store.error).toBe('');
  });

  it('captures restart errors', async () => {
    vi.spyOn(ecosystemSettingsService, 'restartHost').mockRejectedValue(new Error('restart denied'));

    const store = useOverviewStore();
    await expect(store.restart('test')).rejects.toThrow('restart denied');
    expect(store.error).toContain('restart denied');
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { ecosystemSettingsService } from '@/services/ecosystem-settings-service';
import { useOverviewStore } from '@/stores/overview';

describe('overview store log errors', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it('stores runtime log errors separately from status errors', async () => {
    vi.spyOn(ecosystemSettingsService, 'queryRuntimeLogs').mockRejectedValue(
      new Error("permission denied for route 'runtime.log.query'")
    );

    const store = useOverviewStore();
    await store.refreshLogs('error');

    expect(store.error).toBe('');
    expect(store.logsError).toContain("permission denied for route 'runtime.log.query'");
  });
});

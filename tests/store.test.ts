import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { ecosystemSettingsService } from '@/services/ecosystem-settings-service';
import { usePluginsStore } from '@/stores/plugins';

describe('store workflows', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it('installs plugin and refreshes list', async () => {
    const installSpy = vi.spyOn(ecosystemSettingsService, 'installPlugin').mockResolvedValue();
    const listSpy = vi
      .spyOn(ecosystemSettingsService, 'listPlugins')
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'chips.new',
          name: 'new',
          version: '1.0.0',
          type: 'app',
          publisher: 'chips',
          installPath: '/tmp/chips.new',
          enabled: true
        }
      ]);

    const store = usePluginsStore();
    await store.refresh();
    await store.install('/tmp/chips.new', false);

    expect(installSpy).toHaveBeenCalledWith('/tmp/chips.new', false);
    expect(listSpy).toHaveBeenCalledTimes(2);
    expect(store.items[0].id).toBe('chips.new');
  });
});

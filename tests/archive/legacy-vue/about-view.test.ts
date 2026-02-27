import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { ecosystemSettingsService } from '@/services/ecosystem-settings-service';
import { usePluginsStore } from '@/stores/plugins';
import type { PluginRecord } from '@/types';

const demoPlugin: PluginRecord = {
  id: 'chips.demo',
  name: 'Demo',
  version: '1.0.0',
  type: 'app',
  publisher: 'chips',
  installPath: '/tmp/chips.demo',
  enabled: true
};

describe('plugins store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it('loads plugin list', async () => {
    vi.spyOn(ecosystemSettingsService, 'listPlugins').mockResolvedValue([demoPlugin]);

    const store = usePluginsStore();
    await store.refresh();

    expect(store.items).toHaveLength(1);
    expect(store.items[0].id).toBe('chips.demo');
  });

  it('updates local enabled status after toggle', async () => {
    vi.spyOn(ecosystemSettingsService, 'setPluginEnabled').mockResolvedValue();

    const store = usePluginsStore();
    store.items = [demoPlugin];

    await store.setEnabled(demoPlugin, false);

    expect(store.items[0].enabled).toBe(false);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { ecosystemSettingsService } from '@/services/ecosystem-settings-service';
import { useGeneralSettingsStore } from '@/stores/general-settings';

describe('general settings store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it('loads form and themes', async () => {
    vi.spyOn(ecosystemSettingsService, 'loadGeneralSettings').mockResolvedValue({
      locale: 'en-US',
      themeId: 'dark',
      workspacePath: '/tmp/workspace',
      autoStart: false,
      allowExternalLinks: true
    });
    vi.spyOn(ecosystemSettingsService, 'listThemeOptions').mockResolvedValue([
      { id: 'dark', name: 'Dark' }
    ]);

    const store = useGeneralSettingsStore();
    await store.load();

    expect(store.form.locale).toBe('en-US');
    expect(store.themes).toHaveLength(1);
  });

  it('saves current form', async () => {
    const saveSpy = vi.spyOn(ecosystemSettingsService, 'saveGeneralSettings').mockResolvedValue();

    const store = useGeneralSettingsStore();
    store.updateForm({ locale: 'ja-JP' });

    await store.save();

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: 'ja-JP'
      })
    );
  });
});

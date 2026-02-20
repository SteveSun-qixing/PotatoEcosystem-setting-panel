import { defineStore } from 'pinia';

import { ecosystemSettingsService } from '@/services/ecosystem-settings-service';
import type { GeneralSettings, ThemeOption } from '@/types';

interface GeneralSettingsState {
  form: GeneralSettings;
  themes: ThemeOption[];
  loading: boolean;
  saving: boolean;
  error: string;
}

const DEFAULT_FORM: GeneralSettings = {
  locale: 'zh-CN',
  themeId: 'default',
  workspacePath: '',
  autoStart: true,
  allowExternalLinks: false
};

export const useGeneralSettingsStore = defineStore('general-settings', {
  state: (): GeneralSettingsState => ({
    form: { ...DEFAULT_FORM },
    themes: [],
    loading: false,
    saving: false,
    error: ''
  }),

  actions: {
    async load(): Promise<void> {
      this.loading = true;
      this.error = '';

      try {
        const [settings, themes] = await Promise.all([
          ecosystemSettingsService.loadGeneralSettings(),
          ecosystemSettingsService.listThemeOptions()
        ]);

        this.form = settings;
        this.themes = themes;
      } catch (error: unknown) {
        this.error = error instanceof Error ? error.message : String(error);
      } finally {
        this.loading = false;
      }
    },

    updateForm(partial: Partial<GeneralSettings>): void {
      this.form = {
        ...this.form,
        ...partial
      };
    },

    async save(): Promise<void> {
      this.saving = true;
      this.error = '';

      try {
        await ecosystemSettingsService.saveGeneralSettings(this.form);
      } catch (error: unknown) {
        this.error = error instanceof Error ? error.message : String(error);
        throw error;
      } finally {
        this.saving = false;
      }
    }
  }
});

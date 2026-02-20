import { defineStore } from 'pinia';

import { ecosystemSettingsService } from '@/services/ecosystem-settings-service';
import type { PluginRecord } from '@/types';

interface PluginsState {
  items: PluginRecord[];
  updates: Array<Record<string, unknown>>;
  loading: boolean;
  installPending: boolean;
  updatePending: boolean;
  busyPluginIds: string[];
  error: string;
}

function appendUnique(items: string[], next: string): string[] {
  return items.includes(next) ? items : [...items, next];
}

function removeItem(items: string[], target: string): string[] {
  return items.filter((item) => item !== target);
}

export const usePluginsStore = defineStore('plugins', {
  state: (): PluginsState => ({
    items: [],
    updates: [],
    loading: false,
    installPending: false,
    updatePending: false,
    busyPluginIds: [],
    error: ''
  }),

  actions: {
    async refresh(): Promise<void> {
      this.loading = true;
      this.error = '';

      try {
        this.items = await ecosystemSettingsService.listPlugins();
      } catch (error: unknown) {
        this.error = error instanceof Error ? error.message : String(error);
      } finally {
        this.loading = false;
      }
    },

    async refreshUpdates(): Promise<void> {
      this.error = '';

      try {
        this.updates = await ecosystemSettingsService.checkPluginUpdates();
      } catch (error: unknown) {
        this.error = error instanceof Error ? error.message : String(error);
      }
    },

    async applyUpdates(pluginIds: string[] = []): Promise<void> {
      this.updatePending = true;
      this.error = '';

      try {
        await ecosystemSettingsService.applyPluginUpdates(pluginIds);
        await this.refreshUpdates();
      } catch (error: unknown) {
        this.error = error instanceof Error ? error.message : String(error);
        throw error;
      } finally {
        this.updatePending = false;
      }
    },

    async install(sourcePath: string, force: boolean): Promise<void> {
      this.installPending = true;
      this.error = '';

      try {
        await ecosystemSettingsService.installPlugin(sourcePath, force);
        await this.refresh();
      } catch (error: unknown) {
        this.error = error instanceof Error ? error.message : String(error);
        throw error;
      } finally {
        this.installPending = false;
      }
    },

    async uninstall(plugin: PluginRecord): Promise<void> {
      this.busyPluginIds = appendUnique(this.busyPluginIds, plugin.id);
      this.error = '';

      try {
        await ecosystemSettingsService.uninstallPlugin(plugin);
        await this.refresh();
      } catch (error: unknown) {
        this.error = error instanceof Error ? error.message : String(error);
        throw error;
      } finally {
        this.busyPluginIds = removeItem(this.busyPluginIds, plugin.id);
      }
    },

    async setEnabled(plugin: PluginRecord, enabled: boolean): Promise<void> {
      this.busyPluginIds = appendUnique(this.busyPluginIds, plugin.id);
      this.error = '';

      try {
        await ecosystemSettingsService.setPluginEnabled(plugin, enabled);
        this.items = this.items.map((item) =>
          item.id === plugin.id
            ? {
                ...item,
                enabled
              }
            : item
        );
      } catch (error: unknown) {
        this.error = error instanceof Error ? error.message : String(error);
        throw error;
      } finally {
        this.busyPluginIds = removeItem(this.busyPluginIds, plugin.id);
      }
    }
  }
});

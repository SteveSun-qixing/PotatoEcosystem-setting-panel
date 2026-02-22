import { defineStore } from 'pinia';

import type { RuntimeHealthSnapshot, RuntimeLogQueryResult, RuntimeOverview } from '@/types';
import { ecosystemSettingsService } from '@/services/ecosystem-settings-service';

interface OverviewState {
  snapshot: RuntimeOverview | null;
  health: RuntimeHealthSnapshot | null;
  logs: RuntimeLogQueryResult | null;
  report: Record<string, unknown> | null;
  loading: boolean;
  restarting: boolean;
  changingState: boolean;
  error: string;
  logsError: string;
  lastUpdatedAt: string;
}

export const useOverviewStore = defineStore('overview', {
  state: (): OverviewState => ({
    snapshot: null,
    health: null,
    logs: null,
    report: null,
    loading: false,
    restarting: false,
    changingState: false,
    error: '',
    logsError: '',
    lastUpdatedAt: ''
  }),

  actions: {
    async refresh(): Promise<void> {
      this.loading = true;
      this.error = '';

      try {
        const [snapshot, health] = await Promise.all([
          ecosystemSettingsService.getRuntimeOverview(),
          ecosystemSettingsService.getRuntimeHealth()
        ]);

        this.snapshot = snapshot;
        this.health = health;
        this.lastUpdatedAt = new Date().toISOString();
      } catch (error: unknown) {
        this.error = error instanceof Error ? error.message : String(error);
      } finally {
        this.loading = false;
      }
    },

    async refreshLogs(level?: 'debug' | 'info' | 'warn' | 'error', query?: string): Promise<void> {
      this.logsError = '';

      try {
        this.logs = await ecosystemSettingsService.queryRuntimeLogs({
          ...(level ? { level } : {}),
          ...(query ? { query } : {}),
          limit: 50
        });
      } catch (error: unknown) {
        this.logsError = error instanceof Error ? error.message : String(error);
      }
    },

    async exportReport(): Promise<void> {
      this.error = '';

      try {
        this.report = await ecosystemSettingsService.exportRuntimeReport();
      } catch (error: unknown) {
        this.error = error instanceof Error ? error.message : String(error);
      }
    },

    async start(): Promise<void> {
      this.changingState = true;
      this.error = '';

      try {
        await ecosystemSettingsService.startHost();
      } catch (error: unknown) {
        this.error = error instanceof Error ? error.message : String(error);
        throw error;
      } finally {
        this.changingState = false;
      }
    },

    async stop(): Promise<void> {
      this.changingState = true;
      this.error = '';

      try {
        await ecosystemSettingsService.stopHost();
      } catch (error: unknown) {
        this.error = error instanceof Error ? error.message : String(error);
        throw error;
      } finally {
        this.changingState = false;
      }
    },

    async restart(reason: string): Promise<void> {
      this.restarting = true;
      this.error = '';

      try {
        await ecosystemSettingsService.restartHost(reason);
      } catch (error: unknown) {
        this.error = error instanceof Error ? error.message : String(error);
        throw error;
      } finally {
        this.restarting = false;
      }
    }
  }
});

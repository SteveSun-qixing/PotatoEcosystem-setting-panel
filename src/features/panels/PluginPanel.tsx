import { useEffect, useMemo, useState } from 'react';
import { Button, ChipsFileUpload, Switch } from '@chips/component-library';

import { ecosystemSettingsService } from '@/services/ecosystem-settings-service';
import type { PluginRecord } from '@/types';
import { useI18n } from '@/i18n';
import { ErrorAlert } from '@/features/shared/ErrorAlert';
import { toDisplayError, type DisplayError } from '@/utils/error';
import { resolvePackagePath } from '@/utils/package-file';

export function PluginPanel() {
  const { t } = useI18n();
  const [items, setItems] = useState<PluginRecord[]>([]);
  const [updates, setUpdates] = useState<Array<Record<string, unknown>>>([]);
  const [installFile, setInstallFile] = useState<File | null>(null);
  const [forceInstall, setForceInstall] = useState(false);
  const [loading, setLoading] = useState(false);
  const [installPending, setInstallPending] = useState(false);
  const [updatePending, setUpdatePending] = useState(false);
  const [busyPluginIds, setBusyPluginIds] = useState<string[]>([]);
  const [error, setError] = useState<DisplayError | null>(null);

  const hasPlugins = useMemo(() => items.length > 0, [items.length]);

  const refresh = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [plugins, nextUpdates] = await Promise.all([
        ecosystemSettingsService.listPlugins(),
        ecosystemSettingsService.checkPluginUpdates()
      ]);
      setItems(plugins);
      setUpdates(nextUpdates);
    } catch (reason: unknown) {
      setError(toDisplayError(reason));
    } finally {
      setLoading(false);
    }
  };

  const install = async (): Promise<void> => {
    const packagePath = resolvePackagePath(installFile);
    if (!packagePath) {
      setError({
        code: 'FILE_READ_FAILED',
        message: t('i18n.plugin.699027'),
        rawMessage: t('i18n.plugin.699027')
      });
      return;
    }

    setInstallPending(true);
    setError(null);
    try {
      await ecosystemSettingsService.installPlugin(packagePath, forceInstall);
      setInstallFile(null);
      setForceInstall(false);
      await refresh();
    } catch (reason: unknown) {
      setError(toDisplayError(reason));
    } finally {
      setInstallPending(false);
    }
  };

  const setEnabled = async (plugin: PluginRecord, enabled: boolean): Promise<void> => {
    setBusyPluginIds((current) => [...new Set([...current, plugin.id])]);
    setError(null);
    try {
      await ecosystemSettingsService.setPluginEnabled(plugin, enabled);
      setItems((current) =>
        current.map((item) => (item.id === plugin.id ? { ...item, enabled } : item))
      );
    } catch (reason: unknown) {
      setError(toDisplayError(reason));
    } finally {
      setBusyPluginIds((current) => current.filter((item) => item !== plugin.id));
    }
  };

  const uninstall = async (plugin: PluginRecord): Promise<void> => {
    setBusyPluginIds((current) => [...new Set([...current, plugin.id])]);
    setError(null);
    try {
      await ecosystemSettingsService.uninstallPlugin(plugin);
      await refresh();
    } catch (reason: unknown) {
      setError(toDisplayError(reason));
    } finally {
      setBusyPluginIds((current) => current.filter((item) => item !== plugin.id));
    }
  };

  const applyUpdates = async (): Promise<void> => {
    setUpdatePending(true);
    setError(null);
    try {
      const result = await ecosystemSettingsService.applyPluginUpdates([]);
      setUpdates(result);
      await refresh();
    } catch (reason: unknown) {
      setError(toDisplayError(reason));
    } finally {
      setUpdatePending(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <section className="chips-settings-panel">
      <header className="chips-settings-panel__header">
        <div>
          <h2 className="chips-settings-panel__title">{t('i18n.plugin.691001')}</h2>
          <p className="chips-settings-panel__description">{t('i18n.plugin.691002')}</p>
        </div>
        <Button onClick={() => void refresh()} disabled={loading}>
          {t('i18n.plugin.691003')}
        </Button>
      </header>

      <ErrorAlert error={error} summaryKey="i18n.plugin.691008" />

      <article className="chips-settings-card">
        <h3 className="chips-settings-card__title">{t('i18n.plugin.691004')}</h3>
        <p className="chips-settings-card__meta">{t('i18n.plugin.699026')}</p>
        <div className="chips-settings-form">
          <ChipsFileUpload
            value={installFile}
            acceptExtensions={['.cpk']}
            onChange={setInstallFile}
            onError={(uploadError) => setError(toDisplayError(uploadError))}
          />
          <Switch checked={forceInstall} onCheckedChange={setForceInstall}>
            {t('i18n.plugin.691006')}
          </Switch>
          <div className="chips-settings-panel__actions">
            <Button
              data-testid="plugin-install-button"
              onClick={() => void install()}
              disabled={installPending || installFile === null}
            >
              {t('i18n.plugin.691007')}
            </Button>
          </div>
        </div>
      </article>

      <article className="chips-settings-card">
        <h3 className="chips-settings-card__title">{t('i18n.plugin.691020')}</h3>
        <div className="chips-settings-panel__actions">
          <Button onClick={() => void refresh()}>{t('i18n.plugin.691021')}</Button>
          <Button onClick={() => void applyUpdates()} disabled={updatePending}>
            {t('i18n.plugin.691022')}
          </Button>
        </div>
        {updates.length > 0 ? (
          <div className="chips-settings-log">
            <pre>{JSON.stringify(updates, null, 2)}</pre>
          </div>
        ) : (
          <p className="chips-settings-card__meta">{t('i18n.plugin.691023')}</p>
        )}
      </article>

      <article className="chips-settings-card chips-settings-card--table">
        <table className="chips-settings-table">
          <thead>
            <tr>
              <th>{t('i18n.plugin.691009')}</th>
              <th>{t('i18n.plugin.691010')}</th>
              <th>{t('i18n.plugin.691011')}</th>
              <th>{t('i18n.plugin.691012')}</th>
              <th>{t('i18n.plugin.691013')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((plugin) => (
              <tr key={plugin.id}>
                <td>
                  <p className="chips-settings-table__name">{plugin.name}</p>
                  <p className="chips-settings-table__subtext">{plugin.id}</p>
                </td>
                <td>{plugin.type}</td>
                <td>{plugin.version}</td>
                <td>{plugin.publisher}</td>
                <td className="chips-settings-table__actions">
                  <Switch
                    checked={plugin.enabled}
                    disabled={busyPluginIds.includes(plugin.id)}
                    onCheckedChange={(checked) => void setEnabled(plugin, checked)}
                  >
                    {plugin.enabled ? t('i18n.plugin.691014') : t('i18n.plugin.691015')}
                  </Switch>
                  <Button onClick={() => void uninstall(plugin)} disabled={busyPluginIds.includes(plugin.id)}>
                    {t('i18n.plugin.691016')}
                  </Button>
                </td>
              </tr>
            ))}
            {!loading && !hasPlugins ? (
              <tr>
                <td colSpan={5} className="chips-settings-table__empty">
                  {t('i18n.plugin.691017')}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </article>
    </section>
  );
}

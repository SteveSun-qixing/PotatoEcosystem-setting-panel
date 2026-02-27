import { useEffect, useMemo, useState } from 'react';
import { ChipsButton, ChipsDialog, ChipsFileUpload, ChipsSwitch } from '@chips/component-library';

import { ecosystemSettingsService } from '@/services/ecosystem-settings-service';
import type { PluginRecord } from '@/types';
import { useI18n } from '@/i18n';
import { ErrorAlert } from '@/features/shared/ErrorAlert';
import { toDisplayError, type DisplayError } from '@/utils/error';

export function PluginPanel() {
  const { t } = useI18n();
  const [items, setItems] = useState<PluginRecord[]>([]);
  const [updates, setUpdates] = useState<Array<Record<string, unknown>>>([]);
  const [installFiles, setInstallFiles] = useState<File[]>([]);
  const [forceInstall, setForceInstall] = useState(false);
  const [pluginPendingRemoval, setPluginPendingRemoval] = useState<PluginRecord | null>(null);
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
    const installFile = installFiles[0];
    if (!installFile) {
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
      const packagePath = await ecosystemSettingsService.resolveInstallPackagePath(installFile);
      await ecosystemSettingsService.installPlugin(packagePath, forceInstall);
      setInstallFiles([]);
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

  const uninstall = async (): Promise<void> => {
    if (!pluginPendingRemoval) {
      return;
    }

    setBusyPluginIds((current) => [...new Set([...current, pluginPendingRemoval.id])]);
    setError(null);
    try {
      await ecosystemSettingsService.uninstallPlugin(pluginPendingRemoval);
      setPluginPendingRemoval(null);
      await refresh();
    } catch (reason: unknown) {
      setError(toDisplayError(reason));
    } finally {
      setBusyPluginIds((current) => current.filter((item) => item !== pluginPendingRemoval.id));
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

  const panelState = error ? 'error' : loading || installPending || updatePending ? 'loading' : 'idle';

  return (
    <section className="chips-settings-panel" data-scope="settings.panel.plugin" data-part="panel" data-state={panelState}>
      <header className="chips-settings-panel__header" data-part="header">
        <div data-part="header-content">
          <h2 className="chips-settings-panel__title" data-part="title">{t('i18n.plugin.691001')}</h2>
          <p className="chips-settings-panel__description" data-part="description">{t('i18n.plugin.691002')}</p>
        </div>
        <ChipsButton onClick={() => void refresh()} disabled={loading} data-part="refresh-action">
          {t('i18n.plugin.691003')}
        </ChipsButton>
      </header>

      <ErrorAlert error={error} summaryKey="i18n.plugin.691008" />

      <article className="chips-settings-card" data-part="card-install">
        <h3 className="chips-settings-card__title" data-part="card-title">{t('i18n.plugin.691004')}</h3>
        <p className="chips-settings-card__meta" data-part="meta">{t('i18n.plugin.699026')}</p>
        <div className="chips-settings-form" data-part="form">
          <ChipsFileUpload
            value={installFiles}
            acceptExtensions={['.cpk']}
            onChange={setInstallFiles}
            onError={(uploadError) => setError(toDisplayError(uploadError))}
          />
          <ChipsSwitch checked={forceInstall} onCheckedChange={setForceInstall}>
            {t('i18n.plugin.691006')}
          </ChipsSwitch>
          <div className="chips-settings-panel__actions" data-part="actions">
            <ChipsButton
              data-testid="plugin-install-button"
              onClick={() => void install()}
              disabled={installPending || installFiles.length === 0}
              data-part="install-action"
            >
              {t('i18n.plugin.691007')}
            </ChipsButton>
          </div>
        </div>
      </article>

      <article className="chips-settings-card" data-part="card-update">
        <h3 className="chips-settings-card__title" data-part="card-title">{t('i18n.plugin.691020')}</h3>
        <div className="chips-settings-panel__actions" data-part="actions">
          <ChipsButton onClick={() => void refresh()} data-part="refresh-update-action">{t('i18n.plugin.691021')}</ChipsButton>
          <ChipsButton onClick={() => void applyUpdates()} disabled={updatePending} data-part="apply-update-action">
            {t('i18n.plugin.691022')}
          </ChipsButton>
        </div>
        {updates.length > 0 ? (
          <div className="chips-settings-log" data-part="log-output" role="log" aria-live="polite">
            <pre>{JSON.stringify(updates, null, 2)}</pre>
          </div>
        ) : (
          <p className="chips-settings-card__meta" data-part="meta">{t('i18n.plugin.691023')}</p>
        )}
      </article>

      <article className="chips-settings-card chips-settings-card--table" data-part="card-table">
        <table className="chips-settings-table" data-part="table">
          <thead>
            <tr data-part="row">
              <th>{t('i18n.plugin.691009')}</th>
              <th>{t('i18n.plugin.691010')}</th>
              <th>{t('i18n.plugin.691011')}</th>
              <th>{t('i18n.plugin.691012')}</th>
              <th>{t('i18n.plugin.691013')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((plugin) => (
              <tr key={plugin.id} data-part="row" data-state={plugin.enabled ? 'active' : 'disabled'}>
                <td>
                  <p className="chips-settings-table__name">{plugin.name}</p>
                  <p className="chips-settings-table__subtext">{plugin.id}</p>
                </td>
                <td>{plugin.type}</td>
                <td>{plugin.version}</td>
                <td>{plugin.publisher}</td>
                <td className="chips-settings-table__actions" data-part="actions">
                  <ChipsSwitch
                    checked={plugin.enabled}
                    disabled={busyPluginIds.includes(plugin.id)}
                    onCheckedChange={(checked) => void setEnabled(plugin, checked)}
                  >
                    {plugin.enabled ? t('i18n.plugin.691014') : t('i18n.plugin.691015')}
                  </ChipsSwitch>
                  <ChipsButton
                    onClick={() => setPluginPendingRemoval(plugin)}
                    disabled={busyPluginIds.includes(plugin.id)}
                    data-part="uninstall-action"
                  >
                    {t('i18n.plugin.691016')}
                  </ChipsButton>
                </td>
              </tr>
            ))}
            {!loading && !hasPlugins ? (
              <tr data-part="row" data-state="empty">
                <td colSpan={5} className="chips-settings-table__empty">
                  {t('i18n.plugin.691017')}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </article>

      {pluginPendingRemoval ? (
        <ChipsDialog
          defaultOpen
          chipsScope="settings.dialog.confirm"
          className="chips-settings-confirm-dialog"
          onOpenChange={(open) => {
            if (!open) {
              setPluginPendingRemoval(null);
            }
          }}
          title={t('i18n.plugin.691018')}
          description={t('i18n.plugin.691019', { plugin: pluginPendingRemoval.name })}
        >
          <div className="chips-settings-dialog-actions" data-part="actions">
            <ChipsButton onClick={() => setPluginPendingRemoval(null)} data-part="cancel-action">{t('i18n.core.000002')}</ChipsButton>
            <ChipsButton onClick={() => void uninstall()} data-part="confirm-action">{t('i18n.plugin.691016')}</ChipsButton>
          </div>
        </ChipsDialog>
      ) : null}
    </section>
  );
}

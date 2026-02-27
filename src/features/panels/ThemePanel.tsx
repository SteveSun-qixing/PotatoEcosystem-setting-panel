import { useEffect, useState } from 'react';
import { ChipsButton, ChipsDialog, ChipsFileUpload } from '@chips/component-library';

import { DEFAULT_THEME_ID } from '@/constants/theme';
import { ecosystemSettingsService } from '@/services/ecosystem-settings-service';
import type { ThemeOption } from '@/types';
import { useI18n } from '@/i18n';
import { ErrorAlert } from '@/features/shared/ErrorAlert';
import { toDisplayError, type DisplayError } from '@/utils/error';

interface ThemeOverwriteState {
  packagePath: string;
  fileName: string;
}

export function ThemePanel() {
  const { t } = useI18n();
  const [themes, setThemes] = useState<ThemeOption[]>([]);
  const [currentThemeId, setCurrentThemeId] = useState('');
  const [installFiles, setInstallFiles] = useState<File[]>([]);
  const [overwritePending, setOverwritePending] = useState<ThemeOverwriteState | null>(null);
  const [themePendingRemoval, setThemePendingRemoval] = useState<ThemeOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<DisplayError | null>(null);

  const refresh = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [nextThemes, activeTheme] = await Promise.all([
        ecosystemSettingsService.listThemeOptions(),
        ecosystemSettingsService.getCurrentThemeId()
      ]);
      setThemes(nextThemes);
      setCurrentThemeId(activeTheme);
    } catch (reason: unknown) {
      setError(toDisplayError(reason));
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = async (themeId: string): Promise<void> => {
    if (!themeId) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await ecosystemSettingsService.applyTheme(themeId);
      await refresh();
    } catch (reason: unknown) {
      setError(toDisplayError(reason));
    } finally {
      setSaving(false);
    }
  };

  const installThemeByPath = async (packagePath: string, fileName: string, overwrite: boolean): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      await ecosystemSettingsService.installTheme(packagePath, overwrite);
      setInstallFiles([]);
      setOverwritePending(null);
      await refresh();
    } catch (reason: unknown) {
      const displayError = toDisplayError(reason);
      if (displayError.code === 'PACKAGE_INSTALL_CONFLICT' && !overwrite) {
        setOverwritePending({
          packagePath,
          fileName
        });
      } else {
        setError(displayError);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInstallFileChange = (files: File[]): void => {
    setInstallFiles(files);
    setOverwritePending(null);

    const file = files[0];
    if (!file) {
      return;
    }

    void (async () => {
      setSaving(true);
      setError(null);
      try {
        const packagePath = await ecosystemSettingsService.resolveInstallPackagePath(file);
        await installThemeByPath(packagePath, file.name, false);
      } catch (reason: unknown) {
        setError(toDisplayError(reason));
      } finally {
        setSaving(false);
      }
    })();
  };

  const uninstallTheme = async (): Promise<void> => {
    if (!themePendingRemoval) {
      return;
    }

    const targetTheme = themePendingRemoval;

    setSaving(true);
    setError(null);
    try {
      await ecosystemSettingsService.uninstallTheme(targetTheme.id);
      setThemePendingRemoval(null);
      await refresh();
    } catch (reason: unknown) {
      setError(toDisplayError(reason));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const panelState = error ? 'error' : loading || saving ? 'loading' : 'idle';
  const selectedInstallFile = installFiles[0] ?? null;

  return (
    <section className="chips-settings-panel" data-scope="settings.panel.theme" data-part="panel" data-state={panelState}>
      <header className="chips-settings-panel__header" data-part="header">
        <div data-part="header-content">
          <h2 className="chips-settings-panel__title" data-part="title">{t('i18n.plugin.694001')}</h2>
          <p className="chips-settings-panel__description" data-part="description">{t('i18n.plugin.694002')}</p>
        </div>
        <ChipsButton onClick={() => void refresh()} disabled={loading || saving} data-part="refresh-action">
          {t('i18n.plugin.694003')}
        </ChipsButton>
      </header>

      <ErrorAlert error={error} summaryKey="i18n.plugin.691008" />

      <article className="chips-settings-card" data-part="card-install">
        <h3 className="chips-settings-card__title" data-part="card-title">{t('i18n.plugin.694006')}</h3>
        <p className="chips-settings-card__meta" data-part="meta">{t('i18n.plugin.699026')}</p>
        <div className="chips-settings-form" data-part="form">
          <ChipsFileUpload
            value={installFiles}
            disabled={loading || saving}
            acceptExtensions={['.cpk']}
            onChange={handleInstallFileChange}
            onError={(uploadError) => setError(toDisplayError(uploadError))}
          />
          {selectedInstallFile ? (
            <p className="chips-settings-card__meta" data-part="meta">{t('i18n.plugin.694029', { fileName: selectedInstallFile.name })}</p>
          ) : null}
        </div>
      </article>

      <article className="chips-settings-card chips-settings-card--table" data-part="card-table">
        <header className="chips-settings-card__header" data-part="header">
          <h3 className="chips-settings-card__title" data-part="card-title">{t('i18n.plugin.694015')}</h3>
          <p className="chips-settings-card__meta" data-part="meta">{t('i18n.plugin.694016')}</p>
        </header>
        <table className="chips-settings-table" data-part="table">
          <thead>
            <tr data-part="row">
              <th>{t('i18n.plugin.694017')}</th>
              <th>{t('i18n.plugin.694018')}</th>
              <th>{t('i18n.plugin.694019')}</th>
              <th>{t('i18n.plugin.694020')}</th>
              <th>{t('i18n.plugin.694021')}</th>
            </tr>
          </thead>
          <tbody>
            {themes.map((theme) => {
              const isCurrent = theme.id === currentThemeId;
              const isDefault = theme.id === DEFAULT_THEME_ID;
              const disableDelete = isCurrent || isDefault;

              return (
                <tr key={theme.id} data-part="row" data-state={isCurrent ? 'active' : 'idle'}>
                  <td>
                    <p className="chips-settings-table__name">{theme.name}</p>
                  </td>
                  <td>
                    <p className="chips-settings-table__subtext">{theme.id}</p>
                  </td>
                  <td>{theme.version || '-'}</td>
                  <td>
                    <div className="chips-settings-table__badges" data-part="status-group">
                      {isCurrent ? (
                        <span className="chips-settings-status chips-settings-status--ok" data-part="status" data-state="active">
                          {t('i18n.plugin.694022')}
                        </span>
                      ) : null}
                      {isDefault ? (
                        <span className="chips-settings-status chips-settings-status--default" data-part="status" data-state="default">
                          {t('i18n.plugin.694025')}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="chips-settings-table__actions" data-part="actions">
                    <ChipsButton
                      onClick={() => void applyTheme(theme.id)}
                      disabled={loading || saving || isCurrent}
                      data-part="apply-action"
                    >
                      {t('i18n.plugin.694023')}
                    </ChipsButton>
                    <ChipsButton
                      onClick={() => setThemePendingRemoval(theme)}
                      disabled={loading || saving || disableDelete}
                      data-part="delete-action"
                    >
                      {t('i18n.plugin.694024')}
                    </ChipsButton>
                    {disableDelete ? (
                      <p className="chips-settings-table__hint" data-part="hint">
                        {isCurrent ? t('i18n.plugin.694027') : t('i18n.plugin.694026')}
                      </p>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {!loading && themes.length === 0 ? (
              <tr data-part="row" data-state="empty">
                <td colSpan={5} className="chips-settings-table__empty">
                  {t('i18n.plugin.694028')}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </article>

      {overwritePending ? (
        <ChipsDialog
          defaultOpen
          chipsScope="settings.dialog.confirm"
          className="chips-settings-confirm-dialog"
          onOpenChange={(open) => {
            if (!open) {
              setOverwritePending(null);
            }
          }}
          title={t('i18n.plugin.694030')}
          description={overwritePending.fileName}
        >
          <div className="chips-settings-dialog-actions" data-part="actions">
            <ChipsButton onClick={() => setOverwritePending(null)} data-part="cancel-action">{t('i18n.plugin.694032')}</ChipsButton>
            <ChipsButton
              onClick={() => void installThemeByPath(overwritePending.packagePath, overwritePending.fileName, true)}
              disabled={saving}
              data-part="confirm-action"
            >
              {t('i18n.plugin.694031')}
            </ChipsButton>
          </div>
        </ChipsDialog>
      ) : null}

      {themePendingRemoval ? (
        <ChipsDialog
          defaultOpen
          chipsScope="settings.dialog.confirm"
          className="chips-settings-confirm-dialog"
          onOpenChange={(open) => {
            if (!open) {
              setThemePendingRemoval(null);
            }
          }}
          title={t('i18n.plugin.694013')}
          description={t('i18n.plugin.694014', { themeId: themePendingRemoval.id })}
        >
          <div className="chips-settings-dialog-actions" data-part="actions">
            <ChipsButton onClick={() => setThemePendingRemoval(null)} data-part="cancel-action">{t('i18n.plugin.694032')}</ChipsButton>
            <ChipsButton onClick={() => void uninstallTheme()} disabled={saving} data-part="confirm-action">
              {t('i18n.plugin.694024')}
            </ChipsButton>
          </div>
        </ChipsDialog>
      ) : null}
    </section>
  );
}

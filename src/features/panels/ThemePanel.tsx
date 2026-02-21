import { useEffect, useState } from 'react';
import { Button, ChipsFileUpload, Dialog } from '@chips/component-library';

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
  const [installFile, setInstallFile] = useState<File | null>(null);
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
      setInstallFile(null);
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

  const handleInstallFileChange = (file: File | null): void => {
    setInstallFile(file);
    setOverwritePending(null);

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

  return (
    <section className="chips-settings-panel">
      <header className="chips-settings-panel__header">
        <div>
          <h2 className="chips-settings-panel__title">{t('i18n.plugin.694001')}</h2>
          <p className="chips-settings-panel__description">{t('i18n.plugin.694002')}</p>
        </div>
        <Button onClick={() => void refresh()} disabled={loading || saving}>
          {t('i18n.plugin.694003')}
        </Button>
      </header>

      <ErrorAlert error={error} summaryKey="i18n.plugin.691008" />

      <article className="chips-settings-card">
        <h3 className="chips-settings-card__title">{t('i18n.plugin.694006')}</h3>
        <p className="chips-settings-card__meta">{t('i18n.plugin.699026')}</p>
        <div className="chips-settings-form">
          <ChipsFileUpload
            value={installFile}
            disabled={loading || saving}
            acceptExtensions={['.cpk']}
            onChange={handleInstallFileChange}
            onError={(uploadError) => setError(toDisplayError(uploadError))}
          />
          {installFile ? (
            <p className="chips-settings-card__meta">{t('i18n.plugin.694029', { fileName: installFile.name })}</p>
          ) : null}
        </div>
      </article>

      <article className="chips-settings-card chips-settings-card--table">
        <header className="chips-settings-card__header">
          <h3 className="chips-settings-card__title">{t('i18n.plugin.694015')}</h3>
          <p className="chips-settings-card__meta">{t('i18n.plugin.694016')}</p>
        </header>
        <table className="chips-settings-table">
          <thead>
            <tr>
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
                <tr key={theme.id}>
                  <td>
                    <p className="chips-settings-table__name">{theme.name}</p>
                  </td>
                  <td>
                    <p className="chips-settings-table__subtext">{theme.id}</p>
                  </td>
                  <td>{theme.version || '-'}</td>
                  <td>
                    <div className="chips-settings-table__badges">
                      {isCurrent ? (
                        <span className="chips-settings-status chips-settings-status--ok">
                          {t('i18n.plugin.694022')}
                        </span>
                      ) : null}
                      {isDefault ? (
                        <span className="chips-settings-status chips-settings-status--default">
                          {t('i18n.plugin.694025')}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="chips-settings-table__actions">
                    <Button
                      onClick={() => void applyTheme(theme.id)}
                      disabled={loading || saving || isCurrent}
                    >
                      {t('i18n.plugin.694023')}
                    </Button>
                    <Button
                      onClick={() => setThemePendingRemoval(theme)}
                      disabled={loading || saving || disableDelete}
                    >
                      {t('i18n.plugin.694024')}
                    </Button>
                    {disableDelete ? (
                      <p className="chips-settings-table__hint">
                        {isCurrent ? t('i18n.plugin.694027') : t('i18n.plugin.694026')}
                      </p>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {!loading && themes.length === 0 ? (
              <tr>
                <td colSpan={5} className="chips-settings-table__empty">
                  {t('i18n.plugin.694028')}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </article>

      {overwritePending ? (
        <Dialog
          defaultOpen
          className="chips-settings-confirm-dialog"
          onOpenChange={(open) => {
            if (!open) {
              setOverwritePending(null);
            }
          }}
          title={t('i18n.plugin.694030')}
          description={overwritePending.fileName}
        >
          <div className="chips-settings-dialog-actions">
            <Button onClick={() => setOverwritePending(null)}>{t('i18n.plugin.694032')}</Button>
            <Button
              onClick={() => void installThemeByPath(overwritePending.packagePath, overwritePending.fileName, true)}
              disabled={saving}
            >
              {t('i18n.plugin.694031')}
            </Button>
          </div>
        </Dialog>
      ) : null}

      {themePendingRemoval ? (
        <Dialog
          defaultOpen
          className="chips-settings-confirm-dialog"
          onOpenChange={(open) => {
            if (!open) {
              setThemePendingRemoval(null);
            }
          }}
          title={t('i18n.plugin.694013')}
          description={t('i18n.plugin.694014', { themeId: themePendingRemoval.id })}
        >
          <div className="chips-settings-dialog-actions">
            <Button onClick={() => setThemePendingRemoval(null)}>{t('i18n.plugin.694032')}</Button>
            <Button onClick={() => void uninstallTheme()} disabled={saving}>
              {t('i18n.plugin.694024')}
            </Button>
          </div>
        </Dialog>
      ) : null}
    </section>
  );
}

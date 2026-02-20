import { useEffect, useState } from 'react';
import { Button, ChipsFileUpload, Input, Switch } from '@chips/component-library';

import { ecosystemSettingsService } from '@/services/ecosystem-settings-service';
import type { ThemeOption } from '@/types';
import { useI18n } from '@/i18n';
import { ErrorAlert } from '@/features/shared/ErrorAlert';
import { toDisplayError, type DisplayError } from '@/utils/error';
import { resolvePackagePath } from '@/utils/package-file';

export function ThemePanel() {
  const { t } = useI18n();
  const [themes, setThemes] = useState<ThemeOption[]>([]);
  const [currentThemeId, setCurrentThemeId] = useState('');
  const [installFile, setInstallFile] = useState<File | null>(null);
  const [installOverwrite, setInstallOverwrite] = useState(false);
  const [uninstallThemeId, setUninstallThemeId] = useState('');
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

  const applyTheme = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      await ecosystemSettingsService.applyTheme(currentThemeId);
    } catch (reason: unknown) {
      setError(toDisplayError(reason));
    } finally {
      setSaving(false);
    }
  };

  const installTheme = async (): Promise<void> => {
    const packagePath = resolvePackagePath(installFile);
    if (!packagePath) {
      setError({
        code: 'FILE_READ_FAILED',
        message: t('i18n.plugin.699027'),
        rawMessage: t('i18n.plugin.699027')
      });
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await ecosystemSettingsService.installTheme(packagePath, installOverwrite);
      setInstallFile(null);
      setInstallOverwrite(false);
      await refresh();
    } catch (reason: unknown) {
      setError(toDisplayError(reason));
    } finally {
      setSaving(false);
    }
  };

  const uninstallTheme = async (): Promise<void> => {
    if (!uninstallThemeId) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await ecosystemSettingsService.uninstallTheme(uninstallThemeId);
      setUninstallThemeId('');
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
        <Button onClick={() => void refresh()} disabled={loading}>
          {t('i18n.plugin.694003')}
        </Button>
      </header>

      <ErrorAlert error={error} summaryKey="i18n.plugin.691008" />

      <article className="chips-settings-card">
        <h3 className="chips-settings-card__title">{t('i18n.plugin.694004')}</h3>
        <div className="chips-settings-card__toolbar">
          <select value={currentThemeId} onChange={(event) => setCurrentThemeId(event.target.value)}>
            {themes.map((theme) => (
              <option value={theme.id} key={theme.id}>
                {theme.version ? `${theme.name} (${theme.version})` : theme.name}
              </option>
            ))}
          </select>
          <Button onClick={() => void applyTheme()} disabled={saving}>
            {t('i18n.plugin.694005')}
          </Button>
        </div>
      </article>

      <article className="chips-settings-card">
        <h3 className="chips-settings-card__title">{t('i18n.plugin.694006')}</h3>
        <p className="chips-settings-card__meta">{t('i18n.plugin.699026')}</p>
        <div className="chips-settings-form">
          <ChipsFileUpload
            value={installFile}
            acceptExtensions={['.cpk']}
            onChange={setInstallFile}
            onError={(uploadError) => setError(toDisplayError(uploadError))}
          />
          <Switch checked={installOverwrite} onCheckedChange={setInstallOverwrite}>
            {t('i18n.plugin.694008')}
          </Switch>
          <div className="chips-settings-panel__actions">
            <Button
              data-testid="theme-install-button"
              onClick={() => void installTheme()}
              disabled={saving || installFile === null}
            >
              {t('i18n.plugin.694009')}
            </Button>
          </div>
        </div>
      </article>

      <article className="chips-settings-card">
        <h3 className="chips-settings-card__title">{t('i18n.plugin.694010')}</h3>
        <div className="chips-settings-card__toolbar">
          <Input
            aria-label="theme-uninstall-id"
            value={uninstallThemeId}
            onChange={(event) => setUninstallThemeId(event.target.value)}
            placeholder={t('i18n.plugin.694011')}
          />
          <Button onClick={() => void uninstallTheme()} disabled={saving || uninstallThemeId.length === 0}>
            {t('i18n.plugin.694012')}
          </Button>
        </div>
      </article>
    </section>
  );
}

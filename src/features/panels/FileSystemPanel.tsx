import { useEffect, useState } from 'react';
import { Button, Input, Select } from '@chips/component-library';

import { ecosystemSettingsService } from '@/services/ecosystem-settings-service';
import type { WorkspaceExchangePolicy } from '@/types';
import { useI18n } from '@/i18n';
import { ErrorAlert } from '@/features/shared/ErrorAlert';
import { toDisplayError, type DisplayError } from '@/utils/error';

export function FileSystemPanel() {
  const { t } = useI18n();
  const [workspacePath, setWorkspacePath] = useState('');
  const [policy, setPolicy] = useState<WorkspaceExchangePolicy>({
    mode: 'copy',
    conflict: 'rename'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<DisplayError | null>(null);

  const refresh = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [path, nextPolicy] = await Promise.all([
        ecosystemSettingsService.getWorkspacePath(),
        ecosystemSettingsService.getWorkspaceExchangePolicy()
      ]);
      setWorkspacePath(path);
      setPolicy(nextPolicy);
    } catch (reason: unknown) {
      setError(toDisplayError(reason));
    } finally {
      setLoading(false);
    }
  };

  const savePath = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      await ecosystemSettingsService.setWorkspacePath(workspacePath);
    } catch (reason: unknown) {
      setError(toDisplayError(reason));
    } finally {
      setSaving(false);
    }
  };

  const savePolicy = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      await ecosystemSettingsService.setWorkspaceExchangePolicy(policy);
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
          <h2 className="chips-settings-panel__title">{t('i18n.plugin.696001')}</h2>
          <p className="chips-settings-panel__description">{t('i18n.plugin.696002')}</p>
        </div>
        <Button onClick={() => void refresh()} disabled={loading}>
          {t('i18n.plugin.696003')}
        </Button>
      </header>

      <ErrorAlert error={error} summaryKey="i18n.plugin.691008" />

      <article className="chips-settings-card">
        <h3 className="chips-settings-card__title">{t('i18n.plugin.696004')}</h3>
        <div className="chips-settings-card__toolbar">
          <Input
            aria-label={t('i18n.plugin.696004')}
            value={workspacePath}
            onChange={(event) => setWorkspacePath(event.target.value)}
            placeholder={t('i18n.plugin.696005')}
          />
          <Button onClick={() => void savePath()} disabled={saving}>
            {t('i18n.plugin.696006')}
          </Button>
        </div>
      </article>

      <article className="chips-settings-card">
        <h3 className="chips-settings-card__title">{t('i18n.plugin.696007')}</h3>
        <div className="chips-settings-card__toolbar">
          <Select
            label={t('i18n.plugin.696008')}
            value={policy.mode}
            options={[
              { value: 'copy', label: t('i18n.plugin.696011') },
              { value: 'link', label: t('i18n.plugin.696012') }
            ]}
            onValueChange={(value) =>
              setPolicy((current) => ({
                ...current,
                mode: value === 'link' ? 'link' : 'copy'
              }))
            }
          />
          <Select
            label={t('i18n.plugin.696009')}
            value={policy.conflict}
            options={[
              { value: 'rename', label: t('i18n.plugin.696013') },
              { value: 'skip', label: t('i18n.plugin.696014') },
              { value: 'overwrite', label: t('i18n.plugin.696015') }
            ]}
            onValueChange={(value) =>
              setPolicy((current) => ({
                ...current,
                conflict: value === 'overwrite' || value === 'skip' ? value : 'rename'
              }))
            }
          />
          <Button onClick={() => void savePolicy()} disabled={saving}>
            {t('i18n.plugin.696010')}
          </Button>
        </div>
      </article>
    </section>
  );
}

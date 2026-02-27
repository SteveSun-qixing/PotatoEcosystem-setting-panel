import { useEffect, useState } from 'react';
import { ChipsButton, ChipsInput, ChipsSelect } from '@chips/component-library';

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

  const panelState = error ? 'error' : loading || saving ? 'loading' : 'idle';

  return (
    <section className="chips-settings-panel" data-scope="settings.panel.filesystem" data-part="panel" data-state={panelState}>
      <header className="chips-settings-panel__header" data-part="header">
        <div data-part="header-content">
          <h2 className="chips-settings-panel__title" data-part="title">{t('i18n.plugin.696001')}</h2>
          <p className="chips-settings-panel__description" data-part="description">{t('i18n.plugin.696002')}</p>
        </div>
        <ChipsButton onClick={() => void refresh()} disabled={loading} data-part="refresh-action">
          {t('i18n.plugin.696003')}
        </ChipsButton>
      </header>

      <ErrorAlert error={error} summaryKey="i18n.plugin.691008" />

      <article className="chips-settings-card" data-part="card-workspace">
        <h3 className="chips-settings-card__title" data-part="card-title">{t('i18n.plugin.696004')}</h3>
        <div className="chips-settings-card__toolbar" data-part="toolbar">
          <ChipsInput
            aria-label={t('i18n.plugin.696004')}
            value={workspacePath}
            onChange={(event) => setWorkspacePath(event.target.value)}
            placeholder={t('i18n.plugin.696005')}
            data-part="workspace-path-field"
          />
          <ChipsButton onClick={() => void savePath()} disabled={saving} data-part="save-path-action">
            {t('i18n.plugin.696006')}
          </ChipsButton>
        </div>
      </article>

      <article className="chips-settings-card" data-part="card-policy">
        <h3 className="chips-settings-card__title" data-part="card-title">{t('i18n.plugin.696007')}</h3>
        <div className="chips-settings-card__toolbar" data-part="toolbar">
          <ChipsSelect
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
          <ChipsSelect
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
          <ChipsButton onClick={() => void savePolicy()} disabled={saving} data-part="save-policy-action">
            {t('i18n.plugin.696010')}
          </ChipsButton>
        </div>
      </article>
    </section>
  );
}

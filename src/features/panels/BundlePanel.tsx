import { useEffect, useState } from 'react';
import { Button } from '@chips/component-library';

import { ecosystemSettingsService } from '@/services/ecosystem-settings-service';
import type { BundleStatus } from '@/types';
import { useI18n } from '@/i18n';
import { ErrorAlert } from '@/features/shared/ErrorAlert';
import { toDisplayError, type DisplayError } from '@/utils/error';

export function BundlePanel() {
  const { t } = useI18n();
  const [status, setStatus] = useState<BundleStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<DisplayError | null>(null);

  const refresh = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      setStatus(await ecosystemSettingsService.getBundleStatus());
    } catch (reason: unknown) {
      setError(toDisplayError(reason));
    } finally {
      setLoading(false);
    }
  };

  const updateBundle = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      await ecosystemSettingsService.updateBundle();
      await refresh();
    } catch (reason: unknown) {
      setError(toDisplayError(reason));
    } finally {
      setSaving(false);
    }
  };

  const repairBundle = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      await ecosystemSettingsService.repairBundle();
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
          <h2 className="chips-settings-panel__title">{t('i18n.plugin.695001')}</h2>
          <p className="chips-settings-panel__description">{t('i18n.plugin.695002')}</p>
        </div>
        <Button onClick={() => void refresh()} disabled={loading}>
          {t('i18n.plugin.695003')}
        </Button>
      </header>

      <ErrorAlert error={error} summaryKey="i18n.plugin.691008" />

      <article className="chips-settings-card">
        <h3 className="chips-settings-card__title">{t('i18n.plugin.695004')}</h3>
        {status ? (
          <dl className="chips-settings-card__list">
            <div className="chips-settings-card__item">
              <dt>{t('i18n.plugin.695005')}</dt>
              <dd>{status.healthy ? t('i18n.plugin.695006') : t('i18n.plugin.695007')}</dd>
            </div>
            <div className="chips-settings-card__item">
              <dt>{t('i18n.plugin.695008')}</dt>
              <dd>{status.installedCount}</dd>
            </div>
            <div className="chips-settings-card__item">
              <dt>{t('i18n.plugin.695009')}</dt>
              <dd>{status.requiredTypes.join(', ')}</dd>
            </div>
          </dl>
        ) : (
          <p className="chips-settings-card__meta">{t('i18n.plugin.695010')}</p>
        )}
      </article>

      <article className="chips-settings-card">
        <h3 className="chips-settings-card__title">{t('i18n.plugin.695011')}</h3>
        <div className="chips-settings-panel__actions">
          <Button onClick={() => void updateBundle()} disabled={saving}>
            {t('i18n.plugin.695012')}
          </Button>
          <Button onClick={() => void repairBundle()} disabled={saving}>
            {t('i18n.plugin.695013')}
          </Button>
        </div>
      </article>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { Button, Input, Select, Textarea } from '@chips/component-library';

import { ecosystemSettingsService } from '@/services/ecosystem-settings-service';
import { useI18n } from '@/i18n';
import { ErrorAlert } from '@/features/shared/ErrorAlert';
import { toDisplayError, type DisplayError } from '@/utils/error';

interface LanguagePanelProps {
  onLocaleCommitted: (locale: string) => void;
}

export function LanguagePanel({ onLocaleCommitted }: LanguagePanelProps) {
  const { t } = useI18n();
  const [locales, setLocales] = useState<string[]>([]);
  const [locale, setLocale] = useState('zh-CN');
  const [pluginId, setPluginId] = useState('chips.settings.manual');
  const [entriesRaw, setEntriesRaw] = useState('');
  const [resultText, setResultText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<DisplayError | null>(null);

  const refresh = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [nextLocales, nextLocale] = await Promise.all([
        ecosystemSettingsService.listLocales(),
        ecosystemSettingsService.getCurrentLocale()
      ]);
      setLocales(nextLocales);
      setLocale(nextLocale);
    } catch (reason: unknown) {
      setError(toDisplayError(reason));
    } finally {
      setLoading(false);
    }
  };

  const saveLocale = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      await ecosystemSettingsService.setCurrentLocale(locale);
      onLocaleCommitted(locale);
    } catch (reason: unknown) {
      setError(toDisplayError(reason));
    } finally {
      setSaving(false);
    }
  };

  const updateDictionary = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    setResultText('');
    try {
      const parsed = entriesRaw.trim().length > 0 ? (JSON.parse(entriesRaw) as Record<string, Record<string, string>>) : undefined;
      const result = await ecosystemSettingsService.updateDictionary(parsed, pluginId || undefined);
      setResultText(JSON.stringify(result));
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
          <h2 className="chips-settings-panel__title">{t('i18n.plugin.693001')}</h2>
          <p className="chips-settings-panel__description">{t('i18n.plugin.693002')}</p>
        </div>
        <Button onClick={() => void refresh()} disabled={loading}>
          {t('i18n.plugin.693003')}
        </Button>
      </header>

      <ErrorAlert error={error} summaryKey="i18n.plugin.692014" />

      <article className="chips-settings-card">
        <h3 className="chips-settings-card__title">{t('i18n.plugin.693004')}</h3>
        <div className="chips-settings-card__toolbar">
          <Select
            value={locale}
            options={locales.map((item) => ({ value: item, label: item }))}
            onValueChange={(value) => setLocale(value ?? '')}
          />
          <Button onClick={() => void saveLocale()} disabled={saving}>
            {t('i18n.plugin.693005')}
          </Button>
        </div>
      </article>

      <article className="chips-settings-card">
        <h3 className="chips-settings-card__title">{t('i18n.plugin.693006')}</h3>
        <div className="chips-settings-form">
          <Input
            label={t('i18n.plugin.693007')}
            aria-label={t('i18n.plugin.693007')}
            value={pluginId}
            onChange={(event) => setPluginId(event.target.value)}
            placeholder={t('i18n.plugin.693008')}
          />
          <Textarea
            label={t('i18n.plugin.693009')}
            aria-label={t('i18n.plugin.693009')}
            value={entriesRaw}
            onChange={(event) => setEntriesRaw(event.target.value)}
            placeholder={t('i18n.plugin.693010')}
            rows={8}
          />
          <div className="chips-settings-panel__actions">
            <Button onClick={() => void updateDictionary()} disabled={saving}>
              {t('i18n.plugin.693011')}
            </Button>
          </div>
          {resultText ? <p className="chips-settings-card__meta">{t('i18n.plugin.693012', { result: resultText })}</p> : null}
        </div>
      </article>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { ChipsButton, ChipsInput, ChipsSelect, ChipsTextarea } from '@chips/component-library';

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

  const panelState = error ? 'error' : loading || saving ? 'loading' : 'idle';

  return (
    <section className="chips-settings-panel" data-scope="settings.panel.language" data-part="panel" data-state={panelState}>
      <header className="chips-settings-panel__header" data-part="header">
        <div data-part="header-content">
          <h2 className="chips-settings-panel__title" data-part="title">{t('i18n.plugin.693001')}</h2>
          <p className="chips-settings-panel__description" data-part="description">{t('i18n.plugin.693002')}</p>
        </div>
        <ChipsButton onClick={() => void refresh()} disabled={loading} data-part="refresh-action">
          {t('i18n.plugin.693003')}
        </ChipsButton>
      </header>

      <ErrorAlert error={error} summaryKey="i18n.plugin.692014" />

      <article className="chips-settings-card" data-part="card-locale">
        <h3 className="chips-settings-card__title" data-part="card-title">{t('i18n.plugin.693004')}</h3>
        <div className="chips-settings-card__toolbar" data-part="toolbar">
          <ChipsSelect
            value={locale}
            options={locales.map((item) => ({ value: item, label: item }))}
            onValueChange={(value) => setLocale(value ?? '')}
          />
          <ChipsButton onClick={() => void saveLocale()} disabled={saving} data-part="save-locale-action">
            {t('i18n.plugin.693005')}
          </ChipsButton>
        </div>
      </article>

      <article className="chips-settings-card" data-part="card-dictionary">
        <h3 className="chips-settings-card__title" data-part="card-title">{t('i18n.plugin.693006')}</h3>
        <div className="chips-settings-form" data-part="form">
          <ChipsInput
            label={t('i18n.plugin.693007')}
            aria-label={t('i18n.plugin.693007')}
            value={pluginId}
            onChange={(event) => setPluginId(event.target.value)}
            placeholder={t('i18n.plugin.693008')}
            data-part="plugin-id-field"
          />
          <ChipsTextarea
            label={t('i18n.plugin.693009')}
            aria-label={t('i18n.plugin.693009')}
            value={entriesRaw}
            onChange={(event) => setEntriesRaw(event.target.value)}
            placeholder={t('i18n.plugin.693010')}
            rows={8}
            data-part="entries-field"
          />
          <div className="chips-settings-panel__actions" data-part="actions">
            <ChipsButton onClick={() => void updateDictionary()} disabled={saving} data-part="update-dictionary-action">
              {t('i18n.plugin.693011')}
            </ChipsButton>
          </div>
          {resultText ? <p className="chips-settings-card__meta" data-part="meta">{t('i18n.plugin.693012', { result: resultText })}</p> : null}
        </div>
      </article>
    </section>
  );
}

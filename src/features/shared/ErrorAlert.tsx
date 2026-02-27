import type { DisplayError } from '@/utils/error';
import { useI18n } from '@/i18n';

interface ErrorAlertProps {
  error: DisplayError | null;
  summaryKey: string;
}

export function ErrorAlert({ error, summaryKey }: ErrorAlertProps) {
  const { t } = useI18n();
  if (!error) {
    return null;
  }

  const resolveDisplayText = (value: string): string => (value.startsWith('i18n.') ? t(value) : value);
  const message = resolveDisplayText(error.message);
  const rawMessage = resolveDisplayText(error.rawMessage);

  return (
    <div
      className="chips-settings-alert chips-settings-alert--error"
      data-scope="settings.alert.error"
      data-part="root"
      data-state="error"
      role="alert"
      aria-live="assertive"
    >
      <p data-part="summary">{t(summaryKey, { message })}</p>
      <p data-part="code">{t('i18n.plugin.699024', { code: error.code })}</p>
      <p data-part="raw">{t('i18n.plugin.699025', { raw: rawMessage })}</p>
    </div>
  );
}

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

  return (
    <div className="chips-settings-alert chips-settings-alert--error">
      <p>{t(summaryKey, { message: error.message })}</p>
      <p>{t('i18n.plugin.699024', { code: error.code })}</p>
      <p>{t('i18n.plugin.699025', { raw: error.rawMessage })}</p>
    </div>
  );
}

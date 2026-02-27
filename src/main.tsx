import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/App';
import { I18nContext, translate } from '@/i18n';
import { ecosystemSettingsService } from '@/services/ecosystem-settings-service';
import { runtimeGateway } from '@/services/runtime-gateway';
import './styles/index.css';

interface LanguageChangedPayload {
  locale?: string;
  language?: string;
}

export function Bootstrap() {
  const [locale, setLocale] = useState('zh-CN');
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const refreshThemeSnapshot = async (): Promise<void> => {
      await ecosystemSettingsService.refreshThemeCss().catch(() => undefined);
    };

    const syncLocale = async (): Promise<void> => {
      try {
        const nextLocale = await ecosystemSettingsService.getCurrentLocale();
        if (active) {
          setLocale(nextLocale);
        }
      } catch {
        // Ignore runtime sync fallback errors.
      }
    };

    const unsubscribeThemeChanged = runtimeGateway.theme.onChanged(() => {
      if (!active) {
        return;
      }

      void refreshThemeSnapshot();
    });

    const unsubscribeLanguageChanged = runtimeGateway.i18n.onChanged((payload: LanguageChangedPayload) => {
      if (!active) {
        return;
      }

      const nextLocale = typeof payload.locale === 'string' ? payload.locale : payload.language;
      if (typeof nextLocale === 'string' && nextLocale.length > 0) {
        setLocale(nextLocale);
        return;
      }

      void syncLocale();
    });

    const localeTask = ecosystemSettingsService
      .getCurrentLocale()
      .then((nextLocale) => {
        if (active) {
          setLocale(nextLocale);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setBootError(error instanceof Error ? error.message : String(error));
        }
      });

    const themeTask = refreshThemeSnapshot();

    Promise.allSettled([localeTask, themeTask]).finally(() => {
      if (active) {
        setReady(true);
      }
    });

    return () => {
      active = false;
      unsubscribeThemeChanged();
      unsubscribeLanguageChanged();
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      locale,
      setLocale,
      t: (key: string, params?: Record<string, string | number>) => translate(locale, key, params)
    }),
    [locale]
  );

  if (!ready) {
    return null;
  }

  if (bootError) {
    return (
      <div
        className="chips-settings-bootstrap-error"
        data-scope="settings.bootstrap"
        data-part="error"
        data-state="error"
        role="alert"
      >
        <h1 className="chips-settings-bootstrap-error__title" data-part="title">{translate('zh-CN', 'i18n.plugin.699010')}</h1>
        <p className="chips-settings-bootstrap-error__desc" data-part="description">{translate('zh-CN', 'i18n.plugin.699011')}</p>
        <pre className="chips-settings-bootstrap-error__reason" data-part="reason">{bootError}</pre>
      </div>
    );
  }

  return (
    <I18nContext.Provider value={contextValue}>
      <App onLocaleCommitted={setLocale} />
    </I18nContext.Provider>
  );
}

const rootNode = document.querySelector('#app');
if (rootNode) {
  createRoot(rootNode).render(
    <StrictMode>
      <Bootstrap />
    </StrictMode>
  );
}

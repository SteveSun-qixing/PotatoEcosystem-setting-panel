import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/App';
import { I18nContext, translate } from '@/i18n';
import { ecosystemSettingsService } from '@/services/ecosystem-settings-service';
import './styles/index.css';

function Bootstrap() {
  const [locale, setLocale] = useState('zh-CN');
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
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

    const themeTask = ecosystemSettingsService.refreshThemeCss().catch(() => undefined);

    Promise.allSettled([localeTask, themeTask]).finally(() => {
      if (active) {
        setReady(true);
      }
    });

    return () => {
      active = false;
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
      <div className="chips-settings-bootstrap-error">
        <h1 className="chips-settings-bootstrap-error__title">{translate('zh-CN', 'i18n.plugin.699010')}</h1>
        <p className="chips-settings-bootstrap-error__desc">{translate('zh-CN', 'i18n.plugin.699011')}</p>
        <pre className="chips-settings-bootstrap-error__reason">{bootError}</pre>
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

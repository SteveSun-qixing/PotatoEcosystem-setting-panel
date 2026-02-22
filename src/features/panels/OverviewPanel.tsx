import { useEffect, useState } from 'react';
import { Button, Input } from '@chips/component-library';

import { ecosystemSettingsService } from '@/services/ecosystem-settings-service';
import type { RuntimeHealthSnapshot, RuntimeLogQueryResult, RuntimeOverview } from '@/types';
import { useI18n } from '@/i18n';
import { toDisplayError, type DisplayError } from '@/utils/error';
import { ErrorAlert } from '@/features/shared/ErrorAlert';

export function OverviewPanel() {
  const { t } = useI18n();
  const [snapshot, setSnapshot] = useState<RuntimeOverview | null>(null);
  const [health, setHealth] = useState<RuntimeHealthSnapshot | null>(null);
  const [logs, setLogs] = useState<RuntimeLogQueryResult | null>(null);
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [changingState, setChangingState] = useState(false);
  const [error, setError] = useState<DisplayError | null>(null);
  const [restartReason, setRestartReason] = useState('');
  const [logQuery, setLogQuery] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const refresh = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [nextSnapshot, nextHealth] = await Promise.all([
        ecosystemSettingsService.getRuntimeOverview(),
        ecosystemSettingsService.getRuntimeHealth()
      ]);
      setSnapshot(nextSnapshot);
      setHealth(nextHealth);
      setLastUpdatedAt(Date.now());
    } catch (reason: unknown) {
      setError(toDisplayError(reason));
    } finally {
      setLoading(false);
    }
  };

  const queryLogs = async (): Promise<void> => {
    try {
      const nextLogs = await ecosystemSettingsService.queryRuntimeLogs({
        level: 'error',
        query: logQuery,
        limit: 80
      });
      setLogs(nextLogs);
    } catch (reason: unknown) {
      setError(toDisplayError(reason));
    }
  };

  const restartHost = async (): Promise<void> => {
    setChangingState(true);
    setError(null);
    try {
      await ecosystemSettingsService.restartHost(restartReason);
      await refresh();
    } catch (reason: unknown) {
      setError(toDisplayError(reason));
    } finally {
      setChangingState(false);
    }
  };

  const startHost = async (): Promise<void> => {
    setChangingState(true);
    setError(null);
    try {
      await ecosystemSettingsService.startHost();
      await refresh();
    } catch (reason: unknown) {
      setError(toDisplayError(reason));
    } finally {
      setChangingState(false);
    }
  };

  const stopHost = async (): Promise<void> => {
    setChangingState(true);
    setError(null);
    try {
      await ecosystemSettingsService.stopHost();
      await refresh();
    } catch (reason: unknown) {
      setError(toDisplayError(reason));
    } finally {
      setChangingState(false);
    }
  };

  const exportReport = async (): Promise<void> => {
    try {
      const nextReport = await ecosystemSettingsService.exportRuntimeReport();
      setReport(nextReport);
    } catch (reason: unknown) {
      setError(toDisplayError(reason));
    }
  };

  useEffect(() => {
    void refresh();
    void queryLogs();
  }, []);

  return (
    <section className="chips-settings-panel">
      <header className="chips-settings-panel__header">
        <div>
          <h2 className="chips-settings-panel__title">{t('i18n.plugin.690001')}</h2>
          <p className="chips-settings-panel__description">{t('i18n.plugin.690002')}</p>
        </div>
        <Button onClick={() => void refresh()} disabled={loading}>
          {t('i18n.plugin.690003')}
        </Button>
      </header>

      <ErrorAlert error={error} summaryKey="i18n.plugin.690004" />

      <div className="chips-settings-grid">
        <article className="chips-settings-card">
          <h3 className="chips-settings-card__title">{t('i18n.plugin.690005')}</h3>
          <dl className="chips-settings-card__list">
            <div className="chips-settings-card__item">
              <dt>{t('i18n.plugin.690006')}</dt>
              <dd>{snapshot?.hostVersion ?? '-'}</dd>
            </div>
            <div className="chips-settings-card__item">
              <dt>{t('i18n.plugin.690007')}</dt>
              <dd>{snapshot?.hostPid ?? '-'}</dd>
            </div>
            <div className="chips-settings-card__item">
              <dt>{t('i18n.plugin.690008')}</dt>
              <dd>{snapshot?.platform ?? '-'}</dd>
            </div>
            <div className="chips-settings-card__item">
              <dt>{t('i18n.plugin.690009')}</dt>
              <dd>{snapshot?.nodeVersion ?? '-'}</dd>
            </div>
          </dl>
        </article>

        <article className="chips-settings-card">
          <h3 className="chips-settings-card__title">{t('i18n.plugin.690010')}</h3>
          <dl className="chips-settings-card__list">
            <div className="chips-settings-card__item">
              <dt>{t('i18n.plugin.690011')}</dt>
              <dd>{snapshot?.routeCount ?? '-'}</dd>
            </div>
            <div className="chips-settings-card__item">
              <dt>{t('i18n.plugin.690012')}</dt>
              <dd>{snapshot?.namespaceCount ?? '-'}</dd>
            </div>
            <div className="chips-settings-card__item">
              <dt>{t('i18n.plugin.690013')}</dt>
              <dd>{snapshot?.p95LatencyMs ?? '-'}</dd>
            </div>
            <div className="chips-settings-card__item">
              <dt>{t('i18n.plugin.690014')}</dt>
              <dd>{snapshot?.errorCount ?? '-'}</dd>
            </div>
          </dl>
        </article>

        <article className="chips-settings-card chips-settings-card--full">
          <h3 className="chips-settings-card__title">{t('i18n.plugin.690015')}</h3>
          <p className="chips-settings-card__meta">
            {t('i18n.plugin.690016', {
              time: lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleString() : t('i18n.plugin.690017')
            })}
          </p>
          <div className="chips-settings-card__toolbar">
            <Input
              aria-label={t('i18n.plugin.690021')}
              value={restartReason}
              onChange={(event) => setRestartReason(event.target.value)}
              placeholder={t('i18n.plugin.690021')}
            />
            <Button onClick={() => void startHost()} disabled={changingState}>
              {t('i18n.plugin.690023')}
            </Button>
            <Button onClick={() => void stopHost()} disabled={changingState}>
              {t('i18n.plugin.690024')}
            </Button>
          </div>
          <div className="chips-settings-panel__actions">
            <Button onClick={() => void restartHost()} disabled={changingState}>
              {t('i18n.plugin.690022')}
            </Button>
          </div>
        </article>
      </div>

      <article className="chips-settings-card">
        <h3 className="chips-settings-card__title">{t('i18n.plugin.690025')}</h3>
        {health?.checks.length ? (
          <ul className="chips-settings-list">
            {health.checks.map((check) => (
              <li className="chips-settings-list__item" key={check.id}>
                <strong>{check.id}</strong>
                <span className={`chips-settings-status ${check.healthy ? 'chips-settings-status--ok' : 'chips-settings-status--error'}`}>
                  {check.healthy ? t('i18n.plugin.690026') : t('i18n.plugin.690027')}
                </span>
                <span className="chips-settings-list__message">{check.message}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="chips-settings-card__meta">{t('i18n.plugin.690028')}</p>
        )}
      </article>

      <article className="chips-settings-card">
        <h3 className="chips-settings-card__title">{t('i18n.plugin.690029')}</h3>
        <div className="chips-settings-card__toolbar">
          <Input
            aria-label={t('i18n.plugin.690030')}
            value={logQuery}
            onChange={(event) => setLogQuery(event.target.value)}
            placeholder={t('i18n.plugin.690030')}
          />
          <Button onClick={() => void queryLogs()}>{t('i18n.plugin.690031')}</Button>
          <Button onClick={() => void exportReport()}>{t('i18n.plugin.690032')}</Button>
        </div>
        {logs?.logs.length ? (
          <div className="chips-settings-log">
            <pre>{JSON.stringify(logs.logs, null, 2)}</pre>
          </div>
        ) : (
          <p className="chips-settings-card__meta">{t('i18n.plugin.690033')}</p>
        )}
        {report ? (
          <details className="chips-settings-details">
            <summary>{t('i18n.plugin.690034')}</summary>
            <pre>{JSON.stringify(report, null, 2)}</pre>
          </details>
        ) : null}
      </article>
    </section>
  );
}

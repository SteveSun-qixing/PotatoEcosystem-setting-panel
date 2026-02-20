import { useMemo, useState } from 'react';
import { Button } from '@chips/component-library';

import { useI18n } from '@/i18n';
import { BundlePanel } from '@/features/panels/BundlePanel';
import { FileSystemPanel } from '@/features/panels/FileSystemPanel';
import { LanguagePanel } from '@/features/panels/LanguagePanel';
import { OverviewPanel } from '@/features/panels/OverviewPanel';
import { PluginPanel } from '@/features/panels/PluginPanel';
import { ThemePanel } from '@/features/panels/ThemePanel';

type SectionId = 'runtime' | 'language' | 'theme' | 'plugins' | 'bundle' | 'filesystem';

interface AppProps {
  onLocaleCommitted: (locale: string) => void;
}

export function App({ onLocaleCommitted }: AppProps) {
  const { t } = useI18n();
  const [activeSection, setActiveSection] = useState<SectionId>('runtime');

  const menuItems = useMemo<Array<{ id: SectionId; label: string; desc: string }>>(
    () => [
      {
        id: 'runtime',
        label: t('i18n.plugin.699012'),
        desc: t('i18n.plugin.699013')
      },
      {
        id: 'language',
        label: t('i18n.plugin.699014'),
        desc: t('i18n.plugin.699015')
      },
      {
        id: 'theme',
        label: t('i18n.plugin.699016'),
        desc: t('i18n.plugin.699017')
      },
      {
        id: 'plugins',
        label: t('i18n.plugin.699018'),
        desc: t('i18n.plugin.699019')
      },
      {
        id: 'bundle',
        label: t('i18n.plugin.699020'),
        desc: t('i18n.plugin.699021')
      },
      {
        id: 'filesystem',
        label: t('i18n.plugin.699022'),
        desc: t('i18n.plugin.699023')
      }
    ],
    [t]
  );

  return (
    <div className="chips-settings-shell">
      <aside className="chips-settings-shell__sidebar">
        <header className="chips-settings-shell__header">
          <h1 className="chips-settings-shell__title">{t('i18n.plugin.699007')}</h1>
          <p className="chips-settings-shell__subtitle">{t('i18n.plugin.699008')}</p>
        </header>
        <nav className="chips-settings-shell__menu" aria-label={t('i18n.plugin.699009')}>
          {menuItems.map((item) => (
            <Button
              key={item.id}
              className={`chips-settings-shell__menu-item ${activeSection === item.id ? 'chips-settings-shell__menu-item--active' : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="chips-settings-shell__menu-label">{item.label}</span>
              <span className="chips-settings-shell__menu-desc">{item.desc}</span>
            </Button>
          ))}
        </nav>
      </aside>
      <main className="chips-settings-shell__main">
        {activeSection === 'runtime' ? <OverviewPanel /> : null}
        {activeSection === 'language' ? <LanguagePanel onLocaleCommitted={onLocaleCommitted} /> : null}
        {activeSection === 'theme' ? <ThemePanel /> : null}
        {activeSection === 'plugins' ? <PluginPanel /> : null}
        {activeSection === 'bundle' ? <BundlePanel /> : null}
        {activeSection === 'filesystem' ? <FileSystemPanel /> : null}
      </main>
    </div>
  );
}

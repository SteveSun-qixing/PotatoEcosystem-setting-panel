import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = join(__dirname, '..', '..');

const panelFiles = [
  'src/App.tsx',
  'src/features/panels/OverviewPanel.tsx',
  'src/features/panels/LanguagePanel.tsx',
  'src/features/panels/ThemePanel.tsx',
  'src/features/panels/PluginPanel.tsx',
  'src/features/panels/BundlePanel.tsx',
  'src/features/panels/FileSystemPanel.tsx',
  'src/features/shared/ErrorAlert.tsx',
  'src/main.tsx',
] as const;

const scopeExpectations: Array<{ file: string; scope: string }> = [
  { file: 'src/App.tsx', scope: 'settings.shell' },
  { file: 'src/features/panels/OverviewPanel.tsx', scope: 'settings.panel.overview' },
  { file: 'src/features/panels/LanguagePanel.tsx', scope: 'settings.panel.language' },
  { file: 'src/features/panels/ThemePanel.tsx', scope: 'settings.panel.theme' },
  { file: 'src/features/panels/PluginPanel.tsx', scope: 'settings.panel.plugin' },
  { file: 'src/features/panels/BundlePanel.tsx', scope: 'settings.panel.bundle' },
  { file: 'src/features/panels/FileSystemPanel.tsx', scope: 'settings.panel.filesystem' },
  { file: 'src/features/shared/ErrorAlert.tsx', scope: 'settings.alert.error' },
  { file: 'src/main.tsx', scope: 'settings.bootstrap' },
];

const legacyComponentNames = ['Button', 'Input', 'Select', 'Textarea', 'Switch', 'Dialog'];

function readProjectFile(file: string): string {
  return readFileSync(join(projectRoot, file), 'utf8');
}

describe('settings component contract baseline', () => {
  it('uses Chips* exports from @chips/component-library only', () => {
    const offenders: string[] = [];

    for (const file of panelFiles) {
      const content = readProjectFile(file);
      const importMatches = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]@chips\/component-library['"]/g) ?? [];

      for (const importMatch of importMatches) {
        const names = importMatch
          .replace(/^[^{]*\{/, '')
          .replace(/\}[^}]*$/, '')
          .split(',')
          .map((name) => name.trim())
          .filter((name) => name.length > 0);

        const invalid = names.filter((name) => legacyComponentNames.includes(name));
        if (invalid.length > 0) {
          offenders.push(`${file}:${invalid.join(',')}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('keeps required data-scope/data-part contracts on settings main path', () => {
    const missingScopes: string[] = [];
    const missingParts: string[] = [];

    for (const item of scopeExpectations) {
      const content = readProjectFile(item.file);
      if (!content.includes(`data-scope=\"${item.scope}\"`)) {
        missingScopes.push(`${item.file}:${item.scope}`);
      }
    }

    for (const file of panelFiles) {
      const content = readProjectFile(file);
      if (!content.includes('data-part=')) {
        missingParts.push(file);
      }
    }

    expect(missingScopes).toEqual([]);
    expect(missingParts).toEqual([]);
  });
});

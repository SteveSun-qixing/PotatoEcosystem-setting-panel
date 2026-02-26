import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

const sourceRoot = join(__dirname, '..', '..', 'src');

function collectFiles(root: string): string[] {
  const entries = readdirSync(root);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(root, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      if (entry === 'archive') {
        continue;
      }
      files.push(...collectFiles(fullPath));
      continue;
    }

    if (!fullPath.endsWith('.ts') && !fullPath.endsWith('.tsx') && !fullPath.endsWith('.d.ts')) {
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

describe('settings bridge static baseline', () => {
  it('has no direct bridge invoke on main path', () => {
    const files = collectFiles(sourceRoot);
    const offenders = files.filter((filePath) => /window\.chips\.invoke\(/.test(readFileSync(filePath, 'utf8')));

    expect(offenders.map((filePath) => relative(sourceRoot, filePath))).toEqual([]);
  });

  it('has no legacy action literals on main path', () => {
    const files = collectFiles(sourceRoot);
    const identifierPattern = /\binvokeFirstSuccessful\b/;
    const actionLiteralPattern = /['"`](getCurrentLanguage|setLanguage|setLocale|getCurrentTheme|getCSS)['"`]/;

    const offenders = files.filter((filePath) => {
      const content = readFileSync(filePath, 'utf8');
      return identifierPattern.test(content) || actionLiteralPattern.test(content);
    });

    expect(offenders.map((filePath) => relative(sourceRoot, filePath))).toEqual([]);
  });
});

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

const sourceRoot = join(__dirname, '..', '..', 'src');
const allowedLegacyRoot = join(sourceRoot, 'archive');

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

    if (!fullPath.endsWith('.ts') && !fullPath.endsWith('.tsx') && !fullPath.endsWith('.d.ts') && !fullPath.endsWith('.vue')) {
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

describe('settings bridge static baseline', () => {
  it('keeps only react entry on main path', () => {
    expect(existsSync(join(sourceRoot, 'main.tsx'))).toBe(true);
    expect(existsSync(join(sourceRoot, 'main.ts'))).toBe(false);
  });

  it('has no active vue source outside archive', () => {
    const files = collectFiles(sourceRoot);
    const offenders = files.filter((filePath) => filePath.endsWith('.vue') && !filePath.startsWith(allowedLegacyRoot));

    expect(offenders.map((filePath) => relative(sourceRoot, filePath))).toEqual([]);
  });

  it('has no direct bridge invoke on main path', () => {
    const files = collectFiles(sourceRoot);
    const offenders = files.filter((filePath) => /window\.chips[!?]?\.invoke\(/.test(readFileSync(filePath, 'utf8')));

    expect(offenders.map((filePath) => relative(sourceRoot, filePath))).toEqual([]);
  });

  it('has no archive imports on main path', () => {
    const files = collectFiles(sourceRoot);
    const importPattern = /from\s+['"](?:@\/)?archive\/|from\s+['"](?:@\/)?src\/archive\/|from\s+['"]\.\.\/archive\/|from\s+['"]\.\.\/\.\.\/archive\//;
    const dynamicImportPattern = /import\(\s*['"](?:@\/)?archive\/|import\(\s*['"](?:@\/)?src\/archive\/|import\(\s*['"]\.\.\/archive\/|import\(\s*['"]\.\.\/\.\.\/archive\//;
    const offenders = files.filter((filePath) => {
      const content = readFileSync(filePath, 'utf8');
      return importPattern.test(content) || dynamicImportPattern.test(content);
    });

    expect(offenders.map((filePath) => relative(sourceRoot, filePath))).toEqual([]);
  });

  it('keeps archive traceability docs', () => {
    const requiredDocs = [
      'archive/README.md',
      'archive/legacy-vue/README.md',
      'archive/legacy-bridge/README.md',
      'archive/legacy-utils/README.md',
      'archive/legacy-docs/README.md',
    ];

    const missing = requiredDocs.filter((docPath) => !existsSync(join(sourceRoot, docPath)));
    expect(missing).toEqual([]);
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

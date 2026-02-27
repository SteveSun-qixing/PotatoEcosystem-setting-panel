import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = join(__dirname, '..', '..');
const sourceRoot = join(projectRoot, 'src');

const includeExtensions = ['.ts', '.tsx'];
const ignoreDirs = new Set(['archive', 'locales']);

const allowlist = new Set([
  'I18n context is not initialized.',
  'chips-official.ecosystem-settings',
]);

function collectSourceFiles(root: string): string[] {
  const entries = readdirSync(root);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(root, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      if (ignoreDirs.has(entry)) {
        continue;
      }
      files.push(...collectSourceFiles(fullPath));
      continue;
    }

    if (!includeExtensions.some((extension) => fullPath.endsWith(extension))) {
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

function isLikelyUserFacingCopy(value: string): boolean {
  const text = value.trim();
  if (text.length === 0 || allowlist.has(text)) {
    return false;
  }

  if (text.startsWith('i18n.')) {
    return false;
  }

  if (/^[a-z0-9_.:/@-]+$/i.test(text)) {
    return false;
  }

  if (/^[A-Z0-9_]+$/.test(text)) {
    return false;
  }

  if (/^[a-z0-9_-]+(?:\s+[a-z0-9_-]+)*$/.test(text)) {
    return false;
  }

  if (/([\u3040-\u30ff\u3400-\u9fff])/.test(text)) {
    return true;
  }

  const words = text.match(/[A-Za-z]{2,}/g) ?? [];
  if (words.length >= 3 && /\s/.test(text)) {
    return true;
  }

  return false;
}

function extractStringLiterals(content: string): string[] {
  const literals: string[] = [];
  const pattern = /(['"])((?:\\.|(?!\1).)*)\1/g;
  let match: RegExpExecArray | null = pattern.exec(content);

  while (match) {
    literals.push(match[2]);
    match = pattern.exec(content);
  }

  return literals;
}

describe('settings i18n hardcode baseline', () => {
  it('keeps main path free of hardcoded user-facing copy', () => {
    const offenders: string[] = [];
    const files = collectSourceFiles(sourceRoot);

    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      const literals = extractStringLiterals(content);

      for (const literal of literals) {
        if (!isLikelyUserFacingCopy(literal)) {
          continue;
        }

        offenders.push(`${relative(sourceRoot, file)}:${literal}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});

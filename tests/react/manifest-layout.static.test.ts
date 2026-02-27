import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = join(__dirname, '..', '..');
const manifestPath = join(projectRoot, 'manifest.yaml');

function extractValue(content: string, key: string): string | null {
  const pattern = new RegExp(`^\\s*${key}:\\s*(.+)$`, 'm');
  const match = content.match(pattern);
  if (!match) {
    return null;
  }
  return match[1].trim().replace(/^"|"$/g, '');
}

describe('settings manifest layout contract baseline', () => {
  it('declares page layout with cpx + baseWidth 1024', () => {
    const manifestRaw = readFileSync(manifestPath, 'utf8');
    expect(extractValue(manifestRaw, 'owner')).toBe('page');
    expect(extractValue(manifestRaw, 'unit')).toBe('cpx');
    expect(extractValue(manifestRaw, 'baseWidth')).toBe('1024');
    expect(extractValue(manifestRaw, 'contract')).toBe('./contracts/page-layout.contract.json');
    expect(extractValue(manifestRaw, 'minFunctionalSet')).toBe('./contracts/min-functional-set.json');
  });

  it('references existing layout contract files', () => {
    const manifestRaw = readFileSync(manifestPath, 'utf8');
    const contract = extractValue(manifestRaw, 'contract');
    const minFunctionalSet = extractValue(manifestRaw, 'minFunctionalSet');

    const contractPath = contract ? join(projectRoot, contract.replace(/^\.\//, '')) : '';
    const minFunctionalSetPath = minFunctionalSet ? join(projectRoot, minFunctionalSet.replace(/^\.\//, '')) : '';

    expect(contractPath).not.toBe('');
    expect(minFunctionalSetPath).not.toBe('');
    expect(existsSync(contractPath)).toBe(true);
    expect(existsSync(minFunctionalSetPath)).toBe(true);
  });
});

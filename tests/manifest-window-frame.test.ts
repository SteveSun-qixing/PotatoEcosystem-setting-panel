import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('manifest window config', () => {
  it('uses native window frame', () => {
    const manifestPath = resolve(__dirname, '../manifest.yaml');
    const content = readFileSync(manifestPath, 'utf8');

    expect(content).toMatch(/window:\s*[\s\S]*?\n\s*frame:\s*true\b/);
    expect(content).not.toMatch(/\n\s*frame:\s*false\b/);
  });
});

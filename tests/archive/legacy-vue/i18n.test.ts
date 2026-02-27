import { describe, expect, it } from 'vitest';

import { zhCN } from '@/locales/zh-CN';
import { enUS } from '@/locales/en-US';
import { jaJP } from '@/locales/ja-JP';

function collectKeys(node: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(node).flatMap(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      return [nextKey];
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return collectKeys(value as Record<string, unknown>, nextKey);
    }

    return [];
  });
}

describe('locale consistency', () => {
  it('keeps locale key sets aligned', () => {
    const zhKeys = collectKeys(zhCN as unknown as Record<string, unknown>).sort();
    const enKeys = collectKeys(enUS as unknown as Record<string, unknown>).sort();
    const jaKeys = collectKeys(jaJP as unknown as Record<string, unknown>).sort();

    expect(enKeys).toEqual(zhKeys);
    expect(jaKeys).toEqual(zhKeys);
  });
});

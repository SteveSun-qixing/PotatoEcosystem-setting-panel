import { describe, expect, it } from 'vitest';

import { enUS } from '@/locales/en-US';
import { jaJP } from '@/locales/ja-JP';
import { zhCN } from '@/locales/zh-CN';

const installKeys = ['699024', '699025', '699026', '699027', '691004', '694006', '691007', '694009'] as const;

describe('install i18n keys', () => {
  it('provides install-related copy in zh/en/ja locales', () => {
    for (const key of installKeys) {
      expect(zhCN.i18n.plugin[key]).toBeTypeOf('string');
      expect(enUS.i18n.plugin[key]).toBeTypeOf('string');
      expect(jaJP.i18n.plugin[key]).toBeTypeOf('string');
      expect(zhCN.i18n.plugin[key].length).toBeGreaterThan(0);
      expect(enUS.i18n.plugin[key].length).toBeGreaterThan(0);
      expect(jaJP.i18n.plugin[key].length).toBeGreaterThan(0);
    }
  });
});

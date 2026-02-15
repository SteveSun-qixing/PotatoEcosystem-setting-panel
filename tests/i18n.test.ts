import { describe, it, expect, beforeEach } from 'vitest';
import { ChipsSDK } from '@chips/sdk';

describe('I18n Integration', () => {
  let sdk: ChipsSDK;

  beforeEach(() => {
    sdk = new ChipsSDK({ autoConnect: false });
  });

  it('should translate text using SDK', () => {
    const key = 'test.key';
    const result = sdk.t(key);

    expect(typeof result).toBe('string');
  });

  it('should handle translation with parameters', () => {
    const key = 'test.key';
    const params = { count: 5 };
    const result = sdk.t(key, params);

    expect(typeof result).toBe('string');
  });

  it('should get current locale', () => {
    const locale = sdk.i18n.locale;
    expect(typeof locale).toBe('string');
  });
});

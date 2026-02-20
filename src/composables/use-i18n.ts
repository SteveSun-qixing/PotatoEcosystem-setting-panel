import { inject, onBeforeUnmount, onMounted, ref } from 'vue';

import type { ChipsSDK } from '@chips/sdk';

export function useI18n(): {
  t: (key: string, params?: Record<string, string | number>) => string;
  setLocale: (locale: string) => void;
} {
  const sdk = inject<ChipsSDK>('sdk');

  if (!sdk) {
    throw new Error('SDK not provided');
  }

  const localeTick = ref(0);
  const handleLocaleChange = (): void => {
    localeTick.value += 1;
  };

  onMounted(() => {
    if (sdk.i18n && typeof sdk.i18n.onLocaleChange === 'function') {
      sdk.i18n.onLocaleChange(handleLocaleChange);
    }
  });

  onBeforeUnmount(() => {
    if (sdk.i18n && typeof sdk.i18n.offLocaleChange === 'function') {
      sdk.i18n.offLocaleChange(handleLocaleChange);
    }
  });

  const t = (key: string, params?: Record<string, string | number>): string => {
    void localeTick.value;
    try {
      return sdk.t(key, params);
    } catch {
      return key;
    }
  };

  const setLocale = (locale: string): void => {
    sdk.setLocale(locale);
  };

  return {
    t,
    setLocale
  };
}

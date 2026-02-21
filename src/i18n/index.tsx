import { createContext, useContext } from 'react';

import { enUS } from '@/locales/en-US';
import { jaJP } from '@/locales/ja-JP';
import { zhCN } from '@/locales/zh-CN';

type SupportedLocale = 'zh-CN' | 'en-US' | 'ja-JP';

const dictionaries: Record<SupportedLocale, Record<string, unknown>> = {
  'zh-CN': zhCN as unknown as Record<string, unknown>,
  'en-US': enUS as unknown as Record<string, unknown>,
  'ja-JP': jaJP as unknown as Record<string, unknown>
};

const readValueByPath = (source: Record<string, unknown>, key: string): string | null => {
  const segments = key.split('.');
  let cursor: unknown = source;

  for (const segment of segments) {
    if (typeof cursor !== 'object' || cursor === null || Array.isArray(cursor)) {
      return null;
    }
    cursor = (cursor as Record<string, unknown>)[segment];
  }

  return typeof cursor === 'string' ? cursor : null;
};

const injectParams = (template: string, params?: Record<string, string | number>): string => {
  if (!params) {
    return template;
  }

  return Object.entries(params).reduce(
    (result, [key, value]) => result.split(`{${key}}`).join(String(value)),
    template
  );
};

export const translate = (
  locale: string,
  key: string,
  params?: Record<string, string | number>
): string => {
  const normalized = (locale in dictionaries ? locale : 'zh-CN') as SupportedLocale;
  const template = readValueByPath(dictionaries[normalized], key) ?? readValueByPath(dictionaries['zh-CN'], key) ?? key;
  return injectParams(template, params);
};

export interface I18nContextValue {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export const useI18n = (): I18nContextValue => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('I18n context is not initialized.');
  }
  return context;
};

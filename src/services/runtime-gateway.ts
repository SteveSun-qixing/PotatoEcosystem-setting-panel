import {
  RuntimeClient,
  useConfigHook,
  useFile,
  useI18nHook,
  useThemeHook,
  type RuntimeInvokeOptions
} from '@chips/sdk';

const runtimeClient = new RuntimeClient();

const i18n = useI18nHook({ runtimeClient });
const theme = useThemeHook({ runtimeClient });
const file = useFile({ runtimeClient });
const config = useConfigHook({ runtimeClient });

async function invoke<T = unknown>(
  namespace: string,
  action: string,
  params?: unknown,
  options?: RuntimeInvokeOptions
): Promise<T> {
  return runtimeClient.invoke<T>(namespace, action, params, options);
}

async function getConfigValue<T = unknown>(key: string, fallback?: T): Promise<T> {
  const response = await invoke<{ value?: T }>('config', 'get', {
    key,
    ...(fallback === undefined ? {} : { fallback })
  });

  if (response && Object.prototype.hasOwnProperty.call(response, 'value')) {
    return response.value as T;
  }

  return fallback as T;
}

async function setConfigValue(
  key: string,
  value: unknown,
  scope: 'user' | 'app' | 'plugin' | 'runtime' = 'user'
): Promise<void> {
  await invoke('config', 'set', { key, value, scope });
}

export const runtimeGateway = {
  runtimeClient,
  i18n,
  theme,
  file,
  config,
  invoke,
  getConfigValue,
  setConfigValue
};

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { runtimeGateway } = vi.hoisted(() => ({
  runtimeGateway: {
    runtimeClient: {},
    invoke: vi.fn(),
    getConfigValue: vi.fn(),
    setConfigValue: vi.fn(),
    i18n: {
      list: vi.fn(),
      getCurrent: vi.fn(),
      setCurrent: vi.fn(),
      registerVocabulary: vi.fn()
    },
    theme: {
      getCurrent: vi.fn(),
      getAllCss: vi.fn(),
      apply: vi.fn()
    },
    file: {
      read: vi.fn(),
      write: vi.fn(),
      stat: vi.fn(),
      list: vi.fn(),
      onChanged: vi.fn()
    },
    config: {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
      onUpdated: vi.fn()
    }
  }
}));

vi.mock('@/services/runtime-gateway', () => ({
  runtimeGateway
}));

import { EcosystemSettingsService } from '@/services/ecosystem-settings-service';

describe('EcosystemSettingsService i18n canonical routes', () => {
  let service: EcosystemSettingsService;

  beforeEach(() => {
    service = new EcosystemSettingsService();

    runtimeGateway.invoke.mockReset();
    runtimeGateway.invoke.mockResolvedValue({});

    runtimeGateway.getConfigValue.mockReset();
    runtimeGateway.getConfigValue.mockImplementation(async (_key: string, fallback: unknown) => fallback);

    runtimeGateway.setConfigValue.mockReset();
    runtimeGateway.setConfigValue.mockResolvedValue(undefined);

    runtimeGateway.i18n.list.mockReset();
    runtimeGateway.i18n.list.mockResolvedValue({ locales: ['zh-CN', 'en-US'] });

    runtimeGateway.i18n.getCurrent.mockReset();
    runtimeGateway.i18n.getCurrent.mockResolvedValue({ locale: 'zh-CN' });

    runtimeGateway.i18n.setCurrent.mockReset();
    runtimeGateway.i18n.setCurrent.mockResolvedValue({ changed: true });

    runtimeGateway.i18n.registerVocabulary.mockReset();
    runtimeGateway.i18n.registerVocabulary.mockResolvedValue({ registered: 0 });
  });

  it('uses i18n.getCurrent to read current locale', async () => {
    runtimeGateway.i18n.getCurrent.mockResolvedValueOnce({ locale: 'ja-JP' });

    const locale = await service.getCurrentLocale();

    expect(locale).toBe('ja-JP');
    expect(runtimeGateway.i18n.getCurrent).toHaveBeenCalledTimes(1);
  });

  it('uses i18n.setCurrent to update current locale', async () => {
    await service.setCurrentLocale('en-US');

    expect(runtimeGateway.i18n.setCurrent).toHaveBeenCalledWith('en-US', {
      persist: true
    });
  });

  it('uses i18n.registerVocabulary to update dictionary', async () => {
    runtimeGateway.i18n.registerVocabulary.mockResolvedValueOnce({ registered: 2 });

    const result = await service.updateDictionary(
      {
        'i18n.plugin.600100': {
          'zh-CN': '你好',
          'en-US': 'hello'
        }
      },
      'chips.settings.manual'
    );

    expect(result).toEqual({
      updated: true,
      registered: 2
    });

    expect(runtimeGateway.i18n.registerVocabulary).toHaveBeenCalledWith({
      pluginId: 'chips.settings.manual',
      entries: {
        'i18n.plugin.600100': {
          'zh-CN': '你好',
          'en-US': 'hello'
        }
      }
    });
  });

  it('does not invoke i18n gateway when dictionary entries are empty', async () => {
    const result = await service.updateDictionary(undefined, 'chips.settings.manual');

    expect(result).toEqual({
      updated: false,
      registered: 0
    });
    expect(runtimeGateway.i18n.registerVocabulary).not.toHaveBeenCalled();
  });

  it('persists locale via i18n.setCurrent during saveGeneralSettings', async () => {
    await service.saveGeneralSettings({
      locale: 'fr-FR',
      themeId: 'chips-official.default-theme',
      workspacePath: '/tmp/workspace',
      autoStart: true,
      allowExternalLinks: false
    });

    expect(runtimeGateway.i18n.setCurrent).toHaveBeenCalledWith('fr-FR', {
      persist: true
    });

    const i18nInvokeCalls = runtimeGateway.invoke.mock.calls.filter(
      ([namespace]) => namespace === 'i18n'
    );
    expect(i18nInvokeCalls).toEqual([]);
  });
});

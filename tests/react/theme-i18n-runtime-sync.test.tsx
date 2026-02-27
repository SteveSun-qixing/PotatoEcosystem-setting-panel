import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nContext } from '@/i18n';

const { runtimeGateway, themeUnsubscribe, languageUnsubscribe, handlers } = vi.hoisted(() => {
  const runtimeHandlers: {
    theme: ((payload: { themeId?: string }) => void) | null;
    language: ((payload: { locale?: string; language?: string }) => void) | null;
  } = {
    theme: null,
    language: null,
  };

  const themeOff = vi.fn();
  const languageOff = vi.fn();

  return {
    handlers: runtimeHandlers,
    themeUnsubscribe: themeOff,
    languageUnsubscribe: languageOff,
    runtimeGateway: {
      theme: {
        onChanged: vi.fn((callback: (payload: { themeId?: string }) => void) => {
          runtimeHandlers.theme = callback;
          return themeOff;
        }),
      },
      i18n: {
        onChanged: vi.fn((callback: (payload: { locale?: string; language?: string }) => void) => {
          runtimeHandlers.language = callback;
          return languageOff;
        }),
      },
    },
  };
});

const { ecosystemSettingsService } = vi.hoisted(() => ({
  ecosystemSettingsService: {
    getCurrentLocale: vi.fn(),
    refreshThemeCss: vi.fn(),
  },
}));

vi.mock('@/services/runtime-gateway', () => ({
  runtimeGateway,
}));

vi.mock('@/services/ecosystem-settings-service', () => ({
  ecosystemSettingsService,
}));

vi.mock('@/App', () => ({
  App: ({ onLocaleCommitted }: { onLocaleCommitted: (locale: string) => void }) => {
    const context = React.useContext(I18nContext);
    return (
      <div>
        <p data-testid="locale-value">{context?.locale ?? 'missing'}</p>
        <button data-testid="locale-commit" type="button" onClick={() => onLocaleCommitted('en-US')}>
          commit
        </button>
      </div>
    );
  },
}));

import { Bootstrap } from '@/main';

describe('settings runtime theme/i18n sync', () => {
  beforeEach(() => {
    handlers.theme = null;
    handlers.language = null;

    themeUnsubscribe.mockReset();
    languageUnsubscribe.mockReset();

    runtimeGateway.theme.onChanged.mockClear();
    runtimeGateway.i18n.onChanged.mockClear();

    ecosystemSettingsService.getCurrentLocale.mockReset();
    ecosystemSettingsService.getCurrentLocale.mockResolvedValue('zh-CN');

    ecosystemSettingsService.refreshThemeCss.mockReset();
    ecosystemSettingsService.refreshThemeCss.mockResolvedValue({});
  });

  it('subscribes theme.changed and language.changed and syncs UI state', async () => {
    render(<Bootstrap />);

    await waitFor(() => {
      expect(screen.getByTestId('locale-value')).toHaveTextContent('zh-CN');
    });

    expect(runtimeGateway.theme.onChanged).toHaveBeenCalledTimes(1);
    expect(runtimeGateway.i18n.onChanged).toHaveBeenCalledTimes(1);

    act(() => {
      handlers.theme?.({ themeId: 'chips-theme-ocean' });
    });

    await waitFor(() => {
      expect(ecosystemSettingsService.refreshThemeCss).toHaveBeenCalledTimes(2);
    });

    act(() => {
      handlers.language?.({ locale: 'ja-JP' });
    });

    await waitFor(() => {
      expect(screen.getByTestId('locale-value')).toHaveTextContent('ja-JP');
    });
  });

  it('cleans subscriptions on unmount', async () => {
    const view = render(<Bootstrap />);

    await waitFor(() => {
      expect(screen.getByTestId('locale-value')).toHaveTextContent('zh-CN');
    });

    view.unmount();

    expect(themeUnsubscribe).toHaveBeenCalledTimes(1);
    expect(languageUnsubscribe).toHaveBeenCalledTimes(1);
  });
});

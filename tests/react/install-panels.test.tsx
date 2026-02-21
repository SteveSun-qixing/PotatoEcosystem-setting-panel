import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nContext, translate } from '@/i18n';
import { PluginPanel } from '@/features/panels/PluginPanel';
import { ThemePanel } from '@/features/panels/ThemePanel';

const { mockService } = vi.hoisted(() => ({
  mockService: {
    listPlugins: vi.fn(),
    checkPluginUpdates: vi.fn(),
    resolveInstallPackagePath: vi.fn(),
    installPlugin: vi.fn(),
    setPluginEnabled: vi.fn(),
    uninstallPlugin: vi.fn(),
    applyPluginUpdates: vi.fn(),
    listThemeOptions: vi.fn(),
    getCurrentThemeId: vi.fn(),
    applyTheme: vi.fn(),
    installTheme: vi.fn(),
    uninstallTheme: vi.fn()
  }
}));

vi.mock('@/services/ecosystem-settings-service', () => ({
  ecosystemSettingsService: mockService
}));

const renderWithI18n = (ui: React.ReactElement) =>
  render(
    <I18nContext.Provider
      value={{
        locale: 'zh-CN',
        setLocale: () => undefined,
        t: (key, params) => translate('zh-CN', key, params)
      }}
    >
      {ui}
    </I18nContext.Provider>
  );

const createFileList = (file: File): FileList =>
  ({
    0: file,
    length: 1,
    item: (index: number) => (index === 0 ? file : null)
  }) as unknown as FileList;

beforeEach(() => {
  vi.clearAllMocks();
  mockService.listPlugins.mockResolvedValue([]);
  mockService.checkPluginUpdates.mockResolvedValue([]);
  mockService.resolveInstallPackagePath.mockImplementation(async (file: File) => {
    const candidate = file as File & { path?: string };
    return candidate.path ?? '/tmp/uploaded.cpk';
  });
  mockService.installPlugin.mockResolvedValue(undefined);
  mockService.setPluginEnabled.mockResolvedValue(undefined);
  mockService.uninstallPlugin.mockResolvedValue(undefined);
  mockService.applyPluginUpdates.mockResolvedValue([]);

  mockService.listThemeOptions.mockResolvedValue([{ id: 'chips.theme.default', name: 'Default', version: '1.0.0' }]);
  mockService.getCurrentThemeId.mockResolvedValue('chips.theme.default');
  mockService.applyTheme.mockResolvedValue(undefined);
  mockService.installTheme.mockResolvedValue(undefined);
  mockService.uninstallTheme.mockResolvedValue(undefined);
});

describe('install panels', () => {
  it('keeps plugin install button disabled before selecting file', async () => {
    renderWithI18n(<PluginPanel />);
    const button = await screen.findByTestId('plugin-install-button');
    expect(button).toBeDisabled();
  });

  it('sends packagePath when plugin install succeeds', async () => {
    renderWithI18n(<PluginPanel />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    if (!input) {
      return;
    }

    const file = new File(['plugin'], 'plugin.cpk', { type: 'application/octet-stream' });
    Object.defineProperty(file, 'path', { value: '/tmp/plugin.cpk' });
    Object.defineProperty(input, 'files', { value: createFileList(file), configurable: true });
    fireEvent.change(input);

    const button = await screen.findByTestId('plugin-install-button');
    expect(button).not.toBeDisabled();
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockService.resolveInstallPackagePath).toHaveBeenCalledTimes(1);
      expect(mockService.installPlugin).toHaveBeenCalledWith('/tmp/plugin.cpk', false);
    });
  });

  it('falls back to persisted package path when selected file has no native path', async () => {
    renderWithI18n(<PluginPanel />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    if (!input) {
      return;
    }

    const file = new File(['plugin'], 'plugin.cpk', { type: 'application/octet-stream' });
    Object.defineProperty(input, 'files', { value: createFileList(file), configurable: true });
    fireEvent.change(input);
    fireEvent.click(await screen.findByTestId('plugin-install-button'));

    await waitFor(() => {
      expect(mockService.resolveInstallPackagePath).toHaveBeenCalledWith(file);
      expect(mockService.installPlugin).toHaveBeenCalledWith('/tmp/uploaded.cpk', false);
    });
  });

  it('renders plugin install error code and message', async () => {
    mockService.installPlugin.mockRejectedValue({
      code: 'PACKAGE_EXTENSION_INVALID',
      message: 'Only .cpk package files are supported.'
    });

    renderWithI18n(<PluginPanel />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    if (!input) {
      return;
    }

    const file = new File(['plugin'], 'plugin.cpk', { type: 'application/octet-stream' });
    Object.defineProperty(file, 'path', { value: '/tmp/plugin.cpk' });
    Object.defineProperty(input, 'files', { value: createFileList(file), configurable: true });
    fireEvent.change(input);

    fireEvent.click(await screen.findByTestId('plugin-install-button'));

    await waitFor(() => {
      expect(screen.getByText(/PACKAGE_EXTENSION_INVALID/)).toBeInTheDocument();
      expect(screen.getAllByText(/Only \.cpk package files are supported\./).length).toBeGreaterThan(0);
    });
  });

  it('sends packagePath when theme install succeeds', async () => {
    renderWithI18n(<ThemePanel />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    if (!input) {
      return;
    }

    const file = new File(['theme'], 'theme.cpk', { type: 'application/octet-stream' });
    Object.defineProperty(file, 'path', { value: '/tmp/theme.cpk' });
    Object.defineProperty(input, 'files', { value: createFileList(file), configurable: true });
    fireEvent.change(input);

    const button = await screen.findByTestId('theme-install-button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockService.resolveInstallPackagePath).toHaveBeenCalledTimes(1);
      expect(mockService.installTheme).toHaveBeenCalledWith('/tmp/theme.cpk', false);
    });
  });
});

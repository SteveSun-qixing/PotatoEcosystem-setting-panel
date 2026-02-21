import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

  mockService.listThemeOptions.mockResolvedValue([
    { id: 'chips-official.default-theme', name: 'Default Theme', version: '1.0.0' },
    { id: 'chips.theme.ocean', name: 'Ocean Theme', version: '1.2.0' },
    { id: 'chips.theme.dark', name: 'Dark Theme', version: '2.0.0' }
  ]);
  mockService.getCurrentThemeId.mockResolvedValue('chips-official.default-theme');
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

  it('auto installs theme package after selecting .cpk file', async () => {
    renderWithI18n(<ThemePanel />);
    await screen.findByText('Default Theme');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    if (!input) {
      return;
    }

    const file = new File(['theme'], 'theme.cpk', { type: 'application/octet-stream' });
    Object.defineProperty(file, 'path', { value: '/tmp/theme.cpk' });
    Object.defineProperty(input, 'files', { value: createFileList(file), configurable: true });
    fireEvent.change(input);

    await waitFor(() => {
      expect(mockService.resolveInstallPackagePath).toHaveBeenCalledTimes(1);
      expect(mockService.installTheme).toHaveBeenCalledWith('/tmp/theme.cpk', false);
    });
  });

  it('retries install with overwrite=true when conflict is confirmed', async () => {
    mockService.installTheme
      .mockRejectedValueOnce({
        code: 'PACKAGE_INSTALL_CONFLICT',
        message: 'Theme already exists.'
      })
      .mockResolvedValueOnce(undefined);

    renderWithI18n(<ThemePanel />);
    await screen.findByText('Default Theme');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    if (!input) {
      return;
    }

    const file = new File(['theme'], 'theme.cpk', { type: 'application/octet-stream' });
    Object.defineProperty(file, 'path', { value: '/tmp/theme.cpk' });
    Object.defineProperty(input, 'files', { value: createFileList(file), configurable: true });
    fireEvent.change(input);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('检测到同 ID 主题，是否覆盖安装？')).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: '覆盖安装' }));

    await waitFor(() => {
      expect(mockService.installTheme).toHaveBeenNthCalledWith(1, '/tmp/theme.cpk', false);
      expect(mockService.installTheme).toHaveBeenNthCalledWith(2, '/tmp/theme.cpk', true);
    });
  });

  it('applies selected theme from installed theme list', async () => {
    renderWithI18n(<ThemePanel />);

    const row = await screen.findByText('Ocean Theme');
    const tr = row.closest('tr');
    expect(tr).not.toBeNull();
    if (!tr) {
      return;
    }

    fireEvent.click(within(tr).getByRole('button', { name: '应用主题' }));

    await waitFor(() => {
      expect(mockService.applyTheme).toHaveBeenCalledWith('chips.theme.ocean');
    });
  });

  it('disables delete for current/default theme and confirms delete for other themes', async () => {
    mockService.getCurrentThemeId.mockResolvedValue('chips.theme.ocean');

    renderWithI18n(<ThemePanel />);

    const defaultRowText = await screen.findByText('Default Theme');
    const defaultRow = defaultRowText.closest('tr');
    expect(defaultRow).not.toBeNull();
    if (!defaultRow) {
      return;
    }

    const currentRowText = await screen.findByText('Ocean Theme');
    const currentRow = currentRowText.closest('tr');
    expect(currentRow).not.toBeNull();
    if (!currentRow) {
      return;
    }

    const darkRowText = await screen.findByText('Dark Theme');
    const darkRow = darkRowText.closest('tr');
    expect(darkRow).not.toBeNull();
    if (!darkRow) {
      return;
    }

    expect(within(defaultRow).getByRole('button', { name: '删除主题' })).toBeDisabled();
    expect(within(currentRow).getByRole('button', { name: '删除主题' })).toBeDisabled();
    expect(within(darkRow).getByRole('button', { name: '删除主题' })).not.toBeDisabled();

    fireEvent.click(within(darkRow).getByRole('button', { name: '删除主题' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: '删除主题' }));

    await waitFor(() => {
      expect(mockService.uninstallTheme).toHaveBeenCalledWith('chips.theme.dark');
    });
  });
});

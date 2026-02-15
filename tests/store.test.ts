import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAppStore } from '../src/stores/app';

describe('App Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    global.window.chips = {
      invoke: vi.fn().mockResolvedValue(null),
    } as any;
  });

  it('should initialize with default state', () => {
    const store = useAppStore();

    expect(store.initialized).toBe(false);
    expect(store.currentFile).toBe(null);
    expect(store.loading).toBe(false);
  });

  it('should update current file when opening file', async () => {
    const store = useAppStore();
    const testPath = '/test/file.txt';

    await store.openFile(testPath);

    expect(store.currentFile).toBe(testPath);
    expect(window.chips.invoke).toHaveBeenCalledWith('config', 'set', {
      key: 'app.lastOpenedFile',
      value: testPath,
    });
  });
});

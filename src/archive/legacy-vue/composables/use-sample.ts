import { ref, computed, inject } from 'vue';
import type { ChipsSDK } from '@chips/sdk';

/**
 * 使用示例功能的 composable
 * 演示如何封装 Bridge API 调用
 */
export function useSample() {
  const sdk = inject<ChipsSDK>('sdk');
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  if (!sdk) {
    throw new Error('SDK not provided. Make sure to provide SDK in app setup.');
  }

  /**
   * 翻译文本
   */
  function t(key: string, params?: Record<string, string | number>): string {
    try {
      return sdk!.t(key, params);
    } catch (err) {
      console.error('Translation error:', err);
      return key;
    }
  }

  /**
   * 获取当前主题
   */
  const currentTheme = computed(() => {
    try {
      return sdk!.themes.currentThemeId;
    } catch (err) {
      console.error('Theme error:', err);
      return null;
    }
  });

  /**
   * 加载文件
   */
  async function loadFile(path: string): Promise<string> {
    loading.value = true;
    error.value = null;

    try {
      const result = await window.chips!.invoke('file', 'read', { path });

      if (typeof result === 'object' && result !== null && 'content' in result) {
        return (result as { content: string }).content;
      }

      throw new Error('Invalid file read result');
    } catch (err) {
      const errorObj = err as { code: string; message: string };
      error.value = errorObj.message;

      await window.chips!.invoke('log', 'error', {
        message: `Failed to load file: ${errorObj.message}`,
        code: errorObj.code,
      });

      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 保存文件
   */
  async function saveFile(path: string, content: string): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await window.chips!.invoke('file', 'write', { path, content });

      await window.chips!.invoke('log', 'info', {
        message: `File saved: ${path}`,
      });
    } catch (err) {
      const errorObj = err as { code: string; message: string };
      error.value = errorObj.message;

      await window.chips!.invoke('log', 'error', {
        message: `Failed to save file: ${errorObj.message}`,
        code: errorObj.code,
      });

      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取配置
   */
  async function getConfig(key: string): Promise<unknown> {
    try {
      return await window.chips!.invoke('config', 'get', { key });
    } catch (err) {
      const errorObj = err as { code: string; message: string };
      console.error('Config error:', errorObj.message);
      return null;
    }
  }

  /**
   * 设置配置
   */
  async function setConfig(key: string, value: unknown): Promise<void> {
    try {
      await window.chips!.invoke('config', 'set', { key, value });
    } catch (err) {
      const errorObj = err as { code: string; message: string };
      console.error('Config error:', errorObj.message);
      throw err;
    }
  }

  return {
    t,
    currentTheme,
    loading,
    error,
    loadFile,
    saveFile,
    getConfig,
    setConfig,
  };
}

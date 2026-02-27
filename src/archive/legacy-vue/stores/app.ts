import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAppStore = defineStore('app', () => {
  const initialized = ref<boolean>(false);
  const currentFile = ref<string | null>(null);
  const loading = ref<boolean>(false);

  async function initialize(): Promise<void> {
    try {
      loading.value = true;

      const config = await window.chips!.invoke('config', 'get', {
        key: 'app.lastOpenedFile',
      });

      if (config && typeof config === 'string') {
        currentFile.value = config;
      }

      initialized.value = true;
    } catch (error) {
      const errorObj = error as { code: string; message: string };
      await window.chips!.invoke('log', 'error', {
        message: `Failed to initialize app: ${errorObj.message}`,
        code: errorObj.code,
      });
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function openFile(path: string): Promise<void> {
    try {
      loading.value = true;
      currentFile.value = path;

      await window.chips!.invoke('config', 'set', {
        key: 'app.lastOpenedFile',
        value: path,
      });

      await window.chips!.invoke('log', 'info', {
        message: `Opened file: ${path}`,
      });
    } catch (error) {
      const errorObj = error as { code: string; message: string };
      await window.chips!.invoke('log', 'error', {
        message: `Failed to open file: ${errorObj.message}`,
        code: errorObj.code,
      });
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function closeFile(): Promise<void> {
    currentFile.value = null;
    await window.chips!.invoke('config', 'set', {
      key: 'app.lastOpenedFile',
      value: null,
    });
  }

  return {
    initialized,
    currentFile,
    loading,
    initialize,
    openFile,
    closeFile,
  };
});

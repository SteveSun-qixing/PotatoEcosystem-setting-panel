/**
 * 应用插件类型定义
 */

export interface AppConfig {
  lastOpenedFile: string | null;
  theme: string;
  language: string;
}

export interface FileItem {
  path: string;
  name: string;
  size: number;
  modifiedAt: number;
}

export interface AppState {
  initialized: boolean;
  currentFile: string | null;
  fileList: FileItem[];
  loading: boolean;
}

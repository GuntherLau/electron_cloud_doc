// Global type definitions for the electron cloud doc app

export interface FileItem {
  id: string;
  title: string;
  body?: string;
  path?: string;
  isLoaded?: boolean;
  isSynced?: boolean;
  isNew?: boolean;
  createAt?: number;
  updatedAt?: number;
}

export interface FileStore {
  [key: string]: FileItem;
}

export interface MenuTemplate {
  label: string;
  submenu?: MenuTemplate[];
  accelerator?: string;
  role?: string;
  click?: () => void;
  enabled?: boolean;
  type?: string;
}

export interface AliOssConfig {
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
}

export interface AppWindowConfig {
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  parent?: any;
}

export interface IpcMessage {
  id: string;
  path?: string;
  status?: string;
  oldPath?: string;
  newPath?: string;
}

declare global {
  interface Window {
    require: NodeRequire;
  }
}
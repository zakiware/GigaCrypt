import { contextBridge, ipcRenderer } from 'electron';
import { AppSettings, DecryptOptions, EncryptOptions, ItemInfo, NotEncryptedNotice, ProgressUpdate, TempViewInfo, UnlockRequest } from '../types';

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: (forDecrypt?: boolean) => ipcRenderer.invoke('select-file', forDecrypt),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  getItemInfo: (targetPath: string) => ipcRenderer.invoke('get-item-info', targetPath),
  encryptItem: (options: EncryptOptions) => ipcRenderer.invoke('encrypt-item', options),
  decryptItem: (options: DecryptOptions) => ipcRenderer.invoke('decrypt-item', options),
  relockFolder: (folderPath: string) => ipcRenderer.invoke('relock-folder', folderPath),
  closeTempView: (tempDir: string) => ipcRenderer.invoke('close-temp-view', tempDir),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings: Partial<AppSettings>) => ipcRenderer.invoke('update-settings', settings),
  getVaultHistory: () => ipcRenderer.invoke('get-vault-history'),
  clearVaultHistory: () => ipcRenderer.invoke('clear-vault-history'),
  openInExplorer: (targetPath: string) => ipcRenderer.invoke('open-in-explorer', targetPath),
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  resizeWindow: (width: number, height: number) => ipcRenderer.invoke('resize-window', width, height),
  getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: (url: string) => ipcRenderer.invoke('download-update', url),
  installUpdate: (filePath: string) => ipcRenderer.invoke('install-update', filePath),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  isWindowMaximized: () => ipcRenderer.invoke('is-window-maximized'),

  onWindowMaximizedChanged: (callback: (isMaximized: boolean) => void) => {
    const handler = (_event: any, isMax: boolean) => callback(isMax);
    ipcRenderer.on('window-maximized-changed', handler);
    return () => {
      ipcRenderer.removeListener('window-maximized-changed', handler);
    };
  },

  onUnlockRequested: (callback: (request: UnlockRequest) => void) => {
    const handler = (_event: any, request: UnlockRequest) => callback(request);
    ipcRenderer.on('unlock-requested', handler);
    return () => {
      ipcRenderer.removeListener('unlock-requested', handler);
    };
  },

  onEncryptRequested: (callback: (info: ItemInfo) => void) => {
    const handler = (_event: any, info: ItemInfo) => callback(info);
    ipcRenderer.on('encrypt-requested', handler);
    return () => {
      ipcRenderer.removeListener('encrypt-requested', handler);
    };
  },

  onNotEncryptedNotice: (callback: (notice: NotEncryptedNotice) => void) => {
    const handler = (_event: any, notice: NotEncryptedNotice) => callback(notice);
    ipcRenderer.on('not-encrypted-notice', handler);
    return () => {
      ipcRenderer.removeListener('not-encrypted-notice', handler);
    };
  },

  onProgress: (callback: (progress: ProgressUpdate) => void) => {
    const handler = (_event: any, progress: ProgressUpdate) => callback(progress);
    ipcRenderer.on('operation-progress', handler);
    return () => {
      ipcRenderer.removeListener('operation-progress', handler);
    };
  },

  onUpdateDownloadProgress: (callback: (progress: { percent: number; receivedBytes: number; totalBytes: number }) => void) => {
    const handler = (_event: any, progress: any) => callback(progress);
    ipcRenderer.on('update-download-progress', handler);
    return () => {
      ipcRenderer.removeListener('update-download-progress', handler);
    };
  },

  onThemeChanged: (callback: (theme: 'dark' | 'light') => void) => {
    const handler = (_event: any, theme: 'dark' | 'light') => callback(theme);
    ipcRenderer.on('theme-changed', handler);
    return () => {
      ipcRenderer.removeListener('theme-changed', handler);
    };
  },

  onActiveSessionsChanged: (callback: (sessions: string[]) => void) => {
    const handler = (_event: any, sessions: string[]) => callback(sessions);
    ipcRenderer.on('active-sessions-changed', handler);
    return () => {
      ipcRenderer.removeListener('active-sessions-changed', handler);
    };
  },

  onActiveTempViewsChanged: (callback: (views: TempViewInfo[]) => void) => {
    const handler = (_event: any, views: TempViewInfo[]) => callback(views);
    ipcRenderer.on('active-temp-views-changed', handler);
    return () => {
      ipcRenderer.removeListener('active-temp-views-changed', handler);
    };
  },
});

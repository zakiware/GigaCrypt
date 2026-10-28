export type ItemType = 'file' | 'folder';

export type AccentColor = 'ginger' | 'emerald' | 'sapphire' | 'amethyst' | 'ruby' | 'titanium';
export type ThemeMode = 'dark' | 'light' | 'system';

export interface CryptoItem {
  id: string;
  name: string;
  originalPath: string;
  targetPath: string;
  type: ItemType;
  size: number;
  encryptedAt: number;
  hasHint: boolean;
  hint?: string;
  status: 'locked' | 'unlocked';
  isInPlaceFolder?: boolean;
}

export interface ItemInfo {
  name: string;
  path: string;
  type: ItemType;
  size: number;
  fileCount?: number;
  isGcrypt?: boolean;
  isLockedFolder?: boolean;
  hint?: string;
}

export interface AppSettings {
  closeToTray: boolean;
  startWithWindows: boolean;
  explorerContextMenu: boolean;
  wipeOriginal: boolean;
  accentColor: AccentColor;
  themeMode: ThemeMode;
  autoRelockMinutes?: number;
}

export interface ProgressUpdate {
  stage: 'analyzing' | 'compressing' | 'encrypting' | 'decrypting' | 'extracting' | 'wiping' | 'done' | 'error';
  percent: number;
  message: string;
  bytesProcessed?: number;
  totalBytes?: number;
}

export interface UnlockRequest {
  filePath: string;
  fileName: string;
  type: ItemType;
  size: number;
  hint?: string;
  isLockedFolder?: boolean;
  alreadyLockedWarning?: boolean;
}

export interface TempViewInfo {
  tempDir: string;
  originalPath: string;
  name: string;
}

export interface NotEncryptedNotice {
  name: string;
  path: string;
  type: ItemType;
}

export interface EncryptOptions {
  sourcePath: string;
  password: string;
  hint?: string;
  wipeOriginal: boolean;
}

export interface DecryptOptions {
  gcryptPath: string;
  password: string;
  destinationPath?: string;
  tempView?: boolean;
}

export interface OperationResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  isTempView?: boolean;
}

export interface UpdateInfo {
  available: boolean;
  hasUpdate?: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes?: string;
  downloadUrl?: string;
  publishedAt?: string;
  error?: string;
}

export interface UpdateDownloadProgress {
  percent: number;
  receivedBytes: number;
  totalBytes: number;
}

export interface ElectronAPI {
  selectFile: (forDecrypt?: boolean) => Promise<string | null>;
  selectFolder: () => Promise<string | null>;
  getItemInfo: (targetPath: string) => Promise<ItemInfo | null>;
  encryptItem: (options: EncryptOptions) => Promise<OperationResult>;
  decryptItem: (options: DecryptOptions) => Promise<OperationResult>;
  relockFolder: (folderPath: string) => Promise<OperationResult>;
  closeTempView: (tempDir: string) => Promise<OperationResult>;
  getSettings: () => Promise<AppSettings>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
  getVaultHistory: () => Promise<CryptoItem[]>;
  clearVaultHistory: () => Promise<void>;
  openInExplorer: (targetPath: string) => Promise<void>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  resizeWindow: (width: number, height: number) => Promise<void>;
  getSystemTheme: () => Promise<'dark' | 'light'>;
  getAppVersion: () => Promise<string>;
  checkForUpdates: () => Promise<UpdateInfo>;
  downloadUpdate: (url: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  installUpdate: (filePath: string) => Promise<boolean>;
  openExternal: (url: string) => Promise<void>;
  isWindowMaximized: () => Promise<boolean>;
  onWindowMaximizedChanged: (callback: (isMaximized: boolean) => void) => () => void;
  onUnlockRequested: (callback: (request: UnlockRequest) => void) => () => void;
  onEncryptRequested: (callback: (info: ItemInfo) => void) => () => void;
  onNotEncryptedNotice: (callback: (notice: NotEncryptedNotice) => void) => () => void;
  onProgress: (callback: (progress: ProgressUpdate) => void) => () => void;
  onUpdateDownloadProgress: (callback: (progress: UpdateDownloadProgress) => void) => () => void;
  onThemeChanged: (callback: (theme: 'dark' | 'light') => void) => () => void;
  onActiveSessionsChanged: (callback: (folders: string[]) => void) => () => void;
  onActiveTempViewsChanged: (callback: (views: TempViewInfo[]) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

import { app, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage, shell, nativeTheme, powerMonitor, screen, type NativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { CryptoEngine } from './crypto/cryptoEngine';
import { WindowsRegistry } from './windows/registry';
import { AppSettings, CryptoItem, DecryptOptions, EncryptOptions, ItemInfo, NotEncryptedNotice, TempViewInfo, UnlockRequest, UpdateInfo } from '../types';

const CURRENT_VERSION = '1.0.0';
const GITHUB_REPO = 'zakiware/GigaCrypt';

// Ensure autoplay with audio works for intro.mp4 video splash screen
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let mainWindow: BrowserWindow | null = null;
let quickLockWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let pendingTarget: { action: 'open' | 'encrypt'; targetPath: string; alreadyLockedWarning?: boolean } | null = null;

// Active unlocked sessions (stores password in RAM while folder is open for editing)
interface ActiveSession {
  password: string;
  unlockedAt: number;
}
const activeUnlockedSessions = new Map<string, ActiveSession>();

// Active temporary view sessions (isolated sandbox in %TEMP%)
interface TempViewSession {
  tempDir: string;
  originalPath: string;
  name: string;
  openedAt: number;
}
const activeTempViews = new Map<string, TempViewSession>();

const SETTINGS_FILE = path.join(app.getPath('userData'), 'gigacrypt_settings.json');
const VAULT_FILE = path.join(app.getPath('userData'), 'gigacrypt_vault.json');

let currentSettings: AppSettings = {
  closeToTray: true,
  startWithWindows: false,
  explorerContextMenu: true,
  wipeOriginal: true,
  accentColor: 'ginger',
  themeMode: 'dark',
  autoRelockMinutes: 10,
};

function loadSettings(): AppSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      currentSettings = { ...currentSettings, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
  return currentSettings;
}

function saveSettings(settings: Partial<AppSettings>): AppSettings {
  try {
    currentSettings = { ...currentSettings, ...settings };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(currentSettings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
  return currentSettings;
}

function loadVault(): CryptoItem[] {
  try {
    if (fs.existsSync(VAULT_FILE)) {
      const data = fs.readFileSync(VAULT_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load vault history:', err);
  }
  return [];
}

function saveVaultItem(item: CryptoItem): void {
  try {
    const list = loadVault();
    const existingIndex = list.findIndex((i) => i.targetPath === item.targetPath);
    if (existingIndex >= 0) {
      list[existingIndex] = item;
    } else {
      list.unshift(item);
    }
    fs.writeFileSync(VAULT_FILE, JSON.stringify(list.slice(0, 50), null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save vault item:', err);
  }
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', async (_event, commandLine) => {
    const parsed = parseCommandLineArgs(commandLine);
    if (parsed) {
      // If user right-clicked "Зашифровать папку" on an active unlocked folder:
      // Instantly lock it back!
      if (parsed.action === 'encrypt' && activeUnlockedSessions.has(parsed.targetPath)) {
        await relockFolderSession(parsed.targetPath);
        return;
      }

      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        if (!mainWindow.isVisible()) mainWindow.show();
        mainWindow.focus();
        handleTarget(parsed.action, parsed.targetPath, parsed.alreadyLockedWarning);
      }
    } else if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });
}

function parseCommandLineArgs(argv: string[]): { action: 'open' | 'encrypt'; targetPath: string; alreadyLockedWarning?: boolean } | null {
  let explicitAction: 'open' | 'encrypt' | null = null;
  let targetCandidate: string | null = null;

  for (let i = 1; i < argv.length; i++) {
    const raw = argv[i];
    if (!raw) continue;

    const clean = raw.replace(/^"+|"+$/g, '').replace(/[/\\]+$/, '');

    if (clean === 'open' || clean === 'encrypt') {
      explicitAction = clean;
      continue;
    }

    if (!clean.startsWith('-') && !clean.startsWith('--')) {
      if (fs.existsSync(clean)) {
        targetCandidate = clean;
      }
    }
  }

  if (!targetCandidate) return null;

  const isFolder = fs.statSync(targetCandidate).isDirectory();
  const isGcrypt = path.extname(targetCandidate).toLowerCase() === '.gcrypt';
  const hasVaultInside = isFolder && fs.existsSync(path.join(targetCandidate, '.gigavault'));
  const isLocked = isGcrypt || hasVaultInside;

  // Case 1: Folder is currently UNLOCKED and ACTIVE in session, and user clicked "Зашифровать папку"
  if (explicitAction === 'encrypt' && isFolder && activeUnlockedSessions.has(targetCandidate)) {
    return { action: 'encrypt', targetPath: targetCandidate };
  }

  // Case 2: Folder/file is already LOCKED, and user clicked "Зашифровать"
  if (explicitAction === 'encrypt' && isLocked) {
    return { action: 'open', targetPath: targetCandidate, alreadyLockedWarning: true };
  }

  const action = explicitAction || (isLocked ? 'open' : 'encrypt');
  return { action, targetPath: targetCandidate };
}

async function handleTarget(action: 'open' | 'encrypt', targetPath: string, alreadyLockedWarning?: boolean) {
  if (!mainWindow) return;

  const currentBounds = mainWindow.getBounds();
  if (currentBounds.width < 900 || currentBounds.height < 650) {
    mainWindow.setSize(1020, 720);
    mainWindow.center();
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  if (!mainWindow.isVisible()) mainWindow.show();
  mainWindow.focus();

  const stat = await fs.promises.stat(targetPath);
  const isFolder = stat.isDirectory();
  const isGcrypt = path.extname(targetPath).toLowerCase() === '.gcrypt';
  const hasVaultInside = isFolder && fs.existsSync(path.join(targetPath, '.gigavault'));
  const isLocked = isGcrypt || hasVaultInside;
  const cleanName = path.basename(targetPath).replace(/\.gcrypt$/i, '');

  // If user clicked "Зашифровать папку" on an active unlocked folder -> relock immediately
  if (action === 'encrypt' && isFolder && activeUnlockedSessions.has(targetPath)) {
    await relockFolderSession(targetPath);
    return;
  }

  // If user requested "open" / "decrypt", but target is NOT locked:
  // DO NOT open unlock modal! Send not-encrypted notice!
  if (action === 'open' && !isLocked) {
    const notice: NotEncryptedNotice = {
      name: cleanName,
      path: targetPath,
      type: isFolder ? 'folder' : 'file',
    };
    mainWindow.webContents.send('not-encrypted-notice', notice);
    return;
  }

  if (action === 'open' || isGcrypt || hasVaultInside) {
    let hint: string | undefined = undefined;
    let size = stat.size;

    if (isGcrypt) {
      const peek = await CryptoEngine.peekMetadata(targetPath);
      hint = peek.metadata?.hint;
    } else if (hasVaultInside) {
      const vaultFile = path.join(targetPath, '.gigavault');
      const peek = await CryptoEngine.peekMetadata(vaultFile);
      hint = peek.metadata?.hint;
      const vaultStat = await fs.promises.stat(vaultFile);
      size = vaultStat.size;
    }

    if (!hint) {
      const history = loadVault();
      const match = history.find((i) => i.targetPath === targetPath || i.originalPath === targetPath);
      if (match?.hint) hint = match.hint;
    }

    const req: UnlockRequest = {
      filePath: targetPath,
      fileName: cleanName,
      type: isFolder ? 'folder' : 'file',
      size,
      hint,
      isLockedFolder: isFolder,
      alreadyLockedWarning,
    };

    mainWindow.webContents.send('unlock-requested', req);
  } else {
    const stats = await CryptoEngine.calculateItemStats(targetPath);
    const info: ItemInfo = {
      name: cleanName,
      path: targetPath,
      type: stats.type,
      size: stats.size,
      fileCount: stats.count,
    };
    mainWindow.webContents.send('encrypt-requested', info);
  }
}

function getAppIcon(): NativeImage {
  const candidatePaths = [
    path.join(__dirname, '../../icon.ico'),
    path.join(path.dirname(process.execPath), 'icon.ico'),
    path.join(path.dirname(process.execPath), 'resources', 'icon.ico'),
    path.join(process.cwd(), 'icon.ico'),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return nativeImage.createFromPath(p);
    }
  }
  return nativeImage.createEmpty();
}

function getTrayIcon(): NativeImage {
  const candidatePaths = [
    path.join(__dirname, '../../tray.png'),
    path.join(path.dirname(process.execPath), 'tray.png'),
    path.join(path.dirname(process.execPath), 'resources', 'tray.png'),
    path.join(process.cwd(), 'tray.png'),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return nativeImage.createFromPath(p);
    }
  }
  return getAppIcon();
}

function updateTrayMenu() {
  if (!tray) return;

  const activeFolders = Array.from(activeUnlockedSessions.keys());
  const activeViews = Array.from(activeTempViews.values());

  const template: any[] = [
    {
      label: 'Открыть GigaCrypt',
      click: () => {
        if (mainWindow) {
          mainWindow.setSize(1020, 720);
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
  ];

  if (activeFolders.length > 0) {
    template.push({
      label: `🟢 Открыто для работы (${activeFolders.length}):`,
      enabled: false,
    });

    for (const folder of activeFolders) {
      const folderName = path.basename(folder);
      template.push({
        label: `🔒 Заблокировать "${folderName}"`,
        click: async () => {
          await relockFolderSession(folder);
        },
      });
    }

    template.push({
      label: '🔒 Заблокировать ВСЕ папки',
      click: async () => {
        for (const f of activeFolders) {
          await relockFolderSession(f);
        }
      },
    });
    template.push({ type: 'separator' });
  }

  if (activeViews.length > 0) {
    template.push({
      label: `👁️ Временный просмотр (${activeViews.length}):`,
      enabled: false,
    });

    for (const view of activeViews) {
      template.push({
        label: `✕ Закрыть просмотр "${view.name}"`,
        click: async () => {
          await closeTempViewSession(view.tempDir);
        },
      });
    }
    template.push({ type: 'separator' });
  }

  template.push(
    {
      label: 'Зашифровать файл...',
      click: async () => {
        if (mainWindow) {
          mainWindow.show();
          const file = await selectFile(false);
          if (file) handleTarget('encrypt', file);
        }
      },
    },
    {
      label: 'Зашифровать папку...',
      click: async () => {
        if (mainWindow) {
          mainWindow.show();
          const folder = await selectFolder();
          if (folder) handleTarget('encrypt', folder);
        }
      },
    },
    {
      label: 'Расшифровать объект...',
      click: async () => {
        if (mainWindow) {
          mainWindow.setSize(1020, 720);
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Выход',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    }
  );

  tray.setContextMenu(Menu.buildFromTemplate(template));
}

function setupTray() {
  const icon = getTrayIcon();
  tray = new Tray(icon);
  tray.setToolTip('GigaCrypt — Безопасное шифрование');
  updateTrayMenu();

  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.setSize(1020, 720);
        mainWindow.show();
      }
    }
  });
}

/**
 * Floating Quick-Lock Bar (Mini Lock HUD)
 */
function showQuickLockBar() {
  if (quickLockWindow && !quickLockWindow.isDestroyed()) {
    quickLockWindow.show();
    return;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width } = primaryDisplay.workAreaSize;

  quickLockWindow = new BrowserWindow({
    width: 360,
    height: 56,
    x: width - 380,
    y: 28,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const quickLockHtml = path.join(__dirname, 'quickLock.html');
  quickLockWindow.loadFile(quickLockHtml);

  quickLockWindow.webContents.on('did-finish-load', () => {
    const sessions = Array.from(activeUnlockedSessions.keys());
    const tempViews: TempViewInfo[] = Array.from(activeTempViews.values()).map((v) => ({
      tempDir: v.tempDir,
      originalPath: v.originalPath,
      name: v.name,
    }));
    quickLockWindow?.webContents.send('active-sessions-changed', sessions);
    quickLockWindow?.webContents.send('active-temp-views-changed', tempViews);
  });

  quickLockWindow.on('closed', () => {
    quickLockWindow = null;
  });
}

function hideQuickLockBar() {
  if (quickLockWindow && !quickLockWindow.isDestroyed()) {
    quickLockWindow.close();
    quickLockWindow = null;
  }
}

function notifySessionsChanged() {
  updateTrayMenu();
  const sessions = Array.from(activeUnlockedSessions.keys());
  const tempViews: TempViewInfo[] = Array.from(activeTempViews.values()).map((v) => ({
    tempDir: v.tempDir,
    originalPath: v.originalPath,
    name: v.name,
  }));

  mainWindow?.webContents.send('active-sessions-changed', sessions);
  mainWindow?.webContents.send('active-temp-views-changed', tempViews);

  if (quickLockWindow && !quickLockWindow.isDestroyed()) {
    quickLockWindow.webContents.send('active-sessions-changed', sessions);
    quickLockWindow.webContents.send('active-temp-views-changed', tempViews);
  }

  if (sessions.length > 0 || tempViews.length > 0) {
    showQuickLockBar();
  } else {
    hideQuickLockBar();
  }
}

/**
 * Re-locks an unlocked folder with the password stored in active session
 */
async function relockFolderSession(folderPath: string): Promise<boolean> {
  const session = activeUnlockedSessions.get(folderPath);
  if (!session || !fs.existsSync(folderPath)) {
    activeUnlockedSessions.delete(folderPath);
    notifySessionsChanged();
    return false;
  }

  try {
    await CryptoEngine.lockFolder(folderPath, session.password);
    activeUnlockedSessions.delete(folderPath);
    notifySessionsChanged();

    if (tray) {
      tray.displayBalloon({
        title: 'GigaCrypt',
        content: `🔒 Папка "${path.basename(folderPath)}" успешно заблокирована!`,
      });
    }
    return true;
  } catch (err) {
    console.error('Failed to relock folder:', err);
    return false;
  }
}

async function closeTempViewSession(tempDir: string): Promise<boolean> {
  const session = activeTempViews.get(tempDir);
  if (!session) return false;

  try {
    await CryptoEngine.wipePath(tempDir);
    activeTempViews.delete(tempDir);
    notifySessionsChanged();
    return true;
  } catch (err) {
    console.error('Failed to close temp view:', err);
    return false;
  }
}

async function relockAllSessions() {
  for (const folder of Array.from(activeUnlockedSessions.keys())) {
    await relockFolderSession(folder);
  }
  for (const tempDir of Array.from(activeTempViews.keys())) {
    await closeTempViewSession(tempDir);
  }
}

// Auto-relock check interval (every 30 seconds)
setInterval(async () => {
  const timeoutMs = (currentSettings.autoRelockMinutes || 10) * 60 * 1000;
  const now = Date.now();

  // 1. Relock inactive unlocked folders
  if (timeoutMs > 0) {
    for (const [folder, session] of activeUnlockedSessions.entries()) {
      if (now - session.unlockedAt >= timeoutMs) {
        console.log(`Auto-relocking inactive folder: ${folder}`);
        await relockFolderSession(folder);
      }
    }
  }

  // 2. Auto-close temp views older than 10 minutes
  for (const [tempDir, view] of activeTempViews.entries()) {
    if (now - view.openedAt >= 10 * 60 * 1000) {
      console.log(`Auto-closing expired temp view: ${tempDir}`);
      await closeTempViewSession(tempDir);
    }
  }
}, 30000);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1020,
    height: 720,
    minWidth: 800,
    minHeight: 560,
    frame: false,
    icon: getAppIcon(),
    backgroundColor: '#0a0a0c',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  const distHtml = path.join(__dirname, '../renderer/index.html');
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (fs.existsSync(distHtml)) {
    mainWindow.loadFile(distHtml);
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (pendingTarget) {
      handleTarget(pendingTarget.action, pendingTarget.targetPath, pendingTarget.alreadyLockedWarning);
      pendingTarget = null;
    }
  });

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window-maximized-changed', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window-maximized-changed', false);
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      loadSettings();
      if (currentSettings.closeToTray) {
        event.preventDefault();
        mainWindow?.hide();
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// File Pickers
async function selectFile(forDecrypt?: boolean): Promise<string | null> {
  if (!mainWindow) return null;
  const filters = forDecrypt
    ? [
        { name: 'Зашифрованные файлы GigaCrypt (*.gcrypt)', extensions: ['gcrypt'] },
        { name: 'Все файлы (*.*)', extensions: ['*'] },
      ]
    : [
        { name: 'Все файлы (*.*)', extensions: ['*'] },
        { name: 'Файлы GigaCrypt (*.gcrypt)', extensions: ['gcrypt'] },
      ];

  const result = await dialog.showOpenDialog(mainWindow, {
    title: forDecrypt ? 'Выберите зашифрованный файл (.gcrypt)' : 'Выберите файл для шифрования',
    properties: ['openFile'],
    filters,
  });
  return result.canceled ? null : result.filePaths[0];
}

async function selectFolder(): Promise<string | null> {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Выберите папку для шифрования или расшифровки',
    properties: ['openDirectory'],
  });
  return result.canceled ? null : result.filePaths[0];
}

// App lifecycle
app.whenReady().then(async () => {
  loadSettings();
  setupTray();
  createWindow();

  try {
    await WindowsRegistry.registerFileAssociation();
    if (currentSettings.explorerContextMenu) {
      await WindowsRegistry.registerContextMenu();
    }
  } catch (err) {
    console.error('Windows registry error:', err);
  }

  const parsed = parseCommandLineArgs(process.argv);
  if (parsed) {
    // If it was an immediate relock of an active session:
    if (parsed.action === 'encrypt' && activeUnlockedSessions.has(parsed.targetPath)) {
      await relockFolderSession(parsed.targetPath);
    } else {
      pendingTarget = parsed;
    }
  }

  nativeTheme.on('updated', () => {
    mainWindow?.webContents.send('theme-changed', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
  });

  // Re-lock all folders if screen locks or PC goes to sleep!
  powerMonitor.on('lock-screen', () => {
    console.log('Windows screen locked -> Auto-relocking all open folders');
    relockAllSessions();
  });

  powerMonitor.on('suspend', () => {
    console.log('System suspended -> Auto-relocking all open folders');
    relockAllSessions();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', async () => {
  isQuitting = true;
  hideQuickLockBar();
  // Automatically re-lock all open folders and close temp views before quitting!
  await relockAllSessions();
});

// IPC Handlers
ipcMain.handle('select-file', async (_event, forDecrypt?: boolean) => selectFile(forDecrypt));
ipcMain.handle('select-folder', async () => selectFolder());

ipcMain.handle('get-item-info', async (_event, targetPath: string): Promise<ItemInfo | null> => {
  try {
    const clean = targetPath.replace(/[/\\]+$/, '');
    if (!fs.existsSync(clean)) return null;

    const stat = await fs.promises.stat(clean);
    const isFolder = stat.isDirectory();
    const isGcrypt = path.extname(clean).toLowerCase() === '.gcrypt';
    const hasVaultInside = isFolder && fs.existsSync(path.join(clean, '.gigavault'));
    const isLockedFolder = hasVaultInside;

    const stats = await CryptoEngine.calculateItemStats(clean);
    let hint: string | undefined = undefined;

    if (isGcrypt) {
      const peek = await CryptoEngine.peekMetadata(clean);
      hint = peek.metadata?.hint;
    } else if (hasVaultInside) {
      const peek = await CryptoEngine.peekMetadata(path.join(clean, '.gigavault'));
      hint = peek.metadata?.hint;
    }

    if (!hint) {
      const history = loadVault();
      const match = history.find((i) => i.targetPath === clean || i.originalPath === clean);
      if (match?.hint) hint = match.hint;
    }

    const cleanName = path.basename(clean).replace(/\.gcrypt$/i, '');

    return {
      name: cleanName,
      path: clean,
      type: stats.type,
      size: stats.size,
      fileCount: stats.count,
      isGcrypt,
      isLockedFolder,
      hint,
    };
  } catch (err) {
    console.error('Failed to get item info:', err);
    return null;
  }
});

ipcMain.handle('encrypt-item', async (_event, options: EncryptOptions) => {
  try {
    const cleanPath = options.sourcePath.replace(/[/\\]+$/, '');
    const isFolder = (await fs.promises.stat(cleanPath)).isDirectory();

    if (!options.password || options.password.length < 6) {
      return { success: false, error: 'Пароль должен содержать минимум 6 символов для безопасности' };
    }

    // Check if folder is already locked: prevent re-encrypting or overwriting password!
    if (isFolder && fs.existsSync(path.join(cleanPath, '.gigavault'))) {
      return { success: false, error: 'Папка уже зашифрована! Менять пароль без ввода текущего нельзя.' };
    }
    if (!isFolder && path.extname(cleanPath).toLowerCase() === '.gcrypt') {
      return { success: false, error: 'Файл уже зашифрован! Для доступа введите текущий пароль.' };
    }

    const result = await CryptoEngine.encrypt(cleanPath, options.password, {
      hint: options.hint,
      wipeOriginal: options.wipeOriginal,
      onProgress: (progress) => {
        mainWindow?.webContents.send('operation-progress', progress);
      },
    });

    const cleanName = path.basename(result.outputPath).replace(/\.gcrypt$/i, '');

    let realSize = 0;
    try {
      if (isFolder) {
        const vaultFile = path.join(result.outputPath, '.gigavault');
        if (fs.existsSync(vaultFile)) realSize = (await fs.promises.stat(vaultFile)).size;
      } else if (fs.existsSync(result.outputPath)) {
        realSize = (await fs.promises.stat(result.outputPath)).size;
      }
    } catch {}

    const item: CryptoItem = {
      id: Buffer.from(result.outputPath).toString('base64').substring(0, 16),
      name: cleanName,
      originalPath: cleanPath,
      targetPath: result.outputPath,
      type: isFolder ? 'folder' : 'file',
      size: realSize,
      encryptedAt: Date.now(),
      hasHint: !!options.hint,
      hint: options.hint,
      status: 'locked',
      isInPlaceFolder: isFolder,
    };
    saveVaultItem(item);

    return { success: true, outputPath: result.outputPath };
  } catch (err: any) {
    return { success: false, error: err.message || 'Ошибка шифрования' };
  }
});

ipcMain.handle('decrypt-item', async (_event, options: DecryptOptions) => {
  try {
    const cleanPath = options.gcryptPath.replace(/[/\\]+$/, '');
    const stat = await fs.promises.stat(cleanPath);
    const isFolder = stat.isDirectory();
    const baseName = path.basename(cleanPath).replace(/\.gcrypt$/i, '');

    // 1. TEMPORARY VIEW (Isolated copy in %TEMP%, original stays 100% locked)
    if (options.tempView) {
      const tempDir = path.join(
        app.getPath('temp'),
        `GigaCrypt_View_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      );
      await fs.promises.mkdir(tempDir, { recursive: true });

      let openTarget = tempDir;

      if (isFolder) {
        await CryptoEngine.tempViewFolder(cleanPath, options.password, tempDir, {
          onProgress: (p) => mainWindow?.webContents.send('operation-progress', p),
        });
      } else {
        const res = await CryptoEngine.decrypt(cleanPath, options.password, {
          destinationDir: tempDir,
          keepOriginal: true,
          onProgress: (p) => mainWindow?.webContents.send('operation-progress', p),
        });
        if (res.outputPath) openTarget = res.outputPath;
      }

      activeTempViews.set(tempDir, {
        tempDir,
        originalPath: cleanPath,
        name: baseName,
        openedAt: Date.now(),
      });
      notifySessionsChanged();

      if (fs.existsSync(openTarget)) {
        shell.openPath(openTarget);
      }

      return { success: true, outputPath: openTarget, isTempView: true };
    }

    // 2. STANDARD FULL DECRYPTION (In-place)
    const result = await CryptoEngine.decrypt(cleanPath, options.password, {
      destinationDir: options.destinationPath,
      onProgress: (progress) => {
        mainWindow?.webContents.send('operation-progress', progress);
      },
    });

    if (isFolder && result.outputPath) {
      for (const [tempDir, view] of activeTempViews.entries()) {
        if (view.originalPath === cleanPath) {
          await closeTempViewSession(tempDir);
        }
      }

      // Full decryption means the folder is completely unlocked and restored!
      // Do NOT auto-relock it in background:
      activeUnlockedSessions.delete(cleanPath);
      activeUnlockedSessions.delete(result.outputPath);
      notifySessionsChanged();

      // Guarantee: zero extra files in the folder (.gigavault must NOT exist)
      const strayVault = path.join(result.outputPath, '.gigavault');
      if (fs.existsSync(strayVault)) {
        try {
          fs.unlinkSync(strayVault);
        } catch {
          await CryptoEngine.wipePath(strayVault);
        }
      }

      // Update vault history
      try {
        const list = loadVault();
        const existing = list.find((i) => i.targetPath === cleanPath || i.originalPath === cleanPath);
        if (existing) {
          existing.status = 'unlocked';
          fs.writeFileSync(VAULT_FILE, JSON.stringify(list, null, 2), 'utf-8');
        }
      } catch {}
    }

    if (result.outputPath && fs.existsSync(result.outputPath)) {
      shell.openPath(result.outputPath);
    }

    return { success: true, outputPath: result.outputPath };
  } catch (err: any) {
    return { success: false, error: err.message || 'Неверный пароль' };
  }
});

ipcMain.handle('relock-folder', async (_event, folderPath: string) => {
  const success = await relockFolderSession(folderPath);
  return { success };
});

ipcMain.handle('close-temp-view', async (_event, tempDir: string) => {
  const success = await closeTempViewSession(tempDir);
  return { success };
});

ipcMain.handle('get-settings', async () => loadSettings());
ipcMain.handle('update-settings', async (_event, newSettings: Partial<AppSettings>) => {
  const updated = saveSettings(newSettings);
  if (newSettings.explorerContextMenu !== undefined) {
    if (newSettings.explorerContextMenu) {
      await WindowsRegistry.registerContextMenu();
    } else {
      await WindowsRegistry.unregisterContextMenu();
    }
  }
  return updated;
});

ipcMain.handle('get-vault-history', async () => loadVault());
ipcMain.handle('clear-vault-history', async () => {
  try {
    if (fs.existsSync(VAULT_FILE)) fs.unlinkSync(VAULT_FILE);
  } catch {}
});

ipcMain.handle('open-in-explorer', async (_event, targetPath: string) => {
  if (fs.existsSync(targetPath)) {
    shell.showItemInFolder(targetPath);
  }
});

ipcMain.handle('resize-window', async (_event, width: number, height: number) => {
  if (mainWindow) {
    mainWindow.setSize(width, height);
    mainWindow.center();
  }
});

ipcMain.handle('get-system-theme', async () => (nativeTheme.shouldUseDarkColors ? 'dark' : 'light'));
ipcMain.handle('is-window-maximized', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
  return win?.isMaximized() || false;
});

function isNewerVersion(remote: string, current: string): boolean {
  const parse = (v: string) => v.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const r = parse(remote);
  const c = parse(current);
  for (let i = 0; i < Math.max(r.length, c.length); i++) {
    const rPart = r[i] || 0;
    const cPart = c[i] || 0;
    if (rPart > cPart) return true;
    if (rPart < cPart) return false;
  }
  return false;
}

ipcMain.handle('get-app-version', () => CURRENT_VERSION);

ipcMain.handle('open-external', async (_event, url: string) => {
  if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
    shell.openExternal(url);
  }
});

ipcMain.handle('check-for-updates', async (): Promise<UpdateInfo> => {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: {
        'User-Agent': 'GigaCrypt-App/1.0.0',
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        return {
          available: false,
          currentVersion: CURRENT_VERSION,
          latestVersion: CURRENT_VERSION,
          releaseName: 'v1.0.0 (Актуальная версия)',
        };
      }
      throw new Error(`GitHub API HTTP ${res.status}`);
    }

    const data: any = await res.json();
    const remoteTag = data.tag_name || data.name || '1.0.0';
    const isNewer = isNewerVersion(remoteTag, CURRENT_VERSION);

    let downloadUrl = data.html_url;
    if (data.assets && Array.isArray(data.assets)) {
      const exeAsset = data.assets.find((a: any) => a.name.endsWith('.exe'));
      if (exeAsset?.browser_download_url) {
        downloadUrl = exeAsset.browser_download_url;
      }
    }

    return {
      available: isNewer,
      currentVersion: CURRENT_VERSION,
      latestVersion: remoteTag.replace(/^v/i, ''),
      releaseName: data.name || remoteTag,
      releaseNotes: data.body || '',
      downloadUrl,
      publishedAt: data.published_at,
    };
  } catch (err: any) {
    console.warn('Update check notice:', err.message);
    return {
      available: false,
      currentVersion: CURRENT_VERSION,
      latestVersion: CURRENT_VERSION,
      releaseName: 'v1.0.0',
      error: err.message,
    };
  }
});

ipcMain.handle('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
  win?.minimize();
});
ipcMain.handle('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
  if (win?.isMaximized()) {
    win.unmaximize();
  } else {
    win?.maximize();
  }
});
ipcMain.handle('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
  win?.close();
});

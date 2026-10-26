import React, { useState, useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { WelcomeHeader } from './components/WelcomeHeader';
import { DropZone } from './components/DropZone';
import { VaultList } from './components/VaultList';
import { EncryptModal } from './components/EncryptModal';
import { UnlockModal } from './components/UnlockModal';
import { SettingsModal } from './components/SettingsModal';
import { NotEncryptedModal } from './components/NotEncryptedModal';
import { SplashScreen } from './components/SplashScreen';
import { VersionBadge } from './components/VersionBadge';
import { UpdateModal } from './components/UpdateModal';
import { Lock, CheckCircle2, Eye, X, AlertCircle } from 'lucide-react';
import { AppSettings, CryptoItem, ItemInfo, NotEncryptedNotice, TempViewInfo, UnlockRequest, UpdateInfo } from '../types';

export const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    closeToTray: true,
    startWithWindows: false,
    explorerContextMenu: true,
    wipeOriginal: true,
    accentColor: 'ginger',
    themeMode: 'dark',
    autoRelockMinutes: 10,
  });

  const [systemDark, setSystemDark] = useState(true);
  const [vaultHistory, setVaultHistory] = useState<CryptoItem[]>([]);
  const [activeSessions, setActiveSessions] = useState<string[]>([]);
  const [tempViews, setTempViews] = useState<TempViewInfo[]>([]);
  const [selectedItemForEncrypt, setSelectedItemForEncrypt] = useState<ItemInfo | null>(null);
  const [unlockRequest, setUnlockRequest] = useState<UnlockRequest | null>(null);
  const [notEncryptedNotice, setNotEncryptedNotice] = useState<NotEncryptedNotice | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [mainMode, setMainMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [isMaximized, setIsMaximized] = useState(false);
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateToast, setUpdateToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const loadInitialData = async () => {
    try {
      const savedSettings = await window.electronAPI.getSettings();
      setSettings(savedSettings);

      const sysTheme = await window.electronAPI.getSystemTheme();
      setSystemDark(sysTheme === 'dark');

      const history = await window.electronAPI.getVaultHistory();
      setVaultHistory(history);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();

    const unsubUnlock = window.electronAPI.onUnlockRequested((request) => {
      setUnlockRequest(request);
      setSelectedItemForEncrypt(null);
      setNotEncryptedNotice(null);
      setShowSplash(false);
    });

    const unsubEncrypt = window.electronAPI.onEncryptRequested((info) => {
      setSelectedItemForEncrypt(info);
      setUnlockRequest(null);
      setNotEncryptedNotice(null);
      setShowSplash(false);
    });

    const unsubNotice = window.electronAPI.onNotEncryptedNotice((notice) => {
      setNotEncryptedNotice(notice);
      setUnlockRequest(null);
      setSelectedItemForEncrypt(null);
      setShowSplash(false);
    });

    const unsubTheme = window.electronAPI.onThemeChanged((theme) => {
      setSystemDark(theme === 'dark');
    });

    const unsubSessions = window.electronAPI.onActiveSessionsChanged((sessions) => {
      setActiveSessions(sessions);
    });

    const unsubTempViews = window.electronAPI.onActiveTempViewsChanged((views) => {
      setTempViews(views);
    });

    window.electronAPI.isWindowMaximized().then(setIsMaximized).catch(() => {});
    const unsubMaximized = window.electronAPI.onWindowMaximizedChanged((max) => {
      setIsMaximized(max);
    });

    window.electronAPI.getAppVersion().then((v) => {
      if (v) setAppVersion(v);
    }).catch(() => {});

    // Silent background check for updates after splash/intro has settled (3.5s)
    const updateTimer = setTimeout(async () => {
      try {
        const res = await window.electronAPI.checkForUpdates();
        if (res && res.hasUpdate) {
          setUpdateInfo(res);
          setShowUpdateModal(true);
        }
      } catch {
        // Silent catch on automatic startup check
      }
    }, 3500);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedItemForEncrypt(null);
        setUnlockRequest(null);
        setNotEncryptedNotice(null);
        setIsSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(updateTimer);
      unsubUnlock();
      unsubEncrypt();
      unsubNotice();
      unsubTheme();
      unsubSessions();
      unsubTempViews();
      unsubMaximized();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const isDark =
    settings.themeMode === 'system' ? systemDark : settings.themeMode === 'dark';

  const themeClass = isDark ? 'theme-dark' : 'theme-light';
  const colorClass = `color-${settings.accentColor || 'ginger'}`;

  const handleSelectFile = async () => {
    const isDecrypt = mainMode === 'decrypt';
    const filePath = await window.electronAPI.selectFile(isDecrypt);
    if (filePath) handleItemPath(filePath);
  };

  const handleSelectFolder = async () => {
    const folderPath = await window.electronAPI.selectFolder();
    if (folderPath) handleItemPath(folderPath);
  };

  const handleItemPath = async (targetPath: string) => {
    const info = await window.electronAPI.getItemInfo(targetPath);
    if (!info) return;

    const isLocked = info.isGcrypt || info.isLockedFolder;

    if (mainMode === 'decrypt') {
      if (!isLocked) {
        // Strict: Decrypt mode only works on encrypted objects!
        setNotEncryptedNotice({
          name: info.name,
          path: info.path,
          type: info.type,
        });
        setUnlockRequest(null);
        setSelectedItemForEncrypt(null);
        return;
      }

      setUnlockRequest({
        filePath: info.path,
        fileName: info.name,
        type: info.type,
        size: info.size,
        hint: info.hint,
        isLockedFolder: info.isLockedFolder,
      });
      setSelectedItemForEncrypt(null);
      setNotEncryptedNotice(null);
    } else {
      // Encrypt mode
      if (info.isLockedFolder || info.isGcrypt) {
        setUnlockRequest({
          filePath: info.path,
          fileName: info.name,
          type: info.type,
          size: info.size,
          hint: info.hint,
          isLockedFolder: info.isLockedFolder,
          alreadyLockedWarning: true,
        });
        setSelectedItemForEncrypt(null);
        setNotEncryptedNotice(null);
        return;
      }

      setSelectedItemForEncrypt(info);
      setUnlockRequest(null);
      setNotEncryptedNotice(null);
    }
  };

  const handleUnlockHistoryItem = async (item: CryptoItem) => {
    const info = await window.electronAPI.getItemInfo(item.targetPath);
    if (!info || (!info.isLockedFolder && !info.isGcrypt)) {
      setNotEncryptedNotice({
        name: item.name,
        path: item.targetPath,
        type: item.type,
      });
      return;
    }

    setUnlockRequest({
      filePath: item.targetPath,
      fileName: item.name,
      type: item.type,
      size: item.size,
      hint: item.hint,
      isLockedFolder: item.isInPlaceFolder,
    });
  };

  const handleRelockSession = async (folderPath: string) => {
    await window.electronAPI.relockFolder(folderPath);
    loadInitialData();
  };

  const handleCloseTempView = async (tempDir: string) => {
    await window.electronAPI.closeTempView(tempDir);
  };

  const handleUpdateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = await window.electronAPI.updateSettings(newSettings);
    setSettings(updated);
  };

  const handleClearHistory = async () => {
    await window.electronAPI.clearVaultHistory();
    setVaultHistory([]);
  };

  const handleManualUpdateCheck = async () => {
    if (isCheckingUpdate) return;
    setIsCheckingUpdate(true);
    try {
      const res = await window.electronAPI.checkForUpdates();
      if (res && res.hasUpdate) {
        setUpdateInfo(res);
        setShowUpdateModal(true);
      } else {
        setUpdateToast({ message: `У вас последняя версия (v${appVersion})` });
        setTimeout(() => setUpdateToast(null), 3500);
      }
    } catch {
      setUpdateToast({ message: 'Не удалось проверить обновления', isError: true });
      setTimeout(() => setUpdateToast(null), 3500);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleDownloadUpdate = (url: string) => {
    window.electronAPI.openExternal(url);
    setShowUpdateModal(false);
  };

  return (
    <div className={`flex flex-col h-screen w-screen bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden ${themeClass} ${colorClass}`}>
      {/* Mini-Intro Splash Screen (plays intro.mp4) */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* Topbar */}
      <TitleBar
        onOpenSettings={() => setIsSettingsOpen(true)}
        closeToTray={settings.closeToTray}
        isMaximized={isMaximized}
      />

      {/* Main Content Area - Expands gracefully in fullscreen while keeping restored window compact */}
      <main
        className={`flex-1 flex flex-col overflow-hidden w-full mx-auto transition-all duration-300 ${
          isMaximized ? 'max-w-5xl lg:max-w-6xl px-10 pb-8' : 'max-w-4xl px-6 pb-6'
        }`}
      >
        <WelcomeHeader vaultCount={vaultHistory.length} isMaximized={isMaximized} />

        {/* Active Full Editing Sessions Banner */}
        {activeSessions.length > 0 && (
          <div className="mb-2 p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2 text-xs text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Открыто для работы ({activeSessions.length}):{' '}
                <strong>{activeSessions.map((s) => s.split(/[/\\]/).filter(Boolean).pop()).join(', ')}</strong>
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              {activeSessions.map((folder) => (
                <button
                  key={folder}
                  type="button"
                  onClick={() => handleRelockSession(folder)}
                  className="px-3 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center space-x-1 transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <Lock className="w-3 h-3" />
                  <span>Заблокировать</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Temporary View Sessions Banner */}
        {tempViews.length > 0 && (
          <div className="mb-2 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2 text-xs text-amber-300">
              <Eye className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                Временный просмотр ({tempViews.length}):{' '}
                <strong>{tempViews.map((v) => v.name).join(', ')}</strong>
                <span className="text-[10px] text-amber-400/70 ml-1.5 font-normal">
                  (оригинал остаётся заблокирован)
                </span>
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              {tempViews.map((v) => (
                <button
                  key={v.tempDir}
                  type="button"
                  onClick={() => handleCloseTempView(v.tempDir)}
                  className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center space-x-1 transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Завершить просмотр</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <DropZone
          onFileSelect={handleSelectFile}
          onFolderSelect={handleSelectFolder}
          onPathDropped={handleItemPath}
          mode={mainMode}
          onModeChange={setMainMode}
          isMaximized={isMaximized}
        />

        <VaultList
          items={vaultHistory}
          onUnlockItem={handleUnlockHistoryItem}
          onClearHistory={handleClearHistory}
          isMaximized={isMaximized}
        />
      </main>

      {/* Modals - Clean Overlays on top of Main UI */}
      <EncryptModal
        item={selectedItemForEncrypt}
        isOpen={!!selectedItemForEncrypt}
        onClose={() => setSelectedItemForEncrypt(null)}
        onSuccess={loadInitialData}
      />

      {unlockRequest && (
        <UnlockModal
          request={unlockRequest}
          isOpen={true}
          onClose={() => setUnlockRequest(null)}
          onSuccess={() => {
            loadInitialData();
            setUnlockRequest(null);
          }}
        />
      )}

      {notEncryptedNotice && (
        <NotEncryptedModal
          notice={notEncryptedNotice}
          isOpen={true}
          onClose={() => setNotEncryptedNotice(null)}
          onEncrypt={(notice) => {
            setNotEncryptedNotice(null);
            setMainMode('encrypt');
            window.electronAPI.getItemInfo(notice.path).then((info) => {
              if (info) setSelectedItemForEncrypt(info);
            });
          }}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Floating Status Toast for Manual Version Check */}
      {updateToast && (
        <div className="fixed bottom-12 right-4 z-50 px-4 py-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-main)] shadow-2xl flex items-center space-x-2.5 animate-in fade-in slide-in-from-bottom-2 pointer-events-none backdrop-blur-md">
          {updateToast.isError ? (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="font-medium">{updateToast.message}</span>
        </div>
      )}

      {/* Persistent Version Badge in the Bottom-Right Corner */}
      <VersionBadge
        version={appVersion}
        isChecking={isCheckingUpdate}
        hasUpdate={!!updateInfo?.hasUpdate}
        onClick={handleManualUpdateCheck}
      />

      {/* Auto-Update Modal (appears only when newer version is detected) */}
      <UpdateModal
        updateInfo={updateInfo}
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onDownload={handleDownloadUpdate}
      />
    </div>
  );
};

export default App;

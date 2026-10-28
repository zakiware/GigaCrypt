import React, { useState, useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar, NavFilter } from './components/Sidebar';
import { WorkbenchToolbar } from './components/WorkbenchToolbar';
import { VaultLedger } from './components/VaultLedger';
import { DragOverlay } from './components/DragOverlay';
import { EncryptModal } from './components/EncryptModal';
import { UnlockModal } from './components/UnlockModal';
import { SettingsModal } from './components/SettingsModal';
import { NotEncryptedModal } from './components/NotEncryptedModal';
import { SplashScreen } from './components/SplashScreen';
import { UpdateModal } from './components/UpdateModal';
import { Lock, CheckCircle2, Eye, X, AlertCircle } from 'lucide-react';
import {
  AppSettings,
  CryptoItem,
  ItemInfo,
  NotEncryptedNotice,
  TempViewInfo,
  UnlockRequest,
  UpdateInfo,
} from '../types';

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
  const [isMaximized, setIsMaximized] = useState(false);
  const [appVersion, setAppVersion] = useState('1.0.1');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateToast, setUpdateToast] = useState<{ message: string; isError?: boolean } | null>(null);

  // Desktop Navigation & Filtering
  const [currentFilter, setCurrentFilter] = useState<NavFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

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

    // Silent background check for updates after 3.5s
    const updateTimer = setTimeout(async () => {
      try {
        const res = await window.electronAPI.checkForUpdates();
        if (res && (res.available || res.hasUpdate)) {
          setUpdateInfo(res);
          setShowUpdateModal(true);
        }
      } catch {}
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

  const handleSelectFile = async (isDecrypt: boolean = false) => {
    const filePath = await window.electronAPI.selectFile(isDecrypt);
    if (filePath) handleItemPath(filePath);
  };

  const handleSelectFolder = async () => {
    const folderPath = await window.electronAPI.selectFolder();
    if (folderPath) handleItemPath(folderPath);
  };

  const handleOpenEncryptedFolder = async () => {
    const folderPath = await window.electronAPI.selectFolder();
    if (!folderPath) return;

    const info = await window.electronAPI.getItemInfo(folderPath);
    if (!info) return;

    if (info.isLockedFolder) {
      setUnlockRequest({
        filePath: info.path,
        fileName: info.name,
        type: 'folder',
        size: info.size,
        hint: info.hint,
        isLockedFolder: true,
      });
      setSelectedItemForEncrypt(null);
      setNotEncryptedNotice(null);
    } else {
      setNotEncryptedNotice({
        name: info.name,
        path: info.path,
        type: 'folder',
      });
    }
  };


  const handleItemPath = async (targetPath: string) => {
    const info = await window.electronAPI.getItemInfo(targetPath);
    if (!info) return;

    const isLocked = info.isGcrypt || info.isLockedFolder;

    if (isLocked) {
      // Direct unlock flow
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
      // Encrypt flow
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

  const handleRevealPath = (targetPath: string) => {
    window.electronAPI.openInExplorer(targetPath);
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
      if (res && (res.available || res.hasUpdate)) {
        setUpdateInfo(res);
        setShowUpdateModal(true);
      } else {
        setUpdateToast({ message: `У вас последняя версия (v${appVersion})` });
        setTimeout(() => setUpdateToast(null), 3000);
      }
    } catch {
      setUpdateToast({ message: 'Не удалось проверить обновления', isError: true });
      setTimeout(() => setUpdateToast(null), 3000);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleDownloadUpdate = (url: string) => {
    window.electronAPI.openExternal(url);
    setShowUpdateModal(false);
  };

  // Full-window drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const filePath = (file as any).path || file.name;
      if (filePath) {
        handleItemPath(filePath);
      }
    }
  };

  const folderCount = vaultHistory.filter((i) => i.isInPlaceFolder || i.type === 'folder').length;
  const fileCount = vaultHistory.length - folderCount;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col h-screen w-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] overflow-hidden ${themeClass} ${colorClass}`}
    >
      {/* Mini-Intro Splash Screen */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* Full-window Drag & Drop Fluent Overlay */}
      <DragOverlay isDragging={isDraggingOver} />

      {/* Top Titlebar */}
      <TitleBar
        onOpenSettings={() => setIsSettingsOpen(true)}
        closeToTray={settings.closeToTray}
        isMaximized={isMaximized}
      />

      {/* Desktop Master-Detail Layout */}
      <div className="flex-1 flex overflow-hidden w-full">
        {/* Left Navigation Sidebar */}
        <Sidebar
          currentFilter={currentFilter}
          onFilterChange={setCurrentFilter}
          stats={{
            total: vaultHistory.length,
            folders: folderCount,
            files: fileCount,
            tempViews: tempViews.length,
            activeSessions: activeSessions.length,
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onSelectFolder={handleSelectFolder}
          onSelectFile={() => handleSelectFile(false)}
          version={appVersion}
          onCheckUpdate={handleManualUpdateCheck}
          hasUpdate={!!(updateInfo?.available || updateInfo?.hasUpdate)}
          isCheckingUpdate={isCheckingUpdate}
        />

        {/* Right Main Workbench Canvas */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-canvas)]">
          {/* Workbench Action Toolbar */}
          <WorkbenchToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onOpenArchive={() => handleSelectFile(true)}
            onOpenEncryptedFolder={handleOpenEncryptedFolder}
            onClearHistory={handleClearHistory}
            totalCount={vaultHistory.length}
          />

          {/* Active Editing Sessions Banner */}
          {activeSessions.length > 0 && (
            <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2 text-xs text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Активно для редактирования ({activeSessions.length}):{' '}
                  <strong className="font-mono text-emerald-300">
                    {activeSessions.map((s) => s.split(/[/\\]/).filter(Boolean).pop()).join(', ')}
                  </strong>
                </span>
              </div>

              <div className="flex items-center space-x-1.5">
                {activeSessions.map((folder) => (
                  <button
                    key={folder}
                    type="button"
                    onClick={() => handleRelockSession(folder)}
                    className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium border border-emerald-500/30 flex items-center space-x-1 cursor-pointer"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Заблокировать</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Temporary View Sessions Banner */}
          {tempViews.length > 0 && currentFilter !== 'temp' && (
            <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2 text-xs text-amber-300">
                <Eye className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>
                  Открыто во временном просмотре ({tempViews.length}):{' '}
                  <strong className="font-mono text-amber-200">
                    {tempViews.map((v) => v.name).join(', ')}
                  </strong>
                  <span className="text-[10px] text-amber-400/70 ml-1.5">
                    (оригинал защищён)
                  </span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => setCurrentFilter('temp')}
                className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium cursor-pointer"
              >
                Перейти к сессиям
              </button>
            </div>
          )}

          {/* Main Structured Ledger Table */}
          <VaultLedger
            items={vaultHistory}
            tempViews={tempViews}
            activeSessions={activeSessions}
            filter={currentFilter}
            searchTerm={searchTerm}
            onUnlockItem={handleUnlockHistoryItem}
            onRevealItem={handleRevealPath}
            onCloseTempView={handleCloseTempView}
            onRelockSession={handleRelockSession}
            onSelectFolder={handleSelectFolder}
            onSelectFile={() => handleSelectFile(false)}
          />
        </main>
      </div>

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
        <div className="fixed bottom-4 right-4 z-50 px-3 py-1.5 rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] shadow-lg flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 pointer-events-none">
          {updateToast.isError ? (
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          )}
          <span className="font-medium text-[11px]">{updateToast.message}</span>
        </div>
      )}

      {/* Auto-Update Modal */}
      <UpdateModal
        updateInfo={updateInfo}
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onOpenExternal={(url) => window.electronAPI.openExternal(url)}
      />
    </div>
  );
};

export default App;

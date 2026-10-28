import React from 'react';
import {
  FolderLock,
  FileLock,
  Layers,
  Eye,
  Settings,
  Plus,
  Unlock,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { GigaIcon } from './GigaIcon';

export type NavFilter = 'all' | 'folders' | 'files' | 'temp';

interface SidebarProps {
  currentFilter: NavFilter;
  onFilterChange: (filter: NavFilter) => void;
  stats: {
    total: number;
    folders: number;
    files: number;
    tempViews: number;
    activeSessions: number;
  };
  onOpenSettings: () => void;
  onSelectFolder: () => void;
  onSelectFile: () => void;
  onOpenEncryptedFolder?: () => void;
  version: string;
  onCheckUpdate: () => void;
  hasUpdate: boolean;
  isCheckingUpdate: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentFilter,
  onFilterChange,
  stats,
  onOpenSettings,
  onSelectFolder,
  onSelectFile,
  onOpenEncryptedFolder,
  version,
  onCheckUpdate,
  hasUpdate,
  isCheckingUpdate,
}) => {
  return (
    <aside className="w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] flex flex-col justify-between select-none shrink-0 h-full">
      {/* Top Section */}
      <div className="flex flex-col p-3 space-y-4">
        {/* Workspace Brand / Header */}
        <div className="flex items-center space-x-2.5 px-2 py-1">
          <div className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-primary)] shadow-sm">
            <GigaIcon size={20} />
          </div>
          <div>
            <div className="text-xs font-bold tracking-tight text-[var(--text-primary)] flex items-center">
              Giga<span className="text-[var(--accent-primary)] ml-0.5">Crypt</span>
            </div>
            <span className="text-[9px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider block">
              AES-256 VAULT
            </span>
          </div>
        </div>

        {/* Quick Action Split Dropdown / Buttons */}
        <div className="space-y-1.5 px-1">
          <button
            type="button"
            onClick={onSelectFolder}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-md fluent-btn-primary text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Защитить папку</span>
          </button>

          <button
            type="button"
            onClick={onSelectFile}
            className="w-full flex items-center justify-center space-x-2 px-3 py-1.5 rounded-md fluent-btn-secondary text-xs cursor-pointer"
          >
            <FileLock className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span>Зашифровать файл</span>
          </button>

          {onOpenEncryptedFolder && (
            <button
              type="button"
              onClick={onOpenEncryptedFolder}
              className="w-full flex items-center justify-center space-x-2 px-3 py-1.5 rounded-md fluent-btn-secondary text-xs cursor-pointer border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/40 transition-colors"
            >
              <FolderLock className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>Открыть зашифрованную папку</span>
            </button>
          )}
        </div>

        {/* Section Divider */}
        <div className="h-px bg-[var(--border-subtle)] mx-1" />

        {/* Navigation Categories */}
        <div className="space-y-1">
          <span className="px-2 text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider block mb-1">
            Хранилище
          </span>

          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className={`nav-item justify-between ${currentFilter === 'all' ? 'active' : ''}`}
          >
            <div className="flex items-center space-x-2.5">
              <Layers className="w-4 h-4 text-[var(--text-secondary)]" />
              <span>Все объекты</span>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
              {stats.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange('folders')}
            className={`nav-item justify-between ${currentFilter === 'folders' ? 'active' : ''}`}
          >
            <div className="flex items-center space-x-2.5">
              <FolderLock className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>Каталоги</span>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
              {stats.folders}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange('files')}
            className={`nav-item justify-between ${currentFilter === 'files' ? 'active' : ''}`}
          >
            <div className="flex items-center space-x-2.5">
              <FileLock className="w-4 h-4 text-[var(--text-secondary)]" />
              <span>Файлы</span>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
              {stats.files}
            </span>
          </button>

          {/* Temp view sessions */}
          <button
            type="button"
            onClick={() => onFilterChange('temp')}
            className={`nav-item justify-between ${currentFilter === 'temp' ? 'active' : ''} ${
              stats.tempViews > 0 ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Eye className={`w-4 h-4 ${stats.tempViews > 0 ? 'text-amber-400' : 'text-[var(--text-secondary)]'}`} />
              <span>Песочницы</span>
            </div>
            {stats.tempViews > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300">
                {stats.tempViews}
              </span>
            ) : (
              <span className="text-[11px] font-mono text-[var(--text-tertiary)]">0</span>
            )}
          </button>
        </div>
      </div>

      {/* Sidebar Footer with Settings & App Version / Update Check */}
      <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)] space-y-2">
        {/* Settings button - The ONLY settings button in the app */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer text-xs"
        >
          <Settings className="w-4 h-4 text-[var(--text-tertiary)]" />
          <span className="font-medium">Параметры системы</span>
        </button>

        {/* Version Badge & Update Checker */}
        <div className="flex items-center justify-between px-2 pt-1 border-t border-[var(--border-subtle)]">
          <div className="flex items-center space-x-1.5">
            <Shield className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span className="font-mono text-[11px] text-[var(--text-tertiary)]">v{version}</span>
          </div>

          <button
            type="button"
            onClick={onCheckUpdate}
            disabled={isCheckingUpdate}
            className="flex items-center space-x-1 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer disabled:opacity-50"
            title="Проверить наличие обновлений на GitHub"
          >
            <RefreshCw className={`w-3 h-3 ${isCheckingUpdate ? 'animate-spin text-[var(--accent-primary)]' : ''}`} />
            <span>{isCheckingUpdate ? 'Проверка...' : hasUpdate ? 'Есть обновление' : 'Обновления'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

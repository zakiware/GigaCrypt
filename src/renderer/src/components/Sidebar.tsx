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
  version,
  onCheckUpdate,
  hasUpdate,
  isCheckingUpdate,
}) => {
  return (
    <aside className="w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] flex flex-col justify-between select-none shrink-0 h-full">
      {/* Top Section */}
      <div className="flex flex-col p-3 space-y-4">
        {/* Brand Identity */}
        <div className="flex items-center space-x-2.5 px-2 pt-1 pb-2">
          <GigaIcon size={24} />
          <div className="flex flex-col leading-none">
            <span className="font-bold text-sm tracking-tight text-[var(--text-primary)]">
              Giga<span className="text-[var(--accent-primary)]">Crypt</span>
            </span>
            <span className="text-[10px] text-[var(--text-tertiary)] mt-1 font-mono">
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
              <span>Временный просмотр</span>
            </div>
            {stats.tempViews > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 font-bold">
                {stats.tempViews}
              </span>
            ) : (
              <span className="text-[11px] font-mono text-[var(--text-tertiary)]">0</span>
            )}
          </button>
        </div>
      </div>

      {/* Footer Section: Settings & Version */}
      <div className="p-3 border-t border-[var(--border-subtle)] space-y-1">
        <button
          type="button"
          onClick={onOpenSettings}
          className="nav-item justify-between hover:bg-white/5"
        >
          <div className="flex items-center space-x-2.5">
            <Settings className="w-4 h-4 text-[var(--text-secondary)]" />
            <span>Параметры</span>
          </div>
        </button>

        <div className="flex items-center justify-between px-2 pt-2 text-[11px] text-[var(--text-tertiary)]">
          <button
            type="button"
            onClick={onCheckUpdate}
            title="Проверить наличие обновлений"
            className="flex items-center space-x-1.5 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            {isCheckingUpdate ? (
              <RefreshCw className="w-3 h-3 animate-spin text-[var(--accent-primary)]" />
            ) : hasUpdate ? (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            )}
            <span className="font-mono text-[10px]">v{version}</span>
            {hasUpdate && (
              <span className="text-[9px] font-bold text-amber-400 ml-1">UP</span>
            )}
          </button>

          <span className="font-mono text-[9px] text-[var(--text-tertiary)]">
            WIN32-X64
          </span>
        </div>
      </div>
    </aside>
  );
};

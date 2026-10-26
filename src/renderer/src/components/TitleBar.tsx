import React from 'react';
import { Minus, Square, Copy, X, Settings as SettingsIcon } from 'lucide-react';
import { GigaIcon } from './GigaIcon';

interface TitleBarProps {
  onOpenSettings: () => void;
  closeToTray: boolean;
  isMaximized?: boolean;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  onOpenSettings,
  closeToTray,
  isMaximized = false,
}) => {
  const handleMinimize = () => window.electronAPI.minimizeWindow();
  const handleMaximize = () => window.electronAPI.maximizeWindow();
  const handleClose = () => window.electronAPI.closeWindow();

  return (
    <header
      className={`w-full bg-[var(--bg-main)]/90 border-b border-[var(--border-color)] flex items-center justify-between select-none app-drag z-50 transition-all ${
        isMaximized ? 'h-12 pl-4 pr-0' : 'h-10 px-3'
      }`}
    >
      {/* Brand & Minimalist Icon */}
      <div className="flex items-center space-x-2.5 app-no-drag">
        <GigaIcon size={isMaximized ? 26 : 22} />
        <span
          className={`font-extrabold tracking-tight text-[var(--text-main)] flex items-center transition-all ${
            isMaximized ? 'text-base' : 'text-sm'
          }`}
        >
          Giga<span className="text-[var(--accent-primary)]">Crypt</span>
        </span>

        <div className="h-3.5 w-px bg-[var(--border-color)] mx-1" />

        <div className="flex items-center space-x-1.5 text-[11px] text-[var(--text-muted)] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span>Активно</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center app-no-drag">
        {/* Settings button */}
        <div className={isMaximized ? 'mr-2' : 'mr-1'}>
          <button
            onClick={onOpenSettings}
            title="Настройки"
            className={`flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)] transition-colors cursor-pointer ${
              isMaximized ? 'w-9 h-9 rounded-xl' : 'w-7 h-7 rounded-lg'
            }`}
          >
            <SettingsIcon className={isMaximized ? 'w-4.5 h-4.5' : 'w-3.5 h-3.5'} />
          </button>
        </div>

        <div className="h-4 w-px bg-[var(--border-color)] mx-1" />

        {/* Window action buttons (Minimize, Maximize/Restore, Close) */}
        {isMaximized ? (
          <div className="flex items-center h-12">
            <button
              onClick={handleMinimize}
              title="Свернуть"
              className="w-12 h-12 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>

            <button
              onClick={handleMaximize}
              title="Восстановить в окно"
              className="w-12 h-12 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Copy className="w-4 h-4 rotate-180" />
            </button>

            <button
              onClick={handleClose}
              title={closeToTray ? 'Свернуть в системный трей' : 'Закрыть программу'}
              className="w-12 h-12 flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-red-600 transition-colors cursor-pointer group"
            >
              <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-1">
            <button
              onClick={handleMinimize}
              title="Свернуть"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)] transition-colors cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleMaximize}
              title="Развернуть"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)] transition-colors cursor-pointer"
            >
              <Square className="w-3 h-3" />
            </button>

            <button
              onClick={handleClose}
              title={closeToTray ? 'Свернуть в системный трей' : 'Закрыть программу'}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-red-500/80 transition-colors group cursor-pointer"
            >
              <X className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

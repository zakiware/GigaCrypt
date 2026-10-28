import React from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';
import { GigaIcon } from './GigaIcon';

interface TitleBarProps {
  onOpenSettings?: () => void;
  closeToTray: boolean;
  isMaximized?: boolean;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  closeToTray,
  isMaximized = false,
}) => {
  const handleMinimize = () => window.electronAPI.minimizeWindow();
  const handleMaximize = () => window.electronAPI.maximizeWindow();
  const handleClose = () => window.electronAPI.closeWindow();

  return (
    <header
      className={`w-full bg-[var(--bg-main)] border-b border-[var(--border-color)] flex items-center justify-between select-none app-drag z-50 transition-all ${
        isMaximized ? 'h-10 pl-3.5 pr-0' : 'h-10 pl-3.5 pr-0'
      }`}
    >
      {/* Brand & Minimalist Icon */}
      <div className="flex items-center space-x-2 app-no-drag">
        <GigaIcon size={isMaximized ? 22 : 20} />
        <span
          className={`font-semibold tracking-tight text-[var(--text-main)] flex items-center transition-all ${
            isMaximized ? 'text-sm' : 'text-xs'
          }`}
        >
          Giga<span className="text-[var(--accent-primary)] font-bold">Crypt</span>
        </span>
      </div>

      {/* Center Drag Region */}
      <div className="flex-1 h-full" />

      {/* Controls */}
      <div className="flex items-center app-no-drag">
        {/* Windows caption buttons */}
        <button
          onClick={handleMinimize}
          title="Свернуть"
          className="w-10 h-10 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleMaximize}
          title={isMaximized ? 'Восстановить в окно' : 'Развернуть на весь экран'}
          className="w-10 h-10 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/10 transition-colors cursor-pointer"
        >
          {isMaximized ? (
            <Copy className="w-3.5 h-3.5 rotate-180" />
          ) : (
            <Square className="w-3 h-3" />
          )}
        </button>

        <button
          onClick={handleClose}
          title={closeToTray ? 'Свернуть в системный трей' : 'Закрыть программу'}
          className="w-10 h-10 flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-red-600 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

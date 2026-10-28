import React, { useState, DragEvent } from 'react';
import { FolderLock, FileLock, FolderOpen, FileCheck, Lock, Unlock, ArrowDownToLine } from 'lucide-react';

interface DropZoneProps {
  onFileSelect: () => void;
  onFolderSelect: () => void;
  onPathDropped: (path: string) => void;
  mode: 'encrypt' | 'decrypt';
  onModeChange: (m: 'encrypt' | 'decrypt') => void;
  isMaximized?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFileSelect,
  onFolderSelect,
  onPathDropped,
  mode,
  onModeChange,
  isMaximized = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  return (
    <div className={`space-y-3 transition-all ${isMaximized ? 'mb-4' : 'mb-3'}`}>
      {/* Mode Switcher - Linear/Raycast-style Segmented Control */}
      <div className="flex items-center justify-between">
        <div className="inline-flex p-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]">
          <button
            type="button"
            onClick={() => onModeChange('encrypt')}
            className={`flex items-center space-x-2 font-medium transition-all cursor-pointer ${
              isMaximized ? 'px-4 py-1.5 text-xs rounded-md' : 'px-3 py-1 text-xs rounded-md'
            } ${
              mode === 'encrypt'
                ? 'bg-[var(--accent-primary)] text-zinc-950 font-semibold shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Шифрование</span>
          </button>

          <button
            type="button"
            onClick={() => onModeChange('decrypt')}
            className={`flex items-center space-x-2 font-medium transition-all cursor-pointer ${
              isMaximized ? 'px-4 py-1.5 text-xs rounded-md' : 'px-3 py-1 text-xs rounded-md'
            } ${
              mode === 'decrypt'
                ? 'bg-[var(--accent-primary)] text-zinc-950 font-semibold shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5'
            }`}
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>Дешифрация</span>
          </button>
        </div>

        <span className="text-[11px] text-[var(--text-muted)]">
          {mode === 'encrypt' ? 'Режим защиты данных' : 'Режим разблокировки'}
        </span>
      </div>

      {/* Main Drag & Drop Surface */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            const filePath = (file as any).path || file.name;
            if (filePath) {
              onPathDropped(filePath);
            }
          }
        }}
        className={`relative rounded-xl border border-dashed transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer ${
          isMaximized ? 'p-8' : 'p-5'
        } ${
          isDragOver
            ? 'border-[var(--accent-primary)] bg-[var(--accent-glow-bg)] scale-[1.005]'
            : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--border-color-hover)] hover:bg-[var(--bg-card-hover)]'
        }`}
      >
        <div
          className={`rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] mb-2.5 transition-all ${
            isMaximized ? 'w-11 h-11' : 'w-9 h-9'
          }`}
        >
          {mode === 'encrypt' ? (
            <ArrowDownToLine className={isMaximized ? 'w-5 h-5 text-[var(--accent-primary)]' : 'w-4 h-4 text-[var(--accent-primary)]'} />
          ) : (
            <Unlock className={isMaximized ? 'w-5 h-5 text-[var(--accent-primary)]' : 'w-4 h-4 text-[var(--accent-primary)]'} />
          )}
        </div>

        <h3
          className={`font-semibold text-[var(--text-main)] tracking-tight transition-all ${
            isMaximized ? 'text-sm' : 'text-xs'
          }`}
        >
          {mode === 'encrypt'
            ? 'Перетащите файл или папку для мгновенной защиты'
            : 'Перетащите зашифрованный объект для открытия'}
        </h3>
        <p
          className={`text-[var(--text-muted)] max-w-sm transition-all ${
            isMaximized ? 'text-xs mt-1 mb-5' : 'text-[11px] mt-0.5 mb-3.5'
          }`}
        >
          {mode === 'encrypt'
            ? 'Шифрование происходит на месте с нулевым копированием'
            : 'Поддерживаются файлы .gcrypt и защищённые каталоги'}
        </p>

        {/* Action Buttons */}
        <div className={`flex items-center justify-center gap-2.5 w-full ${isMaximized ? 'max-w-md' : 'max-w-sm'}`}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFolderSelect();
            }}
            className={`flex-1 font-medium flex items-center justify-center space-x-2 rounded-lg primary-btn cursor-pointer transition-all ${
              isMaximized ? 'px-4 py-2.5 text-xs' : 'px-3 py-2 text-xs'
            }`}
          >
            <FolderLock className="w-3.5 h-3.5 shrink-0" />
            <span>{mode === 'encrypt' ? 'Выбрать папку' : 'Открыть папку'}</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFileSelect();
            }}
            className={`flex-1 font-medium flex items-center justify-center space-x-2 rounded-lg secondary-btn cursor-pointer transition-all ${
              isMaximized ? 'px-4 py-2.5 text-xs' : 'px-3 py-2 text-xs'
            }`}
          >
            <FileLock className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
            <span>{mode === 'encrypt' ? 'Выбрать файл' : 'Выбрать файл'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

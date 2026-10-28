import React from 'react';
import { Search, FolderLock, FileLock, Trash2 } from 'lucide-react';

interface WorkbenchToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onOpenArchive: () => void;
  onOpenEncryptedFolder: () => void;
  onClearHistory: () => void;
  totalCount: number;
}

export const WorkbenchToolbar: React.FC<WorkbenchToolbarProps> = ({
  searchTerm,
  onSearchChange,
  onOpenArchive,
  onOpenEncryptedFolder,
  onClearHistory,
  totalCount,
}) => {
  return (
    <div className="h-12 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-4 flex items-center justify-between shrink-0 select-none">
      {/* Search Bar */}
      <div className="flex items-center space-x-3 flex-1 max-w-xs md:max-w-sm">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Поиск по названию или расположению..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[var(--bg-input)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] focus:outline-none text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-colors"
          />
        </div>
      </div>

      {/* Right Actions: Distinct Buttons for Encrypted Folder & Encrypted File */}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={onOpenEncryptedFolder}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md fluent-btn-secondary text-xs cursor-pointer border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/40 transition-colors"
          title="Выбрать заблокированную папку для разблокировки или просмотра"
        >
          <FolderLock className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
          <span>Открыть зашифрованную папку</span>
        </button>

        <button
          type="button"
          onClick={onOpenArchive}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md fluent-btn-secondary text-xs cursor-pointer"
          title="Выбрать файл .gcrypt для расшифровки"
        >
          <FileLock className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
          <span>Открыть зашифрованный файл</span>
        </button>

        {totalCount > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors cursor-pointer"
            title="Очистить историю недавних объектов"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

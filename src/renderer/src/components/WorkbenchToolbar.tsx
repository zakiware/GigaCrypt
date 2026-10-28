import React from 'react';
import { Search, Unlock, Trash2, ShieldCheck, FolderSearch } from 'lucide-react';

interface WorkbenchToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onOpenArchive: () => void;
  onClearHistory: () => void;
  totalCount: number;
}

export const WorkbenchToolbar: React.FC<WorkbenchToolbarProps> = ({
  searchTerm,
  onSearchChange,
  onOpenArchive,
  onClearHistory,
  totalCount,
}) => {
  return (
    <div className="h-12 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-4 flex items-center justify-between shrink-0 select-none">
      {/* Search Bar */}
      <div className="flex items-center space-x-3 flex-1 max-w-md">
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

      {/* Right Actions */}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={onOpenArchive}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md fluent-btn-secondary text-xs cursor-pointer"
          title="Выбрать существующий .gcrypt или заблокированную папку для расшифровки"
        >
          <Unlock className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          <span>Открыть зашифрованный объект</span>
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

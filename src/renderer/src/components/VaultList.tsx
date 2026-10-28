import React, { useState } from 'react';
import {
  FolderLock,
  FileLock,
  FolderOpen,
  Unlock,
  Search,
  ShieldAlert,
  Clock,
  HardDrive,
} from 'lucide-react';
import { CryptoItem } from '../../types';

interface VaultListProps {
  items: CryptoItem[];
  onUnlockItem: (item: CryptoItem) => void;
  onClearHistory: () => void;
  isMaximized?: boolean;
}

export const VaultList: React.FC<VaultListProps> = ({
  items,
  onUnlockItem,
  onClearHistory,
  isMaximized = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.targetPath.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReveal = (targetPath: string) => {
    window.electronAPI.openInExplorer(targetPath);
  };

  return (
    <div className={`flex-1 flex flex-col min-h-0 transition-all ${isMaximized ? 'mt-3' : 'mt-1'}`}>
      {/* Table Header & Search */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Недавние хранилища
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10 text-[var(--text-muted)]">
            {items.length}
          </span>
        </div>

        {items.length > 0 && (
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Поиск по названию или пути..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-8 pr-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:outline-none text-xs text-[var(--text-main)] placeholder-zinc-500 transition-all ${
                  isMaximized ? 'py-1 w-56' : 'py-1 w-44'
                }`}
              />
            </div>

            <button
              onClick={onClearHistory}
              className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-main)] px-2 py-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
            >
              Очистить список
            </button>
          </div>
        )}
      </div>

      {/* List Container */}
      {filteredItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center">
          <HardDrive className="w-6 h-6 text-[var(--text-muted)] mb-2 opacity-50" />
          <p className="text-xs font-medium text-[var(--text-secondary)]">
            {searchTerm ? 'Ничего не найдено по запросу' : 'Список недавних объектов пуст'}
          </p>
          <p className="text-[11px] text-[var(--text-muted)] max-w-xs mt-0.5">
            {searchTerm ? 'Попробуйте изменить поисковую фразу' : 'Зашифрованные файлы и каталоги появятся здесь для быстрого доступа'}
          </p>
        </div>
      ) : (
        <div className={`flex-1 overflow-y-auto pr-1 transition-all space-y-1.5`}>
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--border-color-hover)] hover:bg-[var(--bg-card-hover)] flex items-center justify-between gap-3 group transition-all ${
                isMaximized ? 'p-3' : 'p-2.5'
              }`}
            >
              {/* Left Info */}
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div
                  className={`rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] shrink-0 transition-all ${
                    isMaximized ? 'w-9 h-9' : 'w-8 h-8'
                  }`}
                >
                  {item.type === 'folder' ? (
                    <FolderLock className="w-4 h-4 text-[var(--accent-primary)]" />
                  ) : (
                    <FileLock className="w-4 h-4 text-[var(--accent-primary)]" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-xs text-[var(--text-main)] truncate">
                      {item.name}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-[var(--text-muted)]">
                      {item.isInPlaceFolder ? 'DIR' : 'FILE'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-[10px] text-[var(--text-muted)] mt-0.5 truncate font-mono">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 opacity-70" />
                      {formatDate(item.encryptedAt)}
                    </span>
                    {item.hint && (
                      <span className="text-[var(--accent-primary)] truncate font-sans">
                        Подсказка: {item.hint}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleReveal(item.targetPath)}
                  title="Показать в проводнике Windows"
                  className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onUnlockItem(item)}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-[var(--accent-glow-bg)] border border-[var(--border-accent)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-zinc-950 flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Unlock className="w-3 h-3" />
                  <span>Открыть</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

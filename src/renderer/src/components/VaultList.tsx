import React, { useState } from 'react';
import {
  FolderLock,
  FileLock,
  FolderOpen,
  Unlock,
  Search,
  ShieldCheck,
  Clock,
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
    <div className={`flex-1 flex flex-col min-h-0 transition-all ${isMaximized ? 'mt-4' : 'mt-2'}`}>
      {/* Header & Search */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center space-x-2">
          <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center">
            <span>Недавние объекты</span>
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-[var(--accent-glow-bg)] text-[var(--accent-primary)] font-bold">
              {items.length}
            </span>
          </h2>
        </div>

        {items.length > 0 && (
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-8 pr-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:outline-none text-xs text-[var(--text-main)] placeholder-gray-500 transition-all ${
                  isMaximized ? 'py-1.5 w-48' : 'py-1 w-36'
                }`}
              />
            </div>

            <button
              onClick={onClearHistory}
              className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
            >
              Очистить
            </button>
          </div>
        )}
      </div>

      {/* List Container */}
      {filteredItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center">
          <div className="w-10 h-10 rounded-2xl bg-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] mb-2">
            <ShieldCheck className="w-5 h-5 text-[var(--accent-primary)]" />
          </div>
          <p className="text-xs font-semibold text-[var(--text-secondary)]">
            {searchTerm ? 'Ничего не найдено' : 'Нет защищённых объектов'}
          </p>
          <p className="text-[11px] text-[var(--text-muted)] max-w-xs mt-0.5">
            {searchTerm ? 'Проверьте запрос' : 'Выберите любую папку выше, чтобы защитить её на месте'}
          </p>
        </div>
      ) : (
        <div className={`flex-1 overflow-y-auto pr-1 transition-all ${isMaximized ? 'space-y-2' : 'space-y-1.5'}`}>
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`glass-card rounded-2xl flex items-center justify-between gap-3 group transition-all ${
                isMaximized ? 'p-3.5' : 'p-2.5'
              }`}
            >
              {/* Left Info */}
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div
                  className={`bg-[var(--accent-glow-bg)] flex items-center justify-center text-[var(--accent-primary)] shrink-0 transition-all ${
                    isMaximized ? 'w-10 h-10 rounded-xl' : 'w-8 h-8 rounded-xl'
                  }`}
                >
                  {item.type === 'folder' ? (
                    <FolderLock className={isMaximized ? 'w-5 h-5' : 'w-4 h-4'} />
                  ) : (
                    <FileLock className={isMaximized ? 'w-5 h-5' : 'w-4 h-4'} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`font-semibold text-[var(--text-main)] truncate ${
                        isMaximized ? 'text-sm' : 'text-xs'
                      }`}
                    >
                      {item.name}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--accent-glow-bg)] text-[var(--accent-primary)] font-medium">
                      {item.isInPlaceFolder ? 'Папка' : 'Файл'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2.5 text-[10px] text-[var(--text-muted)] mt-0.5 truncate">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-0.5" />
                      {formatDate(item.encryptedAt)}
                    </span>
                    {item.hint && (
                      <span className="text-[var(--accent-primary)] truncate font-medium">
                        Подсказка: {item.hint}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleReveal(item.targetPath)}
                  title="Показать в проводнике"
                  className={`rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)] transition-colors cursor-pointer ${
                    isMaximized ? 'p-2' : 'p-1.5'
                  }`}
                >
                  <FolderOpen className={isMaximized ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
                </button>

                <button
                  type="button"
                  onClick={() => onUnlockItem(item)}
                  className={`bg-[var(--accent-glow-bg)] border border-[var(--border-accent)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white font-bold flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer ${
                    isMaximized ? 'px-3.5 py-2 text-xs rounded-xl' : 'px-2.5 py-1.5 text-xs rounded-xl'
                  }`}
                >
                  <Unlock className={isMaximized ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
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

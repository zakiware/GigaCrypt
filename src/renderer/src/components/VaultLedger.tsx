import React, { useState } from 'react';
import {
  FolderLock,
  FileLock,
  FolderOpen,
  Unlock,
  Clock,
  Eye,
  X,
  HardDrive,
  Loader2,
} from 'lucide-react';
import { CryptoItem, TempViewInfo } from '../../types';

interface VaultLedgerProps {
  items: CryptoItem[];
  tempViews: TempViewInfo[];
  activeSessions: string[];
  filter: 'all' | 'folders' | 'files' | 'temp';
  searchTerm: string;
  onUnlockItem: (item: CryptoItem) => void;
  onRevealItem: (path: string) => void;
  onCloseTempView: (tempDir: string) => void;
  onRelockSession: (folderPath: string) => void;
  onSelectFolder: () => void;
  onSelectFile: () => void;
}

export const VaultLedger: React.FC<VaultLedgerProps> = ({
  items,
  tempViews,
  activeSessions,
  filter,
  searchTerm,
  onUnlockItem,
  onRevealItem,
  onCloseTempView,
  onRelockSession,
  onSelectFolder,
  onSelectFile,
}) => {
  const [closingDirs, setClosingDirs] = useState<Set<string>>(new Set());

  const handleCloseTemp = (tempDir: string) => {
    setClosingDirs((prev) => new Set(prev).add(tempDir));
    onCloseTempView(tempDir);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    if (filter === 'folders' && !item.isInPlaceFolder && item.type !== 'folder') return false;
    if (filter === 'files' && (item.isInPlaceFolder || item.type === 'folder')) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.targetPath.toLowerCase().includes(q) ||
        (item.hint && item.hint.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Dedicated view for Temporary Sessions
  if (filter === 'temp') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-canvas)]">
        {tempViews.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
            <Eye className="w-8 h-8 text-[var(--text-tertiary)] mb-2 opacity-50" />
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              Нет активных сессий временного просмотра
            </h4>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mt-1">
              Временный просмотр позволяет открывать зашифрованные файлы в изолированной песочнице без расшифровки оригинала.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div className="h-8 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 flex items-center text-[11px] font-semibold text-[var(--text-tertiary)] select-none shrink-0">
              <div className="w-[30%] min-w-[160px] pr-2">Имя хранилища</div>
              <div className="flex-1 min-w-[200px] pr-2">Временная песочница</div>
              <div className="w-[120px] shrink-0 text-right">Действия</div>
            </div>

            <div className="divide-y divide-[var(--border-subtle)]">
              {tempViews.map((v) => (
                <div
                  key={v.tempDir}
                  className="px-4 py-2.5 flex items-center text-xs hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <div className="w-[30%] min-w-[160px] pr-2 flex items-center space-x-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />
                    <span className="font-semibold text-[var(--text-primary)] truncate">{v.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 font-medium">
                      SANDBOX
                    </span>
                  </div>

                  <div className="flex-1 min-w-[200px] pr-2 font-mono text-[11px] text-[var(--text-tertiary)] truncate">
                    {v.tempDir}
                  </div>

                  <div className="w-[120px] shrink-0 flex items-center justify-end space-x-1.5">
                    <button
                      type="button"
                      onClick={() => onRevealItem(v.tempDir)}
                      className="p-1 rounded text-[var(--text-tertiary)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Открыть песочницу в Проводнике Windows"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={closingDirs.has(v.tempDir)}
                      onClick={() => handleCloseTemp(v.tempDir)}
                      className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium text-xs flex items-center space-x-1 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {closingDirs.has(v.tempDir) ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Закрытие...</span>
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3" />
                          <span>Завершить</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Regular Ledger Table View
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-canvas)]">
      {/* Table Column Headers - Bulletproof Flexbox Layout */}
      <div className="h-8 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 flex items-center text-[11px] font-semibold text-[var(--text-tertiary)] select-none shrink-0">
        <div className="w-[32%] min-w-[180px] pr-3">Объект</div>
        <div className="w-[130px] shrink-0 pr-3">Тип</div>
        <div className="flex-1 min-w-[140px] pr-3">Расположение</div>
        <div className="w-[140px] shrink-0 font-mono pr-3">Дата защиты</div>
        <div className="w-[110px] shrink-0 text-right">Действия</div>
      </div>

      {/* Rows Container */}
      <div className="flex-1 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center select-none">
            <HardDrive className="w-10 h-10 text-[var(--text-tertiary)] mb-3 opacity-30" />
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              {searchTerm ? 'Ничего не найдено' : 'В хранилище пока нет защищённых объектов'}
            </h4>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mt-1 mb-4">
              {searchTerm
                ? 'Проверьте правильность поискового запроса'
                : 'Защитите любой каталог или файл на месте — данные будут мгновенно зашифрованы алгоритмом AES-256-GCM.'}
            </p>

            {!searchTerm && (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onSelectFolder}
                  className="px-3.5 py-1.5 rounded-md fluent-btn-primary text-xs font-semibold cursor-pointer"
                >
                  Защитить каталог
                </button>
                <button
                  type="button"
                  onClick={onSelectFile}
                  className="px-3.5 py-1.5 rounded-md fluent-btn-secondary text-xs cursor-pointer"
                >
                  Зашифровать файл
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {filteredItems.map((item) => {
              const isFolder = item.isInPlaceFolder || item.type === 'folder';
              const isSessionActive = activeSessions.includes(item.targetPath);

              return (
                <div
                  key={item.id}
                  onDoubleClick={() => onUnlockItem(item)}
                  className={`ledger-row px-4 py-2.5 flex items-center text-xs group cursor-pointer ${
                    isSessionActive ? 'bg-emerald-500/10' : ''
                  }`}
                >
                  {/* Name & Icon (w-[32%]) */}
                  <div className="w-[32%] min-w-[180px] pr-3 flex items-center space-x-2.5 min-w-0">
                    {isFolder ? (
                      <FolderLock className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                    ) : (
                      <FileLock className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-primary)] transition-colors">
                          {item.name}
                        </span>
                        {item.hint && (
                          <span
                            title={`Подсказка: ${item.hint}`}
                            className="px-1.5 py-0.2 rounded text-[10px] bg-white/5 border border-white/10 text-[var(--text-tertiary)] truncate max-w-[120px]"
                          >
                            {item.hint}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Type (w-[130px]) */}
                  <div className="w-[130px] shrink-0 pr-3">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[var(--text-secondary)]">
                      {isFolder ? 'КАТАЛОГ' : 'АРХИВ .GCRYPT'}
                    </span>
                  </div>

                  {/* Path (flex-1) */}
                  <div className="flex-1 min-w-[140px] pr-3 min-w-0">
                    <span
                      title={item.targetPath}
                      className="font-mono text-[11px] text-[var(--text-tertiary)] truncate block"
                    >
                      {item.targetPath}
                    </span>
                  </div>

                  {/* Date (w-[140px]) */}
                  <div className="w-[140px] shrink-0 pr-3 font-mono text-[11px] text-[var(--text-tertiary)] flex items-center space-x-1.5">
                    <Clock className="w-3 h-3 opacity-60 shrink-0" />
                    <span className="truncate">{formatDate(item.encryptedAt)}</span>
                  </div>

                  {/* Actions (w-[110px] fixed width, zero wrapping!) */}
                  <div className="w-[110px] shrink-0 flex items-center justify-end space-x-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRevealItem(item.targetPath);
                      }}
                      title="Показать в Проводнике Windows"
                      className="p-1 rounded text-[var(--text-tertiary)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnlockItem(item);
                      }}
                      title="Открыть / Разблокировать"
                      className="px-2.5 py-1 rounded bg-[var(--accent-subtle)] hover:bg-[var(--accent-primary)] text-[var(--accent-primary)] hover:text-zinc-950 font-medium text-[11px] transition-colors cursor-pointer shrink-0"
                    >
                      Открыть
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

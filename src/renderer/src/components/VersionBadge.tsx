import React from 'react';
import { RefreshCw, Check } from 'lucide-react';

interface VersionBadgeProps {
  version: string;
  isChecking?: boolean;
  hasUpdate?: boolean;
  onClick: () => void;
}

export const VersionBadge: React.FC<VersionBadgeProps> = ({
  version,
  isChecking = false,
  hasUpdate = false,
  onClick,
}) => {
  return (
    <div className="fixed bottom-2.5 right-3.5 z-40 select-none">
      <button
        type="button"
        onClick={onClick}
        title={hasUpdate ? 'Доступна новая версия' : `GigaCrypt v${version} • Нажмите для проверки`}
        className={`px-2.5 py-1 rounded-md border flex items-center space-x-1.5 text-xs transition-all cursor-pointer ${
          hasUpdate
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
            : 'bg-[var(--bg-surface)]/90 hover:bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] shadow-sm'
        }`}
      >
        {isChecking ? (
          <RefreshCw className="w-2.5 h-2.5 animate-spin text-[var(--accent-primary)]" />
        ) : hasUpdate ? (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse" />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
        )}

        <span className="font-mono text-[10px] tracking-tight">
          v{version}
        </span>

        {hasUpdate && (
          <span className="text-[9px] font-mono font-bold px-1 py-0.1 rounded bg-amber-500 text-zinc-950 ml-0.5">
            UPDATE
          </span>
        )}
      </button>
    </div>
  );
};

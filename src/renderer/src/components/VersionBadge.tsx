import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

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
    <div className="fixed bottom-3 right-4 z-40 select-none">
      <button
        type="button"
        onClick={onClick}
        title={hasUpdate ? 'Доступно обновление! Нажмите для просмотра' : `GigaCrypt v${version} • Нажмите для проверки обновлений`}
        className={`px-3 py-1.5 rounded-full border flex items-center space-x-2 text-xs font-semibold backdrop-blur-md transition-all shadow-md active:scale-95 cursor-pointer ${
          hasUpdate
            ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/50 text-amber-300 animate-pulse'
            : 'bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border-[var(--border-color)] hover:border-[var(--border-accent)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
        }`}
      >
        {isChecking ? (
          <RefreshCw className="w-3 h-3 animate-spin text-[var(--accent-primary)]" />
        ) : hasUpdate ? (
          <Sparkles className="w-3 h-3 text-amber-400" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
        )}

        <span className="font-mono text-[11px] tracking-tight">
          v{version}
        </span>

        {hasUpdate && (
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500 text-black">
            NEW
          </span>
        )}
      </button>
    </div>
  );
};

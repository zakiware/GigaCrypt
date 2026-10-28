import React from 'react';
import { ShieldCheck, Database, Lock } from 'lucide-react';

interface WelcomeHeaderProps {
  vaultCount: number;
  isMaximized?: boolean;
}

export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ vaultCount, isMaximized = false }) => {
  return (
    <div className={`transition-all border-b border-[var(--border-color)] ${isMaximized ? 'pt-5 pb-4 mb-4' : 'pt-3 pb-3 mb-3'}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1
              className={`font-semibold tracking-tight text-[var(--text-main)] transition-all ${
                isMaximized ? 'text-xl lg:text-2xl' : 'text-base font-bold'
              }`}
            >
              Защищённое хранилище
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-[var(--accent-glow-bg)] text-[var(--accent-primary)] border border-[var(--border-accent)]">
              AES-256-GCM
            </span>
          </div>
          <p
            className={`text-[var(--text-muted)] mt-0.5 transition-all ${
              isMaximized ? 'text-xs' : 'text-[11px]'
            }`}
          >
            Локальная криптографическая защита файлов и каталогов без создания дубликатов
          </p>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-2">
          <div
            className={`rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center space-x-2 text-[var(--text-secondary)] transition-all ${
              isMaximized ? 'px-3 py-1.5 text-xs' : 'px-2.5 py-1 text-[11px]'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="font-mono text-[var(--text-main)]">{vaultCount}</span>
            <span className="text-[var(--text-muted)]">
              {vaultCount === 1 ? 'объект' : vaultCount > 1 && vaultCount < 5 ? 'объекта' : 'объектов'}
            </span>
          </div>

          <div
            className={`rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center space-x-1.5 text-[var(--text-secondary)] transition-all ${
              isMaximized ? 'px-3 py-1.5 text-xs' : 'px-2.5 py-1 text-[11px]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            <span className="text-[var(--text-muted)]">Готов к работе</span>
          </div>
        </div>
      </div>
    </div>
  );
};

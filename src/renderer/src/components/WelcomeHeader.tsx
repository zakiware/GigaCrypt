import React from 'react';
import { ShieldCheck, HardDrive } from 'lucide-react';

interface WelcomeHeaderProps {
  vaultCount: number;
  isMaximized?: boolean;
}

export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ vaultCount, isMaximized = false }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Доброе утро';
    if (hour >= 12 && hour < 18) return 'Добрый день';
    if (hour >= 18 && hour < 23) return 'Добрый вечер';
    return 'Доброй ночи';
  };

  return (
    <div className={`transition-all ${isMaximized ? 'pt-7 pb-4' : 'pt-4 pb-2'}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1
            className={`font-black tracking-tight text-[var(--text-main)] flex items-center transition-all ${
              isMaximized ? 'text-3xl lg:text-4xl' : 'text-xl md:text-2xl'
            }`}
          >
            {getGreeting()}
          </h1>
          <p
            className={`text-[var(--text-muted)] mt-1 transition-all ${
              isMaximized ? 'text-sm' : 'text-xs'
            }`}
          >
            Простая защита папок и файлов на месте без лишних копий
          </p>
        </div>

        {/* Feature Badges */}
        <div className="flex items-center gap-2.5">
          <div
            className={`glass-card rounded-xl flex items-center space-x-2 text-[var(--text-secondary)] transition-all ${
              isMaximized ? 'px-3.5 py-1.5 text-xs' : 'px-2.5 py-1 text-[11px]'
            }`}
          >
            <ShieldCheck className={isMaximized ? 'w-4 h-4 text-[var(--accent-primary)]' : 'w-3.5 h-3.5 text-[var(--accent-primary)]'} />
            <span className="font-semibold">AES-256</span>
          </div>

          <div
            className={`glass-card rounded-xl flex items-center space-x-2 text-[var(--text-secondary)] transition-all ${
              isMaximized ? 'px-3.5 py-1.5 text-xs' : 'px-2.5 py-1 text-[11px]'
            }`}
          >
            <HardDrive className={isMaximized ? 'w-4 h-4 text-[var(--text-muted)]' : 'w-3.5 h-3.5 text-[var(--text-muted)]'} />
            <span>Объектов: {vaultCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

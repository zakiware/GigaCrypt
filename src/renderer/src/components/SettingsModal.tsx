import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon,
  X,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { AccentColor, AppSettings, ThemeMode } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
}

const ACCENT_OPTIONS: { id: AccentColor; name: string; color: string }[] = [
  { id: 'ginger', name: 'Янтарь', color: '#f59e0b' },
  { id: 'emerald', name: 'Изумруд', color: '#10b981' },
  { id: 'sapphire', name: 'Сапфир', color: '#6366f1' },
  { id: 'amethyst', name: 'Аметист', color: '#a855f7' },
  { id: 'ruby', name: 'Рубин', color: '#f43f5e' },
  { id: 'titanium', name: 'Титан', color: '#a1a1aa' },
];

const THEME_OPTIONS: { id: ThemeMode; name: string; icon: React.ReactNode }[] = [
  { id: 'dark', name: 'Тёмная', icon: <Moon className="w-3.5 h-3.5" /> },
  { id: 'light', name: 'Светлая', icon: <Sun className="w-3.5 h-3.5" /> },
  { id: 'system', name: 'Системная', icon: <Laptop className="w-3.5 h-3.5" /> },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 6 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] p-5 shadow-2xl text-[var(--text-main)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent-primary)]">
                <SettingsIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-main)]">Настройки приложения</h3>
                <p className="text-[11px] text-[var(--text-muted)]">Конфигурация интерфейса и политик безопасности</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="my-4 space-y-4 text-xs">
            {/* Color Accent */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                Цветовая схема
              </span>
              <div className="grid grid-cols-6 gap-2 p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
                {ACCENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onUpdateSettings({ accentColor: opt.id })}
                    className={`py-2 px-1 rounded-md flex flex-col items-center space-y-1.5 transition-all cursor-pointer ${
                      settings.accentColor === opt.id
                        ? 'bg-white/10 ring-1 ring-[var(--accent-primary)]'
                        : 'hover:bg-white/5 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full ring-2 ring-black/40"
                      style={{ backgroundColor: opt.color }}
                    />
                    <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                      {opt.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Mode */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                Тема оформления
              </span>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
                {THEME_OPTIONS.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onUpdateSettings({ themeMode: theme.id })}
                    className={`py-1.5 px-3 rounded-md flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      settings.themeMode === theme.id
                        ? 'bg-[var(--accent-primary)] text-zinc-950 font-semibold shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5'
                    }`}
                  >
                    {theme.icon}
                    <span className="text-xs">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Security Policies */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                Безопасность и поведение
              </span>
              
              <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] divide-y divide-[var(--border-color)]">
                {/* Auto-relock Timer */}
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-[var(--text-main)] block">Автоблокировка открытых папок</span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      Повторно блокировать папки при простое системы
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {[5, 10, 15, 30].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => onUpdateSettings({ autoRelockMinutes: mins })}
                        className={`px-2 py-1 rounded text-[11px] font-mono transition-all cursor-pointer ${
                          (settings.autoRelockMinutes || 10) === mins
                            ? 'bg-[var(--accent-primary)] text-zinc-950 font-semibold'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5'
                        }`}
                      >
                        {mins}м
                      </button>
                    ))}
                  </div>
                </div>

                {/* Close to Tray Toggle */}
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-[var(--text-main)] block">Сворачивать в системный трей</span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      При нажатии на крестик продолжать работу в фоне
                    </span>
                  </div>

                  <input
                    type="checkbox"
                    checked={settings.closeToTray}
                    onChange={(e) => onUpdateSettings({ closeToTray: e.target.checked })}
                    className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-0 cursor-pointer accent-[var(--accent-primary)]"
                  />
                </div>

                {/* Context Menu Integration */}
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-[var(--text-main)] block">Интеграция с Проводником Windows</span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      Пункты шифрования в контекстном меню правой кнопки мыши
                    </span>
                  </div>

                  <input
                    type="checkbox"
                    checked={settings.explorerContextMenu}
                    onChange={(e) => onUpdateSettings({ explorerContextMenu: e.target.checked })}
                    className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-0 cursor-pointer accent-[var(--accent-primary)]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-[var(--border-color)]">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg primary-btn text-xs font-semibold cursor-pointer shadow-sm"
            >
              Готово
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

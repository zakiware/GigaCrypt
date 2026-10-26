import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon,
  X,
  Minimize2,
  Layers,
  Palette,
  Sun,
  Moon,
  Laptop,
  Clock,
} from 'lucide-react';
import { AccentColor, AppSettings, ThemeMode } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
}

const ACCENT_OPTIONS: { id: AccentColor; name: string; color: string }[] = [
  { id: 'ginger', name: 'Янтарь', color: '#f97316' },
  { id: 'emerald', name: 'Изумруд', color: '#10b981' },
  { id: 'sapphire', name: 'Сапфир', color: '#6366f1' },
  { id: 'amethyst', name: 'Аметист', color: '#a855f7' },
  { id: 'ruby', name: 'Рубин', color: '#f43f5e' },
  { id: 'titanium', name: 'Титан', color: '#94a3b8' },
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--bg-main)] border border-[var(--border-color)] p-6 shadow-2xl text-[var(--text-main)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--accent-glow-bg)] flex items-center justify-center text-[var(--accent-primary)]">
                <SettingsIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-main)]">Параметры GigaCrypt</h3>
                <p className="text-[11px] text-[var(--text-muted)]">Оформление, безопасность и автоблокировка</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="my-4 space-y-4 text-xs">
            {/* Color Palettes */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2.5">
              <div className="flex items-center space-x-1.5 font-bold text-[var(--text-main)]">
                <Palette className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Цветовой акцент</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {ACCENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onUpdateSettings({ accentColor: opt.id })}
                    className={`p-2 rounded-xl border flex flex-col items-center space-y-1.5 transition-all ${
                      settings.accentColor === opt.id
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-glow-bg)] scale-105 shadow-sm'
                        : 'border-[var(--border-color)] hover:border-white/20'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: opt.color }}
                    />
                    <span className="text-[10px] font-medium text-[var(--text-secondary)]">
                      {opt.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Mode (Dark / Light / System) */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2.5">
              <div className="font-bold text-[var(--text-main)]">Тема оформления</div>
              <div className="grid grid-cols-3 gap-2">
                {THEME_OPTIONS.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onUpdateSettings({ themeMode: theme.id })}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center space-x-2 transition-all ${
                      settings.themeMode === theme.id
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-glow-bg)] text-[var(--accent-primary)] font-bold'
                        : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {theme.icon}
                    <span className="text-xs">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-relock Timer */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
              <div className="flex items-center space-x-1.5 font-bold text-[var(--text-main)]">
                <Clock className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Автоблокировка открытых папок</span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">
                Автоматически повторно блокирует открытую папку при бездействии или блокировке Windows
              </p>
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[5, 10, 15, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => onUpdateSettings({ autoRelockMinutes: mins })}
                    className={`py-1.5 px-2 rounded-xl border text-center transition-all ${
                      (settings.autoRelockMinutes || 10) === mins
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-glow-bg)] text-[var(--accent-primary)] font-bold'
                        : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {mins} мин
                  </button>
                ))}
              </div>
            </div>

            {/* Close Behavior */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
              <div className="flex items-center space-x-1.5 font-bold text-[var(--text-main)]">
                <Minimize2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Действие при нажатии на крестик</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ closeToTray: true })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    settings.closeToTray
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-glow-bg)]'
                      : 'border-[var(--border-color)]'
                  }`}
                >
                  <span className="font-semibold block text-[var(--text-main)]">Сворачивать в трей</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Фоновая защита и автоблокировка</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateSettings({ closeToTray: false })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    !settings.closeToTray
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-glow-bg)]'
                      : 'border-[var(--border-color)]'
                  }`}
                >
                  <span className="font-semibold block text-[var(--text-main)]">Закрывать</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Полный выход (папки блокируются)</span>
                </button>
              </div>
            </div>

            {/* Context menu */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-between">
              <div>
                <span className="font-semibold block text-[var(--text-main)] flex items-center">
                  <Layers className="w-3.5 h-3.5 mr-1.5 text-[var(--accent-primary)]" />
                  Интеграция в контекстное меню (ПКМ)
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  Пункты «Зашифровать папку» и «Расшифровать папку» в Проводнике
                </span>
              </div>

              <input
                type="checkbox"
                checked={settings.explorerContextMenu}
                onChange={(e) => onUpdateSettings({ explorerContextMenu: e.target.checked })}
                className="rounded h-4 w-4 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl accent-btn text-white text-xs font-semibold shadow-sm"
            >
              Сохранить
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

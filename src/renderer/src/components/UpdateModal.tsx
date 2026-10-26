import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DownloadCloud, Sparkles, X, ExternalLink, ArrowRight, CheckCircle2 } from 'lucide-react';
import { UpdateInfo } from '../../types';

interface UpdateModalProps {
  updateInfo: UpdateInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (url: string) => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  updateInfo,
  isOpen,
  onClose,
  onDownload,
}) => {
  if (!isOpen || !updateInfo) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg rounded-3xl bg-[var(--bg-main)] border border-[var(--border-color)] p-6 shadow-2xl text-[var(--text-main)] overflow-hidden"
        >
          {/* Subtle amber/accent glow */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-24 bg-gradient-to-r from-[var(--accent-primary)] to-amber-500 blur-3xl opacity-25 pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-color)]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--accent-glow-bg)] border border-[var(--border-accent)] flex items-center justify-center text-[var(--accent-primary)] shadow-sm">
                <DownloadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-main)] flex items-center">
                  <span>Доступно обновление</span>
                  <Sparkles className="w-4 h-4 ml-2 text-[var(--accent-primary)]" />
                </h3>
                <p className="text-xs text-[var(--text-muted)]">Новая версия программы готова к установке</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Versions Comparison Card */}
          <div className="my-4 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                Текущая версия
              </span>
              <span className="font-mono text-xs text-[var(--text-secondary)] font-semibold mt-0.5">
                v{updateInfo.currentVersion}
              </span>
            </div>

            <div className="w-8 h-8 rounded-full bg-[var(--accent-glow-bg)] border border-[var(--border-accent)] flex items-center justify-center text-[var(--accent-primary)]">
              <ArrowRight className="w-4 h-4" />
            </div>

            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase font-bold text-[var(--accent-primary)] tracking-wider flex items-center justify-end">
                <span>Новая версия</span>
              </span>
              <span className="font-mono text-sm text-[var(--accent-primary)] font-extrabold mt-0.5">
                v{updateInfo.latestVersion}
              </span>
            </div>
          </div>

          {/* Release Notes */}
          <div className="mb-5 space-y-2">
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Что нового в этой версии:
            </label>
            <div className="max-h-44 overflow-y-auto p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap font-sans">
              {updateInfo.releaseNotes || 'Улучшения стабильности, оптимизация шифрования и исправления интерфейса.'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)] transition-colors cursor-pointer"
            >
              Напомнить позже
            </button>

            <button
              type="button"
              onClick={() => {
                if (updateInfo.downloadUrl) {
                  onDownload(updateInfo.downloadUrl);
                }
              }}
              className="px-6 py-2.5 rounded-xl accent-btn text-white text-xs font-bold flex items-center space-x-2 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Скачать и обновить</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-70" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Folder, File, X, Lock } from 'lucide-react';
import { NotEncryptedNotice } from '../../types';

interface NotEncryptedModalProps {
  notice: NotEncryptedNotice | null;
  isOpen: boolean;
  onClose: () => void;
  onEncrypt: (notice: NotEncryptedNotice) => void;
}

export const NotEncryptedModal: React.FC<NotEncryptedModalProps> = ({
  notice,
  isOpen,
  onClose,
  onEncrypt,
}) => {
  if (!isOpen || !notice) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md rounded-3xl bg-[var(--bg-main)] border border-[var(--border-color)] p-6 shadow-2xl text-[var(--text-main)] overflow-hidden"
        >
          {/* Subtle amber glow */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-20 bg-amber-500/20 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-main)]">Объект не зашифрован</h3>
                <p className="text-[11px] text-[var(--text-muted)]">Расшифровка не требуется</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Object card */}
          <div className="my-4 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-glow-bg)] border border-[var(--border-accent)] flex items-center justify-center text-[var(--accent-primary)] shrink-0">
              {notice.type === 'folder' ? <Folder className="w-5 h-5" /> : <File className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-[var(--text-main)] truncate">{notice.name}</h4>
              <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">{notice.path}</p>
            </div>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-5">
            {notice.type === 'folder' ? 'Папка' : 'Файл'} <strong>«{notice.name}»</strong> не содержит шифрования GigaCrypt. Расшифровать можно только зашифрованные файлы (.gcrypt) или папки с защитным ключом.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)] transition-colors cursor-pointer"
            >
              Понятно
            </button>

            <button
              type="button"
              onClick={() => onEncrypt(notice)}
              className="px-4 py-2 rounded-xl accent-btn text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Зашифровать сейчас</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

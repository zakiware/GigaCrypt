import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Folder, File, X, Lock } from 'lucide-react';
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 6 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="relative w-full max-w-md rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] p-5 shadow-2xl text-[var(--text-main)] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-amber-400">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-main)]">Объект не зашифрован</h3>
                <p className="text-[11px] text-[var(--text-muted)]">Расшифровка не требуется</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Object card */}
          <div className="my-3 p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent-primary)] shrink-0">
              {notice.type === 'folder' ? <Folder className="w-4 h-4" /> : <File className="w-4 h-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-medium text-[var(--text-main)] truncate">{notice.name}</h4>
              <p className="text-[10px] font-mono text-[var(--text-muted)] truncate mt-0.5">{notice.path}</p>
            </div>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
            {notice.type === 'folder' ? 'Каталог' : 'Файл'} <strong>«{notice.name}»</strong> не был зашифрован через GigaCrypt. Расшифровать можно только защищённые контейнеры (.gcrypt) или заблокированные папки.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5 transition-colors cursor-pointer"
            >
              Понятно
            </button>

            <button
              type="button"
              onClick={() => onEncrypt(notice)}
              className="px-4 py-1.5 rounded-lg primary-btn text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Зашифровать</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

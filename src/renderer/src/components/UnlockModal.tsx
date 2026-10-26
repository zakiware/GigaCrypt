import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KeyRound,
  Eye,
  EyeOff,
  FolderLock,
  FileLock,
  AlertCircle,
  HelpCircle,
  X,
  Loader2,
  FolderCheck,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ProgressUpdate, UnlockRequest } from '../../types';

interface UnlockModalProps {
  request: UnlockRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UnlockModal: React.FC<UnlockModalProps> = ({
  request,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
      setIsProcessing(false);
      setProgress(null);
      setIsShaking(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = window.electronAPI.onProgress((p) => {
      setProgress(p);
    });
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen || !request) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Байт';
    const k = 1024;
    const sizes = ['Байт', 'КБ', 'МБ', 'ГБ', 'ТБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUnlock = async (tempView: boolean = false) => {
    if (!password) {
      setError('Введите пароль для расшифровки');
      triggerShake();
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const result = await window.electronAPI.decryptItem({
        gcryptPath: request.filePath,
        password,
        tempView,
      });

      if (result.success) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f97316', '#ea580c', '#34d399', '#ffffff'],
        });

        setTimeout(() => {
          onSuccess();
          onClose();
        }, 600);
      } else {
        setError(result.error || 'Неверный пароль или ошибка расшифровки');
        triggerShake();
        setIsProcessing(false);
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка расшифровки');
      triggerShake();
      setIsProcessing(false);
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          animate={
            isShaking
              ? { x: [-12, 12, -8, 8, -4, 4, 0] }
              : { opacity: 1, scale: 1, y: 0 }
          }
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg rounded-3xl bg-[var(--bg-main)] border border-[var(--border-color)] p-6 shadow-2xl text-[var(--text-main)] overflow-hidden"
        >
          {/* Subtle accent glow on top */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-24 bg-gradient-to-r from-[var(--accent-primary)] to-amber-500 blur-3xl opacity-20 pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-glow-bg)] border border-[var(--border-accent)] flex items-center justify-center text-[var(--accent-primary)] shadow-sm">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-main)]">Доступ ограничен: Введите пароль</h3>
                <p className="text-xs text-[var(--text-muted)]">Объект заблокирован и защищен GigaCrypt</p>
              </div>
            </div>

            {!isProcessing && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Warning if user attempted to re-encrypt an already locked object */}
          {request.alreadyLockedWarning && (
            <div className="my-3 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center space-x-2.5 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {request.type === 'folder' ? 'Папка уже зашифрована!' : 'Файл уже зашифрован!'} Менять или перезаписывать пароль нельзя. Введите текущий пароль для доступа.
              </span>
            </div>
          )}

          {/* Target Card */}
          <div className="my-4 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-[var(--accent-glow-bg)] border border-[var(--border-accent)] flex items-center justify-center text-[var(--accent-primary)] shrink-0">
              {request.type === 'folder' ? (
                <FolderLock className="w-6 h-6" />
              ) : (
                <FileLock className="w-6 h-6" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-[var(--text-main)] truncate">{request.fileName}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-glow-bg)] text-[var(--accent-primary)] font-mono border border-[var(--border-accent)]">
                  {request.type === 'folder' ? 'Папка' : '.gcrypt'}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{request.filePath}</p>
              {request.size > 0 && (
                <div className="text-[11px] text-[var(--text-muted)] mt-1">
                  Размер: {formatBytes(request.size)}
                </div>
              )}
            </div>
          </div>

          {/* Password Hint if present */}
          {request.hint && (
            <div className="mb-4 p-3 rounded-xl bg-[var(--accent-glow-bg)] border border-[var(--border-accent)] flex items-start space-x-2 text-xs text-[var(--text-main)]">
              <HelpCircle className="w-4 h-4 text-[var(--accent-primary)] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[var(--accent-primary)]">Подсказка автора:</span>{' '}
                <span>{request.hint}</span>
              </div>
            </div>
          )}

          {/* Form */}
          {!isProcessing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                  Пароль для разблокировки
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Введите пароль объекта..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] text-sm text-[var(--text-main)] placeholder-gray-500 font-mono transition-all"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center space-x-2 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
                <div className="flex flex-col items-center sm:items-start space-y-1 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleUnlock(true)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--accent-primary)] text-xs font-semibold border border-[var(--border-color)] hover:border-[var(--border-accent)] flex items-center justify-center space-x-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Временный просмотр</span>
                  </button>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Оригинал остаётся заблокирован
                  </span>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)] transition-colors cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnlock(false)}
                    className="px-6 py-2.5 rounded-xl accent-btn text-white text-sm font-semibold flex items-center space-x-2 shadow-sm cursor-pointer active:scale-95 transition-all"
                  >
                    <FolderCheck className="w-4 h-4" />
                    <span>Полная расшифровка</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Progress State */
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent-glow-bg)] border border-[var(--border-accent)] flex items-center justify-center text-[var(--accent-primary)] animate-pulse shadow-sm">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>

              <div>
                <h4 className="font-bold text-[var(--text-main)] text-base">Идёт расшифровка объекта...</h4>
                <p className="text-xs text-[var(--accent-primary)] mt-1">
                  {progress?.message || 'Проверка целостности и распаковка...'}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-sm space-y-1.5">
                <div className="h-2.5 w-full bg-[var(--bg-card)] rounded-full overflow-hidden border border-[var(--border-color)]">
                  <div
                    className="h-full bg-[var(--accent-primary)] transition-all duration-200"
                    style={{ width: `${progress?.percent || 20}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-[var(--text-muted)] font-mono">
                  <span>{progress?.stage || 'decrypting'}</span>
                  <span className="text-[var(--accent-primary)] font-bold">{progress?.percent || 0}%</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

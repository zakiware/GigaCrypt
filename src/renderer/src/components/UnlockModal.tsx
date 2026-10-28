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
  CheckCircle2,
} from 'lucide-react';
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
  const [isDone, setIsDone] = useState(false);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
      setIsProcessing(false);
      setIsDone(false);
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
        setIsDone(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 500);
      } else {
        setError(result.error || 'Неверный пароль или нарушена целостность данных');
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
    setTimeout(() => setIsShaking(false), 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          animate={
            isShaking
              ? { x: [-8, 8, -6, 6, -3, 3, 0] }
              : { opacity: 1, scale: 1, y: 0 }
          }
          initial={{ opacity: 0, scale: 0.98, y: 6 }}
          exit={{ opacity: 0, scale: 0.98, y: 6 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="relative w-full max-w-lg rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] p-5 shadow-2xl text-[var(--text-main)] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent-primary)]">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-main)]">Разблокировка хранилища</h3>
                <p className="text-[11px] text-[var(--text-muted)]">Введите пароль для проверки целостности и расшифровки</p>
              </div>
            </div>

            {!isProcessing && (
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Warning if user attempted to re-encrypt an already locked object */}
          {request.alreadyLockedWarning && (
            <div className="my-2.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center space-x-2 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Объект уже зашифрован. Введите пароль для доступа.</span>
            </div>
          )}

          {/* Target Card */}
          <div className="my-3 p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent-primary)] shrink-0">
              {request.type === 'folder' ? (
                <FolderLock className="w-4 h-4" />
              ) : (
                <FileLock className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-xs text-[var(--text-main)] truncate">{request.fileName}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-[var(--text-muted)]">
                  {request.type === 'folder' ? 'DIR' : '.GCRYPT'}
                </span>
              </div>
              <p className="text-[10px] font-mono text-[var(--text-muted)] truncate mt-0.5">{request.filePath}</p>
              {request.size > 0 && (
                <div className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
                  Размер: {formatBytes(request.size)}
                </div>
              )}
            </div>
          </div>

          {/* Password Hint if present */}
          {request.hint && (
            <div className="mb-3 p-2.5 rounded-lg bg-[var(--accent-glow-bg)] border border-[var(--border-accent)] flex items-start space-x-2 text-xs text-[var(--text-main)]">
              <HelpCircle className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[var(--accent-primary)]">Подсказка:</span>{' '}
                <span className="text-[var(--text-secondary)]">{request.hint}</span>
              </div>
            </div>
          )}

          {isDone ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <h4 className="font-semibold text-xs text-[var(--text-main)]">Пароль подтверждён</h4>
              <p className="text-[11px] text-[var(--text-muted)]">Доступ к данным открыт</p>
            </div>
          ) : !isProcessing ? (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Пароль
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Введите пароль..."
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:outline-none text-xs text-[var(--text-main)] font-mono transition-all"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center space-x-2 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => handleUnlock(true)}
                  className="px-3 py-1.5 rounded-lg secondary-btn text-xs font-medium flex items-center space-x-1.5 cursor-pointer"
                  title="Открыть во временной изолированной песочнице без расшифровки оригинала"
                >
                  <Eye className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  <span>Временный просмотр</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnlock(false)}
                    className="px-4 py-1.5 rounded-lg primary-btn text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <span>Расшифровать</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Progress State */
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-primary)]" />
              <div>
                <h4 className="font-semibold text-xs text-[var(--text-main)]">Расшифровка и проверка подлинности...</h4>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5 font-mono">
                  {progress?.message || 'Пожалуйста, подождите...'}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-xs space-y-1">
                <div className="h-1.5 w-full bg-[var(--bg-card)] rounded-full overflow-hidden border border-[var(--border-color)]">
                  <div
                    className="h-full bg-[var(--accent-primary)] transition-all duration-150"
                    style={{ width: `${progress?.percent || 20}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] font-mono">
                  <span>{progress?.stage || 'decrypting'}</span>
                  <span className="text-[var(--accent-primary)]">{progress?.percent || 0}%</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

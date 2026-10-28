import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Eye,
  EyeOff,
  Dice5,
  Folder,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { ItemInfo, ProgressUpdate } from '../../types';

interface EncryptModalProps {
  item: ItemInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EncryptModal: React.FC<EncryptModalProps> = ({
  item,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hint, setHint] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setConfirmPassword('');
      setHint('');
      setIsProcessing(false);
      setIsDone(false);
      setProgress(null);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = window.electronAPI.onProgress((p) => {
      setProgress(p);
    });
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const generatePassword = () => {
    const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*';
    let generated = '';
    for (let i = 0; i < 16; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
    setConfirmPassword(generated);
    setShowPassword(true);
    navigator.clipboard.writeText(generated);
  };

  const calculateStrength = (pwd: string) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd) || pwd.length >= 14) score += 1;
    return score;
  };

  const strength = calculateStrength(password);

  const handleEncrypt = async () => {
    if (!password) {
      setError('Введите пароль');
      return;
    }
    if (password.length < 6) {
      setError('Минимальная длина пароля — 6 символов');
      return;
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const result = await window.electronAPI.encryptItem({
        sourcePath: item.path,
        password,
        hint: hint.trim() || undefined,
        wipeOriginal: true,
        inPlaceFolder: true,
      });

      if (result.success) {
        setIsDone(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 600);
      } else {
        setError(result.error || 'Ошибка при шифровании');
        setIsProcessing(false);
      }
    } catch (err: any) {
      setError(err.message || 'Системная ошибка');
      setIsProcessing(false);
    }
  };

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
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent-primary)]">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-main)]">Защита паролем</h3>
                <p className="text-[11px] text-[var(--text-muted)]">AES-256-GCM шифрование на месте</p>
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

          {/* Target File Preview */}
          <div className="my-3 p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent-primary)] shrink-0">
              {item.type === 'folder' ? <Folder className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-medium text-xs text-[var(--text-main)] truncate block">{item.name}</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)] block truncate">{item.path}</span>
            </div>
          </div>

          {isDone ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <h4 className="font-semibold text-xs text-[var(--text-main)]">Объект успешно зашифрован</h4>
              <p className="text-[11px] text-[var(--text-muted)]">Оригинал защищен и заблокирован</p>
            </div>
          ) : !isProcessing ? (
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <label className="font-medium text-[var(--text-secondary)]">Пароль</label>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      (мин. 6 символов)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-[var(--accent-primary)] hover:underline flex items-center space-x-1 cursor-pointer text-[11px]"
                  >
                    <Dice5 className="w-3 h-3" />
                    <span>Случайный</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleEncrypt(); }}
                    placeholder="Введите надёжный пароль..."
                    className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:outline-none text-xs text-[var(--text-main)] font-mono"
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

                {/* Technical Password Strength Meter */}
                {password && (
                  <div className="mt-1.5 flex items-center space-x-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          strength >= step
                            ? strength <= 1
                              ? 'bg-red-500'
                              : strength <= 2
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                            : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">Повторите пароль</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleEncrypt(); }}
                    placeholder="Повторите ввод пароля..."
                    className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:outline-none text-xs text-[var(--text-main)] font-mono"
                  />
                  {confirmPassword && password === confirmPassword && (
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="flex items-center text-[var(--text-muted)] mb-1 text-[11px]">
                  <HelpCircle className="w-3 h-3 mr-1" />
                  Подсказка к паролю (необязательно)
                </label>
                <input
                  type="text"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleEncrypt(); }}
                  placeholder="Памятка для себя..."
                  className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              {error && (
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center space-x-1.5 text-red-400 text-[11px]">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleEncrypt}
                  className="px-4 py-1.5 rounded-lg primary-btn text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Зашифровать</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-primary)]" />
              <div>
                <h4 className="font-semibold text-xs text-[var(--text-main)]">Выполняется шифрование...</h4>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5 font-mono">
                  {progress?.message || 'Пожалуйста, подождите...'}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-xs space-y-1">
                <div className="h-1.5 w-full bg-[var(--bg-card)] rounded-full overflow-hidden border border-[var(--border-color)]">
                  <div
                    className="h-full bg-[var(--accent-primary)] transition-all duration-150"
                    style={{ width: `${progress?.percent || 25}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] font-mono">
                  <span>{progress?.stage || 'encrypting'}</span>
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

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Eye,
  EyeOff,
  Dices,
  Folder,
  FileText,
  AlertTriangle,
  CheckCircle2,
  X,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
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
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setConfirmPassword('');
      setHint('');
      setIsProcessing(false);
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

  const handleEncrypt = async () => {
    if (!password) {
      setError('Придумайте пароль');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен содержать не менее 6 символов');
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
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
        });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 700);
      } else {
        setError(result.error || 'Ошибка при защите');
        setIsProcessing(false);
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка');
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md rounded-3xl bg-[var(--bg-main)] border border-[var(--border-color)] p-6 shadow-2xl text-[var(--text-main)] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--accent-glow-bg)] flex items-center justify-center text-[var(--accent-primary)]">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-main)]">Установка пароля</h3>
                <p className="text-[11px] text-[var(--text-muted)]">Защита на месте без создания копий</p>
              </div>
            </div>

            {!isProcessing && (
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Item Preview */}
          <div className="my-3.5 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-glow-bg)] flex items-center justify-center text-[var(--accent-primary)] shrink-0">
              {item.type === 'folder' ? <Folder className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-xs text-[var(--text-main)] truncate block">{item.name}</span>
              <span className="text-[10px] text-[var(--text-muted)] block truncate">{item.path}</span>
            </div>
          </div>

          {!isProcessing ? (
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1.5">
                    <label className="font-medium text-[var(--text-secondary)]">Пароль</label>
                    <span className={`text-[10px] font-mono ${password.length >= 6 ? 'text-emerald-400 font-semibold' : 'text-[var(--text-muted)]'}`}>
                      ({password.length >= 6 ? '✓ надёжно' : `${password.length}/6 мин.`})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-[var(--accent-primary)] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Dices className="w-3 h-3" />
                    <span>Сгенерировать</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleEncrypt(); }}
                    placeholder="Введите пароль (от 6 символов)..."
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:outline-none text-xs text-[var(--text-main)] font-mono"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">Повторите пароль</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleEncrypt(); }}
                    placeholder="Повторите пароль..."
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:outline-none text-xs text-[var(--text-main)] font-mono"
                  />
                  {confirmPassword && password === confirmPassword && (
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="flex items-center text-[var(--text-muted)] mb-1">
                  <HelpCircle className="w-3 h-3 mr-1" />
                  Подсказка к паролю (необязательно)
                </label>
                <input
                  type="text"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleEncrypt(); }}
                  placeholder="Например: дата или кодовое слово"
                  className="w-full px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-main)]"
                />
              </div>

              {error && (
                <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center space-x-1.5 text-red-400 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl text-xs text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleEncrypt}
                  className="px-5 py-2 rounded-xl accent-btn text-white text-xs font-semibold shadow-sm flex items-center space-x-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Защитить объект</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-primary)]" />
              <div>
                <h4 className="font-bold text-xs text-[var(--text-main)]">Шифрование данных...</h4>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{progress?.message || 'Пожалуйста, подождите'}</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Unlock, X, Folder, File, AlertCircle, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GigaIcon } from './GigaIcon';
import { UnlockRequest } from '../../types';

interface CompactUnlockProps {
  request: UnlockRequest;
  onClose: () => void;
  onSuccess: () => void;
}

export const CompactUnlock: React.FC<CompactUnlockProps> = ({
  request,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const handleUnlock = async () => {
    if (!password) {
      triggerShake('Введите пароль');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const result = await window.electronAPI.decryptItem({
        gcryptPath: request.filePath,
        password,
      });

      if (result.success) {
        setIsUnlocked(true);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });

        setTimeout(() => {
          onSuccess();
          onClose();
        }, 600);
      } else {
        triggerShake(result.error || 'Неверный пароль');
        setIsProcessing(false);
      }
    } catch (err: any) {
      triggerShake(err.message || 'Ошибка');
      setIsProcessing(false);
    }
  };

  const triggerShake = (msg: string) => {
    setError(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col justify-between p-5 bg-[var(--bg-main)] text-[var(--text-main)] select-none overflow-hidden">
      {/* Mini Titlebar */}
      <div className="flex items-center justify-between app-drag pb-1">
        <div className="flex items-center space-x-2 app-no-drag">
          <GigaIcon size={20} />
          <span className="text-xs font-bold tracking-tight text-[var(--text-main)]">
            Giga<span className="text-[var(--accent-primary)]">Crypt</span>
          </span>
        </div>

        <button
          onClick={onClose}
          className="app-no-drag w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Form Content */}
      <motion.div
        animate={isShaking ? { x: [-10, 10, -6, 6, -3, 3, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="flex-1 flex flex-col justify-center space-y-3 my-auto"
      >
        {/* Warning if user tried to re-encrypt an already locked object */}
        {request.alreadyLockedWarning && (
          <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center space-x-2 text-[11px] text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>Папка уже зашифрована! Введите пароль для доступа.</span>
          </div>
        )}

        {/* Object Info */}
        <div className="flex items-center space-x-3 p-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-glow-bg)] flex items-center justify-center text-[var(--accent-primary)] shrink-0">
            {request.type === 'folder' ? <Folder className="w-5 h-5" /> : <File className="w-5 h-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-[var(--text-main)] truncate">
              {request.fileName}
            </h4>
            <span className="text-[10px] text-[var(--text-muted)] flex items-center">
              <Lock className="w-3 h-3 mr-1 text-[var(--accent-primary)]" />
              Защищено паролем
            </span>
          </div>
        </div>

        {request.hint && (
          <div className="text-[11px] text-[var(--text-muted)] px-1">
            Подсказка: <span className="text-[var(--accent-primary)] font-semibold">{request.hint}</span>
          </div>
        )}

        {/* Password Input */}
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите пароль..."
            disabled={isProcessing || isUnlocked}
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] text-xs text-[var(--text-main)] placeholder-gray-500 font-mono transition-all"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[var(--text-main)]"
          >
            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-1.5 text-[11px] text-red-400 px-1"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </motion.div>

      {/* Action Button */}
      <button
        onClick={handleUnlock}
        disabled={isProcessing || isUnlocked}
        className="w-full py-2.5 rounded-xl accent-btn text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
      >
        {isUnlocked ? (
          <>
            <Unlock className="w-3.5 h-3.5 animate-bounce" />
            <span>Разблокировано!</span>
          </>
        ) : isProcessing ? (
          <span>Проверка ключа...</span>
        ) : (
          <>
            <Unlock className="w-3.5 h-3.5" />
            <span>Разблокировать доступ</span>
          </>
        )}
      </button>
    </div>
  );
};

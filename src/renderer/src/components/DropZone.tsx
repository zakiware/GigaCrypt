import React, { useState, DragEvent } from 'react';
import { UploadCloud, FolderUp, FileUp, Sparkles, Lock, Unlock } from 'lucide-react';
import { motion } from 'framer-motion';

interface DropZoneProps {
  onFileSelect: () => void;
  onFolderSelect: () => void;
  onPathDropped: (path: string) => void;
  mode: 'encrypt' | 'decrypt';
  onModeChange: (m: 'encrypt' | 'decrypt') => void;
  isMaximized?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFileSelect,
  onFolderSelect,
  onPathDropped,
  mode,
  onModeChange,
  isMaximized = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`space-y-3 transition-all ${isMaximized ? 'my-4' : 'my-3'}`}
    >
      {/* Mode Switcher Segmented Control */}
      <div className="flex items-center justify-center">
        <div className="p-1 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex space-x-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => onModeChange('encrypt')}
            className={`font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              isMaximized ? 'px-7 py-2.5 text-sm rounded-xl' : 'px-5 py-2 text-xs rounded-xl'
            } ${
              mode === 'encrypt'
                ? 'accent-btn text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5'
            }`}
          >
            <Lock className={isMaximized ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
            <span>Шифрование</span>
          </button>

          <button
            type="button"
            onClick={() => onModeChange('decrypt')}
            className={`font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              isMaximized ? 'px-7 py-2.5 text-sm rounded-xl' : 'px-5 py-2 text-xs rounded-xl'
            } ${
              mode === 'decrypt'
                ? 'accent-btn text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5'
            }`}
          >
            <Unlock className={isMaximized ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
            <span>Расшифровка</span>
          </button>
        </div>
      </div>

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            const filePath = (file as any).path || file.name;
            if (filePath) {
              onPathDropped(filePath);
            }
          }
        }}
        className={`relative rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer ${
          isMaximized ? 'p-9' : 'p-6'
        } ${
          isDragOver
            ? 'border-[var(--accent-primary)] bg-[var(--accent-glow-bg)] scale-[1.01]'
            : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--border-accent)]'
        }`}
      >
        <div
          className={`bg-[var(--accent-glow-bg)] border border-[var(--border-accent)] flex items-center justify-center text-[var(--accent-primary)] shadow-sm transition-all ${
            isMaximized ? 'w-16 h-16 rounded-3xl mb-3.5' : 'w-12 h-12 rounded-2xl mb-2.5'
          }`}
        >
          {mode === 'encrypt' ? (
            <UploadCloud className={isMaximized ? 'w-8 h-8' : 'w-6 h-6'} />
          ) : (
            <Unlock className={isMaximized ? 'w-8 h-8' : 'w-6 h-6'} />
          )}
        </div>

        <h3
          className={`font-bold text-[var(--text-main)] tracking-tight flex items-center transition-all ${
            isMaximized ? 'text-base' : 'text-sm'
          }`}
        >
          {mode === 'encrypt'
            ? 'Перетащите папку или файл для шифрования'
            : 'Перетащите зашифрованную папку или файл для открытия'}
          <Sparkles className={`ml-2 text-[var(--accent-primary)] ${isMaximized ? 'w-4 h-4' : 'w-3.5 h-3.5'}`} />
        </h3>
        <p
          className={`text-[var(--text-muted)] max-w-md transition-all ${
            isMaximized ? 'text-xs mt-1 mb-6' : 'text-[11px] mt-0.5 mb-4'
          }`}
        >
          {mode === 'encrypt'
            ? 'Шифрует объект на месте без создания лишних копий'
            : 'Мгновенный ввод пароля и автоматическая защита'}
        </p>

        {/* Action Buttons */}
        <div className={`flex flex-wrap items-center justify-center gap-3 w-full ${isMaximized ? 'max-w-xl' : 'max-w-md'}`}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFolderSelect();
            }}
            className={`flex-1 font-semibold flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-sm accent-btn text-white cursor-pointer ${
              isMaximized ? 'min-w-[200px] px-6 py-3.5 rounded-2xl text-sm' : 'min-w-[160px] px-4 py-2.5 rounded-xl text-xs'
            }`}
          >
            <FolderUp className={isMaximized ? 'w-5 h-5' : 'w-4 h-4'} />
            <span>{mode === 'encrypt' ? '🔒 Зашифровать папку' : '🔓 Расшифровать папку'}</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFileSelect();
            }}
            className={`flex-1 font-semibold border border-[var(--border-color)] hover:border-[var(--border-accent)] flex items-center justify-center space-x-2 transition-all active:scale-95 bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] cursor-pointer ${
              isMaximized ? 'min-w-[200px] px-6 py-3.5 rounded-2xl text-sm' : 'min-w-[160px] px-4 py-2.5 rounded-xl text-xs'
            }`}
          >
            <FileUp className={`text-[var(--accent-primary)] ${isMaximized ? 'w-5 h-5' : 'w-4 h-4'}`} />
            <span>{mode === 'encrypt' ? '📄 Зашифровать файл' : '📄 Расшифровать файл (.gcrypt)'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

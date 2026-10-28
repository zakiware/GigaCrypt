import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, ArrowRight, Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { UpdateInfo } from '../../types';

interface UpdateModalProps {
  updateInfo: UpdateInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenExternal: (url: string) => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  updateInfo,
  isOpen,
  onClose,
  onOpenExternal,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStats, setDownloadStats] = useState({ receivedMB: '0', totalMB: '0' });
  const [downloadedFilePath, setDownloadedFilePath] = useState<string | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsDownloading(false);
      setDownloadProgress(0);
      setDownloadedFilePath(null);
      setIsInstalling(false);
      setError(null);
      return;
    }

    const unsub = window.electronAPI.onUpdateDownloadProgress((p) => {
      setDownloadProgress(p.percent);
      const rec = (p.receivedBytes / (1024 * 1024)).toFixed(1);
      const tot = p.totalBytes > 0 ? (p.totalBytes / (1024 * 1024)).toFixed(1) : '?';
      setDownloadStats({ receivedMB: rec, totalMB: tot });
    });

    return () => unsub();
  }, [isOpen]);

  if (!isOpen || !updateInfo) return null;

  const handleStartDownload = async () => {
    const url = updateInfo.downloadUrl;
    if (!url) {
      onOpenExternal('https://github.com/zakiware/GigaCrypt/releases/latest');
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      const res = await window.electronAPI.downloadUpdate(url);
      if (res.success && res.filePath) {
        setDownloadedFilePath(res.filePath);
      } else {
        setError(res.error || 'Ошибка при загрузке обновления');
        setIsDownloading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Сбой соединения');
      setIsDownloading(false);
    }
  };

  const handleInstallNow = async () => {
    if (!downloadedFilePath) return;
    setIsInstalling(true);
    try {
      await window.electronAPI.installUpdate(downloadedFilePath);
    } catch (err: any) {
      setError(err.message || 'Не удалось запустить установщик');
      setIsInstalling(false);
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
          className="relative w-full max-w-lg rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] p-5 shadow-2xl text-[var(--text-main)] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent-primary)]">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-main)]">Доступно обновление</h3>
                <p className="text-[11px] text-[var(--text-muted)]">Официальный релиз на GitHub</p>
              </div>
            </div>

            {!isDownloading && !isInstalling && (
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Versions Comparison Bar */}
          <div className="my-3 p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] tracking-wider">
                Установлено
              </span>
              <span className="font-mono text-xs text-[var(--text-secondary)] font-semibold mt-0.5">
                v{updateInfo.currentVersion}
              </span>
            </div>

            <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />

            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase font-semibold text-[var(--accent-primary)] tracking-wider">
                Новая версия
              </span>
              <span className="font-mono text-xs text-[var(--accent-primary)] font-bold mt-0.5">
                v{updateInfo.latestVersion}
              </span>
            </div>
          </div>

          {/* Release Notes */}
          {!isDownloading && !downloadedFilePath && (
            <div className="mb-4 space-y-1.5">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                Что нового
              </span>
              <div className="max-h-40 overflow-y-auto p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap font-sans">
                {updateInfo.releaseNotes || 'Плановое обновление стабильности и компонентов.'}
              </div>
            </div>
          )}

          {/* Download Progress State */}
          {isDownloading && !downloadedFilePath && (
            <div className="my-5 p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col items-center space-y-3">
              <div className="flex items-center space-x-2 text-xs font-semibold text-[var(--text-main)]">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-primary)]" />
                <span>Загрузка установщика... {downloadProgress}%</span>
              </div>

              <div className="w-full bg-[var(--bg-surface)] rounded-full h-2 overflow-hidden border border-[var(--border-color)]">
                <div
                  className="h-full bg-[var(--accent-primary)] transition-all duration-150"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>

              <div className="flex justify-between w-full text-[10px] font-mono text-[var(--text-muted)]">
                <span>{downloadStats.receivedMB} МБ из {downloadStats.totalMB} МБ</span>
                <span className="text-[var(--accent-primary)]">{downloadProgress}%</span>
              </div>
            </div>
          )}

          {/* Downloaded Ready State */}
          {downloadedFilePath && (
            <div className="my-5 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center space-x-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-xs font-semibold text-emerald-300">Обновление успешно загружено</h4>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Нажмите «Установить и перезапустить», чтобы обновить программу.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="my-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center space-x-2 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={() => onOpenExternal(updateInfo.downloadUrl || 'https://github.com/zakiware/GigaCrypt/releases/latest')}
              className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center space-x-1 cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Открыть в браузере</span>
            </button>

            <div className="flex items-center space-x-2">
              {!downloadedFilePath && !isDownloading && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Позже
                </button>
              )}

              {!downloadedFilePath ? (
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={handleStartDownload}
                  className="px-4 py-1.5 rounded-lg primary-btn text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Загрузка...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Скачать и установить</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isInstalling}
                  onClick={handleInstallNow}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  {isInstalling ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Запуск установщика...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Установить и перезапустить</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

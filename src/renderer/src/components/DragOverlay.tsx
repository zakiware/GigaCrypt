import React from 'react';
import { ArrowDownToLine, Lock } from 'lucide-react';

interface DragOverlayProps {
  isDragging: boolean;
}

export const DragOverlay: React.FC<DragOverlayProps> = ({ isDragging }) => {
  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-black/60 backdrop-blur-sm p-8">
      <div className="w-full h-full border-2 border-dashed border-[var(--accent-primary)] bg-[var(--accent-subtle)] rounded-xl flex flex-col items-center justify-center space-y-3 text-center">
        <div className="w-14 h-14 rounded-full bg-[var(--accent-primary)] text-zinc-950 flex items-center justify-center animate-bounce">
          <ArrowDownToLine className="w-7 h-7 stroke-[2.5]" />
        </div>

        <div>
          <h3 className="text-base font-bold text-white">
            Отпустите файл или папку здесь
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono">
            Автоматическое определение: шифрование или разблокировка
          </p>
        </div>
      </div>
    </div>
  );
};

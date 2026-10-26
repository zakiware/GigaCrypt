import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import introVideo from '../assets/intro.mp4';
import { FastForward } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFinish = () => {
    if (!isVisible) return;
    setIsVisible(false);
    setTimeout(onFinish, 400);
  };

  useEffect(() => {
    // Safety fallback: if video doesn't end within 7 seconds, proceed automatically
    const fallbackTimer = setTimeout(() => {
      handleFinish();
    }, 7000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.warn('Autoplay notice:', err);
      });
    }

    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black select-none overflow-hidden cursor-pointer"
          onClick={handleFinish}
        >
          {/* Video Player */}
          <video
            ref={videoRef}
            src={introVideo}
            autoPlay
            playsInline
            onEnded={handleFinish}
            onError={handleFinish}
            className="w-full h-full object-contain pointer-events-none"
          />

          {/* Skip Button */}
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.3 }}
            onClick={(e) => {
              e.stopPropagation();
              handleFinish();
            }}
            className="absolute top-5 right-5 z-10 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/15 backdrop-blur-md text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-lg active:scale-95 cursor-pointer"
          >
            <span>Пропустить</span>
            <FastForward className="w-3.5 h-3.5" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

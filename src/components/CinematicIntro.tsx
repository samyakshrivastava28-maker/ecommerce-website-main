import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { BRAND } from '../config';
import { motion, AnimatePresence } from 'framer-motion';

export const CinematicIntro: React.FC = () => {
  const { hasSeenIntro, setHasSeenIntro } = useAppStore();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (hasSeenIntro) return;
    
    // Fast automatic skip fallback (3 seconds instead of 7 to avoid annoying delay)
    const timer = setTimeout(() => {
      completeIntro();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [hasSeenIntro]);

  const completeIntro = () => {
    setFadeOut(true);
    setTimeout(() => setHasSeenIntro(true), 800); // Faster fadeout
  };

  if (hasSeenIntro) return null;

  return (
    <AnimatePresence>
      {!fadeOut && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black overflow-hidden"
        >
          <div className="absolute inset-0 flex items-center justify-center z-0 p-4 md:p-0">
            <div className="w-full max-w-[450px] aspect-square md:max-w-none md:aspect-auto md:w-full md:h-full overflow-hidden rounded-2xl md:rounded-none border border-white/5 md:border-none shadow-[0_0_50px_rgba(212,175,55,0.1)] md:shadow-none bg-black/40">
              <video
                autoPlay
                muted
                playsInline
                onEnded={completeIntro}
                className="w-full h-full object-cover opacity-60 md:opacity-80"
              >
                <source src={BRAND.introVideoUrl} type="video/mp4" />
              </video>
            </div>
          </div>
          <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none" />
          
          {/* Real-time elegant instant Skip button to bypass any freeze / block */}
          <button
            onClick={completeIntro}
            className="absolute top-6 right-6 z-30 bg-black/60 hover:bg-gold-500 hover:text-black border border-gold-500/30 text-gold-400 font-mono text-[9px] uppercase tracking-[0.2em] py-2.5 px-5 rounded-full transition-all cursor-pointer shadow-lg active:scale-95"
          >
            Skip Intro
          </button>
          
          <div className="z-20 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 1.0 }}
              className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden mb-8 border border-gold-500/30 shadow-[0_0_40px_rgba(212,175,55,0.4)]"
            >
              <img src={BRAND.logoUrl} alt={BRAND.name} className="w-full h-full object-cover" />
            </motion.div>
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.8, duration: 0.8 }}
               className="h-1 w-24 bg-white/10 rounded-full overflow-hidden"
            >
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "0%" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="h-full w-full bg-gold-400"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

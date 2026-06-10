import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';

export const FloatingSupport = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  useEffect(() => {
    if (hasDismissed) return;

    const interval = setInterval(() => {
      setShowPopup(true);
      
      // Auto-hide after 5 seconds if not interacted
      setTimeout(() => {
        setShowPopup(false);
      }, 5000);
    }, 15000);

    return () => clearInterval(interval);
  }, [hasDismissed]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="bg-zinc-900 border border-gold-500/30 shadow-2xl p-4 rounded-2xl w-64 md:w-72 relative pointer-events-auto shadow-[0_0_30px_rgba(212,175,55,0.15)]"
          >
            <button
              onClick={() => {
                setShowPopup(false);
                setHasDismissed(true);
              }}
              className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full gold-gradient-bg flex items-center justify-center shrink-0">
                <MessageSquare size={14} className="text-black" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gold-500 uppercase tracking-widest mb-1">Prime Elite Store Support</h4>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                  Hello! How can we assist you with our premium collection today?
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => {
          setShowPopup(true);
          setHasDismissed(false);
        }}
        className="w-14 h-14 rounded-full bg-gold-500 text-black flex items-center justify-center shadow-lg hover:scale-105 hover:bg-gold-400 transition-all pointer-events-auto border-4 border-black group"
      >
        <MessageSquare size={24} className="group-hover:scale-110 transition-transform" />
      </button>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export const PrimeEliteAI: React.FC<{ hasCart?: boolean }> = ({ hasCart }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Only show popup if assistant is not open
    if (isOpen) {
      setShowPopup(false);
      return;
    }

    const interval = setInterval(() => {
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 5000); // hide after 5 seconds
    }, 15000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleToggleAssistant = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setShowPopup(false);
    }
  };

  return (
    <div className={`fixed z-50 transition-all duration-300 ${hasCart ? 'bottom-28 right-6' : 'bottom-6 right-6'} flex flex-col items-end`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="mb-4 w-[calc(100vw-3rem)] sm:w-[400px] h-[600px] max-h-[calc(100vh-8rem)] bg-zinc-950 border border-gold-500/20 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(212,175,55,0.15)] overflow-hidden flex flex-col relative"
          >
            <div className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black rounded-full cursor-pointer z-10 transition-colors backdrop-blur-sm shadow border border-white/10" onClick={handleToggleAssistant}>
              <X size={16} className="text-white" />
            </div>
            <iframe 
              src="https://primeelitestore-ai.netlify.app" 
              className="w-full h-full border-none bg-zinc-950"
              title="Prime Elite AI Assistant"
              allow="microphone; clipboard-write; clipboard-read"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPopup && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="group absolute bottom-[72px] right-0 bg-zinc-900 border border-gold-500/30 text-white p-3 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.15)] flex flex-col gap-1 w-56 md:w-64 cursor-pointer hover:border-gold-500/50 transition-colors"
            onClick={handleToggleAssistant}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-gold-500 uppercase tracking-widest leading-none">Prime Elite Store Support</span>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowPopup(false); }}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X size={12} />
              </button>
            </div>
            <p className="text-xs text-zinc-300 font-sans mt-0.5">Need help finding something? Ask our AI assistant.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={handleToggleAssistant}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_30px_rgba(212,175,55,0.25)] border ${
          isOpen ? 'bg-zinc-900 border-gold-500/50 text-gold-500 scale-90' : 'gold-gradient-bg text-black hover:scale-105 border-transparent'
        }`}
        title={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} className="animate-pulse" />}
      </button>
    </div>
  );
};


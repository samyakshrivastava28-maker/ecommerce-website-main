import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
}

export const SupportAssistant = ({ hasCart = false }: { hasCart?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'bot', text: 'Welcome to Prime Elite Store. How may I assist you with our luxury electronics collection today?' }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Show popup every 30 seconds if not already open
    const interval = setInterval(() => {
      if (!isOpen) {
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 5000); // hide after 5s
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!inputVal.trim()) return;

    const userMsg = inputVal.trim();
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userMsg }]);
    setInputVal('');

    // Simulate smart bot response
    setTimeout(() => {
      let botResponse = "I'm sorry, I'm an AI assistant in training. For precise queries, please use our contact page or WhatsApp support: 6263629683.";
      
      const lower = userMsg.toLowerCase();
      if (lower.includes('minimum') || lower.includes('quantity')) {
        botResponse = "Our minimum order quantity is strictly 2 products across the catalogue. This allows us to ensure premium processing for all clients.";
      } else if (lower.includes('payment') || lower.includes('advance')) {
        botResponse = "We require a 50% advance payment upfront before processing your luxury electronic orders. The remaining 50% is handled post-processing.";
      } else if (lower.includes('delivery') || lower.includes('shipping')) {
        botResponse = "We provide expedited shipping on all our premium orders globally securely packaged to remain immaculate.";
      } else if (lower.includes('hello') || lower.includes('hi')) {
        botResponse = "Hello! Welcome to the Prime Elite premium collection. Are you looking for smart watches or audio gear today?";
      }

      setMessages(prev => [...prev, { id: Date.now().toString() + 'bot', role: 'bot', text: botResponse }]);
    }, 1000);
  };

  return (
    <div className={`fixed right-6 z-50 flex flex-col items-end transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${hasCart ? 'bottom-40' : 'bottom-6'}`}>
      <AnimatePresence>
        {showPopup && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="mb-4 bg-black/80 backdrop-blur-md border border-gold-500/30 text-white px-4 py-3 rounded-xl shadow-lg relative"
          >
            <p className="text-sm font-medium">✨ Prime Elite Support</p>
            <p className="text-xs text-gray-400 mt-1">Need help with our collection?</p>
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-black/80 border-b border-r border-gold-500/30 transform rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-80 sm:w-96 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden shadow-gold-500/10 flex flex-col h-[28rem]"
          >
            <div className="gold-gradient-bg p-4 flex justify-between items-center text-black">
              <div>
                <h3 className="font-bold text-sm">AI Assistant</h3>
                <p className="text-[10px] opacity-80">Prime Elite Store</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-black/10 p-1 rounded-full text-black transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 text-sm scroll-smooth">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`max-w-[85%] p-3 rounded-lg flex flex-col ${
                    msg.role === 'bot' 
                      ? 'bg-white/5 border border-white/10 rounded-tl-none self-start text-gray-200' 
                      : 'bg-gold-500/20 border border-gold-500/30 rounded-tr-none self-end text-white'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="p-3 border-t border-white/5"
            >
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Type a message..." 
                  className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-3 pr-12 text-sm text-white focus:outline-none focus:border-gold-500/50 transition-colors"
                />
                <button 
                  type="submit" 
                  disabled={!inputVal.trim()}
                  className="absolute right-2 text-gold-500 hover:text-gold-400 p-2 disabled:opacity-50 transition-colors"
                >
                  <MessageSquare size={16} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setShowPopup(false);
        }}
        className="w-14 h-14 rounded-full gold-gradient-bg text-black shadow-lg shadow-gold-500/20 flex items-center justify-center hover:scale-110 transition-transform"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};

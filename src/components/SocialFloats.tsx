import React from 'react';
import { Phone, Instagram, MessageCircle } from 'lucide-react';
import { CONTACT_INFO } from '../config';

export const SocialFloats = () => {
  return (
    <div className="fixed left-6 bottom-6 z-40 flex flex-col gap-4">
      <a 
        href={`tel:${CONTACT_INFO.phone}`} 
        className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-white hover:bg-gold-500 hover:text-black transition-all hover:scale-110 group relative"
      >
        <Phone size={20} />
        <span className="absolute left-14 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto bg-black border border-white/10 px-3 py-1 rounded text-xs whitespace-nowrap transition-opacity text-white">
          Call Us
        </span>
      </a>
      <a 
        href={CONTACT_INFO.whatsapp} 
        target="_blank" 
        rel="noopener noreferrer"
        className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-white hover:bg-green-500 hover:text-black transition-all hover:scale-110 group relative"
      >
        <MessageCircle size={20} />
        <span className="absolute left-14 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto bg-black border border-white/10 px-3 py-1 rounded text-xs whitespace-nowrap transition-opacity text-white">
          WhatsApp
        </span>
      </a>
      <a 
        href={CONTACT_INFO.instagram} 
        target="_blank" 
        rel="noopener noreferrer"
        className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-white hover:bg-pink-600 hover:text-white transition-all hover:scale-110 group relative"
      >
        <Instagram size={20} />
        <span className="absolute left-14 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto bg-black border border-white/10 px-3 py-1 rounded text-xs whitespace-nowrap transition-opacity text-white">
          Instagram
        </span>
      </a>
    </div>
  );
};


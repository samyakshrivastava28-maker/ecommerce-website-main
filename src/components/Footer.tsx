import React from 'react';
import { Link } from 'react-router-dom';
import { BRAND, CONTACT_INFO } from '../config';

export const Footer = () => {
  return (
    <footer className="bg-black/90 border-t border-white/5 pt-20 pb-10 mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-4 gap-12 text-sm">
        <div className="col-span-1 md:col-span-1 flex flex-col items-start gap-4">
          <img src={BRAND.logoUrl} alt="Logo" className="w-16 h-16 rounded-full border border-gold-500/30" />
          <p className="text-gray-400 max-w-xs leading-relaxed text-xs">
            Premium electronics ecommerce store specializing in luxury watches, smart audio, and exclusive tech gadgets.
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold tracking-widest uppercase mb-6 text-xs border-b border-gold-500/20 pb-2 inline-block">Explore</h4>
          <ul className="space-y-4 text-gray-400">
            <li><Link to="/products" className="hover:text-gold-400 transition-colors">Our Collection</Link></li>
            <li><Link to="/" className="hover:text-gold-400 transition-colors">Home Page</Link></li>
            <li><Link to="/contact" className="hover:text-gold-400 transition-colors">Contact Us</Link></li>
          </ul>
        </div>

        <div>
           <h4 className="text-white font-bold tracking-widest uppercase mb-6 text-xs border-b border-gold-500/20 pb-2 inline-block">Legal</h4>
          <ul className="space-y-4 text-gray-400">
            <li><Link to="/policies" className="hover:text-gold-400 transition-colors">Privacy Policy</Link></li>
            <li><Link to="/policies" className="hover:text-gold-400 transition-colors">Terms & Conditions</Link></li>
            <li><Link to="/policies" className="hover:text-gold-400 transition-colors">Refund & Return Policy</Link></li>
          </ul>
        </div>

        <div>
           <h4 className="text-white font-bold tracking-widest uppercase mb-6 text-xs border-b border-gold-500/20 pb-2 inline-block">Contact</h4>
          <ul className="space-y-4 text-gray-400">
            <li className="flex items-center gap-2">
              <span className="text-gold-500">Phone:</span> <a href={`tel:${CONTACT_INFO.phone}`} className="hover:text-gold-400 transition-colors">{CONTACT_INFO.phone}</a>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-gold-500">WhatsApp:</span> <a href={CONTACT_INFO.whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-gold-400 transition-colors">Chat With Us</a>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-gold-500">Email:</span> <a href={`mailto:${CONTACT_INFO.email}`} className="hover:text-gold-400 transition-colors">{CONTACT_INFO.email}</a>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-16 pt-8 border-t border-white/5 flex flex-col items-center gap-4 text-xs text-gray-600">
        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
          <p>Ultra-Premium Electronic Experience</p>
        </div>
        <p className="text-center text-gray-500 mt-2">
          This Website made by <a href="https://28webhub.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:text-gold-400 font-bold transition-colors">S-Web Hub</a>
        </p>
      </div>
    </footer>
  );
};

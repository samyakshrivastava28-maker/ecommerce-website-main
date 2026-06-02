import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X, User } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { BRAND } from '../config';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCartTooltip, setShowCartTooltip] = useState(false);
  const items = useCartStore((state) => state.items);
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let interval: any;
    if (totalItems > 0) {
      interval = setInterval(() => {
        setShowCartTooltip(true);
        setTimeout(() => setShowCartTooltip(false), 4000); // 4 seconds duration
      }, 15000);
    } else {
      setShowCartTooltip(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [totalItems]);

  const isAdmin = user && (
    user.email?.toLowerCase().trim() === 'webhub2811@gmail.com' || 
    user.email?.toLowerCase().trim() === 'prime.elitestore02@gmail.com' ||
    user.email?.toLowerCase().trim() === 'primeelitestore02@gmail.com'
  );

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Collection', path: '/products' },
    { name: 'Contact', path: '/contact' },
    ...(isAdmin ? [{ name: 'Admin', path: '/admin' }] : [])
  ];

  return (
    <header 
      className={`fixed top-0 w-full z-40 transition-all duration-500 ${
        isScrolled ? 'bg-black/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex justify-between items-center">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-gold-500/30 group-hover:border-gold-500 transition-colors">
            <img src={BRAND.logoUrl} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-display font-bold text-xl tracking-wider text-white hidden sm:block">
            PRIME <span className="gold-gradient-text text-transparent">ELITE</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`text-sm uppercase tracking-widest transition-colors ${
                location.pathname === link.path ? 'text-gold-400 font-medium' : 'text-gray-400 hover:text-white'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-full overflow-hidden border border-gold-500/30 flex items-center justify-center bg-zinc-900" 
                title={user.email || user.name}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || user.name || 'User')}&background=d4af37&color=000`} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                  />
                )}
              </div>
              <button 
                onClick={() => {
                  if (confirm('Are you sure you want to sign out of your premium account?')) {
                    logout();
                  }
                }} 
                className="text-gray-400 hover:text-red-400 transition-colors text-xs uppercase tracking-widest font-mono font-bold"
                title="Sign Out"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link 
              to="/login?mode=signup" 
              className="text-gray-300 hover:text-gold-400 transition-colors uppercase tracking-widest text-xs font-bold font-mono py-1 px-3 border border-white/15 rounded-md hover:border-gold-500/50 bg-white/5"
            >
              Sign Up
            </Link>
          )}
          <div className="relative">
            <Link to="/checkout" className="relative text-gray-300 hover:text-gold-400 transition-colors flex items-center">
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-gold-500 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
            
            {/* 15-second repeated tooltip */}
            <AnimatePresence>
              {showCartTooltip && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  className="absolute top-[150%] right-0 mt-2 whitespace-nowrap bg-zinc-950 border border-gold-500/30 text-white text-[10px] uppercase tracking-widest font-mono py-2 px-3 rounded shadow-[0_0_15px_rgba(212,175,55,0.1)] pointer-events-none z-50"
                >
                  <div className="absolute -top-1.5 right-1 w-3 h-3 bg-zinc-950 border-t border-l border-gold-500/30 transform rotate-45" />
                  Tap to view your cart
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button 
            className="md:hidden text-gray-300"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'tween', duration: 0.4 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex flex-col"
          >
            <div className="flex justify-end p-6">
              <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white">
                <X size={32} />
              </button>
            </div>
            <div className="flex flex-col items-center justify-center flex-1 gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-display text-3xl font-bold tracking-widest uppercase hover:text-gold-400 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

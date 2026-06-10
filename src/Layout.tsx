import React, { useEffect, useState, Suspense, useMemo } from 'react';
import { Outlet, useSearchParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CinematicIntro } from './components/CinematicIntro';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Lock, AlertCircle, X, ShoppingBag } from 'lucide-react';
import { PhoneNumberRequiredPage } from './components/PhoneNumberRequiredPage';
import { useAuthStore } from './store/authStore';
import { useCartStore } from './store/cartStore';
import { SEO } from './components/SEO';

const PrimeEliteAI = React.lazy(() =>
  import('./components/PrimeEliteAI').then((module) => ({ default: module.PrimeEliteAI }))
);

export const Layout = () => {
  const { user, isCompliant, loading } = useAuthStore();
  const { items } = useCartStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showUnauthorizedAlert, setShowUnauthorizedAlert] = useState(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [isConnectionFailed, setIsConnectionFailed] = useState(false);
  const [loadAssistant, setLoadAssistant] = useState(false);
  
  const isRestrictedRoute = ['/products', '/checkout', '/cart'].some(route => location.pathname.startsWith(route));

  // Do not show floating cart on the actual checkout page to prevent duplication
  const hideFloatingCart = location.pathname === '/checkout' || items.length === 0;

  const totalCartItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartValue = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Dynamic SEO Configuration
  const seoConfig = useMemo(() => {
    const path = location.pathname;
    
    if (path === '/') return { title: 'Prime Elite Store | Premium Watches & Smart Devices', description: 'Experience the pinnacle of audio engineering and luxury timepieces. Curated premium electronics for those who demand excellence.' };
    if (path.startsWith('/products')) return { title: 'Exclusive Collection | Prime Elite Store', description: 'Explore our meticulously curated selection of premium electronics, luxury watches, and high-fidelity audio.' };
    if (path === '/checkout') return { title: 'Secure Checkout | Prime Elite Store', description: 'Complete your purchase securely. Fast and reliable delivery for premium orders.' };
    if (path === '/login') return { title: 'Secure Login | Prime Elite Store', description: 'Access your premium account, track orders, and manage wishlist collections.' };
    if (path === '/admin') return { title: 'Admin Portal | Prime Elite Store', description: 'Secure inventory and order management system.' };
    
    return { title: 'Prime Elite Store | Premium Watches & Smart Devices', description: 'Premium Electronics Collection' };
  }, [location.pathname]);

  useEffect(() => {
    if (searchParams.get('unauthorized') === 'true') {
      setShowUnauthorizedAlert(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleQuotaError = () => {
      setIsQuotaExceeded(true);
    };

    const handleConnectionError = () => {
      setIsConnectionFailed(true);
    };

    window.addEventListener('firebase-quota-exceeded', handleQuotaError);
    window.addEventListener('firebase-connection-failed', handleConnectionError);
    
    return () => {
      window.removeEventListener('firebase-quota-exceeded', handleQuotaError);
      window.removeEventListener('firebase-connection-failed', handleConnectionError);
    };
  }, []);

  useEffect(() => {
    // Gracefully defer AI assistant chunk load logic to prevent network/CPU thrashing on initial load
    const timer = setTimeout(() => {
      setLoadAssistant(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const closeAlert = () => {
    setShowUnauthorizedAlert(false);
    // Clean up the URL query parameters
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('unauthorized');
    setSearchParams(newParams, { replace: true });
  };

  if (!loading && user && !isCompliant) {
    return (
      <div className="flex flex-col min-h-screen bg-black">
        <PhoneNumberRequiredPage />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <SEO title={seoConfig.title} description={seoConfig.description} />
      <CinematicIntro />
      
      {/* Real-time Quota Recovery Intercept Banner */}
      <AnimatePresence>
        {isQuotaExceeded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gold-500/10 border-b border-gold-500/20 text-gold-400 text-xs font-mono py-3 px-6 text-center flex items-center justify-center gap-2.5 relative z-50 backdrop-blur-md"
          >
            <AlertCircle size={14} className="animate-pulse text-gold-500 shrink-0" />
            <span className="leading-normal">
              <strong>Database Notice:</strong> Cloud limits exceeded. Seamlessly transitioned to <strong className="text-white uppercase px-1.5 py-0.5 bg-gold-500/20 rounded">High-Fidelity Offline Sandbox</strong>. Browse items, customize, and mock buy flawlessly!
            </span>
            <button 
              onClick={() => setIsQuotaExceeded(false)}
              className="hover:text-white p-1 cursor-pointer ml-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center"
              title="Acknowledge informational shield"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time Connection Intercept Banner */}
      <AnimatePresence>
        {isConnectionFailed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs font-mono py-3 px-6 text-center flex items-center justify-center gap-2.5 relative z-50 backdrop-blur-md"
          >
            <AlertCircle size={14} className="animate-pulse text-red-500 shrink-0" />
            <span className="leading-normal">
              <strong>Database Notice:</strong> The Firestore client is offline. Seamlessly transitioned to <strong className="text-white uppercase px-1.5 py-0.5 bg-red-500/20 rounded">High-Resilient Local Cache</strong>. You can safely continue browsing and customizing products!
            </span>
            <button 
              onClick={() => setIsConnectionFailed(false)}
              className="hover:text-white p-1 cursor-pointer ml-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center"
              title="Acknowledge connection failure"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar />
      <main className="flex-1 w-full relative z-10 flex flex-col">
        {!loading && user && !isCompliant && isRestrictedRoute ? (
             <div className="flex-1 flex items-center justify-center text-white p-6 text-center">
                 Please complete your profile by adding your phone number to continue shopping.
             </div>
        ) : (
             <Outlet />
        )}
      </main>
      <Footer />

      {loadAssistant && (
        <Suspense fallback={null}>
          <PrimeEliteAI hasCart={!hideFloatingCart} />
        </Suspense>
      )}

      {/* Floating Cart Panel */}
      <AnimatePresence>
        {!hideFloatingCart && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-40 bg-zinc-950 border border-gold-500/30 rounded-xl p-4 shadow-[0_4px_30px_rgba(212,175,55,0.15)] flex flex-col gap-3 min-w-[240px] md:min-w-[280px]"
          >
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2 text-gold-500">
                <ShoppingBag size={20} />
                <span className="font-bold text-sm tracking-widest uppercase">Your Cart</span>
              </div>
              <div className="bg-white/10 px-2 py-0.5 rounded text-xs font-mono">
                {totalCartItems} {totalCartItems === 1 ? 'item' : 'items'}
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Total Value:</span>
              <span className="text-white font-mono font-medium">₹{totalCartValue.toLocaleString()}</span>
            </div>

            <Link
              to="/checkout"
              className="block w-full gold-gradient-bg text-black font-bold uppercase tracking-widest text-xs py-3 rounded-lg hover:shadow-lg transition-all active:scale-95 text-center mt-1"
            >
              View Cart
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Security Intercept Modal */}
      <AnimatePresence>
        {showUnauthorizedAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAlert}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md bg-zinc-950 border border-gold-500/30 rounded-2xl p-8 text-center shadow-[0_0_50px_rgba(212,175,55,0.15)] overflow-hidden"
            >
              {/* Gold gradient accent line at the top */}
              <div className="absolute top-0 left-0 right-0 h-1 gold-gradient-bg" />

              {/* Glowing Shield Icon */}
              <div className="mx-auto w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mb-6 relative animate-pulse">
                <ShieldAlert className="w-8 h-8 text-gold-400" />
                <div className="absolute inset-0 rounded-full bg-gold-500/5 blur-md" />
              </div>

              {/* Title */}
              <h3 className="font-display font-bold text-2xl tracking-wide text-white uppercase mb-2">
                Access <span className="gold-gradient-text">Restricted</span>
              </h3>
              
              <div className="flex justify-center items-center gap-1.5 text-[10px] text-gold-500 font-mono tracking-widest uppercase mb-6 bg-gold-500/5 px-3 py-1 rounded w-fit mx-auto border border-gold-500/15">
                <Lock size={10} className="inline" /> Security Shield Active
              </div>

              <p className="text-gray-400 text-sm leading-relaxed mb-8 font-light">
                Your account does not possess the administrative clearance required to access the Secure Inventory Management suite. Access to this workspace is restricted strictly to authorized emails: <span className="font-bold text-gold-400">prime.elitestore02@gmail.com</span> or <span className="font-bold text-gold-400">primeelitestore02@gmail.com</span>.
              </p>

              {/* Footer Button */}
              <button
                onClick={closeAlert}
                className="w-full relative group overflow-hidden gold-gradient-bg font-bold font-mono text-xs uppercase tracking-widest text-black py-4 rounded shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <span className="relative z-10 text-black font-extrabold hover:text-black">Acknowledge Protection Shield</span>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

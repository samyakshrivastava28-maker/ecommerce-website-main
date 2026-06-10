import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { BRAND } from '../config';
import { Link } from 'react-router-dom';
import { ShoppingBag, ChevronRight, Star } from 'lucide-react';
import { LazyVideo } from '../components/LazyVideo';
import { SEO } from '../components/SEO';
import { useAppStore } from '../store/appStore';

export const Home = () => {
  const { ads, products, initializeProductsListener } = useAppStore();
  const activeAds = ads.filter(a => a.active);

  useEffect(() => {
    const unsub = initializeProductsListener();
    return () => unsub();
  }, [initializeProductsListener]);

  return (
    <div className="w-full">
      {/* Cinematic Hero */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center z-0 p-4 md:p-0">
          <div className="w-full max-w-[450px] aspect-square md:max-w-none md:aspect-auto md:w-full md:h-full overflow-hidden rounded-2xl md:rounded-none border border-white/5 md:border-none shadow-[0_0_50px_rgba(212,175,55,0.05)] md:shadow-none bg-black/40">
            <LazyVideo
              src={BRAND.heroVideoUrl}
              className="w-full h-full object-cover opacity-50 md:opacity-60"
            />
          </div>
        </div>
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black z-1 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.15)_0%,rgba(0,0,0,0.85)_100%)] z-1 pointer-events-none" />

        <div className="relative z-10 text-center max-w-4xl mx-auto px-6 flex flex-col items-center mt-20 md:mt-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mb-6 flex items-center justify-center gap-3 w-fit mx-auto px-4 py-1.5 rounded-full border border-gold-500/30 bg-black/50 backdrop-blur-md"
          >
            <Star size={14} className="text-gold-500" />
            <span className="text-xs uppercase tracking-[0.3em] font-medium text-gray-300">New Arrivals</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white mb-6 tracking-tight leading-tight"
          >
            PRIME <span className="gold-gradient-text">ELITE</span> STORE
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto font-light leading-relaxed"
          >
            Experience the pinnacle of audio engineering and luxury timepieces. 
            Curated premium electronics for those who demand excellence.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="flex flex-col sm:flex-row gap-6 justify-center w-full sm:w-auto"
          >
            <Link
              to="/products"
              className="group relative overflow-hidden bg-white text-black px-8 py-4 flex items-center justify-center gap-3 rounded hover:scale-105 transition-transform"
            >
              <div className="absolute inset-0 gold-gradient-bg opacity-0 group-hover:opacity-10 transition-opacity" />
              <ShoppingBag size={18} />
              <span className="font-semibold uppercase tracking-widest text-sm">Shop Now</span>
            </Link>
            
            <Link
              to="/products"
              className="group flex items-center justify-center gap-2 px-8 py-4 rounded border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              <span className="uppercase tracking-widest text-sm font-medium">View Offers</span>
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Dynamic Advertisements */}
      {activeAds.length > 0 && (
        <section className="py-12 bg-black border-b border-white/5 relative z-10">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeAds.map((ad, i) => (
                <motion.div
                  key={ad.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                >
                  <Link 
                    to={ad.linkUrl || '/products'} 
                    className="block group relative overflow-hidden rounded-2xl aspect-[16/9] border border-white/5 bg-zinc-950"
                  >
                    {ad.imageUrl?.match(/\.(mp4|webm)$/i) ? (
                      <LazyVideo
                        src={ad.imageUrl}
                        className="w-full h-full object-cover opacity-70 group-hover:scale-105 group-hover:opacity-90 transition-all duration-700 pointer-events-none"
                      />
                    ) : (
                      <img 
                        src={ad.imageUrl} 
                        alt={ad.title} 
                        className="w-full h-full object-cover opacity-70 group-hover:scale-105 group-hover:opacity-90 transition-all duration-700"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-6 w-full">
                      <div className="inline-block px-3 py-1 bg-gold-500/10 border border-gold-500/20 text-gold-500 text-[9px] font-bold uppercase tracking-widest rounded-full mb-3">
                        Featured Offer
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{ad.title}</h3>
                      {ad.description && <p className="text-zinc-300 text-xs mb-4 line-clamp-2">{ad.description}</p>}
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold-500 group-hover:text-gold-400 transition-colors">
                        {ad.buttonText || 'Shop Now'} <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Categories (Minimalist Concept) */}
      <section className="py-24 bg-black relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row gap-12 items-end justify-between mb-16">
            <div>
              <h2 className="text-3xl md:text-5xl font-display font-light text-white mb-4">
                The <span className="font-bold gold-gradient-text">Collection</span>
              </h2>
              <p className="text-gray-400 max-w-md">Discover our meticulously curated selection of premium electronics.</p>
            </div>
            <Link to="/products" className="text-gold-500 uppercase tracking-widest text-xs flex items-center gap-2 hover:text-gold-400 transition-colors group">
              Explore All <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Luxury Watches',
                categoryKey: 'Watches',
                videoUrl: 'https://res.cloudinary.com/dxegdaylf/video/upload/v1779982835/WhatsApp_Video_2026-05-28_at_13.52.26_mqbsbs.mp4'
              },
              {
                name: 'High-Fidelity Audio',
                categoryKey: 'EarPods',
                videoUrl: 'https://res.cloudinary.com/dxegdaylf/video/upload/v1779982535/WhatsApp_Video_2026-05-28_at_13.41.54_2_nsaops.mp4'
              },
              {
                name: 'Smart Devices',
                categoryKey: 'Smartwatches',
                videoUrl: 'https://res.cloudinary.com/dxegdaylf/video/upload/v1779982551/WhatsApp_Video_2026-05-18_at_17.07.22_pamdz3.mp4'
              }
            ].map((col, i) => (
              <motion.div
                key={col.name} 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: i * 0.2 }}
              >
                <Link 
                  to={`/products?category=${col.categoryKey}`}
                  className="group relative h-96 overflow-hidden rounded-xl border border-white/5 cursor-pointer bg-zinc-950 flex flex-col justify-end p-8 hover:border-gold-500/30 transition-colors w-full inline-block"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10 pointer-events-none" />
                  <div className="absolute inset-0 bg-gold-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />
                  
                  {/* Background Looping Video */}
                  <div className="absolute inset-0 z-0 bg-zinc-950 group-hover:scale-105 transition-transform duration-700 ease-out flex items-center justify-center overflow-hidden">
                    <LazyVideo
                      src={col.videoUrl}
                      className="w-full h-full object-cover opacity-50 group-hover:opacity-65 transition-opacity"
                    />
                  </div>
                  
                  <div className="relative z-20">
                    <h3 className="text-2xl font-bold text-white mb-2 tracking-wide group-hover:text-gold-400 transition-colors">{col.name}</h3>
                    <p className="text-xs uppercase tracking-widest text-gold-500/80 font-bold flex items-center gap-1 opacity-90 group-hover:opacity-100 translation-transform duration-300">
                      Explore Collection <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

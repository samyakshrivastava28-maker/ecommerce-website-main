import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, checkQuotaExceeded } from '../firebase';
import { Product } from '../types';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { ShoppingBag, ChevronLeft, Star, Shield, Truck, Clock, Maximize2, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '../components/SEO';

export const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Media Gallery & Gallery History
  const [activeMedia, setActiveMedia] = useState<{ type: 'image' | 'video'; url: string } | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  
  // Interactive Zoom State (Amazon-style)
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  
  // Mobile Swipe State
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // Cinematic Lightbox Modal
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  const addItem = useCartStore(state => state.addItem);
  const { user, loading: authLoading } = useAuthStore();
  const { products, initializeProductsListener } = useAppStore();
  const navigate = useNavigate();

  // Ensure global cache is listening for real-time updates and fallback catalog data
  useEffect(() => {
    const unsubscribe = initializeProductsListener();
    return () => unsubscribe();
  }, [initializeProductsListener]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      const setProductData = (data: Product) => {
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          // Set to first variant by default
          setSelectedVariant(data.variants[0].color);
          if (data.variants[0].video) {
            setActiveMedia({ type: 'video', url: data.variants[0].video });
          } else {
            setActiveMedia({ type: 'image', url: data.variants[0].image });
          }
        } else {
          if (data.colors && data.colors.length > 0) {
            setSelectedVariant(data.colors[0]);
          }
          if (data.imageUrls && data.imageUrls.length > 0) {
            setActiveMedia({ type: 'image', url: data.imageUrls[0] });
          } else if (data.videoUrls && data.videoUrls.length > 0) {
            setActiveMedia({ type: 'video', url: data.videoUrls[0] });
          }
        }
      };

      // 1. Instantly check if product exists in our loaded global state cache to avoid double-fetching
      const cached = products.find(p => p.id === id);
      if (cached) {
        setProductData(cached);
        setLoading(false);
        return;
      }

      // 2. Fallback to standard request only if memory cache is empty/resolving
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        console.log(`[Firestore Read] Fetched single product details for ID: ${id}`);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Product;
          setProductData(data);
        }
      } catch (err: any) {
        checkQuotaExceeded(err);
        console.error("[Firestore Error] Firebase product load failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, products]);

  if (authLoading || !user || loading) {
    return (
      <div className="pt-32 min-h-screen flex justify-center items-center">
        <div className="animate-spin w-8 h-8 border-t-2 border-gold-500 rounded-full"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-32 min-h-screen flex flex-col justify-center items-center">
        <h2 className="text-2xl font-bold text-white mb-4">Product Not Found</h2>
        <Link to="/products" className="text-gold-500 hover:text-gold-400 flex items-center gap-2">
          <ChevronLeft size={16} /> Back to Products
        </Link>
      </div>
    );
  }

  // Compile active resources (images + videos) for swiping and thumbnails
  const mediaList = [
    ...(product.imageUrls?.map(url => ({ type: 'image' as const, url })) || []),
    ...(product.videoUrls?.map(url => ({ type: 'video' as const, url })) || [])
  ];

  // Support mobile touch swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (mediaList.length <= 1) return;

    const currentIndex = mediaList.findIndex(m => m.url === activeMedia?.url);
    if (currentIndex === -1) return;

    if (isLeftSwipe) {
      const nextIndex = (currentIndex + 1) % mediaList.length;
      setActiveMedia(mediaList[nextIndex]);
    } else if (isRightSwipe) {
      const prevIndex = (currentIndex - 1 + mediaList.length) % mediaList.length;
      setActiveMedia(mediaList[prevIndex]);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Amazon-style Zoom Move Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div className="pt-32 min-h-screen pb-20 max-w-7xl mx-auto px-6 lg:px-12">
      <SEO 
        title={`${product.productName} | Prime Elite Store`}
        description={`Buy ${product.productName} from Prime Elite Store. Premium quality, secure ordering, multiple variants available. ${product.description?.substring(0, 50)}...`}
        image={mediaList[0]?.url || 'https://primeelitestore.netlify.app/og-image.jpg'}
        url={`https://primeelitestore.netlify.app/products/${product.id}`}
        type="product"
        schema={{
          "@context": "https://schema.org/",
          "@type": "Product",
          "name": product.productName,
          "image": mediaList.map(m => m.url),
          "description": product.description,
          "sku": product.id,
          "brand": {
            "@type": "Brand",
            "name": product.category
          },
          "offers": {
            "@type": "Offer",
            "url": `https://primeelitestore.netlify.app/products/${product.id}`,
            "priceCurrency": "INR",
            "price": product.price,
            "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "itemCondition": "https://schema.org/NewCondition"
          }
        }}
      />
      <Link to="/products" className="text-sm text-gray-400 hover:text-gold-500 inline-flex items-center gap-2 mb-8 transition-colors">
        <ChevronLeft size={16} /> Back to Collection
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        
        {/* Left: Media Gallery and Swiper */}
        <div className="flex flex-col gap-6">
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="aspect-square bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center relative shadow-2xl group"
          >
            {/* Gallery Zoom Wrapper / Lens overlay */}
            <div 
              className="w-full h-full relative overflow-hidden flex items-center justify-center"
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
            >
              <AnimatePresence mode="wait">
                {activeMedia?.type === 'image' ? (
                  <motion.img 
                    key={activeMedia.url}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    src={activeMedia.url} 
                    alt={product.productName} 
                    style={isZoomed ? {
                      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    } : undefined}
                    className={`absolute inset-0 w-full h-full object-cover transition-transform duration-75 ${isZoomed ? 'scale-175 cursor-zoom-in z-10' : 'scale-100'}`} 
                  />
                                ) : activeMedia?.type === 'video' ? (
                  <motion.video 
                    key={activeMedia.url}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    src={activeMedia.url} 
                    autoPlay 
                    muted 
                    loop 
                    playsInline 
                    preload="metadata"
                    className="w-full h-full object-cover absolute inset-0" 
                  />
                ) : (
                  <span className="text-white/20 font-display font-bold text-6xl tracking-widest relative z-10">{product.category.toUpperCase()}</span>
                )}
              </AnimatePresence>
            </div>

            {/* Save Offer Badges */}
            {product.offerPercentage > 0 && (
              <div className="absolute top-6 left-6 bg-gold-500 text-black px-3 py-1 font-bold text-xs uppercase tracking-wider rounded-sm z-20 shadow-lg">
                Save {product.offerPercentage}%
              </div>
            )}

            {/* Custom Lightbox Toggle Command */}
            <button 
              onClick={() => setIsLightboxOpen(true)}
              className="absolute bottom-6 right-6 p-3 bg-black/60 hover:bg-gold-500 hover:text-black hover:scale-105 active:scale-95 text-white backdrop-blur-md rounded-full shadow-lg border border-white/10 z-20 transition-all opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center"
              title="View Luxury Fullscreen Gallery"
            >
              <Maximize2 size={18} />
            </button>
            
            {/* Guide Swipe indicator for mobile */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 py-1 px-3 bg-black/50 text-white/60 text-[10px] rounded-full tracking-wider uppercase backdrop-blur-sm z-10 md:hidden pointer-events-none transition-opacity">
              Swipe to explore variants
            </div>
          </div>
          
          {/* Amazon-style Premium Thumbnail List */}
          {mediaList.length > 0 && (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {mediaList.map((media, i) => (
                <button 
                  key={`${media.type}-${i}`}
                  onClick={() => setActiveMedia(media)}
                  className={`w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 relative transition-all ${activeMedia?.url === media.url ? 'border-gold-500 scale-102 shadow-[0_0_12px_rgba(212,175,55,0.4)]' : 'border-white/5 hover:border-white/30'}`}
                >
                  {media.type === 'image' ? (
                    <img src={media.url} alt={`${product.productName} view ${i}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full relative bg-zinc-900">
                      <video src={media.url} className="w-full h-full object-cover opacity-60" muted playsInline preload="metadata" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-gold-500/80 flex items-center justify-center">
                          <div className="w-0 h-0 border-t-4 border-l-6 border-b-4 border-transparent border-l-black ml-0.5" />
                        </div>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product details, selections, & pricing */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-gold-500">{product.category}</span>
            {product.badge && (
              <span className="bg-gold-500/10 text-gold-500 border border-gold-500/20 text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded">
                {product.badge}
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-medium text-white mb-4 leading-tight">
            {product.productName}
          </h1>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex text-gold-500">
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
            </div>
            <span className="text-gray-400 text-sm">(Premium Selection)</span>
          </div>

          <div className="flex items-end gap-6 mb-8 border-b border-white/10 pb-8">
            <div className="text-4xl font-bold text-white">₹{product.price.toLocaleString()}</div>
            {product.oldPrice > 0 && (
              <div className="text-xl text-gray-500 line-through mb-1">₹{product.oldPrice.toLocaleString()}</div>
            )}
          </div>

          {/* Amazon-style Luxury Variant Selector Buttons WITHOUT text name display */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Select your favourite variant</h3>
              </div>
              <div className="flex flex-wrap gap-4">
                {product.variants.map((variant, i) => {
                  const isSelected = selectedVariant === variant.color;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedVariant(variant.color);
                        if (variant.video) {
                          setActiveMedia({ type: 'video', url: variant.video });
                        } else {
                          setActiveMedia({ type: 'image', url: variant.image });
                        }
                      }}
                      className={`group/btn w-16 h-16 rounded-full overflow-hidden border-2 transition-all p-0.5 relative flex items-center justify-center ${isSelected ? 'border-gold-500 scale-110 shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'border-white/10 hover:border-white/40 hover:scale-105'}`}
                      title={`Model Option ${i+1}`}
                    >
                      <img src={variant.image} alt="Watch option" className="w-full h-full rounded-full object-cover" />
                      
                      {/* Premium indicator marker */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-gold-500/5 transition-opacity pointer-events-none" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {(!product.variants || product.variants.length === 0) && product.colors && product.colors.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Select your favourite variant</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedVariant(color)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all text-xs font-bold tracking-widest uppercase ${selectedVariant === color ? 'border-gold-500 text-gold-500 bg-gold-500/10' : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'}`}
                  >
                    Variant {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="prose prose-invert max-w-none text-gray-300 mb-10 leading-relaxed text-sm whitespace-pre-line border-b border-white/10 pb-8">
            {product.description}
          </div>

          {/* Dynamic Technical Specifications Grid */}
          {product.specifications && product.specifications.length > 0 && (
            <div className="mb-10 border-b border-white/10 pb-8">
              <h3 className="text-xs uppercase tracking-widest text-gold-500 font-bold mb-4 font-mono">Technical Specifications</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {product.specifications.map((spec, i) => (
                  <div key={i} className="flex justify-between items-center bg-zinc-950/40 border border-white/5 p-3 rounded-xl hover:border-gold-500/10 transition-colors">
                    <span className="text-gray-400 text-xs font-mono">{spec.key}</span>
                    <span className="text-white text-xs font-bold font-sans text-right pl-4 truncate max-w-[65%]" title={spec.value}>{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Secure details card */}
          <div className="bg-zinc-950/20 border border-white/5 rounded-xl p-6 mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="text-gold-500 shrink-0"><Shield size={24} /></div>
                <div>
                  <h4 className="text-white font-bold text-sm mb-1">Premium Guarantee</h4>
                  <p className="text-xs text-gray-400">Authentic luxury watch quality with original certification.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-gold-500 shrink-0"><Truck size={24} /></div>
                <div>
                  <h4 className="text-white font-bold text-sm mb-1">Secure Delivery</h4>
                  <p className="text-xs text-gray-400">Expedited, fully insured express shipping globally.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 md:col-span-2">
                <div className="text-gold-500 shrink-0"><Clock size={24} /></div>
                <div>
                  <h4 className="text-white font-bold text-sm mb-1">50% Advance Booking Policy</h4>
                  <p className="text-xs text-gray-400">We require a 50% advance payment upfront to reserve and ship your timepiece securely. The remaining balance is handled subsequently.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-auto">
            <button 
              onClick={() => {
                const confirmed = window.confirm(`Do you want to add ${product.productName} to your cart?`);
                if (confirmed) {
                  addItem({ ...product, selectedColor: selectedVariant || '' });
                  alert(`${product.productName} ${selectedVariant ? `(${selectedVariant}) ` : ''}added to your selection successfully!`);
                }
              }}
              disabled={product.stock <= 0}
              className="flex-1 gold-gradient-bg text-black font-bold uppercase tracking-widest py-5 rounded-xl flex items-center justify-center gap-3 hover:scale-[1.01] transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              <ShoppingBag size={20} />
              {product.stock > 0 ? 'Place Order Selection' : 'Temporarily Out of Stock'}
            </button>
          </div>
          
          <div className="text-center mt-6 text-xs text-zinc-500">
            Exclusive Luxury Distribution | Minimum order: Bulk or Duo (2 units minimum required)
          </div>

        </div>
      </div>

      {/* Fullscreen Luxury Lightbox Overlay Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[999] flex items-center justify-center p-6"
          >
            <button 
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-6 right-6 text-white/70 hover:text-white p-3 hover:bg-white/10 rounded-full transition-colors z-[1001]"
            >
              <X size={26} />
            </button>

            <div className="max-w-4xl max-h-[85vh] w-full flex flex-col justify-center items-center relative gap-6">
              <div className="w-full h-full max-h-[70vh] flex items-center justify-center overflow-hidden">
                {activeMedia?.type === 'image' ? (
                  <motion.img 
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    src={activeMedia.url} 
                    alt={product.productName} 
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl" 
                  />
                ) : (
                  <motion.video 
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    src={activeMedia?.url} 
                    autoPlay 
                    controls 
                    muted 
                    loop 
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl" 
                  />
                )}
              </div>

              {/* Lightbox Mini Swiper Nav */}
              <div className="flex gap-3 justify-center max-w-full overflow-x-auto p-2">
                {mediaList.map((m, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveMedia(m)}
                    className={`w-14 h-14 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${activeMedia?.url === m.url ? 'border-gold-500 scale-105' : 'border-white/10 hover:border-white/30'}`}
                  >
                    {m.type === 'image' ? (
                      <img src={m.url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                        <div className="w-0 h-0 border-t-3 border-l-5 border-b-3 border-transparent border-l-gold-500" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

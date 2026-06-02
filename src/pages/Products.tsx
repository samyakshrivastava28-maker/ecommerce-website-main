import React, { useState, useEffect } from 'react';
import { checkQuotaExceeded } from '../firebase';
import { Product } from '../types';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { ShoppingBag, Search, Filter, ChevronRight } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { useCartStore } from '../store/cartStore';

export const Products = () => {
  const { products, productsLoading: loading, initializeProductsListener } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [visibleItems, setVisibleItems] = useState(12);
  const [priceFilter, setPriceFilter] = useState<number | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [confirmProduct, setConfirmProduct] = useState<Product | null>(null);
  const { user, loading: authLoading } = useAuthStore();
  const navigate = useNavigate();

  // Reset visible items when category or search changes
  useEffect(() => {
    setVisibleItems(12);
  }, [activeCategory, debouncedQuery, priceFilter]);

  // 1. Debounce Search Input changes to prevent excessive re-renders on keystrokes
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Authentication guard
  useEffect(() => {
    if (!authLoading && !user) {
      alert("You can't see our collection without signup. Please create an account to view our premium items.");
      navigate('/login?redirect=products&mode=signup');
    }
  }, [user, authLoading, navigate]);

  // Helper for skeletons
  const SkeletonCard = () => (
    <div className="flex flex-col bg-zinc-950 border border-white/5 rounded-xl pb-3 md:pb-5 overflow-hidden w-full h-full min-w-0 md:min-w-[280px]">
      <div className="aspect-square bg-white/5 animate-pulse" />
      <div className="p-3 md:p-5 flex flex-col flex-1 gap-2">
        <div className="h-3 bg-white/5 rounded w-1/3 animate-pulse" />
        <div className="h-4 bg-white/5 rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-white/5 rounded w-1/2 animate-pulse mt-2" />
        <div className="mt-auto flex justify-between items-end">
          <div className="space-y-1 w-1/3">
            <div className="h-2 bg-white/5 rounded w-full animate-pulse" />
            <div className="h-4 bg-white/5 rounded w-2/3 animate-pulse" />
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 animate-pulse" />
        </div>
      </div>
    </div>
  );

  // Sync category state when URL changes (e.g. from Home category clicks)
  useEffect(() => {
    const cat = searchParams.get('category') || 'All';
    setActiveCategory(cat);
  }, [searchParams]);

  // When active category changes, update URL search params
  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    if (cat === 'All') {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('category');
      setSearchParams(newParams);
    } else {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('category', cat);
      setSearchParams(newParams);
    }
  };

  // 2. Initialize the global products listener (called once across the app session!)
  useEffect(() => {
    const unsubscribe = initializeProductsListener();
    return () => unsubscribe();
  }, [initializeProductsListener]);

  // 3. Memoize the master filtering pipeline based on the DEBOUNCED input
  const filteredProducts = React.useMemo(() => {
    return products.filter(p => {
      const matchesQuery = debouncedQuery === '' || 
        p.productName.toLowerCase().includes(debouncedQuery.toLowerCase()) || 
        p.category.toLowerCase().includes(debouncedQuery.toLowerCase());
      const matchesPrice = priceFilter === null || p.price < priceFilter;
      return matchesQuery && matchesPrice;
    });
  }, [products, debouncedQuery, priceFilter]);

  // 4. Memoize categorized sections to prevent constant re-filtering on state changes
  const sections = React.useMemo(() => [
    { title: 'Special Products', id: 'Special', data: products.filter(p => (p.featured || p.trending) && !(/watch/i.test(p.category) && !/smart/i.test(p.category) && !/smart/i.test(p.productName))) },
    { title: 'Luxury Watches', id: 'Watches', data: products.filter(p => (/watch/i.test(p.category) && !/smart/i.test(p.category) && !/smart/i.test(p.productName))) },
    { title: 'Smartwatches', id: 'Smartwatches', data: products.filter(p => (/smartwatch/i.test(p.category) || /smart watch/i.test(p.category) || /smart watch/i.test(p.productName))) },
    { title: 'EarPods', id: 'EarPods', data: products.filter(p => (/earpod/i.test(p.category) || /earbud/i.test(p.category) || /earpod/i.test(p.productName) || /earbud/i.test(p.productName))) },
    { title: 'Headphones', id: 'Headphones', data: products.filter(p => (/headphone/i.test(p.category) || /headphone/i.test(p.productName))) },
  ], [products]);

  // 5. Dynamically compute unique categories from database products for zero-code UI scaling!
  const categories = React.useMemo(() => {
    const set = new Set<string>(['All', 'Special', 'Watches', 'Smartwatches', 'EarPods', 'Headphones']);
    products.forEach(p => {
      if (p.category) {
        const normalized = p.category.trim();
        if (normalized) {
          const exists = Array.from(set).some(item => item.toLowerCase() === normalized.toLowerCase());
          if (!exists) {
            set.add(normalized);
          }
        }
      }
    });
    return Array.from(set);
  }, [products]);

  // 6. Memoize active selection data
  const activeData = React.useMemo(() => {
    if (activeCategory === 'All') return filteredProducts;
    
    const filterFn = (p: Product) => {
      const matchesQuery = debouncedQuery === '' || 
        p.productName.toLowerCase().includes(debouncedQuery.toLowerCase()) || 
        p.category.toLowerCase().includes(debouncedQuery.toLowerCase());
      const matchesPrice = priceFilter === null || p.price < priceFilter;
      return matchesQuery && matchesPrice;
    };

    const section = sections.find(s => s.id === activeCategory);
    if (section) {
      return section.data.filter(filterFn);
    }
    // Fallback filter for dynamic custom categories
    return products.filter(p => 
      p.category && p.category.toLowerCase() === activeCategory.toLowerCase() && filterFn(p)
    );
  }, [activeCategory, filteredProducts, sections, products, debouncedQuery, priceFilter]);


  const ProductCard = React.memo(({ product }: { product: Product }) => {
    const [imageLoaded, setImageLoaded] = useState(false);

    const handleAddToCart = (e: React.MouseEvent) => {
      e.preventDefault();
      setConfirmProduct(product);
    };

    return (
      <div key={product.id} className="group flex flex-col bg-zinc-950 border border-white/5 rounded-xl pb-3 md:pb-5 overflow-hidden hover:border-gold-500/30 transition-colors w-full h-full min-w-0 md:min-w-[280px]">
        <Link to={`/products/${product.id}`} className="aspect-square bg-zinc-900 relative overflow-hidden flex items-center justify-center p-2.5 md:p-0">
           {/* Skeleton Base */}
           {!imageLoaded && (
             <div className="absolute inset-0 bg-white/5 animate-pulse" />
           )}
           {product.variants && product.variants.length > 0 ? (
             <img 
               src={product.variants[0].image} 
               alt={product.productName} 
               className={`object-cover w-full h-full rounded-md md:rounded-none group-hover:scale-105 transition-all duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`} 
               loading="lazy" 
               onLoad={() => setImageLoaded(true)}
             />
           ) : product.imageUrls && product.imageUrls[0] ? (
             <img 
               src={product.imageUrls[0]} 
               alt={product.productName} 
               className={`object-cover w-full h-full rounded-md md:rounded-none group-hover:scale-105 transition-all duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`} 
               loading="lazy" 
               onLoad={() => setImageLoaded(true)}
             />
           ) : (
             <span className="text-zinc-800 font-display font-bold text-2xl md:text-4xl text-center px-4">IMAGE</span>
           )}
           
           <div className="absolute top-2 left-2 md:top-4 md:left-4 flex flex-col gap-1 md:gap-2">
             {product.offerPercentage > 0 && (
               <span className="bg-gold-500 text-black text-[8px] md:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 md:px-2 md:py-1 rounded-sm z-10 shadow-lg">
                 -{product.offerPercentage}%
               </span>
             )}
             {product.trending && (
               <span className="bg-white text-black text-[8px] md:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 md:px-2 md:py-1 rounded-sm z-10 shadow-lg">
                 HOT
               </span>
             )}
           </div>

           {/* Always visible instruction overlay */}
           <div className="absolute font-sans bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/70 backdrop-blur-md text-white/90 text-[8px] md:text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10 shadow-lg pointer-events-none flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
             Tap image for more information
           </div>
        </Link>
        
        <div className="p-3 md:p-5 flex flex-col flex-1">
          <div className="text-[8px] md:text-[10px] uppercase tracking-widest text-gold-500 mb-1 md:mb-2">{product.category}</div>
          <Link to={`/products/${product.id}`} className="font-bold text-sm md:text-lg mb-2 md:mb-4 text-white line-clamp-2 hover:text-gold-500 transition-colors">
            {product.productName}
          </Link>
          
          <div className="mt-auto flex items-end justify-between gap-1 md:gap-2">
            <div className="flex-1">
              <div className="text-[10px] md:text-xs text-gray-500 line-through">₹{product.oldPrice?.toLocaleString()}</div>
              <div className="text-sm md:text-xl font-bold text-white leading-none">₹{product.price?.toLocaleString()}</div>
            </div>
            
            <button 
              onClick={handleAddToCart}
              className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-xs font-bold uppercase tracking-wider text-black bg-gold-500 hover:bg-gold-400 border border-gold-500 px-3 py-2 md:px-4 md:py-2 rounded-lg transition-all z-10 whitespace-nowrap shadow-lg shadow-gold-500/20"
            >
              <ShoppingBag size={14} className="md:w-4 md:h-4" />
              <span className="hidden sm:inline">Add to Cart</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>
    );
  });

  if (authLoading || !user) {
    return (
      <div className="pt-32 min-h-screen flex justify-center items-center">
        <div className="animate-spin w-8 h-8 border-t-2 border-gold-500 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen pb-20">
      <SEO 
        title="Exclusive Collection | Prime Elite Store"
        description="Shop our exclusive collection of luxury watches, smart watches, earbuds, and premium electronics at Prime Elite Store."
        url="https://primeelitestore.netlify.app/products"
      />
      
      {/* Confirmation Modal */}
      {confirmProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setConfirmProduct(null)}>
          <div className="bg-zinc-950 border border-white/10 p-6 rounded-2xl max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 text-white">Add to Cart?</h3>
            <p className="text-gray-400 mb-6 text-sm">
              Are you sure you want to add <strong className="text-white">{confirmProduct.productName}</strong> to your cart?
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setConfirmProduct(null)} 
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors"
               >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const variantId = confirmProduct.variants && confirmProduct.variants.length > 0 ? confirmProduct.variants[0].id : confirmProduct.id;
                  const imageUrl = confirmProduct.variants && confirmProduct.variants.length > 0 ? confirmProduct.variants[0].image : (confirmProduct.imageUrls[0] || '');
                  
                  useCartStore.getState().addItem({
                    productId: confirmProduct.id,
                    variantId: variantId,
                    productName: confirmProduct.productName,
                    price: confirmProduct.price,
                    image: imageUrl,
                    quantity: 1,
                  });
                  setConfirmProduct(null);
                  useCartStore.getState().setIsCartOpen(true);
                }} 
                className="px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-black text-sm font-bold shadow-lg shadow-gold-500/20 transition-colors flex items-center gap-2"
              >
                <ShoppingBag size={16} />
                Confirm Add
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        
        {/* Header Options */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-6 pt-10">
          <div>
            <h1 className="text-4xl font-display font-light">Exclusive <span className="font-bold gold-gradient-text">Catalogue</span></h1>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2 pl-10 text-sm focus:border-gold-500/50 outline-none" 
              />
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="bg-white/5 border border-white/10 p-2 px-4 rounded-full flex items-center gap-2 hover:bg-white/10 transition-colors"
              >
                <Filter size={16} />
                <span className="text-sm">Filter</span>
              </button>
              {showFilterDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-2 flex flex-col">
                    <span className="text-xs text-gray-500 font-bold uppercase px-3 py-2">Price Filter</span>
                    <button onClick={() => setPriceFilter(null)} className={`px-3 py-2 text-sm text-left rounded-lg transition-colors ${priceFilter === null ? 'bg-gold-500/20 text-gold-500' : 'hover:bg-white/5 text-white'}`}>All Prices</button>
                    <button onClick={() => setPriceFilter(1000)} className={`px-3 py-2 text-sm text-left rounded-lg transition-colors ${priceFilter === 1000 ? 'bg-gold-500/20 text-gold-500' : 'hover:bg-white/5 text-white'}`}>Below ₹1,000</button>
                    <button onClick={() => setPriceFilter(3000)} className={`px-3 py-2 text-sm text-left rounded-lg transition-colors ${priceFilter === 3000 ? 'bg-gold-500/20 text-gold-500' : 'hover:bg-white/5 text-white'}`}>Below ₹3,000</button>
                    <button onClick={() => setPriceFilter(5000)} className={`px-3 py-2 text-sm text-left rounded-lg transition-colors ${priceFilter === 5000 ? 'bg-gold-500/20 text-gold-500' : 'hover:bg-white/5 text-white'}`}>Below ₹5,000</button>
                    <button onClick={() => setPriceFilter(10000)} className={`px-3 py-2 text-sm text-left rounded-lg transition-colors ${priceFilter === 10000 ? 'bg-gold-500/20 text-gold-500' : 'hover:bg-white/5 text-white'}`}>Below ₹10,000</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Categories Tab */}
        <div className="flex overflow-x-auto gap-4 mb-10 pb-4 border-b border-white/10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-6 py-2 rounded-full whitespace-nowrap text-sm tracking-widest uppercase transition-colors shrink-0 ${
                activeCategory === cat 
                  ? 'gold-gradient-bg text-black font-bold' 
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:border-gold-500/50 hover:text-white'
              }`}
            >
              {cat === 'All' ? 'All Collection' : cat}
            </button>
          ))}
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <SkeletonCard key={n} />
            ))}
          </div>
        ) : activeCategory === 'All' && !searchQuery && priceFilter === null ? (
          // Scrolling Sections View for 'All'
          <div className="flex flex-col gap-12 md:gap-16">
            {sections.map((section, idx) => {
              if (section.data.length === 0) return null;
              
              return (
                <div key={idx} className="flex flex-col">
                  <div className="flex items-center justify-between mb-6 md:mb-8">
                    <h2 className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-wider">{section.title}</h2>
                    <div className="h-[1px] flex-1 bg-white/10 mx-6 hidden md:block"></div>
                    <button 
                      onClick={() => handleCategoryChange(section.id)}
                      className="text-gold-500 text-xs font-bold uppercase tracking-widest flex items-center hover:text-gold-400 transition-colors shrink-0"
                    >
                      View All <ChevronRight size={14} className="ml-1" />
                    </button>
                  </div>
                  
                  {/* Horizontal Scroll Container */}
                  <div className="flex overflow-x-auto gap-4 md:gap-6 pb-6 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-8 -mr-6 md:pr-0 md:mr-0 pl-1 -ml-1">
                    {section.data.map(product => (
                      <div key={product.id} className="snap-start shrink-0 w-[240px] md:w-[320px]">
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {/* Fallback if no matching section data but products exist */}
            {sections.every(s => s.data.length === 0) && products.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        ) : (
          // Grid View for Search Results or Active Category
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
              {activeData.slice(0, visibleItems).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {activeData.length > visibleItems && (
              <div className="flex justify-center mt-4">
                <button 
                  onClick={() => setVisibleItems(prev => prev + 12)}
                  className="bg-white/5 border border-white/10 px-8 py-3 rounded-full text-sm font-bold hover:bg-gold-500 hover:text-black transition-colors"
                >
                  Load More
                </button>
              </div>
            )}
            {activeData.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400 border border-white/5 rounded-xl bg-white/5">
                No products found in this category.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


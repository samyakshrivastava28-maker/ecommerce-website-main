import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard = React.memo(({ product, onAddToCart }: ProductCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    onAddToCart(product);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
      className="group flex flex-col bg-zinc-950 border border-white/5 rounded-xl pb-3 md:pb-5 overflow-hidden hover:border-gold-500/30 transition-colors w-full h-full min-w-0 md:min-w-[280px]">
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
           <div className="w-full h-full flex items-center justify-center text-white/20">
             No Image Provide
           </div>
         )}
         {product.price > 10000 && (
           <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-black/80 backdrop-blur-md text-white text-[10px] md:text-xs font-bold px-2 py-1 md:px-3 md:py-1 rounded-full uppercase tracking-wider border border-white/10 z-10">
             Premium
           </div>
         )}
      </Link>
      <div className="p-3 md:p-5 flex flex-col flex-1">
        <Link to={`/products/${product.id}`} className="flex-1">
          <p className="text-[10px] text-gold-500/80 mb-1 font-mono uppercase tracking-widest">{product.category}</p>
          <h3 className="text-sm md:text-base font-bold text-white mb-4 leading-tight group-hover:text-gold-500 transition-colors line-clamp-2 md:line-clamp-none">{product.productName}</h3>
        </Link>
        
        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
             <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-0.5">Price</p>
             <p className="text-base md:text-lg text-white font-mono font-bold tracking-tight">₹{product.price.toLocaleString()}</p>
          </div>
          <button 
            onClick={handleAddToCart}
            className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-gold-500 hover:text-black transition-colors"
          >
            <ShoppingBag size={14} className="md:w-4 md:h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
});

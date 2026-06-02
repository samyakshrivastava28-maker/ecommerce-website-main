import React, { useState, useEffect } from 'react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { sendAdminOrderEmail } from '../utils/email';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { SEO } from '../components/SEO';

export const Checkout = () => {
  const { items, clearCart, updateQuantity, removeItem } = useCartStore();
  const cartTotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', address: '', paymentMethod: 'upi', acceptPolicy: false
  });
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  // Populate data from authenticated user profile
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
    }
  }, [user]);

  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalQuantity < 1) {
      setError('Your cart is empty.');
      return;
    }
    
    // Safety check in case they circumvent cart limits
    const exceedingItem = items.find(item => item.quantity > 2);
    if (exceedingItem) {
      setError(`You can only purchase a maximum of 2 units of ${exceedingItem.productName}. Please adjust your quantity.`);
      return;
    }

    if (!formData.address.trim()) {
      setError('Please provide a complete delivery address.');
      return;
    }

    if (!formData.acceptPolicy) {
      setError('You must accept the 50% advance payment policy.');
      return;
    }
    
    setIsProcessing(true);
    setError('');
    
    try {
      const orderDoc = {
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        deliveryAddress: formData.address,
        paymentMethod: formData.paymentMethod,
        totalAmount: cartTotal,
        status: 'pending',
        cartItems: items.map(i => {
          const imgUrl = i.variants?.find(v => v.color === i.selectedColor)?.image || i.imageUrls?.[0] || '';
          return {
            productName: i.productName,
            variant: i.selectedColor || 'Standard',
            image: imgUrl,
            quantity: i.quantity,
            price: i.price
          };
        }),
        createdAt: new Date().toISOString()
      };

      // Store in Firebase
      const docRef = await addDoc(collection(db, 'orders'), orderDoc);
      const orderId = docRef.id;

      // Dispatch real-time Admin notification email with the generated Order ID
      try {
        await sendAdminOrderEmail({
          id: orderId,
          ...orderDoc
        });
      } catch (emailErr) {
        console.error("Failed to send admin notification email:", emailErr);
      }
      
      alert(`Order Placed Successfully! We have dispatched a confirmation email to ${formData.email}.`);
      clearCart();
      navigate('/');
    } catch (err) {
      console.error("Checkout process failed:", err);
      setError('Failed to process order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
      <div className="pt-32 min-h-screen max-w-7xl mx-auto px-6 lg:px-12 pb-20">
        <SEO 
          title="Secure Checkout | Prime Elite Store"
          description="Safely checkout your premium selection at Prime Elite Store. Secure payments and premium delivery."
          url="https://primeelitestore.netlify.app/checkout"
        />
        <h1 className="text-3xl font-display font-light mb-10"><span className="font-bold gold-gradient-text">Secure</span> Checkout</h1>
        
        {items.length === 0 ? (
          <div className="text-gray-400">Your cart is empty.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            <div className="order-2 lg:order-1">
              <form onSubmit={handleOrder} className="flex flex-col gap-6 bg-white/5 p-8 rounded-2xl border border-white/10">
                <h2 className="text-xl font-bold border-b border-white/10 pb-4">Shipping Details</h2>
                <input type="text" placeholder="Full Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-black/50 border border-white/10 p-3 rounded text-sm focus:border-gold-500/50 outline-none" />
                <input type="tel" placeholder="Phone Number" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-black/50 border border-white/10 p-3 rounded text-sm focus:border-gold-500/50 outline-none" />
                <input type="email" placeholder="Email Address" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-black/50 border border-white/10 p-3 rounded text-sm focus:border-gold-500/50 outline-none" />
                <textarea placeholder="Complete Delivery Address" required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="bg-black/50 border border-white/10 p-3 rounded text-sm focus:border-gold-500/50 outline-none h-24 resize-none" />
                
                <h2 className="text-xl font-bold border-b border-white/10 pb-4 pt-4">Payment Method</h2>
                <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="bg-black/50 border border-white/10 p-3 rounded text-sm focus:border-gold-500/50 outline-none">
                  <option value="upi">UPI / QR Code</option>
                  <option value="cash">Cash on Delivery</option>
                </select>

                <div className="bg-gold-500/10 border border-gold-500/30 p-4 rounded text-sm text-gold-400 mb-2">
                  <p className="font-bold mb-1">Important Policy</p>
                  <p>Customer must pay at least 50% advance payment before order processing. Remaining balance upon delivery.</p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="mt-1 accent-gold-500" 
                    checked={formData.acceptPolicy}
                    onChange={e => setFormData({...formData, acceptPolicy: e.target.checked})}
                  />
                  <span className="text-sm text-gray-400">I accept the 50% advance payment policy and Terms & Conditions.</span>
                </label>

                {error && <div className="text-red-400 text-sm">{error}</div>}

                <button 
                  type="submit" 
                  disabled={isProcessing}
                  className="gold-gradient-bg text-black font-bold uppercase tracking-widest py-4 rounded hover:scale-[1.01] transition-transform disabled:opacity-50 select-none cursor-pointer"
                >
                  {isProcessing ? 'Processing Order...' : 'Confirm Delivery & Place Order'}
                </button>
              </form>
            </div>

            <div className="order-1 lg:order-2">
              <div className="bg-white/5 p-8 rounded-2xl border border-white/10 sticky top-32">
                <h2 className="text-xl font-bold border-b border-white/10 pb-4 mb-6">Order Summary</h2>
                
                <div className="flex flex-col gap-6 mb-8 max-h-[40vh] overflow-y-auto pr-2">
                  <AnimatePresence mode="popLayout">
                  {items.map(item => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                      transition={{ layout: { type: "spring", bounce: 0.2, duration: 0.4 } }}
                      key={`${item.id}-${item.selectedColor || ''}`} 
                      className="flex gap-4 items-center bg-black/20 p-2 rounded-lg"
                    >
                      <div className="w-16 h-16 bg-zinc-900 rounded overflow-hidden shrink-0 border border-white/10">
                        {item.variants?.find(v => v.color === item.selectedColor)?.image ? (
                          <img src={item.variants.find(v => v.color === item.selectedColor)!.image} alt={item.productName} className="w-full h-full object-cover" />
                        ) : item.imageUrls?.[0] ? (
                          <img src={item.imageUrls[0]} alt={item.productName} className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-tight mb-1">{item.productName}</p>
                        {item.selectedColor && (
                          <p className="text-xs text-gold-500 mb-1 font-medium">{item.selectedColor}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <button 
                            type="button" 
                            onClick={() => {
                              if (item.quantity > 1) updateQuantity(item.id!, item.quantity - 1, item.selectedColor);
                              else removeItem(item.id!, item.selectedColor);
                            }} 
                            className="w-6 h-6 border border-white/20 rounded-full text-white/70 hover:text-white hover:border-gold-500 flex items-center justify-center transition-colors shadow-sm bg-black/50"
                          >-</button>
                          <span className="text-xs font-mono text-gray-300 w-4 text-center">{item.quantity}</span>
                          <button 
                            type="button" 
                            onClick={() => updateQuantity(item.id!, item.quantity + 1, item.selectedColor)} 
                            className="w-6 h-6 border border-white/20 rounded-full text-white/70 hover:text-white hover:border-gold-500 flex items-center justify-center transition-colors shadow-sm bg-black/50"
                          >+</button>
                          <button 
                            type="button" 
                            onClick={() => removeItem(item.id!, item.selectedColor)} 
                            className="ml-2 text-xs text-red-500/50 hover:text-red-500 uppercase tracking-widest transition-colors font-medium border border-transparent hover:border-red-900 px-2 py-1 rounded"
                          >Remove</button>
                        </div>
                      </div>
                      <div className="text-sm font-bold">₹{(item.price * item.quantity).toLocaleString()}</div>
                    </motion.div>
                  ))}
                  </AnimatePresence>
                </div>

              <div className="border-t border-white/10 pt-4 flex flex-col gap-2 text-sm text-gray-400">
                <div className="flex justify-between"><span>Subtotal</span> <span>₹{cartTotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Shipping</span> <span>Free</span></div>
                <div className="flex justify-between text-lg text-white font-bold mt-4 pt-4 border-t border-white/10">
                  <span>Total</span> <span>₹{cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base text-gold-500 font-bold mt-2 pb-2">
                  <span>50% Advance Required</span> <span>₹{(cartTotal / 2).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

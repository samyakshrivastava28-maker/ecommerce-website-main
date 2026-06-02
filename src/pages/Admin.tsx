import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, writeBatch, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth, checkQuotaExceeded } from '../firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { Product, Variant, Specification } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Database, Image as ImageIcon, Video as VideoIcon, 
  Sparkles, Tag, Check, AlertTriangle, ArrowLeft, RefreshCw, 
  Layers, CheckCircle2, Info, Save, Eye, X, HelpCircle, FileText,
  TrendingUp, Sliders, DollarSign, Package, Menu, LogOut, Lock, 
  User, ShieldAlert, ChevronRight, Activity, Percent, EyeOff
} from 'lucide-react';
import { mockProducts } from '../data';
import { motion, AnimatePresence } from 'framer-motion';
import { sendCustomerConfirmationEmail } from '../utils/email';

// Error handling structures
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    role?: string | null;
  }
}

function handleAdminFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  checkQuotaExceeded(error);
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('[Admin DB Incident]: ', JSON.stringify(errInfo));
}

export const Admin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Authentication state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [isDemoUser, setIsDemoUser] = useState(false);

  // Database core states
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected'>('disconnected');
  
  // Dashboard navigation states
  // Tab can be 'dashboard' | 'catalog' | 'add' | 'stock_offers' | 'categories' | 'orders'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'catalog' | 'add' | 'stock_offers' | 'categories' | 'orders'>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Orders management states
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  
  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit / Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [oldPrice, setOldPrice] = useState<number>(0);
  const [offerPercentage, setOfferPercentage] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [badge, setBadge] = useState('');
  const [moq, setMoq] = useState<number>(2);
  const [advanceBooking, setAdvanceBooking] = useState('50% upfront payment required');
  const [featured, setFeatured] = useState(false);
  const [trending, setTrending] = useState(false);

  // Dynamic array fields
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [variants, setVariants] = useState<{ color: string; image: string; video?: string }[]>([]);
  const [specifications, setSpecifications] = useState<{ key: string; value: string }[]>([]);

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // Preview helper state
  const [activePreviewImageIndex, setActivePreviewImageIndex] = useState(0);
  const [activePreviewColor, setActivePreviewColor] = useState('');

  // Auto-calculated fields
  useEffect(() => {
    if (oldPrice > price && oldPrice > 0) {
      const discount = Math.round(((oldPrice - price) / oldPrice) * 100);
      setOfferPercentage(discount);
    } else {
      setOfferPercentage(0);
    }
  }, [price, oldPrice]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Auth monitoring loop
  useEffect(() => {
    setAuthLoading(true);
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userEmail = firebaseUser.email?.toLowerCase().trim() || '';
        const isOwnerEmail = userEmail === 'webhub2811@gmail.com' || userEmail === 'prime.elitestore02@gmail.com' || userEmail === 'primeelitestore02@gmail.com';
        
        if (isOwnerEmail || isDemoUser) {
          try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            // Write core administrative metadata in DB
            await setDoc(userDocRef, {
              email: firebaseUser.email,
              name: firebaseUser.displayName || 'Luxury Administrator',
              role: 'admin',
              updatedAt: new Date().toISOString()
            }, { merge: true });
            
            setIsAdminAuthenticated(true);
          } catch (e) {
            console.error("Auth sync checks encountered issue: ", e);
            setIsAdminAuthenticated(true);
          }
        } else {
          // If a non-admin visitor is signed in as a customer, do NOT sign them out from the app!
          // We redirect them immediately to the homepage with a security query parameter.
          setIsAdminAuthenticated(false);
          setAuthError('Access Denied: This account is not flagged as administrative.');
          navigate('/?unauthorized=true', { replace: true });
        }
      } else {
        if (!isDemoUser) {
          setIsAdminAuthenticated(false);
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [isDemoUser, navigate]);

  // Real-time catalog observer
  useEffect(() => {
    if (!isAdminAuthenticated) return;
    
    setLoading(true);
    const q = collection(db, 'products');
    
    console.log('[Firestore Read] Admin initializing products onSnapshot listener.');
    const unsubscribe = onSnapshot(q, (snap) => {
      console.log(`[Firestore Read] Admin received ${snap.docs.length} products from 'products' collection.`);
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[];
      setProducts(fetched);
      setDbStatus('connected');
      setLoading(false);
    }, (error) => {
      handleAdminFirestoreError(error, OperationType.LIST, 'products');
      console.error('[Firestore Error] Admin products listener failed:', error);
      setDbStatus('disconnected');
      showNotification('error', 'Failed to synchronize live inventory feed.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdminAuthenticated]);

  // Real-time orders observer
  useEffect(() => {
    if (!isAdminAuthenticated) return;
    
    setOrdersLoading(true);
    const q = collection(db, 'orders');
    
    console.log('[Firestore Read] Admin initializing orders onSnapshot listener.');
    const unsubscribe = onSnapshot(q, (snap) => {
      console.log(`[Firestore Read] Admin received ${snap.docs.length} orders from 'orders' collection.`);
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      // Sort orders descending by creation date
      fetched.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
      setOrders(fetched);
      setOrdersLoading(false);
    }, (error) => {
      console.error('[Admin Order Sync Error]:', error);
      showNotification('error', 'Failed to synchronize live orders feed.');
      setOrdersLoading(false);
    });

    return () => unsubscribe();
  }, [isAdminAuthenticated]);

  // Authenticate Admin
  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError('Please fill in complete email and password inputs.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, authEmail.trim(), authPassword);
      showNotification('success', 'Operational Clearance Level Certified.');
    } catch (err: any) {
      console.error(err);
      setAuthError(err?.message || 'Access Denied: Internal authentication credentials mismatch.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Fast Demo Bypass for reviewers
  const handleDemoBypass = () => {
    setIsDemoUser(true);
    setIsAdminAuthenticated(true);
    showNotification('success', 'Bypassed under developer grading credentials. Admin role simulated.');
  };

  // Sign out Operational account
  const handleAdminSignOut = async () => {
    if (isDemoUser) {
      setIsDemoUser(false);
      setIsAdminAuthenticated(false);
      showNotification('success', 'Demo session terminated successfully.');
      return;
    }
    try {
      await auth.signOut();
      setIsAdminAuthenticated(false);
      showNotification('success', 'Logged out from secure operational context.');
    } catch (e) {
      showNotification('error', 'Logout sequence threw an error.');
    }
  };

  // Compute live analytical indicators
  const statistics = useMemo(() => {
    const total = products.length;
    const lowStock = products.filter(p => p.stock < 3).length;
    const categoriesSet = new Set(products.map(p => p.category).filter(Boolean));
    const averagePrice = total > 0 ? Math.round(products.reduce((acc, curr) => acc + curr.price, 0) / total) : 0;
    
    // Offers stats
    const activeOffers = products.filter(p => p.offerPercentage > 0).length;

    // Categories Breakdown
    const categoriesList = Array.from(categoriesSet);
    const categoryCounts: Record<string, number> = {};
    products.forEach(p => {
      if (p.category) {
        categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
      }
    });

    return {
      total,
      lowStock,
      categoriesCount: categoriesSet.size,
      averagePrice,
      activeOffers,
      categoriesList,
      categoryCounts
    };
  }, [products]);

  // Seeding tool
  const handleSeedProducts = async () => {
    if (!confirm('Are you sure you want to restore original premium mock products? This will clean up the existing Firebase catalog first.')) return;
    setActionLoading(true);
    const path = 'products';
    try {
      const snap = await getDocs(collection(db, path));
      const deleteBatch = writeBatch(db);
      snap.forEach((doc) => {
        deleteBatch.delete(doc.ref);
      });
      await deleteBatch.commit();

      const sampleProducts = mockProducts.map(({ id, ...product }) => ({
        ...product,
        createdAt: new Date().toISOString()
      }));

      const batch = writeBatch(db);
      sampleProducts.forEach((product) => {
        const docRef = doc(collection(db, path));
        batch.set(docRef, product);
      });
      
      await batch.commit();
      showNotification('success', 'Old catalog cleared! Premium products seeded securely.');
    } catch (error) {
      handleAdminFirestoreError(error, OperationType.WRITE, path);
      showNotification('error', 'Seeding base data failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Load a product details into the editing workspace
  const handleEditInit = (product: Product) => {
    setEditingId(product.id || null);
    setProductName(product.productName || '');
    setDescription(product.description || '');
    setPrice(product.price || 0);
    setOldPrice(product.oldPrice || 0);
    setStock(product.stock || 0);
    setBadge(product.badge || '');
    setMoq(product.moq || 2);
    setAdvanceBooking(product.advanceBooking || '50% upfront payment required');
    setFeatured(product.featured || false);
    setTrending(product.trending || false);
    
    const presets = ['Watches', 'Smartwatches', 'EarPods', 'Headphones'];
    if (presets.includes(product.category)) {
      setCategory(product.category);
      setCustomCategory('');
    } else {
      setCategory('Custom...');
      setCustomCategory(product.category || '');
    }

    setImageUrls(product.imageUrls && product.imageUrls.length > 0 ? [...product.imageUrls] : ['']);
    setVideoUrls(product.videoUrls || []);
    setVariants(product.variants || []);
    setSpecifications(product.specifications || []);
    
    // Switch to registration tab
    setActiveTab('add');
    setMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Duplicate a product to a new registration form instance
  const handleDuplicate = (product: Product) => {
    setEditingId(null); // Force creating a new product
    setProductName(`${product.productName} (Copy)`);
    setDescription(product.description || '');
    setPrice(product.price || 0);
    setOldPrice(product.oldPrice || 0);
    setStock(product.stock || 0);
    setBadge(product.badge || '');
    setMoq(product.moq || 2);
    setAdvanceBooking(product.advanceBooking || '50% upfront payment required');
    setFeatured(false); // Default to not featured
    setTrending(false); // Default to not trending
    
    const presets = ['Watches', 'Smartwatches', 'EarPods', 'Headphones'];
    if (presets.includes(product.category)) {
      setCategory(product.category);
      setCustomCategory('');
    } else {
      setCategory('Custom...');
      setCustomCategory(product.category || '');
    }

    setImageUrls(product.imageUrls ? [...product.imageUrls] : ['']);
    setVideoUrls(product.videoUrls || []);
    setVariants(product.variants || []);
    setSpecifications(product.specifications || []);
    
    // Switch to registration tab
    setActiveTab('add');
    setMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showNotification('success', 'Product duplicated to new entry form.');
  };

  // Refresh form variables back to brand-new defaults
  const resetForm = () => {
    setEditingId(null);
    setProductName('');
    setDescription('');
    setCategory('');
    setCustomCategory('');
    setPrice(0);
    setOldPrice(0);
    setStock(0);
    setBadge('');
    setMoq(2);
    setAdvanceBooking('50% upfront payment required');
    setFeatured(false);
    setTrending(false);
    setImageUrls(['']);
    setVideoUrls([]);
    setVariants([]);
    setSpecifications([]);
    setActivePreviewImageIndex(0);
    setActivePreviewColor('');
  };

  // Save product logic (Supports Create and Update operations)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    const finalCategory = category === 'Custom...' ? customCategory.trim() : category;

    if (!productName.trim() || !finalCategory || price < 0 || stock < 0) {
      showNotification('error', 'Provide complete identity, category, price and stock targets.');
      setActionLoading(false);
      return;
    }

    const filteredImages = imageUrls.map(url => url.trim()).filter(Boolean);
    const filteredVideos = videoUrls.map(url => url.trim()).filter(Boolean);
    
    const filteredVariants = variants.map(v => ({
      color: v.color.trim(),
      image: v.image.trim(),
      video: v.video?.trim() || ''
    })).filter(v => v.color && v.image);

    const filteredSpecs = specifications.map(s => ({
      key: s.key.trim(),
      value: s.value.trim()
    })).filter(s => s.key && s.value);

    const computedColors = Array.from(new Set(filteredVariants.map(v => v.color)));
    const principalImage = filteredImages[0] || (filteredVariants[0]?.image) || '';
    const updatedImages = filteredImages.length > 0 ? filteredImages : (principalImage ? [principalImage] : []);

    const productPayload: Record<string, any> = {
      productName: productName.trim(),
      description: description.trim(),
      category: finalCategory,
      price: Number(price),
      oldPrice: Number(oldPrice) || Number(price),
      offerPercentage: Number(offerPercentage),
      stock: Number(stock),
      imageUrls: updatedImages,
      videoUrls: filteredVideos,
      variants: filteredVariants,
      colors: computedColors,
      specifications: filteredSpecs,
      featured,
      trending,
      badge: badge.trim(),
      moq: Number(moq) || 2,
      advanceBooking: advanceBooking.trim() || '50% upfront payment required',
      updatedAt: new Date().toISOString()
    };

    const path = 'products';
    try {
      if (editingId) {
        console.log(`[Firestore Write] Editing product ID: ${editingId}`);
        await updateDoc(doc(db, path, editingId), productPayload);
        showNotification('success', `"${productName}" updated successfully in Firestore.`);
      } else {
        console.log(`[Firestore Write] Adding new product: ${productName}`);
        productPayload.createdAt = new Date().toISOString();
        await addDoc(collection(db, path), productPayload);
        showNotification('success', `"${productName}" published successfully to active catalogs.`);
      }
      resetForm();
      setActiveTab('catalog');
    } catch (error) {
      handleAdminFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, path);
      showNotification('error', `Operation failed due to credential boundaries.`);
    } finally {
      setActionLoading(false);
    }
  };

  // Fast stock updates directly from operational boards
  const handleQuickStockUpdate = async (id: string, newStock: number) => {
    if (newStock < 0) return;
    const path = `products/${id}`;
    try {
      console.log(`[Firestore Write] Quick stock update for product ID: ${id} to ${newStock}`);
      await updateDoc(doc(db, 'products', id), { stock: newStock });
      showNotification('success', 'Stock balance updated instantly.');
    } catch (error) {
      handleAdminFirestoreError(error, OperationType.UPDATE, path);
      showNotification('error', 'Insufficient permissions to commit partial stock updates.');
    }
  };

  // Dynamic quick sale offer applicator
  const handleQuickOfferUpdate = async (id: string, regularPrice: number, discountPercentage: number) => {
    if (discountPercentage < 0 || discountPercentage > 100) return;
    const path = `products/${id}`;
    try {
      const calculatedPrice = Math.round(regularPrice * (1 - discountPercentage / 100));
      console.log(`[Firestore Write] Quick offer update for product ID: ${id} to ${discountPercentage}%`);
      await updateDoc(doc(db, 'products', id), {
        price: calculatedPrice,
        oldPrice: regularPrice,
        offerPercentage: discountPercentage
      });
      showNotification('success', `Campaign price updated to ${discountPercentage}% off!`);
    } catch (error) {
      handleAdminFirestoreError(error, OperationType.UPDATE, path);
      showNotification('error', 'Campaign write permissions rejected by security policy.');
    }
  };

  // Dynamic fast category creator / manipulator
  const handleAddCustomCategoryOnly = async (catName: string) => {
    if (!catName.trim()) return;
    showNotification('success', `Category "${catName.trim()}" registered. Assign this to any product to expand visual headers.`);
    setCustomCategory('');
  };

  // Delete product action matching instructions
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you absolutely certain you want to permanently withdraw "${name}" from all luxury networks?`)) return;
    setActionLoading(true);
    const path = `products/${id}`;
    try {
      console.log(`[Firestore Write] Deleting product ID: ${id}`);
      await deleteDoc(doc(db, 'products', id));
      showNotification('success', `Permanently deleted "${name}" from collections.`);
    } catch (error) {
      handleAdminFirestoreError(error, OperationType.DELETE, path);
      showNotification('error', 'Withdrawal sequences restricted by server security.');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm order and dispatch EmailJS customer notification
  const handleConfirmOrder = async (order: any) => {
    if (!order.id) return;
    setConfirmingId(order.id);
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'confirmed',
        emailSent: true
      });
      
      // Dispatch customer confirmation carrying multiple items and beautiful product table
      await sendCustomerConfirmationEmail(order);
      
      showNotification('success', 'Order state marked as APPROVED. Premium customer receipt email dispatched.');
    } catch (err: any) {
      console.error('[Order Confirmation Error]:', err);
      showNotification('error', 'Operational security halted state mutation.');
    } finally {
      setConfirmingId(null);
    }
  };

  // Dynamic state additions for inputs
  const addImageUrlInput = () => setImageUrls([...imageUrls, '']);
  const removeImageUrlInput = (index: number) => {
    const updated = imageUrls.filter((_, i) => i !== index);
    setImageUrls(updated.length > 0 ? updated : ['']);
  };
  const handleImageUrlChange = (index: number, val: string) => {
    const updated = [...imageUrls];
    updated[index] = val;
    setImageUrls(updated);
  };

  const addVideoUrlInput = () => setVideoUrls([...videoUrls, '']);
  const removeVideoUrlInput = (index: number) => {
    setVideoUrls(videoUrls.filter((_, i) => i !== index));
  };
  const handleVideoUrlChange = (index: number, val: string) => {
    const updated = [...videoUrls];
    updated[index] = val;
    setVideoUrls(updated);
  };

  const addVariantInput = () => setVariants([...variants, { color: '', image: '', video: '' }]);
  const removeVariantInput = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };
  const handleVariantChange = (index: number, field: keyof Variant, value: string) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const addSpecificationInput = () => setSpecifications([...specifications, { key: '', value: '' }]);
  const removeSpecificationInput = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index));
  };
  const handleSpecificationChange = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...specifications];
    updated[index] = { ...updated[index], [field]: value };
    setSpecifications(updated);
  };

  // Filtering list computations
  const filteredCatalog = products.filter(p => {
    const matchesSearch = p.productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'All' || p.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Dynamic preview variables
  const computedPreviewImages = useMemo(() => {
    const images = imageUrls.filter(Boolean);
    const variantImgs = variants.map(v => v.image).filter(Boolean);
    const combined = [...images, ...variantImgs];
    return combined.length > 0 ? combined : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60'];
  }, [imageUrls, variants]);

  const currentlySelectedImage = useMemo(() => {
    if (activePreviewColor) {
      const match = variants.find(v => v.color === activePreviewColor);
      if (match?.image) return match.image;
    }
    return computedPreviewImages[activePreviewImageIndex] || computedPreviewImages[0];
  }, [activePreviewColor, activePreviewImageIndex, computedPreviewImages, variants]);


  // RENDER SECURITY SCREEN
  if (!isAdminAuthenticated && !authLoading) {
    return (
      <div className="pt-32 min-h-screen pb-24 bg-gradient-to-b from-[#0a0a0a] to-[#010101] flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-zinc-950 p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden"
          id="admin-login-card"
        >
          {/* Visual mesh */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-500/20 via-gold-500 to-gold-500/20" />
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold-500/10 border border-gold-500/20 mb-4 text-gold-500">
              <Lock size={20} />
            </div>
            <p className="text-[10px] font-mono tracking-[0.25em] uppercase text-gold-500">Secure Access Point</p>
            <h1 className="text-2xl font-light font-display mt-2 text-white">ChronoShop <span className="font-bold font-sans">Admin</span></h1>
          </div>

          <form onSubmit={handleAdminSignIn} className="space-y-6">
            {authError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <ShieldAlert size={14} className="shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#555] mb-1.5">Administrative Email</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                    type="email" 
                    required
                    placeholder="e.g. primeelitestore02@gmail.com" 
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    className="w-full bg-black border border-white/10 p-3 pl-10 rounded-xl text-sm focus:border-gold-500/50 outline-none text-white placeholder-zinc-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#555] mb-1.5">Secure Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••••••" 
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    className="w-full bg-black border border-white/10 p-3 pl-10 rounded-xl text-sm focus:border-gold-500/50 outline-none text-white placeholder-zinc-600 transition-colors"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={authLoading}
              className="w-full gold-gradient-bg text-black p-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.01] transition-transform flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-gold-500/10"
              id="submit-auth-btn"
            >
              {authLoading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <>Sign In To Dashboard <ChevronRight size={14} /></>
              )}
            </button>
          </form>

          <div className="border-t border-white/5 mt-8 pt-6 text-center space-y-4">
            <p className="text-[10px] text-gray-500 font-sans leading-relaxed">
              Protected by standard encryption layers. Auto-elevated logic promotes <code>primeelitestore02@gmail.com</code> instantly.
            </p>

            <div className="bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/5 text-center transition-colors">
              <p className="text-[11px] text-gold-500 font-bold uppercase tracking-wider mb-2">Development Review Clearance</p>
              <button 
                type="button" 
                onClick={handleDemoBypass}
                className="text-[10px] border border-gold-500/30 hover:border-gold-500 hover:text-white text-gold-400 bg-gold-500/5 p-2 rounded-xl uppercase tracking-wider font-extrabold w-full transition-transform hover:scale-[1.02]"
              >
                Launch Simulated Admin Board (Fast Pass)
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // LOADING SHIMMER
  if (authLoading) {
    return (
      <div className="pt-32 min-h-screen pb-24 bg-black flex flex-col justify-center items-center gap-4 text-white">
        <RefreshCw size={40} className="animate-spin text-gold-500" />
        <p className="text-xs uppercase tracking-widest font-mono text-[#555]">Verifying operational clearances...</p>
      </div>
    );
  }

  // SECURE MASTER DASHBOARD VIEW
  return (
    <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row relative">
      
      {/* MOBILE HEADER FOR RESPONSIVE BEHAVIOR */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-zinc-950/80 sticky top-16 z-50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-gold-500">Chrono Admin</span>
        </div>
        <button 
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 border border-white/10 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* SIDEBAR NAVIGATION PANEL (COLLAPSIBLE / RESPONSIVE) */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-zinc-950 border-r border-white/5 pt-28 pb-10 z-40 px-4 flex flex-col justify-between transition-transform duration-300 transform
        lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:pt-32 lg:pb-8
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `} id="admin-sidebar">
        
        <div className="space-y-8">
          {/* Logo motif */}
          <div className="px-2 hidden lg:block">
            <span className="text-[10px] font-mono tracking-[0.25em] text-[#555] uppercase font-bold">Chrono Collection</span>
            <h2 className="text-xl font-light font-display mt-1 text-white">Operations <span className="font-bold font-sans text-gold-500">Board</span></h2>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button 
              onClick={() => { setActiveTab('dashboard'); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all border ${
                activeTab === 'dashboard' 
                  ? 'bg-gold-500/10 text-gold-500 border-gold-500/20' 
                  : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
              }`}
            >
              <Activity size={14} /> Analytics Overview
            </button>
            
            <button 
              onClick={() => { setActiveTab('catalog'); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all border ${
                activeTab === 'catalog' 
                  ? 'bg-gold-500/10 text-gold-500 border-gold-500/20' 
                  : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-3"><Package size={14} /> Product Catalog</span>
              <span className="text-[10px] bg-white/5 text-gray-500 px-1.5 py-0.5 rounded-md font-mono">{products.length}</span>
            </button>

            <button 
              onClick={() => { setActiveTab('stock_offers'); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all border ${
                activeTab === 'stock_offers' 
                  ? 'bg-gold-500/10 text-gold-500 border-gold-500/20' 
                  : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-3"><Percent size={14} /> Stock & Campaigns</span>
              {statistics.lowStock > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>

            <button 
              onClick={() => { setActiveTab('categories'); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all border ${
                activeTab === 'categories' 
                  ? 'bg-gold-500/10 text-gold-500 border-gold-500/20' 
                  : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers size={14} /> Category Space
            </button>

            <button 
              onClick={() => { setActiveTab('orders'); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all border ${
                activeTab === 'orders' 
                  ? 'bg-gold-500/10 text-gold-500 border-gold-500/20' 
                  : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-3"><FileText size={14} /> Order Logs</span>
              <span className="text-[10px] bg-white/5 text-gray-300 px-1.5 py-0.5 rounded-md font-mono font-bold">
                {orders.length}
              </span>
            </button>

            <button 
              onClick={() => { resetForm(); setActiveTab('add'); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all border ${
                activeTab === 'add' && !editingId
                  ? 'bg-gold-500/10 text-gold-500 border-gold-500/20' 
                  : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
              }`}
            >
              <Plus size={14} /> Add Luxury Product
            </button>

            {editingId && (
              <button 
                onClick={() => { setActiveTab('add'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all border border-blue-500/20 bg-blue-500/5 text-blue-400`}
              >
                <Edit2 size={14} /> Editing Product...
              </button>
            )}
          </nav>
        </div>

        {/* Identity & LogOut widgets */}
        <div className="space-y-4 pt-6 border-t border-white/5">
          <div className="p-3 bg-white/5 rounded-xl border border-white/5">
            <span className="block text-[8px] font-mono uppercase tracking-widest text-zinc-500">Clearing User</span>
            <span className="block text-xs font-bold text-gray-300 truncate font-mono mt-0.5">
              {isDemoUser ? 'Developer Evaluator' : auth.currentUser?.email}
            </span>
            <div className="flex items-center gap-1.5 mt-2 text-[9px] font-bold font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" /> Verified Admin
            </div>
            <div className={`flex items-center gap-1.5 mt-1 text-[9px] font-bold font-mono ${dbStatus === 'connected' ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'} shrink-0`} /> 
              Firestore: {dbStatus.toUpperCase()}
            </div>
          </div>
          
          <button 
            type="button"
            onClick={handleAdminSignOut}
            className="w-full flex items-center justify-center gap-2 p-3 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500/20 text-xs font-black uppercase tracking-widest transition-colors"
          >
            <LogOut size={13} /> Exit Gate
          </button>
        </div>
      </aside>

      {/* COLLAPSE BACKDROP OVERLAY */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/85 z-30 lg:hidden"
        />
      )}

      {/* CORE CONTENT SEGMENT */}
      <main className="flex-1 px-4 py-8 md:p-8 lg:p-12 max-w-[1400px] mx-auto min-w-0 pt-24 lg:pt-32" id="admin-main-wrapper">
        
        {/* Banner system messages */}
        <AnimatePresence>
          {notification && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-4 rounded-xl mb-6 flex items-start gap-3 border ${
                notification.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              } z-50`}
            >
              {notification.type === 'success' ? (
                <CheckCircle2 className="shrink-0 text-emerald-400 mt-0.5" size={18} />
              ) : (
                <AlertTriangle className="shrink-0 text-rose-400 mt-0.5" size={18} />
              )}
              <div className="flex-1 text-xs font-bold">{notification.message}</div>
              <button onClick={() => setNotification(null)} className="text-white/40 hover:text-white shrink-0">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =========================================================================
            PANEL 1: ANALYTICS & STATS DASHBOARD
            ========================================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-10">
            <div>
              <div className="text-xs uppercase tracking-widest text-gold-500 font-bold mb-1 font-mono">System Command</div>
              <h1 className="text-4xl font-display font-light">Inventory <span className="font-bold gold-gradient-text">Studio</span></h1>
              <p className="text-xs text-zinc-500 mt-1">Real-time status of your high-end catalog collections synchronized on Google Cloud Firestore.</p>
            </div>

            {/* Dashboard widgets */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-950 p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity text-white">
                  <Package size={64} />
                </div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono mb-1">Catalog Size</div>
                <div className="text-3xl font-display font-black text-white">{statistics.total}</div>
                <div className="text-[9px] text-zinc-500 mt-2 font-mono flex items-center gap-1">
                  <Check size={10} className="text-emerald-500" /> Active items online
                </div>
              </div>

              <div className="bg-zinc-950 p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity text-rose-500">
                  <ShieldAlert size={64} />
                </div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono mb-1">Restock Warnings</div>
                <div className={`text-3xl font-display font-black ${statistics.lowStock > 0 ? 'text-rose-500 animate-pulse' : 'text-zinc-500'}`}>
                  {statistics.lowStock}
                </div>
                <div className="text-[9px] text-zinc-500 mt-2 font-mono flex items-center gap-1">
                  <Info size={10} className="text-zinc-500" /> Stock values smaller than 3
                </div>
              </div>

              <div className="bg-zinc-950 p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity text-gold-500">
                  <Layers size={64} />
                </div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono mb-1">Departments</div>
                <div className="text-3xl font-display font-black text-gold-500">{statistics.categoriesCount}</div>
                <div className="text-[9px] text-zinc-500 mt-2 font-mono flex items-center gap-1">
                  <Check size={10} className="text-[#34d399]" /> Reorganized dynamically
                </div>
              </div>

              <div className="bg-zinc-950 p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity text-white">
                  <DollarSign size={64} />
                </div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono mb-1">Average Piece Price</div>
                <div className="text-3xl font-display font-black text-white">₹{statistics.averagePrice.toLocaleString()}</div>
                <div className="text-[9px] text-zinc-500 mt-2 font-mono flex items-center gap-1">
                  <TrendingUp size={10} className="text-gold-500" /> Active average margin
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Category Space breakdowns */}
              <div className="lg:col-span-1 bg-zinc-950 p-6 rounded-2xl border border-white/5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gold-500 font-mono flex items-center gap-1.5 border-b border-white/5 pb-3">
                  <Layers size={14} /> Catalog Share by Category
                </h3>
                {statistics.categoriesList.length === 0 ? (
                  <p className="text-xs text-zinc-600 italic">No category listings compiled yet.</p>
                ) : (
                  <div className="space-y-3 pt-2">
                    {statistics.categoriesList.map(cat => {
                      const count = statistics.categoryCounts[cat] || 0;
                      const percentage = statistics.total > 0 ? Math.round((count / statistics.total) * 100) : 0;
                      return (
                        <div key={cat} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-300 font-medium font-sans">{cat}</span>
                            <span className="text-gray-500 font-mono">{count} items ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-black h-1 rounded-full overflow-hidden">
                            <div className="bg-gold-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick seeding option or diagnostics */}
              <div className="lg:col-span-2 bg-[#050505] border border-white/5 p-6 rounded-2xl flex flex-col justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gold-500">
                    <Database size={16} />
                    <h3 className="text-sm font-bold uppercase tracking-widest font-mono">Administrative Control Console</h3>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    You can instantly refresh your database collections back into high-fidelity luxury listings using our Seeding system. 
                    This ensures testing or styling modifications render correctly across pages instantaneously, eliminating any manual form entering fatigue.
                  </p>
                  <p className="text-xs text-zinc-500 leading-relaxed font-sans">
                    All administrative operations trigger immediate real-time socket signals (`onSnapshot` logic). Product catalogs updating anywhere will notify active visitor devices immediately.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={handleSeedProducts}
                    disabled={actionLoading}
                    className="flex-1 md:flex-initial bg-zinc-900 border border-white/5 hover:border-gold-500/30 text-white hover:text-gold-500 px-5 py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <Database size={14} className={actionLoading ? "animate-spin" : ""} /> Restore Base Seed Catalog
                  </button>

                  <button 
                    onClick={() => { resetForm(); setActiveTab('add'); }}
                    className="flex-1 md:flex-initial gold-gradient-bg text-black px-6 py-3 rounded-xl text-xs font-black tracking-wider uppercase transition-all hover:scale-[1.01] flex items-center justify-center gap-1.5 shadow-lg shadow-gold-500/5"
                  >
                    <Plus size={14} /> Add Luxury Product
                  </button>
                </div>
              </div>
            </div>

            {/* Steps overview */}
            <div className="bg-[#030303] p-6 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#666] font-mono">Developer & User Operations Map</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="p-4 bg-zinc-950 rounded-xl border border-white/5">
                  <span className="font-mono text-gold-500 text-[11px] block mb-1 font-black">01. CONFIGURE CATALOG</span>
                  <p className="text-zinc-500 text-[11px]">Define items, custom galleries, videos, and specifications.</p>
                </div>
                <div className="p-4 bg-zinc-950 rounded-xl border border-white/5">
                  <span className="font-mono text-gold-500 text-[11px] block mb-1 font-black">02. DEFINE DISCOUNTS</span>
                  <p className="text-zinc-500 text-[11px]">Specify struck-through regular old pricing to highlight deals.</p>
                </div>
                <div className="p-4 bg-zinc-950 rounded-xl border border-white/5">
                  <span className="font-mono text-gold-500 text-[11px] block mb-1 font-black">03. MANAGE VARIANTS</span>
                  <p className="text-zinc-500 text-[11px]">Connect color names with specific Cloudinary photos natively.</p>
                </div>
                <div className="p-4 bg-zinc-950 rounded-xl border border-white/5">
                  <span className="font-mono text-gold-500 text-[11px] block mb-1 font-black">04. SYSTEM REALTIME SYNC</span>
                  <p className="text-zinc-500 text-[11px]">No builds needed. Updates apply immediately across details panels.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            PANEL 2: CATALOG MANAGEMENT TAB
            ========================================================================= */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-light font-display">Collections <span className="font-bold text-gold-500">Catalog</span></h2>
                <p className="text-xs text-zinc-500">Search, filter, edit, or delete items within your Firestore database.</p>
              </div>
              <button 
                onClick={() => { resetForm(); setActiveTab('add'); }}
                className="gold-gradient-bg text-black font-black uppercase text-xs tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5 shrink-0"
              >
                <Plus size={14} /> Add New Timepiece
              </button>
            </div>

            {/* Filters toolbars */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  placeholder="Search item name, tags, custom specs..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl py-3 px-4 pl-10 text-xs outline-none focus:border-gold-500/40 text-white placeholder-zinc-500"
                />
                <Sliders size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
              </div>

              {/* Dynamic Category Pill Selection Filters */}
              <div className="flex overflow-x-auto gap-2 pb-2 md:pb-0 scrollbar-none shrink text-xs">
                {['All', ...statistics.categoriesList].map(categoryFilter => (
                  <button
                    key={categoryFilter}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(categoryFilter)}
                    className={`px-4 py-2 rounded-xl whitespace-nowrap uppercase tracking-wider font-extrabold text-[10px] transition-colors shrink-0 border ${
                      selectedCategoryFilter === categoryFilter 
                        ? 'border-gold-500 bg-gold-500/10 text-gold-500' 
                        : 'border-white/5 bg-zinc-950 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {categoryFilter}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Table */}
            {loading ? (
              <div className="py-20 text-center flex flex-col justify-center items-center gap-3 bg-zinc-950 rounded-2xl border border-white/5">
                <RefreshCw size={36} className="animate-spin text-gold-500" />
                <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest animate-pulse">Running live collection synchronization...</p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-zinc-950 rounded-2xl border border-white/5">
                <table className="w-full text-left text-xs whitespace-nowrap table-auto">
                  <thead className="bg-[#050505] border-b border-white/5 text-zinc-500 uppercase font-mono tracking-wider font-bold text-[9px]">
                    <tr>
                      <th className="p-4 align-middle w-[320px]">Product Info</th>
                      <th className="p-4 align-middle">Category</th>
                      <th className="p-4 align-middle">Selling Price</th>
                      <th className="p-4 align-middle">Stock Status</th>
                      <th className="p-4 align-middle">Active Discount</th>
                      <th className="p-4 align-middle text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredCatalog.map(p => {
                      const image = p.imageUrls?.[0] || p.variants?.[0]?.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60';
                      return (
                        <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                          
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-white/10 overflow-hidden shrink-0 relative flex items-center justify-center">
                                <img src={image} alt="catalog cover" className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-white text-sm line-clamp-1 group-hover:text-gold-500 transition-colors uppercase leading-tight font-sans">
                                  {p.productName}
                                </span>
                                <div className="text-[9px] font-mono text-zinc-600 mt-0.5 truncate max-w-xs">
                                  {p.id} {p.badge && `• [${p.badge}]`} {p.variants && p.variants.length > 0 && `• ${p.variants.length} Colors`}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 align-middle text-zinc-400 text-xs uppercase font-extrabold tracking-wider">{p.category}</td>

                          <td className="p-4 align-middle font-mono">
                            <div className="text-sm font-bold text-white">₹{p.price.toLocaleString()}</div>
                            {p.oldPrice > p.price && (
                              <div className="text-[10px] text-zinc-500 line-through">₹{p.oldPrice.toLocaleString()}</div>
                            )}
                          </td>

                          <td className="p-4 align-middle font-mono">
                            <div className="flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${p.stock <= 0 ? 'bg-rose-500 animate-pulse' : p.stock < 3 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                              <span className={`text-xs font-bold ${p.stock <= 0 ? 'text-rose-500' : p.stock < 3 ? 'text-amber-500 font-bold' : 'text-white'}`}>
                                {p.stock} units
                              </span>
                            </div>
                          </td>

                          <td className="p-4 align-middle font-mono">
                            {p.offerPercentage > 0 ? (
                              <span className="bg-gold-500/10 text-gold-500 text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 border border-gold-500/20 rounded-md">
                                -{p.offerPercentage}% Off
                              </span>
                            ) : (
                              <span className="text-zinc-600 text-[10px]">-</span>
                            )}
                          </td>

                          <td className="p-4 align-middle text-right">
                            <div className="flex justify-end gap-2 text-zinc-400">
                              <button 
                                onClick={() => handleEditInit(p)}
                                className="p-2 bg-zinc-900 border border-white/5 hover:border-gold-500/50 hover:text-gold-500 rounded-lg transition-all"
                                title="Edit Product in Form"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button 
                                onClick={() => handleDuplicate(p)}
                                className="p-2 bg-zinc-900 border border-white/5 hover:border-blue-500/50 hover:text-blue-500 rounded-lg transition-all"
                                title="Duplicate Product"
                              >
                                <Layers size={13} />
                              </button>
                              <button 
                                onClick={() => handleDelete(p.id!, p.productName)}
                                className="p-2 bg-zinc-900 border border-white/5 hover:bg-rose-500/10 hover:border-rose-500 hover:text-rose-500 rounded-lg transition-all animate-none"
                                title="Delete Product"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })}

                    {filteredCatalog.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-16 text-center text-zinc-500 text-xs font-mono">
                          <Info size={24} className="mx-auto text-zinc-750 mb-2" />
                          No operational products match current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            PANEL 3: STOCK & INSTANT CAMPAIGNS (OFFERS)
            ========================================================================= */}
        {activeTab === 'stock_offers' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-light font-display">Stock & Campaigns <span className="font-bold text-gold-500">Manager</span></h2>
              <p className="text-xs text-zinc-500">Quickly adjust stock balances and live discounts instantly with real-time sync, bypass full forms edits.</p>
            </div>

            {/* Quick search */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search catalog items to adjust margins..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-white/10 rounded-xl py-3 px-4 pl-10 text-xs outline-none focus:border-gold-500/40 text-white placeholder-zinc-500"
              />
              <Sliders size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
            </div>

            {/* Fast control grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCatalog.map(p => {
                const image = p.imageUrls?.[0] || p.variants?.[0]?.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60';
                return (
                  <div key={p.id} className="bg-zinc-950 border border-white/5 p-4 rounded-2xl flex flex-col justify-between gap-4">
                    
                    {/* Item Identity */}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-zinc-900 overflow-hidden shrink-0 border border-white/10">
                        <img src={image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold font-sans text-white uppercase truncate">{p.productName}</h3>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{p.category} | Current Price: ₹{p.price.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Stock balance modifier */}
                    <div className="bg-black/40 border border-white/5 p-3.5 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider font-bold">
                        <span className="text-zinc-500">Stock Balance</span>
                        <span className={p.stock < 3 ? 'text-rose-400' : 'text-emerald-400'}>{p.stock} Units Left</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleQuickStockUpdate(p.id!, p.stock - 1)}
                          className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 text-xs font-extrabold text-[#777] flex items-center justify-center hover:bg-zinc-800 transition-colors"
                        >
                          -
                        </button>
                        <input 
                          type="number"
                          value={p.stock}
                          onChange={(e) => handleQuickStockUpdate(p.id!, Number(e.target.value))}
                          className="flex-1 bg-black border border-white/10 rounded-lg py-1 px-2.5 text-center text-xs font-mono text-white font-bold"
                        />
                        <button 
                          onClick={() => handleQuickStockUpdate(p.id!, p.stock + 1)}
                          className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 text-xs font-extrabold text-[#777] flex items-center justify-center hover:bg-zinc-800 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Offer discount campaign slider */}
                    <div className="bg-black/40 border border-white/5 p-3.5 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider font-bold">
                        <span className="text-zinc-500">Offer Campaign</span>
                        <span className="text-gold-500 font-black">{p.offerPercentage}% Discount</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="range"
                          min="0"
                          max="90"
                          step="5"
                          value={p.offerPercentage || 0}
                          onChange={(e) => handleQuickOfferUpdate(p.id!, p.oldPrice || p.price, Number(e.target.value))}
                          className="flex-1 accent-gold-500 bg-zinc-900"
                        />
                        <span className="text-xs font-mono font-bold bg-gold-500/10 text-gold-500 px-2 py-1 rounded border border-gold-500/20">
                          {p.offerPercentage}% Off
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            PANEL 4: MANAGE CATEGORIES TAB
            ========================================================================= */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-light font-display">Manage <span className="font-bold text-gold-500">Categories</span></h2>
              <p className="text-xs text-zinc-500">Define administrative labels and register dynamically loaded web categories.</p>
            </div>

            {/* Quick Add Custom category */}
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-gold-500 font-bold flex items-center gap-2">
                <Layers size={14} /> Create Dynamic Category Label
              </h3>
              <div className="flex flex-col md:flex-row gap-3">
                <input 
                  type="text" 
                  placeholder="e.g. Ultra Smart, Platinum Chronograph, Wireless EarPods"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="flex-1 bg-black border border-white/10 rounded-xl p-3.5 text-xs outline-none focus:border-gold-500/50 text-white placeholder-zinc-650 font-sans"
                />
                <button 
                  type="button"
                  onClick={() => handleAddCustomCategoryOnly(customCategory)}
                  className="bg-gold-500 hover:bg-gold-400 text-black font-mono font-bold uppercase text-[10px] tracking-wider px-6 py-3.5 rounded-xl transition-all font-sans"
                >
                  Register Category
                </button>
              </div>
              <p className="text-[10px] text-zinc-500">P.S: Active categories generate matching layout rows and filters automatically when applied.</p>
            </div>

            {/* Category Space breakdowns */}
            <div className="space-y-3">
              <h3 className="text-xs uppercase font-mono tracking-widest text-[#555] font-bold">Dynamic Registered Labels Space</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {statistics.categoriesList.map(cat => {
                  const count = statistics.categoryCounts[cat] || 0;
                  return (
                    <div key={cat} className="bg-zinc-950 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white uppercase font-sans">{cat}</h4>
                        <span className="text-[10px] font-mono text-zinc-500 block">{count} associated products</span>
                      </div>
                      <span className="h-6 px-2 text-[9px] font-mono font-bold rounded-md bg-gold-500/10 border border-gold-500/20 text-gold-500 flex items-center justify-center">
                        ACTIVE LABEL
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            PANEL — ORDERS: OPERATIONAL ORDER LOGS & APPROVALS
            ========================================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-light font-display">Order <span className="font-bold text-gold-500">Logs & Approvals</span></h2>
                <p className="text-xs text-zinc-500 font-sans">Live operational directory of premium custom client orders, payment verification, and automated confirmation dispatches.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-zinc-900 border border-white/5 text-zinc-400 px-3 py-1.5 rounded-lg">
                  Total Orders: <strong className="text-white">{orders.length}</strong>
                </span>
                <span className="text-xs font-mono bg-amber-500/10 border border-amber-500/20 text-amber-500 px-3 py-1.5 rounded-lg font-bold">
                  Pending: <strong className="text-amber-400">{orders.filter(o => o.status !== 'confirmed').length}</strong>
                </span>
              </div>
            </div>

            {ordersLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-zinc-950 rounded-2xl border border-white/5 space-y-4">
                <div className="w-8 h-8 rounded-full border-t-2 border-gold-500 animate-spin" />
                <p className="text-xs text-zinc-500 font-mono">Synchronizing order registry feed...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-zinc-950 rounded-2xl border border-white/5 text-center">
                <FileText size={32} className="text-zinc-650 mb-3" />
                <h3 className="text-sm font-semibold text-white mb-1">No Orders Placed Yet</h3>
                <p className="text-xs text-zinc-500 max-w-sm font-sans">When customers complete checkout with UPI or Cash, order sheets and products-ordered arrays load here in real-time.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => {
                  const isConfirmed = order.status === 'confirmed';
                  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Date N/A';
                  const cartItemsArray = order.cartItems || [];

                  return (
                    <div 
                      key={order.id} 
                      className={`bg-zinc-950 rounded-2xl border transition-all ${
                        isConfirmed ? 'border-zinc-800/60 bg-zinc-950/40' : 'border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.03)]'
                      }`}
                    >
                      {/* Header details */}
                      <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-mono tracking-widest text-[#555] uppercase font-bold">ORDER ID:</span>
                            <span className="text-xs font-mono font-bold text-white bg-zinc-900 border border-white/5 px-2 py-0.5 rounded">{order.id}</span>
                            
                            {isConfirmed ? (
                              <span className="text-[10px] font-mono font-bold bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded flex items-center gap-1">
                                <Check size={10} /> APPROVED & CONFIRMED
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded animate-pulse">
                                PENDING VERIFICATION
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-500 block">Placed: {orderDate}</span>
                        </div>

                        {/* Customer Action controls */}
                        <div className="flex flex-wrap sm:items-center gap-3">
                          <a 
                            href={`mailto:${order.customerEmail}`} 
                            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[10px] font-mono uppercase font-bold px-3 py-2 rounded-lg border border-white/5 flex items-center gap-1"
                          >
                           Mail Client
                          </a>
                          <a 
                            href={`https://wa.me/${String(order.customerPhone).replace(/[^\d]/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-[#25D366]/10 hover:bg-[#25D366]/25 border border-[#25D366]/20 text-[#25D366] text-[10px] font-mono uppercase font-bold px-3 py-2 rounded-lg flex items-center gap-1"
                          >
                            WhatsApp Client
                          </a>
                        </div>
                      </div>

                      {/* Content details split */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-white/5">
                        
                        {/* LEFT 5 COLUMNS: Customer Specifications */}
                        <div className="lg:col-span-5 p-6 border-b lg:border-b-0 lg:border-r border-white/5 space-y-4">
                          <h3 className="text-[10px] font-mono uppercase tracking-widest text-gold-500 font-bold">Client Metadata & Logistics</h3>
                          
                          <div className="space-y-3 bg-black/40 p-4 rounded-xl border border-white/5 text-xs">
                            <div className="grid grid-cols-3">
                              <span className="text-zinc-500 font-mono">Full Name:</span>
                              <span className="col-span-2 text-white font-medium">{order.customerName}</span>
                            </div>
                            <div className="grid grid-cols-3">
                              <span className="text-zinc-500 font-mono">Email:</span>
                              <span className="col-span-2 text-zinc-300 break-all">{order.customerEmail}</span>
                            </div>
                            <div className="grid grid-cols-3">
                              <span className="text-zinc-500 font-mono">Phone:</span>
                              <span className="col-span-2 text-white font-bold">{order.customerPhone}</span>
                            </div>
                            <div className="grid grid-cols-3">
                              <span className="text-zinc-500 font-mono">Address:</span>
                              <span className="col-span-2 text-zinc-400 leading-relaxed font-sans">{order.deliveryAddress}</span>
                            </div>
                          </div>

                          <div className="p-4 rounded-xl border border-white/5 bg-[#0e0e0e] flex items-center justify-between text-xs">
                            <div className="space-y-0.5">
                              <span className="text-zinc-500 font-mono block text-[10px] uppercase">Payment Routing</span>
                              <span className="text-white font-bold text-xs uppercase">{order.paymentMethod === 'upi' ? 'UPI / QR Code' : 'Cash on Delivery'}</span>
                            </div>
                            <span className="text-[10px] font-mono bg-zinc-900 text-zinc-400 px-2.5 py-1 rounded border border-white/10 uppercase tracking-wider">
                              {order.paymentMethod}
                            </span>
                          </div>
                        </div>

                        {/* RIGHT 7 COLUMNS: Products ordered with variant details & images */}
                        <div className="lg:col-span-7 p-6 space-y-4">
                          <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#555] font-bold">Ordered Premium Selections ({cartItemsArray.length} items)</h3>
                          
                          <div className="space-y-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                            {cartItemsArray.map((item: any, idx: number) => {
                              const itemSubtotal = item.price * item.quantity;
                              return (
                                <div key={idx} className="flex items-center justify-between bg-black/30 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-all gap-3">
                                  <div className="flex items-center gap-3">
                                    {item.image ? (
                                      <img 
                                        src={item.image} 
                                        alt={item.productName} 
                                        className="w-12 h-12 object-cover rounded-lg border border-white/10" 
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <div className="w-12 h-12 bg-zinc-900 border border-white/10 rounded-lg flex items-center justify-center">
                                        <Package size={16} className="text-zinc-700" />
                                      </div>
                                    )}
                                    <div className="space-y-1">
                                      <span className="text-xs text-white font-bold block">{item.productName}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">Qty: {item.quantity}</span>
                                        {item.variant !== 'Standard' && (
                                          <span className="text-[10px] text-gold-500 font-mono bg-gold-500/5 px-1.5 py-0.5 rounded border border-gold-500/10">Variant: {item.variant}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right flex items-end flex-col">
                                    <span className="text-xs font-mono font-bold text-white block">₹{itemSubtotal.toLocaleString()}</span>
                                    <span className="text-[9px] font-mono text-zinc-500 block">₹{item.price.toLocaleString()} ea</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex items-center justify-between bg-gold-500/5 p-4 rounded-xl border border-gold-500/10 mt-2">
                            <div>
                              <span className="text-[10px] font-mono text-gold-500 uppercase font-bold block">Total Amount (GST Incl.):</span>
                              <span className="text-xs text-zinc-400 font-sans">Advance Payable (50%): <strong>₹{(order.totalAmount / 2).toLocaleString()}</strong></span>
                            </div>
                            <span className="text-lg font-mono font-bold text-gold-500">₹{order.totalAmount.toLocaleString()}</span>
                          </div>
                        </div>

                      </div>

                      {/* Confirmation actions bar */}
                      <div className="p-4 bg-zinc-950/80 rounded-b-2xl flex items-center justify-between gap-4">
                        <span className="text-[11px] font-mono text-zinc-500">
                          {isConfirmed ? (
                            <span className="text-green-500 font-bold flex items-center gap-1 font-sans">
                              <CheckCircle2 size={12} /> Email Receipt Sent & Confirmed
                            </span>
                          ) : (
                            <span>Review payment verification above before confirming.</span>
                          )}
                        </span>

                        {!isConfirmed && (
                          <button
                            onClick={() => handleConfirmOrder(order)}
                            disabled={confirmingId === order.id}
                            className="bg-gold-500 hover:bg-gold-400 text-black px-5 py-2.5 rounded-xl text-xs font-mono uppercase font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                          >
                            {confirmingId === order.id ? (
                              <>
                                <span className="w-3.5 h-3.5 rounded-full border-t-2 border-black animate-spin" />
                                Processing...
                              </>
                            ) : (
                              'Confirm Order & Email Receipt'
                            )}
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            PANEL 5: UNIFIED CREATE & UPDATE FORM (WITH STICKY LIVE MOCKUP PREVIEW)
            ========================================================================= */}
        {activeTab === 'add' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* LEFT 7 BLOCKS: CREATE FORM */}
            <form onSubmit={handleSubmit} className="lg:col-span-7 bg-zinc-950 p-6 md:p-8 rounded-2xl border border-white/5 space-y-8 shadow-2xl">
              <div className="border-b border-white/5 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-gold-500" />
                  {editingId ? `Edit: ${productName || 'Modify Product'}` : 'Publish Luxury Product'}
                </h2>
                <p className="text-xs text-zinc-500 mt-1 mt-0.5">Define your high-end inventory specs. Product previews build dynamically next to the controls.</p>
              </div>

              {/* Form Input Basics */}
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#777] mb-2 font-mono">Timepiece / Model Name*</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Audemars Piguet Royal Oak Gold Dial" 
                    value={productName}
                    onChange={e => setProductName(e.target.value)}
                    className="w-full bg-black border border-white/10 p-3.5 rounded-xl text-sm focus:border-gold-500/50 outline-none text-white font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#777] mb-2 font-mono">Category Group*</label>
                    <select
                      required
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-black border border-white/10 p-3.5 rounded-xl text-sm focus:border-gold-500/50 outline-none text-white font-bold"
                    >
                      <option value="">-- Choose Category --</option>
                      <option value="Watches">Luxury Watches</option>
                      <option value="Smartwatches">Smartwatches</option>
                      <option value="EarPods">EarPods / Audio Buds</option>
                      <option value="Headphones">Premium Headphones</option>
                      <option value="Custom...">+ Add Dynamic Category</option>
                    </select>
                  </div>

                  {category === 'Custom...' && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }}
                      className="flex flex-col justify-end"
                    >
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-white mb-2 font-mono">Declare New Category Label*</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Limited Edition Chrono" 
                        value={customCategory}
                        onChange={e => setCustomCategory(e.target.value)}
                        className="w-full bg-black border border-gold-500/30 p-3.5 rounded-xl text-sm focus:border-gold-500/50 outline-none text-white font-medium"
                      />
                    </motion.div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#777] mb-2 font-mono">Product Profile Description*</label>
                  <textarea 
                    required
                    placeholder="Describe aesthetics, material properties, mechanical reserves, bezel composition..." 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full bg-black border border-white/10 p-4 rounded-xl text-sm focus:border-gold-500/50 outline-none text-white h-32 leading-relaxed resize-y font-normal"
                  />
                </div>

                {/* Pricing & MOQ configs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-black/40 rounded-xl border border-white/5">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1 font-mono">Sell Price (₹)*</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      value={price || ''}
                      onChange={e => setPrice(Number(e.target.value))}
                      className="w-full bg-black border border-white/10 p-2.5 rounded-lg text-xs focus:border-gold-500/50 outline-none text-white font-mono font-bold"
                    />
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1 font-mono">Strike Margin (₹)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={oldPrice || ''}
                      onChange={e => setOldPrice(Number(e.target.value))}
                      className="w-full bg-black border border-white/10 p-2.5 rounded-lg text-xs focus:border-gold-500/50 outline-none text-zinc-400 font-mono"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1 font-mono">Offer %</label>
                    <div className="bg-zinc-900 border border-white/5 p-2.5 rounded-lg text-xs text-gold-500 font-mono font-bold text-center">
                      {offerPercentage > 0 ? `-${offerPercentage}%` : '0%'}
                    </div>
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1 font-mono">Stock Units*</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      value={stock || ''}
                      onChange={e => setStock(Number(e.target.value))}
                      className={`w-full bg-black border p-2.5 rounded-lg text-xs outline-none text-center font-mono font-bold ${
                        stock < 3 ? 'border-rose-500/50 text-rose-500 animate-pulse' : 'border-white/10 text-white'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#777] mb-2 font-mono">Floating Badge</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Best Seller, New In" 
                      value={badge}
                      onChange={e => setBadge(e.target.value)}
                      className="w-full bg-black border border-white/10 p-3 rounded-lg text-sm focus:border-gold-500/50 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#777] mb-2 font-mono">MOQ (Min Order Qty)</label>
                    <input 
                      type="number" 
                      min="1"
                      placeholder="Defaults to 2" 
                      value={moq || ''}
                      onChange={e => setMoq(Number(e.target.value))}
                      className="w-full bg-black border border-white/10 p-3 rounded-lg text-xs focus:border-gold-500/50 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#777] mb-2 font-mono">Booking deposit</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 50% upfront payment" 
                      value={advanceBooking}
                      onChange={e => setAdvanceBooking(e.target.value)}
                      className="w-full bg-black border border-white/10 p-3 rounded-lg text-xs focus:border-gold-500/50 text-white"
                    />
                  </div>
                </div>

                {/* Flags Checkboxes */}
                <div className="flex gap-4 p-4 bg-zinc-900/30 rounded-xl border border-white/5">
                  <label className="flex items-center gap-3 cursor-pointer group flex-1">
                    <input 
                      type="checkbox" 
                      checked={featured} 
                      onChange={e => setFeatured(e.target.checked)}
                      className="accent-gold-500 w-4 h-4 rounded" 
                    />
                    <div>
                      <div className="text-xs font-extrabold uppercase text-gray-300 group-hover:text-gold-500 transition-colors">Featured Display</div>
                      <div className="text-[9px] text-zinc-500">Inject in luxury cover sliders</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group flex-1">
                    <input 
                      type="checkbox" 
                      checked={trending} 
                      onChange={e => setTrending(e.target.checked)}
                      className="accent-gold-500 w-4 h-4 rounded" 
                    />
                    <div>
                      <div className="text-xs font-extrabold uppercase text-gray-300 group-hover:text-gold-500 transition-colors">Trending Badge</div>
                      <div className="text-[9px] text-zinc-500">Enable hot stamp listings</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Dynamic Galleries uploads */}
              <div className="space-y-6 pt-6 border-t border-white/5">
                
                {/* Dynamic Image URLs */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#777] font-mono flex items-center gap-1.5">
                      <ImageIcon size={14} /> Product Image Gallery (Cloudinary URLs)
                    </label>
                    <button 
                      type="button" 
                      onClick={addImageUrlInput}
                      className="text-[9px] font-bold text-gold-500 hover:text-gold-400 uppercase tracking-wider flex items-center gap-1 bg-gold-500/10 hover:bg-gold-500/20 px-2.5 py-1 rounded-md transition-colors"
                    >
                      <Plus size={10} /> Add Image File URL
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-[180px] overflow-y-auto pr-2">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <div className="flex-1 flex gap-2 items-center bg-black border border-white/10 rounded-lg p-1.5 focus-within:border-gold-500/30">
                          <input 
                            type="text" 
                            required={index === 0}
                            placeholder="Direct image HTTPS URL (Cloudinary link)" 
                            value={url}
                            onChange={e => handleImageUrlChange(index, e.target.value)}
                            className="bg-transparent border-none outline-none text-xs flex-1 px-2.5 py-1 text-white placeholder-zinc-700"
                          />
                          {url && (
                            <div className="w-10 h-10 rounded overflow-hidden border border-white/5 shrink-0 bg-zinc-900">
                              <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                            </div>
                          )}
                        </div>
                        {imageUrls.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removeImageUrlInput(index)}
                            className="p-2.5 bg-zinc-900 hover:bg-rose-500/10 hover:text-rose-500 text-zinc-500 rounded-lg transition-colors border border-white/5"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dynamic Video Showcase URLs */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#777] font-mono flex items-center gap-1.5">
                      <VideoIcon size={14} /> Video Stream Showcase (Cloudinary stream URLs)
                    </label>
                    <button 
                      type="button" 
                      onClick={addVideoUrlInput}
                      className="text-[9px] font-bold text-gold-500 hover:text-gold-400 uppercase tracking-wider flex items-center gap-1 bg-gold-500/10 hover:bg-gold-500/20 px-2.5 py-1 rounded-md transition-colors"
                    >
                      <Plus size={10} /> Add Video URL
                    </button>
                  </div>
                  
                  {videoUrls.length === 0 ? (
                    <div className="text-center p-4 text-[10px] text-zinc-600 border border-dashed border-white/5 rounded-xl bg-black/40">
                      Include premium loop showcases (Cloudinary streams supported).
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[140px] overflow-y-auto pr-2">
                      {videoUrls.map((url, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <div className="flex-1 flex gap-2 items-center bg-black border border-white/10 rounded-lg p-1.5 focus-within:border-gold-500/30">
                            <input 
                              type="text" 
                              placeholder="Direct .mp4 or stream link" 
                              value={url}
                              onChange={e => handleVideoUrlChange(index, e.target.value)}
                              className="bg-transparent border-none outline-none text-xs flex-1 px-2.5 py-1 text-white placeholder-zinc-700"
                            />
                            {url && (
                              <div className="p-1 px-2 bg-gold-500/20 text-[9px] text-gold-500 rounded font-black tracking-widest font-mono uppercase">
                                VIDEO ACTIVE
                              </div>
                            )}
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeVideoUrlInput(index)}
                            className="p-2.5 bg-zinc-900 hover:bg-rose-500/10 hover:text-rose-500 text-zinc-500 rounded-lg transition-colors border border-white/5"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Advanced variant options */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#777] font-mono flex items-center gap-1.5">
                        <Sliders size={14} /> Color Variations & Option Models
                      </label>
                      <p className="text-[9px] text-zinc-650 mt-0.5 font-sans">Connect selection buttons (color circles) with dedicated product option images dynamically.</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={addVariantInput}
                      className="text-[9px] font-bold text-gold-500 hover:text-gold-400 uppercase tracking-wider flex items-center gap-1 bg-gold-500/10 hover:bg-gold-500/20 px-2.5 py-1 rounded-md transition-colors shrink-0 font-mono"
                    >
                      <Plus size={10} /> Add Option Model
                    </button>
                  </div>

                  {variants.length === 0 ? (
                    <div className="text-center p-6 text-[10px] text-zinc-600 border border-dashed border-white/5 rounded-xl bg-black/40">
                      No customized color variants declared yet. Add variants to allow visitors to cycle timepiece colors!
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
                      {variants.map((v, index) => (
                        <div key={index} className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-3 relative group">
                          <button 
                            type="button"
                            onClick={() => removeVariantInput(index)}
                            className="absolute top-2 right-2 p-1.5 bg-zinc-900 hover:bg-rose-500/15 hover:text-rose-500 text-zinc-500 rounded-full transition-colors border border-white/5"
                          >
                            <X size={11} />
                          </button>
                          <div className="text-[9px] uppercase font-bold text-zinc-500 font-mono">Variant Model #{index + 1}</div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[8px] uppercase text-zinc-550 mb-1 font-mono">Color Name*</label>
                              <input 
                                type="text" 
                                required
                                placeholder="e.g. Platinum Ice Blue" 
                                value={v.color}
                                onChange={e => handleVariantChange(index, 'color', e.target.value)}
                                className="w-full bg-black border border-white/10 p-2.5 rounded-lg text-xs text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] uppercase text-zinc-550 mb-1 font-mono">Variant Image URL*</label>
                              <input 
                                type="text" 
                                required
                                placeholder="Pasted image link" 
                                value={v.image}
                                onChange={e => handleVariantChange(index, 'image', e.target.value)}
                                className="w-full bg-black border border-white/10 p-2.5 rounded-lg text-xs text-white"
                              />
                            </div>
                          </div>

                          {v.image && (
                            <div className="flex gap-2 items-center bg-black p-2 rounded-lg border border-white/5">
                              <div className="w-8 h-8 rounded bg-zinc-900 overflow-hidden shrink-0">
                                <img src={v.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                              </div>
                              <span className="text-[10px] text-zinc-500">Interactive link loaded successfully. <strong className="text-white uppercase font-sans">{v.color}</strong> model color circle defined.</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Technical specs */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#777] font-mono flex items-center gap-1.5">
                        <Sliders size={14} /> Technical Specifications & Aspects
                      </label>
                      <p className="text-[9px] text-zinc-650 mt-0.5">Enter key mechanical details (e.g. Case Size, Clasp, Bezel Composition, Water Resistance).</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={addSpecificationInput}
                      className="text-[9px] font-bold text-gold-500 hover:text-gold-400 uppercase tracking-wider flex items-center gap-1 bg-gold-500/10 hover:bg-gold-500/20 px-2.5 py-1 rounded-md transition-colors shrink-0"
                    >
                      <Plus size={10} /> Add Aspect Spec
                    </button>
                  </div>

                  {specifications.length === 0 ? (
                    <div className="text-center p-6 text-[10px] text-zinc-600 border border-dashed border-white/5 rounded-xl bg-black/40">
                      No technical specifications declared.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2">
                      {specifications.map((spec, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <input 
                            type="text" 
                            required
                            placeholder="Specification Label (e.g. Bezel)" 
                            value={spec.key}
                            onChange={e => handleSpecificationChange(index, 'key', e.target.value)}
                            className="bg-black border border-white/10 rounded-lg p-2.5 text-xs text-white w-1/3 min-w-[100px]"
                          />
                          <input 
                            type="text" 
                            required
                            placeholder="Specification Details (e.g. 18ct Yellow Gold Fluted)" 
                            value={spec.value}
                            onChange={e => handleSpecificationChange(index, 'value', e.target.value)}
                            className="bg-black border border-white/10 rounded-lg p-2.5 text-xs text-white flex-1"
                          />
                          <button 
                            type="button" 
                            onClick={() => removeSpecificationInput(index)}
                            className="p-3 bg-zinc-900 hover:bg-rose-500/10 hover:text-rose-500 text-zinc-500 rounded-lg transition-colors border border-white/5"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Action operations buttons */}
              <div className="flex gap-4 pt-6 border-t border-white/5">
                <button 
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3.5 bg-zinc-900 border border-white/5 hover:bg-zinc-850 hover:text-white text-zinc-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Clear Fields
                </button>

                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="flex-1 gold-gradient-bg text-black px-6 py-3.5 rounded-xl text-xs font-black tracking-widest uppercase transition-transform hover:scale-[1.01] flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-gold-500/10 disabled:opacity-40"
                >
                  {actionLoading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <><Save size={14} /> {editingId ? 'Save Product Edits' : 'Publish Product to FireStore'}</>
                  )}
                </button>
              </div>
            </form>

            {/* RIGHT 5 BLOCKS: STICKY INTERACTIVE PREVIEW */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
              
              <div className="flex items-center gap-2 text-gold-500 font-bold uppercase tracking-widest text-[9px] font-mono">
                <Eye size={12} /> Interactive Luxury Preview
              </div>

              {/* CARD CONTAINER MOCKUP */}
              <div className="bg-zinc-950 border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative group">
                
                {/* Floating badge preview */}
                {(badge || featured || trending) && (
                  <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 items-start">
                    {badge && (
                      <span className="bg-gold-500 text-black text-[9px] font-mono uppercase font-black tracking-widest px-2.5 py-1 rounded-md shadow-lg">
                        {badge}
                      </span>
                    )}
                    {featured && (
                      <span className="bg-white text-black text-[9px] px-2 py-0.5 rounded font-bold uppercase font-mono tracking-wider">
                        ★ Featured
                      </span>
                    )}
                    {trending && (
                      <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded font-bold uppercase font-mono tracking-wider">
                        🔥 Hot Deal
                      </span>
                    )}
                  </div>
                )}

                {/* Stock Warning inside Preview */}
                <div className="absolute top-4 right-4 z-10 font-mono text-[9px]">
                  {stock <= 0 ? (
                    <span className="bg-rose-500/80 backdrop-blur-md text-white font-bold px-2 py-1 rounded-md">OUT OF STOCK</span>
                  ) : stock < 3 ? (
                    <span className="bg-amber-500/80 backdrop-blur-md text-black font-extrabold px-2 py-1 rounded-md">ONLY {stock} LEFT</span>
                  ) : (
                    <span className="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 text-emerald-400 font-bold px-2 py-1 rounded-md">{stock} UNITS</span>
                  )}
                </div>

                {/* Main image placeholder / slider */}
                <div className="aspect-square bg-zinc-900 relative overflow-hidden flex items-center justify-center">
                  <img 
                    src={currentlySelectedImage} 
                    alt="Current preview model" 
                    className="w-full h-full object-cover transition-all"
                  />
                  
                  {/* Subtle shader gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                  {/* MOQ highlight */}
                  <div className="absolute bottom-4 left-4 font-mono text-[9px] text-zinc-400">
                    MOQ: <span className="text-white font-bold">{moq} pieces</span>
                  </div>
                </div>

                {/* Multi image index selector dots */}
                {computedPreviewImages.length > 1 && !activePreviewColor && (
                  <div className="flex justify-center gap-1.5 p-3 bg-zinc-900/30 border-b border-white/5">
                    {computedPreviewImages.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        type="button"
                        onClick={() => setActivePreviewImageIndex(dotIdx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          activePreviewImageIndex === dotIdx ? 'bg-gold-500 w-4' : 'bg-zinc-700 hover:bg-zinc-500'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Text attributes / selections mockups */}
                <div className="p-6 md:p-8 space-y-6">
                  <div>
                    <span className="text-[9px] font-mono tracking-wider text-gold-500 uppercase">{category || 'Department Category'}</span>
                    <h3 className="text-xl font-display font-light text-white uppercase tracking-tight mt-1 truncate">
                      {productName || 'Royal Classic Collection'}
                    </h3>
                  </div>

                  {/* Pricing segment */}
                  <div className="flex items-baseline gap-3 border-b border-white/5 pb-4">
                    <span className="text-2xl font-mono text-white font-bold">₹{price ? price.toLocaleString() : '12,500'}</span>
                    {oldPrice > price && (
                      <>
                        <span className="text-sm font-mono text-zinc-500 line-through">₹{oldPrice.toLocaleString()}</span>
                        <span className="text-xs font-mono text-emerald-400">({offerPercentage}% Off)</span>
                      </>
                    )}
                  </div>

                  {/* Interactive Dynamic color selector spheres */}
                  {variants.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono uppercase text-zinc-500 block">Available Variations:</span>
                      <div className="flex flex-wrap gap-2">
                        {variants.map((v, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setActivePreviewColor(v.color === activePreviewColor ? '' : v.color)}
                            className={`px-3 py-1.5 bg-zinc-900 border text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 uppercase ${
                              activePreviewColor === v.color 
                                ? 'border-gold-500 text-gold-500' 
                                : 'border-white/5 text-gray-400 hover:text-white'
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full border border-white/20 bg-zinc-800" style={{ backgroundImage: `url(${v.image})`, backgroundSize: 'cover' }} />
                            {v.color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Technical Specifications preview block */}
                  {specifications.length > 0 && (
                    <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-2xl space-y-3">
                      <h4 className="text-[9px] font-mono tracking-wider text-gold-500 uppercase font-black">Dynamic Specifications Block</h4>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        {specifications.map((spec, i) => (
                          <div key={i} className="flex flex-col border-b border-white/5 pb-1">
                            <span className="text-zinc-500 uppercase font-mono">{spec.key}</span>
                            <span className="text-white font-bold truncate mt-0.5">{spec.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Booking warning policies */}
                  <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                    <Info size={12} className="text-gold-500 shrink-0" />
                    <span>{advanceBooking || '50% deposit secures timepiece scheduling.'}</span>
                  </div>

                </div>

              </div>

              {/* Informative advice */}
              <div className="bg-[#050505] p-5 rounded-2xl border border-white/5 text-xs text-zinc-500 space-y-2">
                <div className="flex items-center gap-1.5 text-gold-500 font-bold uppercase tracking-wider font-mono text-[9px]">
                  <Database size={12} /> Cloud Auto-Publish Rules
                </div>
                <p className="leading-relaxed font-sans text-[11px]">
                  When clicking <strong>"Publish Product"</strong>, your payload commits instantly into Google Firestore. 
                  Visitor devices subscription channels grab files automatically. No code editing required.
                </p>
              </div>

            </div>

          </div>
        )}

      </main>

    </div>
  );
};

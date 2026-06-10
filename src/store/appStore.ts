import { create } from 'zustand';
import { Product, Ad } from '../types';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, checkQuotaExceeded } from '../firebase';

interface AppState {
  hasSeenIntro: boolean;
  setHasSeenIntro: (val: boolean) => void;
  products: Product[];
  productsLoading: boolean;
  ads: Ad[];
  adsLoading: boolean;
  listenerInitialized: boolean;
  setProducts: (products: Product[]) => void;
  setProductsLoading: (loading: boolean) => void;
  initializeProductsListener: () => () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  hasSeenIntro: false,
  setHasSeenIntro: (val) => set({ hasSeenIntro: val }),
  products: [],
  productsLoading: true,
  ads: [],
  adsLoading: true,
  listenerInitialized: false,
  setProducts: (products) => set({ products }),
  setProductsLoading: (loading) => set({ productsLoading: loading }),
  initializeProductsListener: () => {
    // If already initialized, return a no-op unsubscribe function
    if (get().listenerInitialized) {
      return () => {};
    }

    set({ listenerInitialized: true, productsLoading: true, adsLoading: true });

    try {
      const q = collection(db, 'products');
      console.log('[Firestore Read] Initializing products onSnapshot listener.');
      
      onSnapshot(q, (snap) => {
        console.log(`[Firestore Read] Received ${snap.docs.length} products from 'products' collection.`);
        if (!snap.empty) {
          const data = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Product[];
          
          set({ products: data, productsLoading: false });
        } else {
          set({ products: [], productsLoading: false });
        }
      }, (err) => {
        checkQuotaExceeded(err);
        console.error('[Firestore Error] products listener error:', err.message);
        set({ products: [], productsLoading: false });
      });

      const adsQuery = collection(db, 'ads');
      onSnapshot(adsQuery, (snap) => {
        if (!snap.empty) {
          const data = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Ad[];
          // Sort by creation date roughly
          set({ ads: data, adsLoading: false });
        } else {
          set({ ads: [], adsLoading: false });
        }
      }, (err) => {
        set({ ads: [], adsLoading: false });
        console.error('[Firestore Error] ads listener error:', err.message);
      });

      // Do nothing on unmount from component side. The app store manages connection lifecycle for efficiency.
      return () => {};
    } catch (err: any) {
      console.error('[Firestore Error] Failed to establish products observer:', err);
      set({ products: [], productsLoading: false, adsLoading: false });
      return () => {};
    }
  }
}));



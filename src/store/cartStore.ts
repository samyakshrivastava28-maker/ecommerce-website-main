import { create } from 'zustand';
import { Product, CartItem } from '../types';

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  addItem: (product: any, quantity?: number) => void;
  removeItem: (productId: string, selectedColor?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedColor?: string) => void;
  clearCart: () => void;
  cartTotal: number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isCartOpen: false,
  setIsCartOpen: (isOpen: boolean) => set({ isCartOpen: isOpen }),
  addItem: (product: any, quantity = 1) => {
    set((state) => {
      // Find item with same ID AND same selectedColor
      const existing = state.items.find((item) => item.id === product.id && item.selectedColor === product.selectedColor);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > 2) {
          alert(`You can only purchase a maximum of 2 units of ${product.productName} to maintain exclusive luxury standards.`);
          return {
            items: state.items.map((item) =>
              (item.id === product.id && item.selectedColor === product.selectedColor) ? { ...item, quantity: 2 } : item
            ),
          };
        }
        return {
          items: state.items.map((item) =>
            (item.id === product.id && item.selectedColor === product.selectedColor) ? { ...item, quantity: newQty } : item
          ),
        };
      }
      if (quantity > 2) {
        alert(`You can only purchase a maximum of 2 units of ${product.productName} to maintain exclusive luxury standards.`);
        return { items: [...state.items, { ...product, quantity: 2 }] };
      }
      return { items: [...state.items, { ...product, quantity }] };
    });
  },
  removeItem: (productId, selectedColor?: string) => {
    set((state) => ({ 
      items: state.items.filter((item) => 
        !(item.id === productId && (!selectedColor || item.selectedColor === selectedColor))
      ) 
    }));
  },
  updateQuantity: (productId, quantity, selectedColor?: string) => {
    set((state) => {
      let finalQuantity = quantity;
      if (quantity > 2) {
        alert("Maximum quantity limit is 2 units per product to preserve limited stock.");
        finalQuantity = 2;
      }
      return {
        items: state.items.map((item) =>
          (item.id === productId && (!selectedColor || item.selectedColor === selectedColor)) 
            ? { ...item, quantity: finalQuantity } 
            : item
        ),
      };
    });
  },
  clearCart: () => set({ items: [] }),
  get cartTotal() {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
  },
}));

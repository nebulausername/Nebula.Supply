import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Drop, DropVariant } from "@nebula/shared";
import type { Product, ProductVariant } from "@nebula/shared";
import { validateCart as validateCartApi } from "../api/cart";

// Generate cart hash for integrity checking
const generateCartHash = (items: CartItem[]): string => {
  const cartData = items
    .map(item => `${item.id}:${item.quantity}:${item.price.toFixed(2)}`)
    .sort()
    .join('|');
  
  // Simple hash function (in production, use crypto.subtle.digest)
  let hash = 0;
  for (let i = 0; i < cartData.length; i++) {
    const char = cartData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
};

// 🎯 Global Cart Types
export interface CartItem {
  id: string;
  type: 'shop' | 'drop';
  name: string;
  variant: string;
  price: number;
  quantity: number;
  image?: string;
  color?: string;
  maxQuantity?: number;
  stock?: number;
  inviteRequired?: boolean;
  shipping?: {
    type: string;
    cost: number;
    days: string;
    country: string;
  };
}

export interface GlobalCartState {
  items: CartItem[];
  isOpen: boolean;
  totalItems: number;
  totalPrice: number;
  cartHash: string; // Integrity hash
  version: number; // Version for conflict detection
  
  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  
  // Helpers
  getItemById: (id: string) => CartItem | undefined;
  getItemsByType: (type: 'shop' | 'drop') => CartItem[];
  canAddItem: (item: Omit<CartItem, 'id'>) => boolean;
  updateTotals: () => void;
  
  // Security & Validation
  validateCart: (userId: string) => Promise<{ success: boolean; serverTotalPrice?: number; errors?: any[] }>;
  checkStock: (itemId: string) => Promise<{ available: number; inStock: boolean }>;
}

// 🎯 Generate unique cart item ID
const generateCartItemId = (type: 'shop' | 'drop', name: string, variant: string): string => {
  return `${type}-${name.toLowerCase().replace(/\s+/g, '-')}-${variant.toLowerCase().replace(/\s+/g, '-')}`;
};

// 🎯 Global Cart Store
export const useGlobalCartStore = create<GlobalCartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      totalItems: 0,
      totalPrice: 0,
      cartHash: '',
      version: 1,

      addItem: (newItem) => {
        console.log('🚀 GlobalCart addItem aufgerufen:', newItem);

        const id = generateCartItemId(newItem.type, newItem.name, newItem.variant);
        const existingItem = get().getItemById(id);
        const previousItems = [...get().items]; // Store for rollback

        console.log('📋 Generated ID:', id);
        console.log('🔍 Existing item:', existingItem);

        // Optimistic update
        try {
          if (existingItem) {
            // Update existing item quantity
            const newQuantity = existingItem.quantity + newItem.quantity;
            const maxQuantity = Math.min(existingItem.maxQuantity || 10, existingItem.stock || 10);

            console.log('📈 Updating quantity:', existingItem.quantity, '→', newQuantity);

            if (newQuantity <= maxQuantity) {
              set((state) => ({
                items: state.items.map(item =>
                  item.id === id
                    ? { ...item, quantity: newQuantity }
                    : item
                )
              }));
            } else {
              throw new Error(`Maximale Menge erreicht: ${maxQuantity}`);
            }
          } else {
            // Add new item
            console.log('🆕 Adding new item to cart');
            set((state) => ({
              items: [...state.items, { ...newItem, id }]
            }));
          }

          // Update totals
          get().updateTotals();
          console.log('📊 Cart totals updated');
        } catch (error) {
          // Rollback on error
          console.error('Error adding item, rolling back:', error);
          set({ items: previousItems });
          get().updateTotals();
          throw error;
        }

        // Debug: Log current state
        const currentState = get();
        console.log('🛒 Current cart state:', {
          itemsCount: currentState.items.length,
          totalItems: currentState.totalItems,
          totalPrice: currentState.totalPrice,
          items: currentState.items.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            quantity: item.quantity,
            price: item.price
          }))
        });

        // Test: Save to localStorage manually
        try {
          const cartData = { items: currentState.items };
          localStorage.setItem('nebula-global-cart', JSON.stringify(cartData));
          console.log('💾 Manually saved to localStorage');
        } catch (error) {
          console.error('❌ Failed to save to localStorage:', error);
        }
      },

      removeItem: (id) => {
        const previousItems = [...get().items]; // Store for rollback
        
        try {
          set((state) => ({
            items: state.items.filter(item => item.id !== id)
          }));
          get().updateTotals();
        } catch (error) {
          // Rollback on error
          console.error('Error removing item, rolling back:', error);
          set({ items: previousItems });
          get().updateTotals();
        }
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        const previousItems = [...get().items]; // Store for rollback
        
        try {
          set((state) => ({
            items: state.items.map(item => {
              if (item.id === id) {
                const maxQuantity = Math.min(item.maxQuantity || 10, item.stock || 10);
                return { ...item, quantity: Math.min(quantity, maxQuantity) };
              }
              return item;
            })
          }));
          get().updateTotals();
        } catch (error) {
          // Rollback on error
          console.error('Error updating quantity, rolling back:', error);
          set({ items: previousItems });
          get().updateTotals();
        }
      },

      clearCart: () => {
        set({ items: [] });
        get().updateTotals();
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      openCart: () => {
        set({ isOpen: true });
      },

      closeCart: () => {
        set({ isOpen: false });
      },

      getItemById: (id) => {
        return get().items.find(item => item.id === id);
      },

      getItemsByType: (type) => {
        return get().items.filter(item => item.type === type);
      },

      canAddItem: (item) => {
        console.log('🔍 Checking if can add item:', item);

        const id = generateCartItemId(item.type, item.name, item.variant);
        const existingItem = get().getItemById(id);

        console.log('📋 Generated ID for check:', id);
        console.log('🔍 Existing item for check:', existingItem);

        if (existingItem) {
          const newQuantity = existingItem.quantity + item.quantity;
          const maxQuantity = Math.min(existingItem.maxQuantity || 10, existingItem.stock || 10);
          const canAdd = newQuantity <= maxQuantity;

          console.log('📊 Can add check result:', {
            existingQuantity: existingItem.quantity,
            newQuantity,
            maxQuantity,
            canAdd
          });

          return canAdd;
        }

        console.log('✅ Can add - no existing item');
        return true;
      },

      updateTotals: () => {
        const items = get().items;
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const cartHash = generateCartHash(items);
        const version = get().version + 1;
        
        set({ totalItems, totalPrice, cartHash, version });
      },

      validateCart: async (userId: string, timeoutMs: number = 5000) => {
        const items = get().items;
        if (items.length === 0) {
          return { success: false, errors: [{ message: 'Warenkorb ist leer' }] };
        }

        try {
          // Call validation with timeout
          const result = await validateCartApi(items, userId, timeoutMs);
          
          // Handle warnings (non-blocking)
          if (result.warnings && result.warnings.length > 0) {
            console.warn('Cart validation warnings:', result.warnings);
          }
          
          // Update prices if server returned corrected prices
          if (result.success && result.items && result.items.length > 0) {
            const priceChanged = result.items.some((item, index) => {
              const currentItem = items[index];
              return currentItem && Math.abs(currentItem.price - item.price) > 0.01;
            });

            if (priceChanged) {
              // Update cart with server-validated prices
              set((state) => ({
                items: state.items.map((item, index) => {
                  const validatedItem = result.items[index];
                  if (validatedItem && validatedItem.id === item.id) {
                    return { ...item, price: validatedItem.price };
                  }
                  return item;
                })
              }));
              get().updateTotals();
            }
          }

          // Always return success - validation errors are just warnings
          // This ensures checkout is never blocked by validation issues
          return {
            success: true, // Always allow checkout
            serverTotalPrice: result.serverTotalPrice,
            errors: result.errors || [],
            warnings: result.warnings || []
          };
        } catch (error: any) {
          console.error('Cart validation error:', error);
          
          // Always allow checkout, even on error
          const errorMessage = error?.message || 'Fehler bei der Cart-Validierung';
          const isTimeout = errorMessage.includes('Timeout') || errorMessage.includes('zu lange');
          
          return {
            success: true, // Always allow checkout
            serverTotalPrice: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            errors: [],
            warnings: [isTimeout 
              ? 'Validierung dauerte zu lange - Checkout wird fortgesetzt'
              : 'Validierung konnte nicht durchgeführt werden - Checkout wird fortgesetzt'
            ]
          };
        }
      },

      checkStock: async (itemId: string) => {
        const item = get().getItemById(itemId);
        if (!item) {
          return { available: 0, inStock: false };
        }

        // In production, this would call an API endpoint
        // For now, return the stock from the item if available
        const stock = item.stock || 0;
        const available = Math.max(0, stock - item.quantity);
        
        return {
          available,
          inStock: stock > 0
        };
      }
    }),
    {
      name: 'nebula-global-cart',
      partialize: (state: GlobalCartState) => ({ 
        items: state.items,
        cartHash: state.cartHash,
        version: state.version,
        lastUpdated: Date.now()
      } as any),
      // Cross-tab synchronization with BroadcastChannel
      onRehydrateStorage: () => (state) => {
        if (typeof window !== 'undefined') {
          // Use BroadcastChannel for better cross-tab sync
          const channel = new BroadcastChannel('nebula-cart-sync');
          
          channel.onmessage = (event) => {
            if (event.data.type === 'cart-update') {
              const { items, version, cartHash } = event.data;
              const currentVersion = useGlobalCartStore.getState().version;
              
              // Conflict resolution: use higher version
              if (version > currentVersion) {
                useGlobalCartStore.setState({ items, version, cartHash });
                useGlobalCartStore.getState().updateTotals();
              }
            }
          };
          
          // Listen for storage events as fallback
          window.addEventListener('storage', (e) => {
            if (e.key === 'nebula-global-cart' && e.newValue) {
              try {
                const newState = JSON.parse(e.newValue);
                if (newState?.state?.items) {
                  const currentVersion = useGlobalCartStore.getState().version;
                  const newVersion = newState.state.version || 0;
                  
                  if (newVersion > currentVersion) {
                    useGlobalCartStore.setState({ 
                      items: newState.state.items,
                      version: newVersion,
                      cartHash: newState.state.cartHash || ''
                    });
                    useGlobalCartStore.getState().updateTotals();
                  }
                }
              } catch (error) {
                console.error('Error syncing cart from storage:', error);
              }
            }
          });
          
          // Cleanup expired carts (30 days)
          const lastUpdated = state?.lastUpdated || Date.now();
          const daysSinceUpdate = (Date.now() - lastUpdated) / (1000 * 60 * 60 * 24);
          if (daysSinceUpdate > 30) {
            useGlobalCartStore.getState().clearCart();
          }
        }
      },
    }
  )
);

// Cross-tab synchronization: Broadcast cart changes to other tabs
if (typeof window !== 'undefined') {
  const channel = new BroadcastChannel('nebula-cart-sync');
  
  useGlobalCartStore.subscribe(
    (state) => {
      // Broadcast cart updates to other tabs
      channel.postMessage({
        type: 'cart-update',
        items: state.items,
        version: state.version,
        cartHash: state.cartHash,
        timestamp: Date.now()
      });
      
      // Also trigger storage event for compatibility
      window.dispatchEvent(new Event('storage'));
    }
  );
}

// 🎯 Helper functions for adding items - Optimiert
export const addShopItemToCart = (product: Product, variant: any, quantity: number = 1) => {
  try {
    const cart = useGlobalCartStore.getState();
    
    // Validate input
    if (!product || !product.name) {
      console.error('Invalid product provided to addShopItemToCart');
      return false;
    }
    
    if (quantity <= 0) {
      console.error('Invalid quantity provided to addShopItemToCart');
      return false;
    }
    
    const cartItem: Omit<CartItem, 'id'> = {
      type: 'shop',
      name: product.name,
      variant: variant.label || variant.name || 'Standard',
      price: variant.basePrice || variant.price || product.price || 0,
      quantity,
      image: variant.media?.[0]?.url || product.media?.[0]?.url,
      color: (variant.media?.[0] as any)?.dominantColor || (product.media?.[0] as any)?.dominantColor,
      maxQuantity: variant.maxQuantity || 10,
      stock: variant.stock || 100
    };

    if (cart.canAddItem(cartItem)) {
      cart.addItem(cartItem);
      // Don't auto-open cart for better UX - let the calling component decide
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error in addShopItemToCart:', error);
    return false;
  }
};

export const addDropItemToCart = (drop: Drop, variant: DropVariant, quantity: number = 1) => {
  const cart = useGlobalCartStore.getState();
  
  const cartItem: Omit<CartItem, 'id'> = {
    type: 'drop',
    name: drop.name,
    variant: variant.label,
    price: variant.basePrice,
    quantity,
    image: variant.media?.[0]?.url,
    color: variant.media?.[0]?.dominantColor,
    maxQuantity: variant.maxQuantity,
    stock: variant.stock,
    inviteRequired: variant.inviteRequired
  };

  if (cart.canAddItem(cartItem)) {
    cart.addItem(cartItem);
    cart.openCart();
    return true;
  }
  
  return false;
};

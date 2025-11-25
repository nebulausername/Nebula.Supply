import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserInterestsState {
  shopInterests: string[];
  dropInterests: string[];
  timestamp: number;
  addShopInterest: (productId: string) => void;
  addDropInterest: (dropId: string) => void;
  removeShopInterest: (productId: string) => void;
  removeDropInterest: (dropId: string) => void;
  toggleShopInterest: (productId: string) => boolean;
  toggleDropInterest: (dropId: string) => boolean;
  getAll: () => { shopInterests: string[]; dropInterests: string[] };
  clearAll: () => void;
  isShopInterested: (productId: string) => boolean;
  isDropInterested: (dropId: string) => boolean;
}

export const useUserInterestsStore = create<UserInterestsState>()(
  persist(
    (set, get) => ({
      shopInterests: [],
      dropInterests: [],
      timestamp: Date.now(),

      addShopInterest: (productId: string) => {
        set((state) => {
          if (state.shopInterests.includes(productId)) {
            return state;
          }
          return {
            shopInterests: [...state.shopInterests, productId],
            timestamp: Date.now()
          };
        });
      },

      addDropInterest: (dropId: string) => {
        set((state) => {
          if (state.dropInterests.includes(dropId)) {
            return state;
          }
          return {
            dropInterests: [...state.dropInterests, dropId],
            timestamp: Date.now()
          };
        });
      },

      removeShopInterest: (productId: string) => {
        set((state) => ({
          shopInterests: state.shopInterests.filter(id => id !== productId),
          timestamp: Date.now()
        }));
      },

      removeDropInterest: (dropId: string) => {
        set((state) => ({
          dropInterests: state.dropInterests.filter(id => id !== dropId),
          timestamp: Date.now()
        }));
      },

      toggleShopInterest: (productId: string) => {
        const state = get();
        if (state.shopInterests.includes(productId)) {
          state.removeShopInterest(productId);
          return false;
        } else {
          state.addShopInterest(productId);
          return true;
        }
      },

      toggleDropInterest: (dropId: string) => {
        const state = get();
        if (state.dropInterests.includes(dropId)) {
          state.removeDropInterest(dropId);
          return false;
        } else {
          state.addDropInterest(dropId);
          return true;
        }
      },

      getAll: () => {
        const state = get();
        return {
          shopInterests: state.shopInterests,
          dropInterests: state.dropInterests
        };
      },

      clearAll: () => {
        set({
          shopInterests: [],
          dropInterests: [],
          timestamp: Date.now()
        });
      },

      isShopInterested: (productId: string) => {
        return get().shopInterests.includes(productId);
      },

      isDropInterested: (dropId: string) => {
        return get().dropInterests.includes(dropId);
      }
    }),
    {
      name: 'nebula-user-interests',
      version: 1
    }
  )
);











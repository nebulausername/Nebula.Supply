import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DevModeState {
  isActive: boolean;
  activatedAt: number | null;
  expiresAt: number | null;
  activate: () => void;
  deactivate: () => void;
  checkExpiry: () => boolean;
}

const DEV_MODE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const useDevModeStore = create<DevModeState>()(
  persist(
    (set, get) => ({
      isActive: false,
      activatedAt: null,
      expiresAt: null,

      activate: () => {
        const now = Date.now();
        set({
          isActive: true,
          activatedAt: now,
          expiresAt: now + DEV_MODE_DURATION,
        });
      },

      deactivate: () => {
        set({
          isActive: false,
          activatedAt: null,
          expiresAt: null,
        });
      },

      checkExpiry: () => {
        const { expiresAt, isActive } = get();
        if (!isActive || !expiresAt) {
          return false;
        }
        
        if (Date.now() > expiresAt) {
          get().deactivate();
          return false;
        }
        
        return true;
      },
    }),
    {
      name: 'nebula-dev-mode',
    }
  )
);









































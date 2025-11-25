import { useEffect } from 'react';
import { useCookieClickerStore } from '../store/cookieClicker';

/**
 * Hook zum Speichern des Cookie Clicker State beim Verlassen
 * Pausiert die Session automatisch
 */
export const useBeforeUnload = () => {
  useEffect(() => {
    const handleBeforeUnload = () => {
      const state = useCookieClickerStore.getState();
      
      // Pausiere Session beim Verlassen
      state.pauseSession();
      
      // State wird automatisch via Zustand persist middleware gespeichert
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
};





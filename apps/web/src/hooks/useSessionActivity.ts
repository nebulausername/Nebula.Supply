import { useEffect, useCallback } from 'react';
import { useCookieClickerStore } from '../store/cookieClicker';

/**
 * Session Activity Hook
 * Tracked Page Visibility, Focus und pausiert bei Inaktivität
 */
export const useSessionActivity = () => {
  const updateActiveStatus = useCookieClickerStore(state => state.updateActiveStatus);
  const pauseSession = useCookieClickerStore(state => state.pauseSession);
  const resumeSession = useCookieClickerStore(state => state.resumeSession);

  // 🎯 Page Visibility API
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // Tab nicht sichtbar → Pause
      pauseSession();
    } else {
      // Tab wieder sichtbar → Resume
      resumeSession();
    }
  }, [pauseSession, resumeSession]);

  // 🎯 Window Focus/Blur
  const handleFocus = useCallback(() => {
    updateActiveStatus(true);
  }, [updateActiveStatus]);

  const handleBlur = useCallback(() => {
    updateActiveStatus(false);
  }, [updateActiveStatus]);

  useEffect(() => {
    // Page Visibility Listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Focus/Blur Listeners
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [handleVisibilityChange, handleFocus, handleBlur]);
};





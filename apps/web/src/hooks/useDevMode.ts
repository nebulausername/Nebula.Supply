import { useEffect, useState, useCallback } from 'react';
import { useDevModeStore } from '../store/devMode';
import {
  checkUrlDevMode,
  validateDevToken,
  getDevCookie,
  generateDevToken,
  setDevCookie,
  SecretKeySequence,
  LogoClickSequence,
} from '../utils/devMode';

export const useDevMode = () => {
  const { isActive, activate, deactivate, checkExpiry } = useDevModeStore();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize dev mode on mount
  useEffect(() => {
    // Check URL parameter first
    if (checkUrlDevMode()) {
      activate();
      setIsInitialized(true);
      return;
    }

    // Check cookie
    const cookie = getDevCookie();
    if (cookie) {
      if (validateDevToken(cookie.token)) {
        activate();
      } else {
        // Cookie expired or invalid
        deactivate();
      }
    }

    // Check expiry periodically
    const interval = setInterval(() => {
      if (isActive) {
        const stillValid = checkExpiry();
        if (!stillValid) {
          deactivate();
        }
      }
    }, 60000); // Check every minute

    setIsInitialized(true);

    return () => clearInterval(interval);
  }, []); // Only run once on mount

  // Activate dev mode manually
  const activateDevMode = useCallback(() => {
    const token = generateDevToken();
    setDevCookie(token);
    activate();
  }, [activate]);

  // Deactivate dev mode
  const deactivateDevMode = useCallback(() => {
    deactivate();
  }, [deactivate]);

  // Keyboard sequence handler
  const handleKeySequence = useCallback(() => {
    const sequence = new SecretKeySequence(['d', 'e', 'v', 'm', 'o', 'd', 'e']);
    
    const handler = (e: KeyboardEvent) => {
      if (sequence.addKey(e.key)) {
        activateDevMode();
        window.removeEventListener('keydown', handler);
      }
    };

    window.addEventListener('keydown', handler);
    
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [activateDevMode]);

  // Logo click sequence handler
  const handleLogoClickSequence = useCallback(() => {
    const sequence = new LogoClickSequence();
    
    return (e: React.MouseEvent) => {
      if (sequence.addClick()) {
        activateDevMode();
      }
    };
  }, [activateDevMode]);

  return {
    isActive: isActive && isInitialized,
    isInitialized,
    activate: activateDevMode,
    deactivate: deactivateDevMode,
    handleKeySequence,
    handleLogoClickSequence,
  };
};








































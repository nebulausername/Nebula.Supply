import { useEffect, useRef } from 'react';
import { useCookieStore } from '../store/cookieStore';

// ⏰ Game Loop Hook - Handles passive cookie generation (CPS)

export const useGameLoop = () => {
  const { cookiesPerSecond, addCookie } = useCookieStore();
  const lastTickRef = useRef<number>(Date.now());

  useEffect(() => {
    if (cookiesPerSecond === 0) return;

    // Update every 100ms for smooth experience
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaTime = (now - lastTickRef.current) / 1000; // Convert to seconds
      lastTickRef.current = now;

      const cookiesToAdd = cookiesPerSecond * deltaTime;
      addCookie(cookiesToAdd, false);
    }, 100);

    return () => clearInterval(interval);
  }, [cookiesPerSecond, addCookie]);
};

import { memo, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCookieClickerStore } from '../../store/cookieClicker';
import { cn } from '../../utils/cn';

interface GoldenCookie {
  id: string;
  x: number;
  y: number;
  effect: 'multiplier' | 'bonus' | 'speed';
  duration: number;
  timestamp: number;
}

// 🍪 Golden Cookie Component - Zufällige Events mit Boni
export const GoldenCookieSystem = memo(() => {
  const [goldenCookies, setGoldenCookies] = useState<GoldenCookie[]>([]);
  const cookies = useCookieClickerStore(state => state.cookies);
  const cookiesPerClick = useCookieClickerStore(state => state.cookiesPerClick);
  const cookiesPerSecond = useCookieClickerStore(state => state.cookiesPerSecond);
  const animationsEnabled = useCookieClickerStore(state => state.animationsEnabled);

  // Spawn Golden Cookie alle 30-60 Sekunden
  useEffect(() => {
    if (!animationsEnabled) return;

    const spawnCookie = () => {
      const effects: Array<'multiplier' | 'bonus' | 'speed'> = ['multiplier', 'bonus', 'speed'];
      const effect = effects[Math.floor(Math.random() * effects.length)];
      
      const newCookie: GoldenCookie = {
        id: Math.random().toString(36).substring(2, 11),
        x: Math.random() * 80 + 10, // 10-90% of screen
        y: Math.random() * 60 + 20, // 20-80% of screen
        effect,
        duration: 30000, // 30 seconds
        timestamp: Date.now()
      };

      setGoldenCookies(prev => [...prev, newCookie]);

      // Remove after duration
      setTimeout(() => {
        setGoldenCookies(prev => prev.filter(c => c.id !== newCookie.id));
      }, newCookie.duration);
    };

    // Initial spawn after 10 seconds
    const initialTimeout = setTimeout(spawnCookie, 10000);
    
    // Then spawn every 30-60 seconds
    const interval = setInterval(spawnCookie, 30000 + Math.random() * 30000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [animationsEnabled]);

  const handleClick = useCallback((cookie: GoldenCookie) => {
    const store = useCookieClickerStore.getState();
    
    // Apply effect
    switch (cookie.effect) {
      case 'multiplier': {
        // 2x cookies for 30 seconds - temporary multiplier
        const originalCpc = store.cookiesPerClick;
        useCookieClickerStore.setState((state) => {
          state.cookiesPerClick = originalCpc * 2;
        });
        setTimeout(() => {
          const currentStore = useCookieClickerStore.getState();
          // Only reset if still multiplied (avoid race conditions)
          if (currentStore.cookiesPerClick === originalCpc * 2) {
            useCookieClickerStore.setState((state) => {
              state.cookiesPerClick = originalCpc;
            });
          }
        }, 30000);
        break;
      }
      case 'bonus': {
        // Instant bonus cookies
        const bonus = store.cookiesPerSecond * 60; // 1 minute of CPS
        useCookieClickerStore.setState((state) => {
          state.cookies += bonus;
          state.totalCookies += bonus;
        });
        break;
      }
      case 'speed': {
        // 3x CPS for 30 seconds
        const originalCps = store.cookiesPerSecond;
        useCookieClickerStore.setState((state) => {
          state.cookiesPerSecond = originalCps * 3;
        });
        setTimeout(() => {
          const currentStore = useCookieClickerStore.getState();
          // Only reset if still multiplied (avoid race conditions)
          if (currentStore.cookiesPerSecond === originalCps * 3) {
            useCookieClickerStore.setState((state) => {
              state.cookiesPerSecond = originalCps;
            });
          }
        }, 30000);
        break;
      }
    }

    // Remove cookie
    setGoldenCookies(prev => prev.filter(c => c.id !== cookie.id));
  }, []);

  if (!animationsEnabled || goldenCookies.length === 0) return null;

  return (
    <AnimatePresence>
      {goldenCookies.map(cookie => (
        <motion.div
          key={cookie.id}
          className="fixed z-50 cursor-pointer"
          style={{
            left: `${cookie.x}%`,
            top: `${cookie.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
          initial={{ scale: 0, opacity: 0, rotate: -180 }}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: 1,
            rotate: [0, 360],
            y: [0, -10, 0]
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            scale: { duration: 0.5, repeat: Infinity, repeatType: 'reverse' },
            rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
            y: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
          }}
          onClick={() => handleClick(cookie)}
        >
          <div className="relative">
            <motion.div
              className="text-6xl filter drop-shadow-2xl"
              animate={{
                filter: [
                  'drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))',
                  'drop-shadow(0 0 20px rgba(255, 215, 0, 1))',
                  'drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))'
                ]
              }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              🍪
            </motion.div>
            <motion.div
              className="absolute -inset-4 rounded-full border-2 border-yellow-400/50"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold text-yellow-400 whitespace-nowrap">
              {cookie.effect === 'multiplier' && '2x Klick!'}
              {cookie.effect === 'bonus' && 'Bonus!'}
              {cookie.effect === 'speed' && '3x CPS!'}
            </div>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
});

GoldenCookieSystem.displayName = 'GoldenCookieSystem';


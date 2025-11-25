import { useEffect, useCallback, useRef, useState, useMemo, memo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCookieClickerStore, BUILDINGS, UPGRADES } from '../store/cookieClicker';
import { Header } from '../layout/Header';
import { ProgressBar } from '../components/ProgressBar';
import { cn } from '../utils/cn';
import { formatNumber, formatTime } from '../utils/cookieFormatters';
import { VipOfflineProgressModal } from '../components/cookieClicker/VipOfflineProgressModal';
import { VipUpgradeBanner } from '../components/cookieClicker/VipUpgradeBanner';
import { VerificationBanner } from '../components/cookieClicker/VerificationBanner';
import { checkNicknameSet } from '../api/cookieClicker';
import { debounce, rafThrottle } from '../utils/performance';
import { EnhancedProgressBar } from '../components/cookieClicker/EnhancedProgressBar';
import { Tooltip } from '../components/cookieClicker/Tooltip';
import { GoldenCookieSystem } from '../components/cookieClicker/GoldenCookie';
import { OptimizedParticleSystem } from '../components/cookieClicker/OptimizedParticleSystem';
import { SmoothNumberAnimation } from '../components/cookieClicker/SmoothNumberAnimation';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { handleAsyncError, getErrorMessage } from '../utils/errorHandler';

// 🚀 Lazy Loading für schwere Komponenten (Bundle Size Optimierung)
const AchievementSystem = lazy(() => 
  import('../components/cookieClicker/AchievementSystem')
    .then(module => ({ default: module.AchievementSystem }))
    .catch(error => {
      console.warn('Failed to load AchievementSystem:', error);
      return { default: () => <div className="p-4 text-white/60">Achievement System konnte nicht geladen werden</div> };
    })
);
// Direct import for GamingDiscountPanel to avoid dynamic import issues
import { GamingDiscountPanel } from '../components/cookieClicker/GamingDiscountPanel';
const EnhancedStats = lazy(() => 
  import('../components/cookieClicker/EnhancedStats')
    .then(module => ({ default: module.EnhancedStats }))
    .catch(error => {
      console.warn('Failed to load EnhancedStats:', error);
      return { default: () => <div className="p-4 text-white/60">Stats konnten nicht geladen werden</div> };
    })
);
const EnhancedUpgrades = lazy(() => 
  import('../components/cookieClicker/EnhancedUpgrades')
    .then(module => ({ default: module.EnhancedUpgrades }))
    .catch(error => {
      console.warn('Failed to load EnhancedUpgrades:', error);
      return { default: () => <div className="p-4 text-white/60">Upgrades konnten nicht geladen werden</div> };
    })
);
const MonthlyContest = lazy(() => 
  import('../components/cookieClicker/MonthlyContest')
    .then(module => ({ default: module.MonthlyContest }))
    .catch(error => {
      console.warn('Failed to load MonthlyContest:', error);
      return { default: () => <div className="p-4 text-white/60">Monthly Contest konnte nicht geladen werden</div> };
    })
);
const ContestTypes = lazy(() => 
  import('../components/cookieClicker/ContestTypes')
    .then(module => ({ default: module.ContestTypes }))
    .catch(error => {
      console.warn('Failed to load ContestTypes:', error);
      return { default: () => <div className="p-4 text-white/60">Contest Types konnten nicht geladen werden</div> };
    })
);
const ContestAnalytics = lazy(() => 
  import('../components/cookieClicker/ContestAnalytics')
    .then(module => ({ default: module.ContestAnalytics }))
    .catch(error => {
      console.warn('Failed to load ContestAnalytics:', error);
      return { default: () => <div className="p-4 text-white/60">Contest Analytics konnten nicht geladen werden</div> };
    })
);
const PrizeClaim = lazy(() => 
  import('../components/cookieClicker/PrizeClaim')
    .then(module => ({ default: module.PrizeClaim }))
    .catch(error => {
      console.warn('Failed to load PrizeClaim:', error);
      return { default: () => <div className="p-4 text-white/60">Prize Claim konnte nicht geladen werden</div> };
    })
);
const SoundManager = lazy(() => 
  import('../components/cookieClicker/EnhancedSoundSystem')
    .then(module => ({ default: module.SoundManager }))
    .catch(error => {
      console.warn('Failed to load SoundManager:', error);
      return { default: () => null };
    })
);
const ToastContainer = lazy(() => 
  import('../components/cookieClicker/ToastSystem')
    .then(module => ({ default: module.ToastContainer }))
    .catch(error => {
      console.warn('Failed to load ToastContainer:', error);
      return { default: () => null };
    })
);
const CookieLeaderboard = lazy(() => 
  import('../components/cookieClicker/CookieLeaderboard')
    .then(module => ({ default: module.CookieLeaderboard }))
    .catch(error => {
      console.warn('Failed to load CookieLeaderboard:', error);
      return { default: () => <div className="p-4 text-white/60">Leaderboard konnte nicht geladen werden</div> };
    })
);
const NicknameSetupModal = lazy(() => 
  import('../components/cookieClicker/NicknameSetupModal')
    .then(module => ({ default: module.NicknameSetupModal }))
    .catch(error => {
      console.warn('Failed to load NicknameSetupModal:', error);
      return { default: () => null };
    })
);
const KeyboardShortcuts = lazy(() => 
  import('../components/cookieClicker/AccessibilityFeatures')
    .then(module => ({ default: module.KeyboardShortcuts }))
    .catch(error => {
      console.warn('Failed to load KeyboardShortcuts:', error);
      return { default: () => null };
    })
);
import { useGamingDiscountNotifications } from '../hooks/useGamingDiscountNotifications';
import { useSessionActivity } from '../hooks/useSessionActivity';
import { useBeforeUnload } from '../hooks/useBeforeUnload';
import { useBotCommandHandler } from '../utils/botCommandHandler';
import { useTouchGestures } from '../hooks/useTouchGestures';
import { 
  Cookie, 
  Zap, 
  Target, 
  Trophy, 
  Flame, 
  Settings, 
  Volume2, 
  VolumeX,
  Star,
  Diamond,
  Crown,
  Building,
  Coins,
  TrendingUp,
  Award,
  ArrowRight,
  TestTube,
  Columns,
  LayoutGrid
} from 'lucide-react';

// 🍪 GEILE COOKIE COMPONENT - MAXIMIERT MIT MULTI-LAYER GLOW & STREAK EFFECTS!
const CookieComponent = memo(({ onClick }: { onClick: (x: number, y: number) => void }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [clickAnimation, setClickAnimation] = useState(false);
  const [rippleEffects, setRippleEffects] = useState<Array<{ id: string; x: number; y: number; timestamp: number }>>([]);
  const cookieRef = useRef<HTMLDivElement>(null);
  const animationsEnabled = useCookieClickerStore(state => state.animationsEnabled);
  const streak = useCookieClickerStore(state => state.streak);

  // 🚀 Haptic Feedback für Mobile (Vibration API)
  const triggerHapticFeedback = useCallback((pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Silently fail if vibration not supported
      }
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!cookieRef.current) return;
    
    try {
      const rect = cookieRef.current.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        // 🎯 Touch/Mouse Position Detection
        const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
        
        if (!clientX || !clientY) return;
        
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        onClick(x, y);
        
        // 🚀 Haptic Feedback für Mobile
        if ('touches' in e) {
          triggerHapticFeedback([10, 5, 10]); // Pattern: vibrate, pause, vibrate
        }
        
        // 🎯 MAXIMIERTE CLICK ANIMATIONEN!
        setIsClicked(true);
        setClickAnimation(true);
        
        // Enhanced Ripple Effect mit Multi-Layer
        if (animationsEnabled) {
          const rippleId = Math.random().toString(36).substring(2, 11);
          setRippleEffects(prev => [...prev, { id: rippleId, x, y, timestamp: Date.now() }]);
          
          // Cleanup after animation
          setTimeout(() => {
            setRippleEffects(prev => prev.filter(r => r.id !== rippleId));
          }, 1200);
        }
        
        setTimeout(() => {
          setIsClicked(false);
          setClickAnimation(false);
        }, 200);
      }
    } catch (error) {
      // Silently handle DOM errors (element not found, etc.)
      if (import.meta.env.DEV) {
        console.debug('Cookie click handler error:', error);
      }
    }
  }, [onClick, animationsEnabled, triggerHapticFeedback]);

  // Streak Fire Effect Intensity
  const fireIntensity = Math.min(streak / 50, 1); // Max bei 50+ streak
  
  return (
    <div className="relative flex items-center justify-center">
      {/* Cookie Container */}
      <div
        ref={cookieRef}
        className={cn(
          "relative cursor-pointer transition-transform duration-200 select-none will-change-transform",
          "hover:scale-105 active:scale-95 touch-manipulation", // 🚀 Touch-Optimierung
          clickAnimation && "scale-110"
        )}
        style={{
          willChange: 'transform',
          transform: clickAnimation ? 'scale(0.95)' : undefined,
          touchAction: 'manipulation', // 🚀 Bessere Touch-Performance
          WebkitTapHighlightColor: 'transparent' // 🚀 Entferne Tap-Highlight auf Mobile
        }}
        role="button"
        aria-label="Cookie klicken um Kekse zu verdienen"
        tabIndex={0}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        onTouchStart={handleClick}
        onKeyDown={(e) => {
          // 🚀 Keyboard Support für Accessibility
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const rect = cookieRef.current?.getBoundingClientRect();
            if (rect) {
              handleClick({
                ...e,
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2
              } as any);
            }
          }
        }}
      >
        {/* Multi-Layer Glow Effect - MAXIMIERT! */}
        {/* Outer Glow Layer 1 */}
        <motion.div 
          className={cn(
            "absolute inset-0 rounded-full will-change-transform -z-10",
            isHovered ? "bg-orange-500/30 blur-3xl" : "bg-orange-400/20 blur-2xl"
          )}
          animate={{
            scale: isHovered ? [1, 1.3, 1.2, 1.3, 1] : 1,
            opacity: isHovered ? [0.4, 0.6, 0.5, 0.6, 0.4] : [0.2, 0.3, 0.2]
          }}
          transition={{
            duration: isHovered ? 2 : 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Middle Glow Layer 2 */}
        <motion.div 
          className={cn(
            "absolute inset-0 rounded-full will-change-transform -z-10",
            isHovered ? "bg-yellow-400/40 blur-2xl" : "bg-yellow-400/20 blur-xl"
          )}
          animate={{
            scale: isHovered ? [1, 1.25, 1.15, 1.25, 1] : 1,
            opacity: isHovered ? [0.3, 0.5, 0.4, 0.5, 0.3] : [0.15, 0.25, 0.15]
          }}
          transition={{
            duration: isHovered ? 2.5 : 3.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Inner Glow Layer 3 */}
        <motion.div 
          className="absolute inset-0 rounded-full will-change-transform -z-10 bg-orange-300/50 blur-lg"
          animate={{
            scale: isHovered ? [1, 1.15, 1.1, 1.15, 1] : 1,
          }}
          transition={{
            duration: isHovered ? 3 : 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Streak Fire Effect - MAXIMIERT! */}
        {streak > 0 && animationsEnabled && (
          <>
            {/* Fire Particles */}
            {Array.from({ length: Math.floor(streak / 5) }).map((_, i) => (
              <motion.div
                key={`fire-${i}`}
                className="absolute pointer-events-none text-2xl"
                style={{
                  left: `${50 + (Math.random() - 0.5) * 20}%`,
                  top: `${50 + (Math.random() - 0.5) * 20}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                animate={{
                  y: [-20, -60],
                  x: [(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 80],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.2, 0]
                }}
                transition={{
                  duration: 1 + Math.random(),
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "easeOut"
                }}
              >
                🔥
              </motion.div>
            ))}
            
            {/* Fire Glow Ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-red-500/60 pointer-events-none"
              animate={{
                scale: [1, 1.2, 1.1, 1.2, 1],
                opacity: [0.5 * fireIntensity, 0.9 * fireIntensity, 0.6 * fireIntensity, 0.9 * fireIntensity, 0.5 * fireIntensity],
                boxShadow: [
                  `0_0_20px_rgba(239,68,68,${0.5 * fireIntensity})`,
                  `0_0_40px_rgba(239,68,68,${0.8 * fireIntensity})`,
                  `0_0_30px_rgba(239,68,68,${0.6 * fireIntensity})`,
                  `0_0_40px_rgba(239,68,68,${0.8 * fireIntensity})`,
                  `0_0_20px_rgba(239,68,68,${0.5 * fireIntensity})`
                ]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </>
        )}
        
        {/* Cookie Icon - Enhanced Animation */}
        <motion.div 
          className={cn(
            "relative text-8xl md:text-9xl will-change-transform z-10",
            isHovered && "drop-shadow-2xl",
            streak > 0 && "drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]"
          )}
          animate={clickAnimation ? {
            scale: [1, 0.88, 1.12, 1],
            rotate: [0, -8, 8, -4, 4, 0]
          } : isHovered ? {
            scale: [1, 1.08, 1.05, 1.08, 1],
            rotate: [0, 2, -2, 1, -1, 0]
          } : streak > 0 ? {
            scale: [1, 1.05, 1],
            rotate: [0, 1, -1, 0]
          } : {}}
          transition={{
            duration: clickAnimation ? 0.25 : isHovered ? 2 : streak > 0 ? 3 : 0,
            ease: clickAnimation ? [0.34, 1.56, 0.64, 1] : "easeOut",
            repeat: isHovered || streak > 0 ? Infinity : 0
          }}
        >
          🍪
        </motion.div>

        {/* Enhanced Multi-Layer Ripple Effects */}
        <AnimatePresence>
          {rippleEffects.map((ripple) => (
            <motion.div
              key={`ripple-group-${ripple.id}`}
              className="absolute pointer-events-none"
              style={{
                left: ripple.x,
                top: ripple.y,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {/* Outer Ripple */}
              <motion.div
                key={`ripple-outer-${ripple.id}`}
                className="absolute pointer-events-none rounded-full border-2 border-orange-400/40"
                style={{
                  left: 0,
                  top: 0,
                  transform: 'translate(-50%, -50%)'
                }}
                initial={{ width: 0, height: 0, opacity: 0.8 }}
                animate={{ width: 400, height: 400, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
              {/* Middle Ripple */}
              <motion.div
                key={`ripple-middle-${ripple.id}`}
                className="absolute pointer-events-none rounded-full border-2 border-yellow-400/50"
                style={{
                  left: 0,
                  top: 0,
                  transform: 'translate(-50%, -50%)'
                }}
                initial={{ width: 0, height: 0, opacity: 0.9 }}
                animate={{ width: 300, height: 300, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              />
              {/* Inner Ripple */}
              <motion.div
                key={`ripple-inner-${ripple.id}`}
                className="absolute pointer-events-none rounded-full border-2 border-orange-300/60"
                style={{
                  left: 0,
                  top: 0,
                  transform: 'translate(-50%, -50%)'
                }}
                initial={{ width: 0, height: 0, opacity: 1 }}
                animate={{ width: 200, height: 200, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Hover Glow Ring - Enhanced Multi-Ring */}
        {isHovered && animationsEnabled && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-orange-400/50 pointer-events-none"
              animate={{
                scale: [1, 1.2, 1.1, 1.2, 1],
                opacity: [0.5, 0.9, 0.6, 0.9, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border border-yellow-400/40 pointer-events-none"
              animate={{
                scale: [1, 1.25, 1.15, 1.25, 1],
                opacity: [0.3, 0.7, 0.4, 0.7, 0.3]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </>
        )}
      </div>
      
      {/* Streak Counter Badge */}
      {streak > 0 && (
        <motion.div
          className="absolute -top-4 -right-4 px-3 py-1 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold shadow-lg flex items-center gap-1 z-20"
          animate={{
            scale: [1, 1.1, 1],
            boxShadow: [
              "0_0_10px_rgba(239,68,68,0.5)",
              "0_0_20px_rgba(239,68,68,0.8)",
              "0_0_10px_rgba(239,68,68,0.5)"
            ]
          }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <motion.span
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            🔥
          </motion.span>
          {streak}x
        </motion.div>
      )}
    </div>
  );
});
CookieComponent.displayName = 'CookieComponent';

// 🎯 PARTICLE SYSTEM - GEILE EFFEKTE MIT FARBEN! (Performance Optimiert)
const ParticleSystem = memo(() => {
  const particles = useCookieClickerStore(state => state.particles);
  const animationsEnabled = useCookieClickerStore(state => state.animationsEnabled);
  const performanceMode = useCookieClickerStore(state => state.performanceMode);
  const [reducedMotion, setReducedMotion] = useState(false);

  // 🚀 Check für prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 🚀 Performance: Limit Particles - MAX 50 für bessere Performance!
  const displayedParticles = useMemo(() => {
    const maxParticles = performanceMode ? 30 : 50;
    return particles.slice(-maxParticles);
  }, [particles, performanceMode]);

  if (!animationsEnabled || reducedMotion) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {displayedParticles.map(particle => (
        <div
          key={particle.id}
          className={cn(
            "absolute font-bold will-change-transform",
            particle.type === 'critical' && "text-red-500 text-xl font-black",
            particle.type === 'combo' && "text-yellow-500 text-2xl font-black",
            particle.type === 'coin' && "text-yellow-400 text-lg font-bold"
          )}
          style={{
            left: particle.x,
            top: particle.y,
            transform: 'translate(-50%, -50%)',
            fontSize: particle.size || 16,
            color: particle.color || '#ff8c00',
            willChange: 'transform, opacity',
            animation: performanceMode 
              ? 'none' 
              : particle.type === 'critical' 
                ? 'particle-critical 1s ease-out forwards'
                : particle.type === 'combo'
                  ? 'particle-combo 1.2s ease-out forwards'
                  : 'particle-fade 1s ease-out forwards'
          }}
        >
          +{Math.floor(particle.value).toLocaleString()}
        </div>
      ))}
      <style>{`
        @keyframes particle-fade {
          0% {
            transform: translate(-50%, -50%) translateY(0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translateY(-100px);
            opacity: 0;
          }
        }
        @keyframes particle-critical {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translateY(-150px) scale(1);
            opacity: 0;
          }
        }
        @keyframes particle-combo {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translateY(-120px) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes ripple {
          0% {
            transform: scale(1);
            opacity: 0.75;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
});
ParticleSystem.displayName = 'ParticleSystem';

// 🏗️ BUILDING CARD - MAXIMIERT & GEIL MIT PREMIUM ANIMATIONEN! (Optimiert)
const BuildingCard = memo(({ building, owned, cost, canAfford }: {
  building: typeof BUILDINGS[0];
  owned: number;
  cost: number;
  canAfford: boolean;
}) => {
  // 🚀 Performance: Nur benötigte Actions selektieren
  const buyBuilding = useCookieClickerStore(state => state.buyBuilding);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [ripplePosition, setRipplePosition] = useState<{ x: number; y: number } | null>(null);
  const [ownedCount, setOwnedCount] = useState(owned);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Count-Up Animation für owned count
  useEffect(() => {
    if (owned !== ownedCount) {
      const diff = owned - ownedCount;
      const duration = 500;
      const steps = Math.min(20, Math.abs(diff));
      const increment = diff / steps;
      const stepDuration = duration / steps;
      
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        setOwnedCount(prev => {
          const newVal = prev + increment;
          if (currentStep >= steps) return owned;
          return Math.round(newVal);
        });
        if (currentStep >= steps) {
          clearInterval(timer);
          setOwnedCount(owned);
        }
      }, stepDuration);
      
      return () => clearInterval(timer);
    }
  }, [owned, ownedCount]);
  
  const handlePurchase = (e: React.MouseEvent) => {
    if (canAfford && !isClicked) {
      setIsClicked(true);
      
      // Ripple Effect Position
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        setRipplePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
        
        setTimeout(() => setRipplePosition(null), 600);
      }
      
      buyBuilding(building.id);
      
      setTimeout(() => setIsClicked(false), 200);
    }
  };
  
  // Price tier für Farbverlauf
  const getPriceTier = (price: number) => {
    if (price < 1000) return 'low';
    if (price < 100000) return 'medium';
    if (price < 10000000) return 'high';
    return 'epic';
  };
  
  const priceTier = getPriceTier(cost);
  const tierColors = {
    low: 'from-green-500 to-emerald-500',
    medium: 'from-blue-500 to-cyan-500',
    high: 'from-purple-500 to-pink-500',
    epic: 'from-yellow-500 to-orange-500'
  };
  
  // Calculate CPS contribution
  const buildingCps = building.baseCps * (owned + (canAfford ? 1 : 0));
  
  return (
    <motion.div
      ref={cardRef}
      className={cn(
        "relative overflow-hidden rounded-xl border-2 p-4 transition-all duration-300",
        canAfford 
          ? `${tierColors[priceTier]}/40 border-${priceTier === 'low' ? 'emerald' : priceTier === 'medium' ? 'blue' : priceTier === 'high' ? 'purple' : 'yellow'}-500/40 bg-gradient-to-br ${tierColors[priceTier]}/5 hover:${tierColors[priceTier]}/10 cursor-pointer shadow-[0_0_30px_rgba(16,185,129,0.4)]` 
          : "border-white/10 bg-white/5 cursor-not-allowed opacity-60 blur-[0.5px]"
      )}
      whileHover={canAfford ? { scale: 1.03, y: -4 } : {}}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handlePurchase}
      animate={canAfford && !isHovered ? {
        boxShadow: [
          "0_0_20px_rgba(16,185,129,0.3)",
          "0_0_30px_rgba(16,185,129,0.5)",
          "0_0_20px_rgba(16,185,129,0.3)"
        ]
      } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {/* Pulse Glow bei Kaufmöglichkeit */}
      {canAfford && (
        <motion.div
          className={cn("absolute inset-0 rounded-xl", `bg-gradient-to-br ${tierColors[priceTier]}/20`)}
          animate={{
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      
      {/* Ripple Effect on Click */}
      {ripplePosition && (
        <motion.div
          className="absolute rounded-full bg-white/40 pointer-events-none"
          style={{
            left: ripplePosition.x,
            top: ripplePosition.y,
            transform: 'translate(-50%, -50%)'
          }}
          initial={{ width: 0, height: 0, opacity: 0.8 }}
          animate={{ width: 400, height: 400, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      )}

      {/* Animated Background on Hover */}
      {canAfford && isHovered && (
        <motion.div
          className={cn("absolute inset-0 bg-gradient-to-br", tierColors[priceTier] + "/20")}
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <motion.div
              className="text-3xl"
              animate={canAfford && isHovered ? {
                rotate: [0, -10, 10, -5, 5, 0],
                scale: [1, 1.2, 1.1, 1.15, 1]
              } : canAfford ? {
                rotate: [0, 2, -2, 0],
                scale: [1, 1.05, 1]
              } : {}}
              transition={{ duration: canAfford && isHovered ? 0.8 : 3, repeat: canAfford ? Infinity : 0 }}
            >
              {building.icon}
            </motion.div>
            <div>
              <h3 className="font-bold text-text text-lg">{building.name}</h3>
              <p className="text-xs text-muted">{building.description}</p>
            </div>
          </div>
          <motion.div 
            className="text-right"
            animate={owned !== ownedCount ? {
              scale: [1, 1.2, 1]
            } : {}}
            transition={{ duration: 0.3 }}
          >
            <div className="text-xl font-bold text-accent">{ownedCount}</div>
            <div className="text-xs text-muted">besessen</div>
          </motion.div>
        </div>
        
        {/* CPS Preview */}
        {isHovered && canAfford && (
          <motion.div
            className={cn("mb-2 p-2 rounded-lg border", `bg-gradient-to-r ${tierColors[priceTier]}/10 border-${priceTier === 'low' ? 'emerald' : priceTier === 'medium' ? 'blue' : priceTier === 'high' ? 'purple' : 'yellow'}-500/30`)}
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="text-xs text-white/70 mb-1">Wenn gekauft:</div>
            <div className="text-sm font-bold text-emerald-400">
              +{formatNumber(building.baseCps)} Cookies/Sek
            </div>
          </motion.div>
        )}
        
        {/* Cost & Buy Button */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div>
            <motion.div 
              className="text-lg font-bold text-accent"
              animate={canAfford ? {
                scale: [1, 1.05, 1]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {formatNumber(cost)}
            </motion.div>
            <div className="text-xs text-white/50">Cookies</div>
          </div>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              handlePurchase(e);
            }}
            disabled={!canAfford}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 relative overflow-hidden",
              canAfford
                ? `bg-gradient-to-r ${tierColors[priceTier]} text-white shadow-lg shadow-${priceTier === 'low' ? 'emerald' : priceTier === 'medium' ? 'blue' : priceTier === 'high' ? 'purple' : 'yellow'}-500/50`
                : "bg-white/10 text-white/40 cursor-not-allowed"
            )}
            whileHover={canAfford ? { scale: 1.08, boxShadow: "0_0_20px_rgba(16,185,129,0.6)" } : {}}
            whileTap={canAfford ? { scale: 0.92 } : {}}
          >
            {canAfford && (
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            )}
            <span className="relative z-10">Kaufen</span>
            {canAfford && (
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="relative z-10"
              >
                <ArrowRight className="w-4 h-4" />
              </motion.span>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // 🚀 Performance: Custom comparison - nur re-render wenn sich relevante Props ändern
  return (
    prevProps.building.id === nextProps.building.id &&
    prevProps.owned === nextProps.owned &&
    prevProps.cost === nextProps.cost &&
    prevProps.canAfford === nextProps.canAfford
  );
});
BuildingCard.displayName = 'BuildingCard';

// ⚡ UPGRADE CARD - MAXIMIERT & GEIL MIT PREMIUM ANIMATIONEN! (Optimiert)
const UpgradeCard = memo(({ upgrade, owned, canAfford }: {
  upgrade: typeof UPGRADES[0];
  owned: boolean;
  canAfford: boolean;
}) => {
  // 🚀 Performance: Nur benötigte Actions selektieren
  const buyUpgrade = useCookieClickerStore(state => state.buyUpgrade);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [ripplePosition, setRipplePosition] = useState<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  if (owned) return null;
  
  const handlePurchase = (e: React.MouseEvent) => {
    if (canAfford && !isClicked) {
      setIsClicked(true);
      
      // Ripple Effect Position
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        setRipplePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
        
        setTimeout(() => setRipplePosition(null), 600);
      }
      
      buyUpgrade(upgrade.id);
      
      setTimeout(() => setIsClicked(false), 200);
    }
  };
  
  return (
    <motion.div
      ref={cardRef}
      className={cn(
        "relative overflow-hidden rounded-xl border-2 p-4 transition-all duration-300",
        canAfford 
          ? "border-blue-500/40 bg-gradient-to-br from-blue-500/5 to-purple-500/5 hover:from-blue-500/10 hover:to-purple-500/10 cursor-pointer shadow-[0_0_25px_rgba(59,130,246,0.4)]" 
          : "border-white/10 bg-white/5 cursor-not-allowed opacity-60 blur-[0.5px]"
      )}
      whileHover={canAfford ? { scale: 1.05, y: -3 } : {}}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handlePurchase}
      animate={canAfford && !isHovered ? {
        boxShadow: [
          "0_0_20px_rgba(59,130,246,0.3)",
          "0_0_30px_rgba(59,130,246,0.5)",
          "0_0_20px_rgba(59,130,246,0.3)"
        ]
      } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {/* Pulse Glow bei Kaufmöglichkeit */}
      {canAfford && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20"
          animate={{
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      
      {/* Ripple Effect on Click */}
      {ripplePosition && (
        <motion.div
          className="absolute rounded-full bg-white/40 pointer-events-none"
          style={{
            left: ripplePosition.x,
            top: ripplePosition.y,
            transform: 'translate(-50%, -50%)'
          }}
          initial={{ width: 0, height: 0, opacity: 0.8 }}
          animate={{ width: 400, height: 400, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      )}

      {/* Animated Background on Hover */}
      {canAfford && isHovered && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <motion.span
            className="text-3xl"
            animate={canAfford && isHovered ? {
              rotate: [0, -10, 10, -5, 5, 0],
              scale: [1, 1.3, 1.15, 1.2, 1]
            } : canAfford ? {
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 1]
            } : {}}
            transition={{ duration: canAfford && isHovered ? 0.8 : 3, repeat: canAfford ? Infinity : 0 }}
          >
            {upgrade.icon}
          </motion.span>
          <div className="flex-1">
            <h3 className="font-bold text-text text-lg">{upgrade.name}</h3>
            <p className="text-xs text-muted">{upgrade.description}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <motion.div
            className="text-lg font-bold text-accent"
            animate={canAfford ? {
              scale: [1, 1.05, 1]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {upgrade.cost.toLocaleString()}
          </motion.div>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              handlePurchase(e);
            }}
            disabled={!canAfford}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold transition-all relative overflow-hidden flex items-center gap-2",
              canAfford 
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/50" 
                : "bg-white/10 text-white/40 cursor-not-allowed"
            )}
            whileHover={canAfford ? { scale: 1.08, boxShadow: "0_0_20px_rgba(59,130,246,0.6)" } : {}}
            whileTap={canAfford ? { scale: 0.92 } : {}}
          >
            {canAfford && (
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            )}
            <span className="relative z-10">Kaufen</span>
            {canAfford && (
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="relative z-10"
              >
                <ArrowRight className="w-4 h-4" />
              </motion.span>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // 🚀 Performance: Custom comparison - nur re-render wenn sich relevante Props ändern
  return (
    prevProps.upgrade.id === nextProps.upgrade.id &&
    prevProps.owned === nextProps.owned &&
    prevProps.canAfford === nextProps.canAfford
  );
});
UpgradeCard.displayName = 'UpgradeCard';

// 🎮 GEILE COOKIE CLICKER PAGE - DEUTSCH & SÜCHTIG!
export const CookieClickerPage = () => {
  // 🚀 Performance: Selektive Subscriptions statt gesamter Store
  const cookies = useCookieClickerStore(state => state.cookies);
  const totalCookies = useCookieClickerStore(state => state.totalCookies);
  const cookiesPerClick = useCookieClickerStore(state => state.cookiesPerClick);
  const cookiesPerSecond = useCookieClickerStore(state => state.cookiesPerSecond);
  const level = useCookieClickerStore(state => state.level);
  const xp = useCookieClickerStore(state => state.xp);
  const xpToNextLevel = useCookieClickerStore(state => state.xpToNextLevel);
  const streak = useCookieClickerStore(state => state.streak);
  const maxStreak = useCookieClickerStore(state => state.maxStreak);
  const clicks = useCookieClickerStore(state => state.clicks);
  const timePlayed = useCookieClickerStore(state => state.timePlayed);
  const prestigeLevel = useCookieClickerStore(state => state.prestigeLevel);
  const prestigePoints = useCookieClickerStore(state => state.prestigePoints);
  const buildings = useCookieClickerStore(state => state.buildings);
  const upgrades = useCookieClickerStore(state => state.upgrades);
  const coins = useCookieClickerStore(state => state.coins);
  const coinMultiplier = useCookieClickerStore(state => state.coinMultiplier);
  const soundEnabled = useCookieClickerStore(state => state.soundEnabled);
  const animationsEnabled = useCookieClickerStore(state => state.animationsEnabled);
  const isActiveSession = useCookieClickerStore(state => state.isActiveSession);
  const hasVipPassiveIncome = useCookieClickerStore(state => state.hasVipPassiveIncome);
  const offlineCpsMultiplier = useCookieClickerStore(state => state.offlineCpsMultiplier);
  const totalActiveTime = useCookieClickerStore(state => state.totalActiveTime);
  const vipTier = useCookieClickerStore(state => state.vipTier);
  
  // Actions
  const clickCookie = useCookieClickerStore(state => state.clickCookie);
  const buyBuilding = useCookieClickerStore(state => state.buyBuilding);
  const buyUpgrade = useCookieClickerStore(state => state.buyUpgrade);
  
  // 🧪 TEST BUTTON - Nur im Development Mode
  const addTestCookies = useCallback(() => {
    useCookieClickerStore.setState((state) => {
      const testCookies = 50_000_000; // 50 Millionen Cookies
      state.cookies += testCookies;
      state.totalCookies += testCookies;
    });
  }, []);
  const tick = useCookieClickerStore(state => state.tick);
  const toggleSound = useCookieClickerStore(state => state.toggleSound);
  const toggleAnimations = useCookieClickerStore(state => state.toggleAnimations);

  const [activeTab, setActiveTab] = useState<'buildings' | 'upgrades' | 'stats' | 'achievements' | 'discounts' | 'contest' | 'analytics' | 'leaderboard'>('buildings');
  const [tabDirection, setTabDirection] = useState<'forward' | 'back'>('forward');
  const [splitView, setSplitView] = useState(false);
  const tabOrder: Array<'buildings' | 'upgrades' | 'stats' | 'achievements' | 'discounts' | 'contest' | 'analytics' | 'leaderboard'> = ['buildings', 'upgrades', 'achievements', 'discounts', 'stats', 'contest', 'analytics', 'leaderboard'];
  
  const handleTabChange = useCallback((newTab: typeof activeTab) => {
    const currentIndex = tabOrder.indexOf(activeTab);
    const newIndex = tabOrder.indexOf(newTab);
    setTabDirection(newIndex > currentIndex ? 'forward' : 'back');
    setActiveTab(newTab);
  }, [activeTab, tabOrder]);
  const [showVipOfflineModal, setShowVipOfflineModal] = useState(false);
  const [offlineProgress, setOfflineProgress] = useState<{cookies: number, seconds: number} | null>(null);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [hasCheckedNickname, setHasCheckedNickname] = useState(false);
  const { executeCommand } = useBotCommandHandler();
  
  // Leaderboard sync
  const syncStatsToServer = useCookieClickerStore(state => state.syncStatsToServer);
  
  // 🎮 SESSION ACTIVITY TRACKING
  useSessionActivity();
  
  // 💾 AUTO-SAVE BEIM VERLASSEN
  useBeforeUnload();

  // 🚀 TOUCH GESTURES für Tab Navigation
  const handleSwipeLeft = useCallback(() => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex < tabOrder.length - 1) {
      handleTabChange(tabOrder[currentIndex + 1]);
    }
  }, [activeTab, tabOrder, handleTabChange]);

  const handleSwipeRight = useCallback(() => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex > 0) {
      handleTabChange(tabOrder[currentIndex - 1]);
    }
  }, [activeTab, tabOrder, handleTabChange]);

  const touchGesturesResult = useTouchGestures({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight
  });
  
  const touchHandlers = touchGesturesResult?.handlers || {};

  // 🏅 CHECK NICKNAME ON MOUNT
  useEffect(() => {
    const checkNickname = async () => {
      if (hasCheckedNickname) return;
      
      try {
        const result = await checkNicknameSet();
        if (!result.hasNickname) {
          setShowNicknameModal(true);
        }
        setHasCheckedNickname(true);
      } catch (error) {
        // Silently fail - don't interrupt gameplay
        if (import.meta.env.DEV) {
          console.error('Failed to check nickname:', error);
        }
        setHasCheckedNickname(true);
      }
    };
    
    checkNickname();
  }, [hasCheckedNickname]);

  // 🍪 AUTO-SYNC STATS TO SERVER (every 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      syncStatsToServer();
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [syncStatsToServer]);

  // Sync on significant changes
  useEffect(() => {
    // Sync when totalCookies changes significantly (every 1000 cookies)
    if (totalCookies > 0 && totalCookies % 1000 === 0) {
      syncStatsToServer();
    }
  }, [totalCookies, syncStatsToServer]);
  
  // 🎮 GAMING-DISCOUNT NOTIFICATIONS - GEIL!
  useGamingDiscountNotifications();
  
  // 🌟 VIP CHECK & SESSION RESUME beim Load
  useEffect(() => {
    // Get actions directly from store
    const checkVipStatus = useCookieClickerStore.getState().checkVipStatus;
    const resumeSession = useCookieClickerStore.getState().resumeSession;
    const calculateOfflineProgress = useCookieClickerStore.getState().calculateOfflineProgress;
    
    // Get current state values
    const currentState = useCookieClickerStore.getState();
    
    // Check VIP Status
    checkVipStatus();
    
    // Berechne VIP Offline Progress BEVOR Resume
    if (currentState.hasVipPassiveIncome && currentState.lastPauseTime) {
      const offlineSeconds = (Date.now() - currentState.lastPauseTime) / 1000;
      const offlineCookies = calculateOfflineProgress(offlineSeconds);
      
      if (offlineCookies > 0) {
        setOfflineProgress({ cookies: offlineCookies, seconds: offlineSeconds });
        setShowVipOfflineModal(true);
      }
    }
    
    // Resume Session (falls pausiert)
    resumeSession();
    
    // 🎯 CPS beim Laden neu berechnen (falls Upgrades vorhanden)
    // CPS wird automatisch bei next buyBuilding/buyUpgrade berechnet
    if (Object.keys(currentState.buildings).length > 0 || Object.keys(currentState.upgrades).length > 0) {
      // CPS wird beim nächsten Kauf automatisch neu berechnet
    }
  }, []); // Nur einmal beim Mount
  
  // 🎯 GAME LOOP - RAF BASIERT für flüssigere Animationen! (Optimiert)
  useEffect(() => {
    let rafId: number;
    let lastTime = performance.now();
    let tickAccumulator = 0;
    const TICK_INTERVAL = 1000; // 1 Sekunde
    
    const gameLoop = (currentTime: number) => {
      const delta = currentTime - lastTime;
      lastTime = currentTime;
      tickAccumulator += delta;
      
      // 🚀 Performance: Tick nur wenn genug Zeit vergangen ist
      // Aber nutze RAF für flüssige Animationen zwischen Ticks
      if (tickAccumulator >= TICK_INTERVAL) {
        const ticksToProcess = Math.floor(tickAccumulator / TICK_INTERVAL);
        tickAccumulator = tickAccumulator % TICK_INTERVAL;
        
        // Batch Ticks für bessere Performance
        for (let i = 0; i < ticksToProcess; i++) {
          tick();
        }
      }
      
      rafId = requestAnimationFrame(gameLoop);
    };
    
    rafId = requestAnimationFrame(gameLoop);
    
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [tick]);

  // 🎯 AUTO-SAVE - ALLE 30 SEKUNDEN!
  useEffect(() => {
    const saveInterval = setInterval(() => {
      // Auto-save is handled by Zustand persist
    }, 30000);
    
    return () => clearInterval(saveInterval);
  }, []);

  // Check for bot commands in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const command = urlParams.get('command');
    if (command) {
      const result = executeCommand(command);
      if (result.success) {
        console.log('Bot command executed:', result.message);
      }
    }
  }, [executeCommand]);

  // 🎯 BUILDING COSTS BERECHNEN - MEMOIZED für Performance!
  const buildingData = useMemo(() => BUILDINGS.map(building => {
    const owned = buildings[building.id] || 0;
    const cost = Math.floor(building.baseCost * Math.pow(1.2, owned)); // 1.2 = schwieriger!
    const canAfford = cookies >= cost;
    
    return { building, owned, cost, canAfford };
  }), [buildings, cookies]);

  // 🎯 UPGRADE AVAILABILITY - MEMOIZED für Performance!
  const upgradeData = useMemo(() => UPGRADES.map(upgrade => {
    const owned = upgrades[upgrade.id] || false;
    const canAfford = cookies >= upgrade.cost && !owned;
    
    return { upgrade, owned, canAfford };
  }), [upgrades, cookies]);

  const availableUpgrades = useMemo(() => upgradeData.filter(u => !u.owned && u.canAfford), [upgradeData]);
  
  // 🎯 Memoized Formatierte Werte - Debounced für bessere Performance bei häufigen Updates
  const formattedCookies = useMemo(() => formatNumber(cookies), [cookies]);
  const formattedTotalCookies = useMemo(() => formatNumber(totalCookies), [totalCookies]);
  const formattedCoins = useMemo(() => formatNumber(coins), [coins]);
  const formattedTimePlayed = useMemo(() => formatTime(timePlayed), [timePlayed]);
  const formattedTotalActiveTime = useMemo(() => formatTime(totalActiveTime), [totalActiveTime]);
  const xpProgress = useMemo(() => Math.min(100, (xp / xpToNextLevel) * 100), [xp, xpToNextLevel]);
  
  // 🚀 Debounced Cookie Display für flüssigere Updates
  const [displayCookies, setDisplayCookies] = useState(cookies);
  useEffect(() => {
    const updateDisplay = debounce(() => {
      setDisplayCookies(cookies);
    }, 100); // Update alle 100ms statt bei jedem State-Change
    updateDisplay();
  }, [cookies]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0A0A0A] to-[#050505] text-text relative" id="main-content">
      {/* 🌟 VIP OFFLINE PROGRESS MODAL */}
      {showVipOfflineModal && offlineProgress && (
        <VipOfflineProgressModal
          isOpen={showVipOfflineModal}
          offlineCookies={offlineProgress.cookies}
          offlineSeconds={offlineProgress.seconds}
          vipMultiplier={offlineCpsMultiplier}
          vipTier={vipTier || 'Nova'}
          onClose={() => {
            setShowVipOfflineModal(false);
            setOfflineProgress(null);
          }}
        />
      )}

      {/* Header */}
      <Header
        coins={coins}
        eyebrow="Nebula Kekse"
        title="Cookie Clicker"
        description="Klicke den Keks um Kekse zu verdienen! Kaufe Gebäude und Upgrades um deine Keks-Produktion zu automatisieren."
        coinLabel={hasVipPassiveIncome ? `🌟 VIP ${(offlineCpsMultiplier * 100).toFixed(0)}% Offline` : undefined}
        highlights={[
          {
            title: `Level ${level}`,
            description: `XP: ${xp}/${xpToNextLevel}`,
            tone: "accent" as const
          },
          {
            title: "Combo",
            description: streak > 0 ? `${streak}x Combo!` : "Kein Combo"
          },
          {
            title: "Coins",
            description: `${formattedCoins} Coins (${coinMultiplier}x)`
          }
        ]}
      />

      {/* 🧪 TEST BUTTON - Nur im Development Mode */}
      {process.env.NODE_ENV === 'development' && (
        <motion.div
          className="fixed bottom-4 right-4 z-50"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <motion.button
            onClick={addTestCookies}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg hover:shadow-xl transition-all border-2 border-purple-300/50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <TestTube className="w-5 h-5" />
            <span>+50M Cookies (Test)</span>
          </motion.button>
        </motion.div>
      )}

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Game Stats Bar - Enhanced with Glassmorphism */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          <Tooltip content="Cookies die du pro Klick erhältst">
            <motion.div 
              className="glass rounded-xl border border-orange-500/20 p-4 hover:border-orange-500/40 transition-all"
              whileHover={{ scale: 1.05, y: -2 }}
            >
              <div className="flex items-center gap-2 text-orange-400">
                <Cookie className="h-5 w-5" />
                <span className="text-sm font-medium">Pro Klick</span>
              </div>
              <div className="text-2xl font-bold text-text">{cookiesPerClick}</div>
            </motion.div>
          </Tooltip>
          
          <Tooltip content="Cookies die automatisch pro Sekunde generiert werden">
            <motion.div 
              className="glass rounded-xl border border-green-500/20 p-4 hover:border-green-500/40 transition-all"
              whileHover={{ scale: 1.05, y: -2 }}
            >
              <div className="flex items-center gap-2 text-green-400">
                <Target className="h-5 w-5" />
                <span className="text-sm font-medium">Pro Sekunde</span>
              </div>
              <div className="text-2xl font-bold text-text">{cookiesPerSecond.toFixed(1)}</div>
            </motion.div>
          </Tooltip>
          
          <Tooltip content={`Dein aktuelles Level. Erhöhe XP um aufzusteigen!`}>
            <motion.div 
              className="glass rounded-xl border border-purple-500/20 p-4 hover:border-purple-500/40 transition-all"
              whileHover={{ scale: 1.05, y: -2 }}
            >
              <div className="flex items-center gap-2 text-purple-400">
                <Trophy className="h-5 w-5" />
                <span className="text-sm font-medium">Level</span>
              </div>
              <div className="text-2xl font-bold text-text">{level}</div>
            </motion.div>
          </Tooltip>
          
          <Tooltip content="Aktueller Combo-Streak. Klicke schnell für mehr Boni!">
            <motion.div 
              className="glass rounded-xl border border-orange-500/20 p-4 hover:border-orange-500/40 transition-all"
              whileHover={{ scale: 1.05, y: -2 }}
            >
              <div className="flex items-center gap-2 text-orange-400">
                <Flame className="h-5 w-5" />
                <span className="text-sm font-medium">Combo</span>
              </div>
              <div className="text-2xl font-bold text-text">{streak}</div>
            </motion.div>
          </Tooltip>

          <Tooltip content="Coins die du für Rabatte im Shop verwenden kannst">
            <motion.div 
              className="glass-glow rounded-xl border border-yellow-500/30 p-4 hover:border-yellow-500/50 transition-all"
              whileHover={{ scale: 1.05, y: -2 }}
            >
              <div className="flex items-center gap-2 text-yellow-400">
                <Coins className="h-5 w-5" />
                <span className="text-sm font-medium">Coins</span>
              </div>
              <div className="text-2xl font-bold text-text">{formattedCoins}</div>
            </motion.div>
          </Tooltip>
        </div>

        {/* Activity & VIP Indicators */}
        <div className="mb-4 flex items-center justify-between">
          {/* Activity Status */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium",
            isActiveSession 
              ? "bg-green-500/10 border-green-500/30 text-green-500"
              : "bg-orange-500/10 border-orange-500/30 text-orange-500"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full",
              isActiveSession ? "bg-green-500 animate-pulse" : "bg-orange-500"
            )} />
            {isActiveSession ? "Aktiv" : "Pausiert"}
          </div>

          {/* VIP Passive Income Badge */}
          {hasVipPassiveIncome && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <span className="text-lg">🌟</span>
              <span className="text-sm font-semibold text-purple-300">
                VIP {(offlineCpsMultiplier * 100).toFixed(0)}% Offline
              </span>
            </div>
          )}
        </div>

        {/* VIP Upgrade Banner (nur für Non-VIP) */}
        {!hasVipPassiveIncome && cookiesPerSecond > 1 && (
          <div className="mb-4">
            <VipUpgradeBanner />
          </div>
        )}

        {/* Main Game Area */}
        <div className="mb-8 grid gap-8 lg:grid-cols-3">
          {/* Cookie Section */}
          <div className="lg:col-span-2">
            <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] p-8">
              {/* Cookie */}
              <div className="relative">
                <CookieComponent onClick={clickCookie} />
                {/* 🚀 Optimiertes Particle System mit Canvas-Rendering */}
                <OptimizedParticleSystem />
              </div>
              
              {/* Cookie Stats */}
              <div className="mt-8 text-center">
                <div className="text-4xl font-bold text-text">
                  <SmoothNumberAnimation 
                    value={displayCookies} 
                    duration={300}
                    format={(val) => `${Math.floor(val).toLocaleString()} Kekse`}
                  />
                </div>
                <div className="text-sm text-muted">
                  Gesamt: <SmoothNumberAnimation 
                    value={totalCookies} 
                    duration={500}
                    format={(val) => formatNumber(Math.floor(val))}
                  />
                </div>
                
                {/* XP Progress - Enhanced */}
                <div className="mt-4">
                  <EnhancedProgressBar
                    progress={xpProgress}
                    label={`XP: ${xp}/${xpToNextLevel}`}
                    color="primary"
                    animated={true}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Game Controls */}
          <div className="space-y-6">
            {/* Game Stats */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-4 font-semibold text-text">Statistiken</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Klicks:</span>
                  <span className="text-text">{clicks.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Spielzeit:</span>
                    <span className="text-text">{formattedTimePlayed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Max Combo:</span>
                  <span className="text-text">{maxStreak}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Coins:</span>
                    <span className="text-yellow-400">{formattedCoins}</span>
                </div>
                {prestigeLevel > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted">Prestige Level:</span>
                    <span className="text-accent">{prestigeLevel}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Settings - MAXIMIERT & GEIL MIT TOGGLE SWITCHES! */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-4 font-semibold text-text">Einstellungen</h3>
              <div className="space-y-4">
                {/* Sound Toggle Switch */}
                <motion.button
                  onClick={toggleSound}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-4 py-3 transition-all relative overflow-hidden",
                    soundEnabled 
                      ? "bg-green-500/20 text-green-400" 
                      : "bg-white/10 text-muted hover:bg-white/20"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {soundEnabled && (
                    <motion.div
                      className="absolute inset-0 bg-green-500/10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  <div className="flex items-center gap-3 relative z-10">
                    {soundEnabled ? (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Volume2 className="h-5 w-5" />
                      </motion.div>
                    ) : (
                      <VolumeX className="h-5 w-5" />
                    )}
                    <span className="font-medium">Sound</span>
                  </div>
                  {/* Toggle Switch */}
                  <div className={cn(
                    "relative w-14 h-7 rounded-full transition-all duration-300",
                    soundEnabled ? "bg-green-500" : "bg-white/20"
                  )}>
                    <motion.div
                      className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
                      animate={{
                        x: soundEnabled ? 28 : 4
                      }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </div>
                </motion.button>
                
                {/* Animations Toggle Switch */}
                <motion.button
                  onClick={toggleAnimations}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-4 py-3 transition-all relative overflow-hidden",
                    animationsEnabled 
                      ? "bg-blue-500/20 text-blue-400" 
                      : "bg-white/10 text-muted hover:bg-white/20"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {animationsEnabled && (
                    <motion.div
                      className="absolute inset-0 bg-blue-500/10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  <div className="flex items-center gap-3 relative z-10">
                    {animationsEnabled ? (
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      >
                        <Star className="h-5 w-5 fill-blue-400 text-blue-400" />
                      </motion.div>
                    ) : (
                      <Star className="h-5 w-5" />
                    )}
                    <span className="font-medium">Animationen</span>
                  </div>
                  {/* Toggle Switch */}
                  <div className={cn(
                    "relative w-14 h-7 rounded-full transition-all duration-300",
                    animationsEnabled ? "bg-blue-500" : "bg-white/20"
                  )}>
                    <motion.div
                      className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
                      animate={{
                        x: animationsEnabled ? 28 : 4
                      }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </div>
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Buildings & Upgrades */}
        <div className="space-y-6">
          {/* Verification Banner */}
          <VerificationBanner />
          
          {/* Tab Navigation - MAXIMIERT & GEIL! (Mit Touch Gestures) */}
          <div 
            className="flex gap-2 flex-wrap touch-pan-x"
            {...touchHandlers}
          >
            <motion.button
              onClick={() => handleTabChange('buildings')}
              className={cn(
                "relative rounded-lg px-5 py-2.5 text-sm font-bold transition-all overflow-hidden",
                activeTab === 'buildings' 
                  ? "bg-accent text-black shadow-lg shadow-accent/50" 
                  : "bg-white/10 text-muted hover:bg-white/20"
              )}
              whileHover={activeTab !== 'buildings' ? { scale: 1.05, y: -2 } : {}}
              whileTap={{ scale: 0.95 }}
            >
              {activeTab === 'buildings' && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              )}
              <motion.span
                className="relative z-10 flex items-center gap-2"
                animate={activeTab === 'buildings' ? {
                  scale: [1, 1.05, 1]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Gebäude
                {activeTab === 'buildings' && (
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    🏗️
                  </motion.span>
                )}
              </motion.span>
            </motion.button>
            <motion.button
              onClick={() => handleTabChange('upgrades')}
              className={cn(
                "relative rounded-lg px-5 py-2.5 text-sm font-bold transition-all overflow-hidden",
                activeTab === 'upgrades' 
                  ? "bg-accent text-black shadow-lg shadow-accent/50" 
                  : "bg-white/10 text-muted hover:bg-white/20"
              )}
              whileHover={activeTab !== 'upgrades' ? { scale: 1.05, y: -2 } : {}}
              whileTap={{ scale: 0.95 }}
            >
              {activeTab === 'upgrades' && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              )}
              <motion.span
                className="relative z-10 flex items-center gap-2"
                animate={activeTab === 'upgrades' ? {
                  scale: [1, 1.05, 1]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Upgrades
                {availableUpgrades.length > 0 && (
                  <motion.span
                    className="ml-1 px-2 py-0.5 rounded-full bg-yellow-500 text-black text-xs font-bold"
                    animate={availableUpgrades.length > 0 ? {
                      scale: [1, 1.2, 1],
                      boxShadow: ["0_0_0px_rgba(234,179,8,0)", "0_0_10px_rgba(234,179,8,0.8)", "0_0_0px_rgba(234,179,8,0)"]
                    } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {availableUpgrades.length}
                  </motion.span>
                )}
              </motion.span>
            </motion.button>
            <motion.button
              onClick={() => handleTabChange('achievements')}
              className={cn(
                "relative rounded-lg px-5 py-2.5 text-sm font-bold transition-all overflow-hidden",
                activeTab === 'achievements' 
                  ? "bg-accent text-black shadow-lg shadow-accent/50" 
                  : "bg-white/10 text-muted hover:bg-white/20"
              )}
              whileHover={activeTab !== 'achievements' ? { scale: 1.05, y: -2 } : {}}
              whileTap={{ scale: 0.95 }}
            >
              {activeTab === 'achievements' && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <motion.span
                  animate={activeTab === 'achievements' ? {
                    rotate: [0, 15, -15, 0],
                    scale: [1, 1.1, 1]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🏆
                </motion.span>
                Erfolge
              </span>
            </motion.button>
            <motion.button
              onClick={() => handleTabChange('discounts')}
              className={cn(
                "relative rounded-lg px-5 py-2.5 text-sm font-bold transition-all overflow-hidden",
                activeTab === 'discounts' 
                  ? "bg-gradient-to-r from-orange-500 to-yellow-500 text-black shadow-lg shadow-orange-500/50" 
                  : "bg-white/10 text-muted hover:bg-white/20"
              )}
              whileHover={activeTab !== 'discounts' ? { scale: 1.05, y: -2 } : {}}
              whileTap={{ scale: 0.95 }}
            >
              {activeTab === 'discounts' && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <motion.span
                  animate={activeTab === 'discounts' ? {
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  } : {}}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  🎮
                </motion.span>
                Gaming-Rabatte
              </span>
            </motion.button>
            <motion.button
              onClick={() => handleTabChange('stats')}
              className={cn(
                "relative rounded-lg px-5 py-2.5 text-sm font-bold transition-all overflow-hidden",
                activeTab === 'stats' 
                  ? "bg-accent text-black shadow-lg shadow-accent/50" 
                  : "bg-white/10 text-muted hover:bg-white/20"
              )}
              whileHover={activeTab !== 'stats' ? { scale: 1.05, y: -2 } : {}}
              whileTap={{ scale: 0.95 }}
            >
              {activeTab === 'stats' && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              )}
              <span className="relative z-10">Stats</span>
            </motion.button>
            
            {/* Split View Toggle - Only show when achievements or stats are active */}
            {(activeTab === 'achievements' || activeTab === 'stats') && (
              <motion.button
                onClick={() => setSplitView(!splitView)}
                className={cn(
                  "relative rounded-lg px-4 py-2.5 text-sm font-bold transition-all",
                  splitView
                    ? "bg-purple-500/40 text-white border border-purple-500/50"
                    : "bg-white/10 text-muted hover:bg-white/20"
                )}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                title={splitView ? "Einzelansicht" : "Split-Ansicht"}
              >
                {splitView ? <LayoutGrid className="w-4 h-4" /> : <Columns className="w-4 h-4" />}
              </motion.button>
            )}
            <motion.button
              onClick={() => handleTabChange('contest')}
              className={cn(
                "relative rounded-lg px-5 py-2.5 text-sm font-bold transition-all overflow-hidden",
                activeTab === 'contest' 
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-lg shadow-yellow-500/50" 
                  : "bg-white/10 text-muted hover:bg-white/20"
              )}
              whileHover={activeTab !== 'contest' ? { scale: 1.05, y: -2 } : {}}
              whileTap={{ scale: 0.95 }}
            >
              {activeTab === 'contest' && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <motion.span
                  animate={activeTab === 'contest' ? {
                    y: [0, -5, 0],
                    rotate: [0, 10, -10, 0]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🏆
                </motion.span>
                Gewinnspiel
              </span>
            </motion.button>
            <motion.button
              onClick={() => handleTabChange('leaderboard')}
              className={cn(
                "relative rounded-lg px-5 py-2.5 text-sm font-bold transition-all overflow-hidden",
                activeTab === 'leaderboard' 
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/50" 
                  : "bg-white/10 text-muted hover:bg-white/20"
              )}
              whileHover={activeTab !== 'leaderboard' ? { scale: 1.05, y: -2 } : {}}
              whileTap={{ scale: 0.95 }}
            >
              {activeTab === 'leaderboard' && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Leaderboard
              </span>
            </motion.button>
          </div>

          {/* Tab Content with Smooth Transitions - Natural Page Scroll */}
          <div className="relative min-h-[600px]">
            <AnimatePresence mode="wait" initial={false}>
              {/* Split View: Achievements & Stats Side-by-Side */}
              {splitView && (activeTab === 'achievements' || activeTab === 'stats') && (
                <motion.div
                  key="split-view"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-4"
                >
                  {/* Achievements Panel */}
                  <div className="p-2">
                    <Suspense fallback={
                      <div className="rounded-xl border border-white/10 bg-white/5 p-8">
                        <div className="animate-pulse space-y-4">
                          <div className="h-6 bg-white/10 rounded w-1/3"></div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[...Array(4)].map((_, i) => (
                              <div key={i} className="h-32 bg-white/5 rounded-lg"></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    }>
                      <AchievementSystem />
                    </Suspense>
                  </div>
                  
                  {/* Stats Panel */}
                  <div className="p-2">
                    <Suspense fallback={
                      <div className="rounded-xl border border-white/10 bg-white/5 p-8">
                        <div className="animate-pulse space-y-4">
                          <div className="h-8 bg-white/10 rounded w-1/3"></div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => (
                              <div key={i} className="h-24 bg-white/5 rounded-lg"></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    }>
                      <EnhancedStats />
                    </Suspense>
                  </div>
                </motion.div>
              )}

              {/* Normal Single View */}
              {!splitView && activeTab === 'buildings' && (
                <motion.div
                  key="buildings"
                  initial={{ opacity: 0, x: tabDirection === 'forward' ? 50 : -50, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: tabDirection === 'forward' ? -50 : 50, scale: 0.95 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 30,
                    mass: 0.8
                  }}
                  className="p-2"
                  style={{ willChange: 'transform, opacity' }}
                >
                  <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {buildingData.map(({ building, owned, cost, canAfford }) => (
                      <BuildingCard
                        key={building.id}
                        building={building}
                        owned={owned}
                        cost={cost}
                        canAfford={canAfford}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'upgrades' && (
                <motion.div
                  key="upgrades"
                  initial={{ opacity: 0, x: tabDirection === 'forward' ? 50 : -50, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: tabDirection === 'forward' ? -50 : 50, scale: 0.95 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 30,
                    mass: 0.8
                  }}
                  className="p-2"
                  style={{ willChange: 'transform, opacity' }}
                >
                  <Suspense fallback={
                    <div className="rounded-xl border border-white/10 bg-white/5 p-8">
                      <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-white/10 rounded w-1/3"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-48 bg-white/5 rounded-lg"></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  }>
                    <EnhancedUpgrades />
                  </Suspense>
                </motion.div>
              )}

              {!splitView && activeTab === 'achievements' && (
                <motion.div
                  key="achievements"
                  initial={{ opacity: 0, x: tabDirection === 'forward' ? 50 : -50, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: tabDirection === 'forward' ? -50 : 50, scale: 0.95 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 30,
                    mass: 0.8
                  }}
                  className="p-2"
                  style={{ willChange: 'transform, opacity' }}
                >
                  <Suspense fallback={
                    <div className="rounded-xl border border-white/10 bg-white/5 p-8">
                      <div className="animate-pulse space-y-4">
                        <div className="h-6 bg-white/10 rounded w-1/3"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-32 bg-white/5 rounded-lg"></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  }>
                    <AchievementSystem />
                  </Suspense>
                </motion.div>
              )}

              {activeTab === 'discounts' && (
                <motion.div
                  key="discounts"
                  initial={{ opacity: 0, x: tabDirection === 'forward' ? 50 : -50, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: tabDirection === 'forward' ? -50 : 50, scale: 0.95 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 30,
                    mass: 0.8
                  }}
                  className="p-2"
                  style={{ willChange: 'transform, opacity' }}
                >
                  <GamingDiscountPanel />
                </motion.div>
              )}

              {!splitView && activeTab === 'stats' && (
                <motion.div
                  key="stats"
                  initial={{ opacity: 0, x: tabDirection === 'forward' ? 50 : -50, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: tabDirection === 'forward' ? -50 : 50, scale: 0.95 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 30,
                    mass: 0.8
                  }}
                  className="p-2"
                  style={{ willChange: 'transform, opacity' }}
                >
                  <Suspense fallback={
                    <div className="rounded-xl border border-white/10 bg-white/5 p-8">
                      <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-white/10 rounded w-1/3"></div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-24 bg-white/5 rounded-lg"></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  }>
                    <EnhancedStats />
                  </Suspense>
                </motion.div>
              )}

              {activeTab === 'contest' && (
                <motion.div
                  key="contest"
                  initial={{ opacity: 0, x: tabDirection === 'forward' ? 50 : -50, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: tabDirection === 'forward' ? -50 : 50, scale: 0.95 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 30,
                    mass: 0.8
                  }}
                  className="p-2"
                  style={{ willChange: 'transform, opacity' }}
                >
                  <Suspense fallback={
                    <div className="rounded-xl border border-white/10 bg-white/5 p-8">
                      <div className="animate-pulse space-y-4">
                        <div className="h-12 bg-white/10 rounded w-1/2"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-32 bg-white/5 rounded-lg"></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  }>
                    <ContestTypes />
                  </Suspense>
                </motion.div>
              )}

              {activeTab === 'analytics' && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, x: tabDirection === 'forward' ? 50 : -50, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: tabDirection === 'forward' ? -50 : 50, scale: 0.95 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 30,
                    mass: 0.8
                  }}
                  className="p-2"
                  style={{ willChange: 'transform, opacity' }}
                >
                  <Suspense fallback={
                    <div className="rounded-xl border border-white/10 bg-white/5 p-8">
                      <div className="animate-pulse space-y-4">
                        <div className="h-12 bg-white/10 rounded w-1/2"></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-32 bg-white/5 rounded-lg"></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  }>
                    <ContestAnalytics />
                  </Suspense>
                </motion.div>
              )}

              {activeTab === 'leaderboard' && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, x: tabDirection === 'forward' ? 50 : -50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: tabDirection === 'forward' ? -50 : 50, scale: 0.95 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 30,
                  mass: 0.8
                }}
                className="p-2"
                style={{ willChange: 'transform, opacity' }}
              >
                <Suspense fallback={
                  <div className="rounded-xl border border-white/10 bg-white/5 p-8">
                    <div className="animate-pulse space-y-4">
                      <div className="h-12 bg-white/10 rounded w-1/2"></div>
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-16 bg-white/5 rounded-lg"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                }>
                  <div className="w-full">
                    <CookieLeaderboard />
                  </div>
                </Suspense>
              </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Nickname Setup Modal */}
      <Suspense fallback={null}>
        <NicknameSetupModal
          isOpen={showNicknameModal}
          onClose={() => setShowNicknameModal(false)}
          onSuccess={() => {
            setShowNicknameModal(false);
            syncStatsToServer(); // Sync after nickname is set
          }}
        />
      </Suspense>

      {/* Sound Manager (always active in background) */}
      <Suspense fallback={null}>
        <SoundManager />
      </Suspense>

      {/* Toast Container */}
      <Suspense fallback={null}>
        <ToastContainer />
      </Suspense>

      {/* Keyboard Shortcuts */}
      <Suspense fallback={null}>
        <KeyboardShortcuts />
      </Suspense>

      {/* Golden Cookie System */}
      <GoldenCookieSystem />

    </div>
  );
};
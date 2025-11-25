import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCookieClickerStore } from '../../store/cookieClicker';
import { formatNumber } from '../../utils/cookieFormatters';
import { cn } from '../../utils/cn';
import { Link } from 'react-router-dom';
import { Cookie, ArrowRight } from 'lucide-react';

interface MiniCookieWidgetProps {
  className?: string;
}

export const MiniCookieWidget = ({ className }: MiniCookieWidgetProps) => {
  const cookies = useCookieClickerStore(state => state.cookies);
  const totalCookies = useCookieClickerStore(state => state.totalCookies);
  const cookiesPerClick = useCookieClickerStore(state => state.cookiesPerClick);
  const cookiesPerSecond = useCookieClickerStore(state => state.cookiesPerSecond);
  const level = useCookieClickerStore(state => state.level);
  const streak = useCookieClickerStore(state => state.streak);
  const clickCookie = useCookieClickerStore(state => state.clickCookie);
  const animationsEnabled = useCookieClickerStore(state => state.animationsEnabled);

  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [clickAnimation, setClickAnimation] = useState(false);
  const [rippleEffects, setRippleEffects] = useState<Array<{ id: string; x: number; y: number; timestamp: number }>>([]);
  const cookieRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!cookieRef.current) return;
    
    try {
      const rect = cookieRef.current.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        clickCookie(x, y);
        
        setIsClicked(true);
        setClickAnimation(true);
        
        if (animationsEnabled) {
          const rippleId = Math.random().toString(36).substring(2, 11);
          setRippleEffects(prev => [...prev, { id: rippleId, x, y, timestamp: Date.now() }]);
          
          setTimeout(() => {
            setRippleEffects(prev => prev.filter(r => r.id !== rippleId));
          }, 800);
        }
        
        setTimeout(() => {
          setIsClicked(false);
          setClickAnimation(false);
        }, 200);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.debug('Mini cookie click handler error:', error);
      }
    }
  }, [clickCookie, animationsEnabled]);

  const fireIntensity = Math.min(streak / 50, 1);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={cn("relative", className)}
    >
      <div className="relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-6">
        {/* Glow Effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/20 via-yellow-500/10 to-transparent blur-xl opacity-50" />
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-orange-400" />
              <h3 className="text-lg font-bold text-white">Cookie Clicker</h3>
            </div>
            {streak > 0 && (
              <motion.div
                className="px-2 py-1 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold flex items-center gap-1"
                animate={{
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    "0_0_5px_rgba(239,68,68,0.5)",
                    "0_0_10px_rgba(239,68,68,0.8)",
                    "0_0_5px_rgba(239,68,68,0.5)"
                  ]
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <span>🔥</span>
                <span>{streak}x</span>
              </motion.div>
            )}
          </div>

          {/* Cookie */}
          <div className="relative flex items-center justify-center mb-4">
            <div
              ref={cookieRef}
              className={cn(
                "relative cursor-pointer transition-transform duration-200 select-none will-change-transform",
                "hover:scale-110 active:scale-95",
                clickAnimation && "scale-105"
              )}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={handleClick}
            >
              {/* Multi-Layer Glow */}
              <motion.div 
                className={cn(
                  "absolute inset-0 rounded-full will-change-transform -z-10",
                  isHovered ? "bg-orange-500/30 blur-2xl" : "bg-orange-400/20 blur-xl"
                )}
                animate={{
                  scale: isHovered ? [1, 1.2, 1] : 1,
                  opacity: isHovered ? [0.4, 0.6, 0.4] : [0.2, 0.3, 0.2]
                }}
                transition={{
                  duration: isHovered ? 2 : 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Streak Fire Effect */}
              {streak > 0 && animationsEnabled && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-red-500/60 pointer-events-none"
                  animate={{
                    scale: [1, 1.15, 1.1, 1.15, 1],
                    opacity: [0.5 * fireIntensity, 0.9 * fireIntensity, 0.6 * fireIntensity, 0.9 * fireIntensity, 0.5 * fireIntensity],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
              
              {/* Cookie Icon */}
              <motion.div 
                className={cn(
                  "relative text-6xl md:text-7xl will-change-transform z-10",
                  isHovered && "drop-shadow-2xl",
                  streak > 0 && "drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]"
                )}
                animate={clickAnimation ? {
                  scale: [1, 0.9, 1.1, 1],
                  rotate: [0, -5, 5, 0]
                } : isHovered ? {
                  scale: [1, 1.05, 1],
                  rotate: [0, 2, -2, 0]
                } : streak > 0 ? {
                  scale: [1, 1.03, 1],
                } : {}}
                transition={{
                  duration: clickAnimation ? 0.25 : isHovered ? 2 : streak > 0 ? 3 : 0,
                  ease: clickAnimation ? [0.34, 1.56, 0.64, 1] : "easeOut",
                  repeat: isHovered || streak > 0 ? Infinity : 0
                }}
              >
                🍪
              </motion.div>

              {/* Ripple Effects */}
              <AnimatePresence>
                {rippleEffects.map((ripple) => (
                  <motion.div
                    key={`ripple-${ripple.id}`}
                    className="absolute pointer-events-none"
                    style={{
                      left: ripple.x,
                      top: ripple.y,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <motion.div
                      className="absolute pointer-events-none rounded-full border-2 border-orange-400/40"
                      style={{
                        left: 0,
                        top: 0,
                        transform: 'translate(-50%, -50%)'
                      }}
                      initial={{ width: 0, height: 0, opacity: 0.8 }}
                      animate={{ width: 200, height: 200, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Cookies:</span>
              <span className="text-white font-bold">{formatNumber(cookies)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Level:</span>
              <span className="text-accent font-bold">{level}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Pro Sekunde:</span>
              <span className="text-green-400 font-bold">{cookiesPerSecond.toFixed(1)}</span>
            </div>
          </div>

          {/* CTA Button */}
          <Link
            to="/cookie-clicker"
            className={cn(
              "group relative w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
              "bg-gradient-to-r from-orange-500 to-yellow-500",
              "text-white font-semibold text-sm",
              "transition-all duration-300",
              "hover:scale-105 hover:shadow-lg hover:shadow-orange-500/50",
              "active:scale-95"
            )}
          >
            <span>Jetzt spielen</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 opacity-0 group-hover:opacity-100 blur-md transition-opacity" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};








































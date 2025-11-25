import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown } from 'lucide-react';
import { useEnhancedTouch } from '../../hooks/useEnhancedTouch';
import { useIsVip } from '../../hooks/useIsVip';

type CornerPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

interface Position {
  x: number;
  y: number;
  corner: CornerPosition;
}

const CORNER_POSITIONS: Record<CornerPosition, { x: number; y: number }> = {
  'bottom-right': { x: 20, y: 20 },
  'bottom-left': { x: 20, y: 20 },
  'top-right': { x: 20, y: 20 },
  'top-left': { x: 20, y: 20 }
};

export const VipFloatingTab = () => {
  const navigate = useNavigate();
  const { triggerHaptic } = useEnhancedTouch();
  const { isVip } = useIsVip();
  const [position, setPosition] = useState<Position>({
    x: 0,
    y: 0,
    corner: 'bottom-right'
  });
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Don't show if user is already VIP
  if (isVip) {
    return null;
  }

  // Calculate position based on corner and viewport
  const getPosition = useCallback((corner: CornerPosition) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const size = isMobile ? 56 : 64;
    // Safe area padding for mobile (avoid notches, home indicators)
    const safeAreaBottom = isMobile ? 20 : 0;
    const safeAreaTop = isMobile ? 20 : 0;
    const padding = isMobile ? 16 : 24;
    
    switch (corner) {
      case 'bottom-right':
        return { 
          x: window.innerWidth - size - padding, 
          y: window.innerHeight - size - padding - safeAreaBottom 
        };
      case 'bottom-left':
        return { 
          x: padding, 
          y: window.innerHeight - size - padding - safeAreaBottom 
        };
      case 'top-right':
        return { 
          x: window.innerWidth - size - padding, 
          y: padding + safeAreaTop 
        };
      case 'top-left':
        return { 
          x: padding, 
          y: padding + safeAreaTop 
        };
      default:
        return { 
          x: window.innerWidth - size - padding, 
          y: window.innerHeight - size - padding - safeAreaBottom 
        };
    }
  }, []);

  // Random corner position change
  useEffect(() => {
    const changePosition = () => {
      const corners: CornerPosition[] = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
      const randomCorner = corners[Math.floor(Math.random() * corners.length)];
      const newPos = getPosition(randomCorner);
      setPosition({ ...newPos, corner: randomCorner });
    };

    // Change position every 15-30 seconds randomly
    const interval = setInterval(() => {
      if (Math.random() > 0.5) { // 50% chance to move
        changePosition();
      }
    }, 15000 + Math.random() * 15000);

    return () => clearInterval(interval);
  }, [getPosition]);

  // Initial position
  useEffect(() => {
    const initialPos = getPosition('bottom-right');
    setPosition({ ...initialPos, corner: 'bottom-right' });
  }, [getPosition]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newPos = getPosition(position.corner);
      setPosition(prev => ({ ...newPos, corner: prev.corner }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position.corner, getPosition]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerHaptic('medium');
    
    requestAnimationFrame(() => {
      try {
        navigate('/vip');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error) {
        console.error('Navigation error:', error);
      }
    });
  }, [navigate, triggerHaptic]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const size = isMobile ? 56 : 64;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            x: position.x,
            y: position.y
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
            x: { duration: 0.6, ease: "easeOut" },
            y: { duration: 0.6, ease: "easeOut" }
          }}
          whileHover={{ 
            scale: 1.1,
            rotate: [0, -5, 5, -5, 0],
            transition: { duration: 0.3 }
          }}
          whileTap={{ scale: 0.9 }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          onClick={handleClick}
          className="fixed z-50 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 shadow-2xl flex items-center justify-center cursor-pointer touch-target group overflow-hidden"
          style={{
            width: size,
            height: size,
            boxShadow: '0 8px 32px rgba(251, 191, 36, 0.4), 0 0 0 1px rgba(251, 191, 36, 0.2)',
            // Safe area for mobile devices
            paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : '0',
            paddingTop: isMobile ? 'env(safe-area-inset-top)' : '0',
            paddingLeft: isMobile ? 'env(safe-area-inset-left)' : '0',
            paddingRight: isMobile ? 'env(safe-area-inset-right)' : '0'
          }}
          aria-label="VIP Bereich öffnen"
        >
          {/* Animated background glow */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-yellow-300/50 to-amber-600/50 rounded-full"
            animate={{
              scale: isHovered ? [1, 1.2, 1] : [1, 1.1, 1],
              opacity: isHovered ? [0.5, 0.8, 0.5] : [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Floating animation */}
          <motion.div
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative z-10"
          >
            <Crown 
              className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'} text-yellow-900 group-hover:text-yellow-950 transition-colors drop-shadow-lg`}
              fill="currentColor"
            />
          </motion.div>

          {/* Shine effect on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            initial={{ x: '-100%' }}
            animate={isHovered ? { x: '200%' } : { x: '-100%' }}
            transition={{ duration: 0.6 }}
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
};


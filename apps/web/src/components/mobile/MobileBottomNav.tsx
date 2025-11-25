import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  ShoppingCart,
  Rocket,
  Cookie,
  Sparkles,
  Zap,
  Home
} from 'lucide-react';

// 🎯 Sigma Icon Component (Σ)
const SigmaIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 4h8c2 0 3.5 1.5 3.5 3.5S16 11 14 11H8M18 20H10c-2 0-3.5-1.5-3.5-3.5S8 13 10 13h6" />
  </svg>
);
import { cn } from '../../utils/cn';
import { useEnhancedTouch } from '../../hooks/useEnhancedTouch';
import { springConfigs } from '../../utils/springConfigs';

// 🎯 Mobile Navigation Items - Standard Navigation (Shop, Drop, Profil, Cookies)
export type MobileNavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  gradient?: string;
};

const mobileNavItems: MobileNavItem[] = [
  { 
    id: 'home', 
    label: 'Home', 
    icon: <Home className="w-5 h-5" />,
    gradient: 'from-blue-500 via-purple-500 to-pink-500'
  },
  { 
    id: 'shop', 
    label: 'Shop', 
    icon: <ShoppingCart className="w-5 h-5" />,
    gradient: undefined // Orange komplett entfernt - kein Gradient
  },
  { 
    id: 'drops', 
    label: 'Drops', 
    icon: <Rocket className="w-5 h-5" />,
    gradient: 'from-cyan-500 to-blue-500'
  },
  { 
    id: 'cookie-clicker', 
    label: 'Game', 
    icon: <Cookie className="w-5 h-5" />,
    gradient: 'from-green-500 to-emerald-500'
  },
  { 
    id: 'profile', 
    label: 'Profile', 
    icon: <User className="w-5 h-5" />,
    gradient: 'from-purple-500 via-blue-500 to-cyan-400'
  }
];

interface MobileBottomNavProps {
  items?: MobileNavItem[];
  activeItem?: string;
  onItemChange?: (itemId: string) => void;
  className?: string;
}

export const MobileBottomNav = ({ 
  items = mobileNavItems, 
  activeItem: controlledActiveItem,
  onItemChange,
  className 
}: MobileBottomNavProps) => {
  const [internalActiveItem, setInternalActiveItem] = useState(items[0]?.id || 'home');
  const { triggerHaptic } = useEnhancedTouch();
  
  const activeItem = controlledActiveItem ?? internalActiveItem;

  const handleItemClick = (itemId: string) => {
    if (itemId === activeItem) {
      // Double tap to scroll to top
      triggerHaptic('medium');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    triggerHaptic('light');
    
    if (onItemChange) {
      onItemChange(itemId);
    } else {
      setInternalActiveItem(itemId);
    }
  };

  return (
    <nav 
      className={cn(
        // Positioning
        "fixed bottom-0 left-0 right-0 z-50",
        // Safe area for mobile devices
        "pb-[env(safe-area-inset-bottom)]",
        // Animation
        "transition-transform duration-300",
        className
      )}
    >
      {/* Main Navigation Container */}
      <div className="relative">
        {/* Background with glassmorphism */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl rounded-t-3xl border-t border-white/10" />
        
        {/* Glow effect */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        
        {/* Navigation Items */}
        <div className="relative flex justify-around items-stretch h-20 px-4 pt-2">
          {items.map((item) => {
            const isActive = item.id === activeItem;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={cn(
                  // Layout
                  "flex flex-col items-center justify-center",
                  "flex-1 relative",
                  // Touch target size
                  "min-w-[44px] py-3",
                  // Transitions
                  "transition-all duration-300",
                  // Active feedback
                  "active:scale-95"
                )}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                whileHover={{ 
                  scale: 1.05,
                  transition: springConfigs.gentle
                }}
                whileTap={{ 
                  scale: 0.95,
                  transition: springConfigs.quick
                }}
              >
                {/* Active Background */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      className={cn(
                        "absolute inset-0 rounded-2xl",
                        item.gradient 
                          ? `bg-gradient-to-br ${item.gradient}`
                          : "bg-white/10" // Neutraler Hintergrund wenn kein Gradient
                      )}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={springConfigs.snappy}
                    />
                  )}
                </AnimatePresence>
                
                {/* Icon Container */}
                <motion.div 
                  className={cn(
                    "relative z-10 transition-all duration-300",
                    isActive ? "text-white" : "text-gray-400",
                    isActive && "drop-shadow-lg"
                  )}
                  animate={isActive ? {
                    scale: [1, 1.2, 1],
                    y: [0, -2, 0],
                    transition: {
                      duration: 0.4,
                      ease: "easeOut"
                    }
                  } : {}}
                >
                  {item.icon}
                  
                  {/* Badge */}
                  <AnimatePresence>
                    {item.badge !== undefined && item.badge > 0 && (
                      <motion.span
                        className={cn(
                          "absolute -top-2 -right-2",
                          "flex items-center justify-center",
                          "min-w-[20px] h-[20px] px-1",
                          "bg-red-500 text-white text-[10px] font-bold",
                          "rounded-full border-2 border-black",
                          "shadow-lg"
                        )}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                          scale: 1, 
                          opacity: 1,
                          y: [0, -3, 0]
                        }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{
                          scale: springConfigs.bouncy,
                          y: {
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }
                        }}
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
                
                {/* Label */}
                <motion.span 
                  className={cn(
                    "text-[11px] font-medium mt-1 transition-all duration-300 relative z-10",
                    isActive ? "text-white font-semibold" : "text-gray-500"
                  )}
                  animate={isActive ? {
                    y: [0, -1, 0],
                    transition: {
                      duration: 0.3,
                      ease: "easeOut"
                    }
                  } : {}}
                >
                  {item.label}
                </motion.span>
                
                {/* Sparkle effect on active */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      className="absolute top-1 right-1 z-20"
                      initial={{ scale: 0, rotate: 0 }}
                      animate={{ 
                        scale: [0, 1, 0.8, 1],
                        rotate: [0, 180, 360],
                        transition: {
                          duration: 0.8,
                          ease: "easeOut"
                        }
                      }}
                      exit={{ scale: 0, rotate: 0 }}
                    >
                      <Sparkles className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Pulse effect for active item */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-white/20"
                      initial={{ scale: 1, opacity: 0 }}
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0, 0.3, 0],
                        transition: {
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }
                      }}
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

// 🎯 Mobile Status Bar Component - REMOVED (not needed)
// Das orange Banner wurde komplett entfernt, da es nicht funktioniert hat





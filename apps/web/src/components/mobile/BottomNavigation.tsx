import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Star, Building, TrendingUp, Settings, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useEnhancedTouch } from '../../hooks/useEnhancedTouch';
import { springConfigs } from '../../utils/springConfigs';

// 🎯 Navigation Items
export type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  color?: string;
};

const defaultNavItems: NavItem[] = [
  { 
    id: 'game', 
    label: 'Game', 
    icon: <Cookie className="w-6 h-6" />,
    color: 'text-orange-400'
  },
  { 
    id: 'shop', 
    label: 'Shop', 
    icon: <Star className="w-6 h-6" />,
    color: 'text-yellow-400'
  },
  { 
    id: 'buildings', 
    label: 'Buildings', 
    icon: <Building className="w-6 h-6" />,
    color: 'text-blue-400'
  },
  { 
    id: 'stats', 
    label: 'Stats', 
    icon: <TrendingUp className="w-6 h-6" />,
    color: 'text-green-400'
  },
  { 
    id: 'settings', 
    label: 'Settings', 
    icon: <Settings className="w-6 h-6" />,
    color: 'text-purple-400'
  }
];

interface BottomNavigationProps {
  items?: NavItem[];
  activeItem?: string;
  onItemChange?: (itemId: string) => void;
  className?: string;
}

export const BottomNavigation = ({ 
  items = defaultNavItems, 
  activeItem: controlledActiveItem,
  onItemChange,
  className 
}: BottomNavigationProps) => {
  const [internalActiveItem, setInternalActiveItem] = useState(items[0]?.id || 'game');
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
        // Background with blur
        "bg-gradient-to-t from-black/98 via-black/95 to-transparent",
        "backdrop-blur-2xl",
        // Border
        "border-t border-white/10",
        // Safe area for mobile devices
        "pb-[env(safe-area-inset-bottom)]",
        // Animation
        "transition-transform duration-300",
        className
      )}
    >
      {/* Glow effect */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#0BF7BC]/50 to-transparent" />
      
      <div className="flex justify-around items-stretch h-16 px-2">
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
                // Touch target size (minimum 44x44px)
                "min-w-[44px] py-2",
                // Transitions
                "transition-all duration-200",
                // Active state
                isActive && "scale-105",
                // Hover state (desktop)
                "hover:scale-105",
                // Active feedback
                "active:scale-95 active:opacity-70"
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
              animate={isActive ? {
                scale: [1, 1.1, 1.05],
                transition: {
                  duration: 0.3,
                  ease: "easeOut"
                }
              } : {}}
            >
              {/* Active indicator */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-[#0BF7BC] to-[#61F4F4] rounded-full shadow-lg shadow-[#0BF7BC]/50"
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    exit={{ scaleX: 0, opacity: 0 }}
                    transition={springConfigs.snappy}
                  />
                )}
              </AnimatePresence>
              
              {/* Icon */}
              <motion.div 
                className={cn(
                  "relative transition-all duration-200",
                  isActive ? item.color || "text-[#0BF7BC]" : "text-gray-400",
                  isActive && "drop-shadow-[0_0_8px_rgba(11,247,188,0.5)]"
                )}
                animate={isActive ? {
                  scale: [1, 1.2, 1],
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
                        "absolute -top-1 -right-1",
                        "flex items-center justify-center",
                        "min-w-[18px] h-[18px] px-1",
                        "bg-red-500 text-white text-[10px] font-bold",
                        "rounded-full border-2 border-black"
                      )}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: 1, 
                        opacity: 1,
                        y: [0, -2, 0]
                      }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{
                        scale: springConfigs.bouncy,
                        y: {
                          duration: 1,
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
                  "text-[10px] font-medium mt-1 transition-all duration-200",
                  isActive ? item.color || "text-[#0BF7BC]" : "text-gray-500",
                  isActive && "font-semibold"
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
                    className="absolute top-1 right-1"
                    initial={{ scale: 0, rotate: 0 }}
                    animate={{ 
                      scale: [0, 1, 0.8, 1],
                      rotate: [0, 180, 360],
                      transition: {
                        duration: 0.6,
                        ease: "easeOut"
                      }
                    }}
                    exit={{ scale: 0, rotate: 0 }}
                  >
                    <Sparkles className="w-3 h-3 text-[#0BF7BC]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

// 🎯 Navigation Button Component (für custom usage)
interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
  color?: string;
}

export const NavButton = ({ 
  icon, 
  label, 
  active = false, 
  badge,
  onClick,
  color = 'text-[#0BF7BC]'
}: NavButtonProps) => {
  const { triggerHaptic } = useEnhancedTouch();

  const handleClick = () => {
    triggerHaptic('light');
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex flex-col items-center justify-center flex-1 relative",
        "min-w-[44px] py-2 transition-all duration-200",
        active && "scale-105",
        "hover:scale-105 active:scale-95 active:opacity-70"
      )}
    >
      {active && (
        <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-[#0BF7BC] to-[#61F4F4] rounded-full shadow-lg shadow-[#0BF7BC]/50" />
      )}
      
      <div className={cn(
        "relative transition-all duration-200",
        active ? color : "text-gray-400",
        active && "drop-shadow-[0_0_8px_rgba(11,247,188,0.5)]"
      )}>
        {icon}
        
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-black animate-pulse">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      
      <span className={cn(
        "text-[10px] font-medium mt-1 transition-all duration-200",
        active ? color : "text-gray-500",
        active && "font-semibold"
      )}>
        {label}
      </span>
    </button>
  );
};



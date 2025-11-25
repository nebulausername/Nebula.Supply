import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  ShoppingBag, 
  Ticket, 
  Settings,
  Menu
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useTouchFeedback } from '../../hooks/useTouchFeedback';
import { ViewType } from '../../lib/types/common';

export type MobileNavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
};

const defaultNavItems: MobileNavItem[] = [
  { 
    id: 'overview', 
    label: 'Dashboard', 
    icon: LineChart
  },
  { 
    id: 'shop', 
    label: 'Shop', 
    icon: ShoppingBag
  },
  { 
    id: 'tickets', 
    label: 'Tickets', 
    icon: Ticket,
    badge: '7'
  },
  { 
    id: 'settings', 
    label: 'Settings', 
    icon: Settings
  },
  { 
    id: 'menu', 
    label: 'Menu', 
    icon: Menu
  }
];

interface MobileBottomNavProps {
  items?: MobileNavItem[];
  activeItem?: ViewType | 'menu';
  onItemChange?: (itemId: ViewType | 'menu') => void;
  onMenuClick?: () => void;
  className?: string;
}

export const MobileBottomNav = ({ 
  items = defaultNavItems, 
  activeItem: controlledActiveItem,
  onItemChange,
  onMenuClick,
  className 
}: MobileBottomNavProps) => {
  const [internalActiveItem, setInternalActiveItem] = useState<ViewType | 'menu'>(items[0]?.id as ViewType | 'menu' || 'overview');
  const { triggerHaptic } = useTouchFeedback();
  
  const activeItem = controlledActiveItem ?? internalActiveItem;

  const handleItemClick = (itemId: string) => {
    if (itemId === activeItem && itemId !== 'menu') {
      // Double tap to scroll to top
      triggerHaptic('medium');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    triggerHaptic('light');
    
    if (itemId === 'menu') {
      onMenuClick?.();
    } else {
      if (onItemChange) {
        onItemChange(itemId as ViewType);
      } else {
        setInternalActiveItem(itemId as ViewType);
      }
    }
  };

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-gradient-to-t from-black/98 via-black/95 to-transparent",
        "backdrop-blur-2xl",
        "border-t border-neon/20",
        "pb-safe-bottom",
        "lg:hidden",
        className
      )}
    >
      {/* Glow effect */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon/50 to-transparent" />
      
      <div className="flex justify-around items-stretch h-16 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          const isMenu = item.id === 'menu';

          return (
            <motion.button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1",
                "min-h-touch min-w-touch",
                "relative rounded-lg",
                "transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-neon/50 focus:ring-offset-2 focus:ring-offset-black",
                isActive && !isMenu
                  ? "text-neon"
                  : "text-muted hover:text-neon"
              )}
              whileTap={{ scale: 0.95 }}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active indicator */}
              {isActive && !isMenu && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-neon rounded-b-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              {/* Icon with badge */}
              <div className="relative">
                <Icon className={cn(
                  "w-5 h-5 transition-all duration-200",
                  isActive && !isMenu && "scale-110"
                )} />
                
                {/* Badge */}
                {item.badge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      "absolute -top-1 -right-1 min-w-[18px] h-[18px]",
                      "flex items-center justify-center",
                      "text-[10px] font-bold text-black",
                      "bg-neon rounded-full",
                      "px-1"
                    )}
                  >
                    {item.badge}
                  </motion.span>
                )}
              </div>

              {/* Label */}
              <span className={cn(
                "text-[10px] font-medium transition-all duration-200",
                isActive && !isMenu && "font-semibold"
              )}>
                {item.label}
              </span>

              {/* Active glow effect */}
              {isActive && !isMenu && (
                <motion.div
                  className="absolute inset-0 rounded-lg bg-neon/10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};



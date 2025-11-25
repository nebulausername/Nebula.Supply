import { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  Home, 
  Info, 
  HelpCircle, 
  Sparkles,
  Zap,
  TrendingUp,
  Bell
} from 'lucide-react';
import { cn } from '../../utils/cn';

// 🎯 BREADCRUMBS COMPONENT
export const Breadcrumbs = memo(({ items }: { items: { label: string; onClick?: () => void }[] }) => {
  return (
    <nav className="flex items-center gap-2 text-sm mb-4" aria-label="Breadcrumb">
      <motion.button
        onClick={() => items[0].onClick?.()}
        className="text-white/60 hover:text-white transition-colors flex items-center gap-1"
        whileHover={{ scale: 1.05 }}
      >
        <Home className="w-4 h-4" />
        <span>{items[0].label}</span>
      </motion.button>
      
      {items.slice(1).map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-white/40" />
          {item.onClick ? (
            <motion.button
              onClick={item.onClick}
              className="text-white/60 hover:text-white transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              {item.label}
            </motion.button>
          ) : (
            <span className="text-white">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
});
Breadcrumbs.displayName = 'Breadcrumbs';

// 🎯 LOADING SKELETON COMPONENT
export const LoadingSkeleton = memo(({ 
  variant = 'card',
  count = 1 
}: { 
  variant?: 'card' | 'bar' | 'circle';
  count?: number;
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            "rounded-xl bg-white/5 border border-white/10",
            variant === 'card' && "h-48",
            variant === 'bar' && "h-4 w-full",
            variant === 'circle' && "h-16 w-16 rounded-full"
          )}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.1
          }}
        />
      ))}
    </>
  );
});
LoadingSkeleton.displayName = 'LoadingSkeleton';

// 🎯 TOOLTIP COMPONENT
export const Tooltip = memo(({ 
  children, 
  content,
  position = 'top'
}: { 
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={cn(
              "absolute z-50 px-3 py-2 rounded-lg bg-black/90 text-white text-sm whitespace-nowrap pointer-events-none",
              positionClasses[position]
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
Tooltip.displayName = 'Tooltip';

// 🎯 HELP BUTTON
export const HelpButton = memo(({ content }: { content: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Hilfe"
      >
        <HelpCircle className="w-4 h-4 text-white/70" />
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 w-64 p-4 rounded-xl bg-black/95 border border-white/20 z-50"
          >
            <p className="text-sm text-white/80">{content}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
HelpButton.displayName = 'HelpButton';

// 🎯 FLOATING ACTION BUTTON (FAB)
export const FloatingActionButton = memo(({ 
  icon: Icon, 
  onClick, 
  label,
  color = 'blue'
}: { 
  icon: any;
  onClick: () => void;
  label: string;
  color?: 'blue' | 'green' | 'yellow' | 'purple';
}) => {
  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    yellow: 'bg-yellow-500 hover:bg-yellow-600',
    purple: 'bg-purple-500 hover:bg-purple-600'
  };

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white z-40",
        colorClasses[color]
      )}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      aria-label={label}
    >
      <Icon className="w-6 h-6" />
    </motion.button>
  );
});
FloatingActionButton.displayName = 'FloatingActionButton';

// 🎯 PROGRESS INDICATOR
export const ProgressIndicator = memo(({ 
  value, 
  max, 
  label,
  showValue = true,
  size = 'md'
}: { 
  value: number;
  max: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const percentage = Math.min(100, (value / max) * 100);
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1 text-sm">
          {label && <span className="text-white/70">{label}</span>}
          {showValue && (
            <span className="text-white font-bold">
              {Math.round(value).toLocaleString()} / {Math.round(max).toLocaleString()}
            </span>
          )}
        </div>
      )}
      <div className={cn("w-full bg-white/10 rounded-full overflow-hidden", sizeClasses[size])}>
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      {showValue && (
        <div className="text-xs text-white/50 mt-1 text-right">{percentage.toFixed(1)}%</div>
      )}
    </div>
  );
});
ProgressIndicator.displayName = 'ProgressIndicator';

// 🎯 NOTIFICATION BANNER
export const NotificationBanner = memo(({ 
  type = 'info',
  message,
  onClose
}: { 
  type?: 'info' | 'success' | 'warning' | 'error';
  message: string;
  onClose?: () => void;
}) => {
  const typeClasses = {
    info: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
    success: 'bg-green-500/20 border-green-500/30 text-green-400',
    warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
    error: 'bg-red-500/20 border-red-500/30 text-red-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "rounded-xl border p-4 flex items-center justify-between",
        typeClasses[type]
      )}
    >
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5" />
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-current/60 hover:text-current transition-colors"
        >
          ✕
        </button>
      )}
    </motion.div>
  );
});
NotificationBanner.displayName = 'NotificationBanner';

// 🎯 SHIMMER EFFECT (für Loading States)
export const Shimmer = memo(() => {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
    </div>
  );
});
Shimmer.displayName = 'Shimmer';

// 🎯 PULSE RING (für wichtige Actions)
export const PulseRing = memo(({ delay = 0 }: { delay?: number }) => {
  return (
    <motion.div
      className="absolute inset-0 rounded-full border-2 border-current"
      initial={{ scale: 1, opacity: 0.8 }}
      animate={{ scale: 2, opacity: 0 }}
      transition={{
        duration: 2,
        repeat: Infinity,
        delay,
        ease: "easeOut"
      }}
    />
  );
});
PulseRing.displayName = 'PulseRing';


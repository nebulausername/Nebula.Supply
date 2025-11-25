import { memo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useEnhancedTouch } from '../../hooks/useEnhancedTouch';

interface LoadingButtonProps {
  children: ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
}

export const LoadingButton = memo(({
  children,
  isLoading = false,
  disabled = false,
  variant = 'default',
  size = 'md',
  className,
  onClick,
  type = 'button',
  fullWidth = false
}: LoadingButtonProps) => {
  const { triggerHaptic } = useEnhancedTouch();

  const handleClick = () => {
    if (!isLoading && !disabled && onClick) {
      triggerHaptic('light');
      onClick();
    }
  };

  const baseClasses = 'relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden';
  
  const variantClasses = {
    default: 'bg-white text-black hover:bg-white/90 focus:ring-white',
    outline: 'border border-white/20 text-white hover:bg-white/10 focus:ring-white',
    ghost: 'text-white hover:bg-white/10 focus:ring-white',
    accent: 'bg-accent text-white hover:bg-accent/90 focus:ring-accent'
  };

  const sizeClasses = {
    sm: 'h-9 px-3 text-sm rounded-lg',
    md: 'h-11 px-4 text-base rounded-lg',
    lg: 'h-14 px-6 text-lg rounded-xl'
  };

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      whileHover={!isLoading && !disabled ? { scale: 1.02 } : {}}
      whileTap={!isLoading && !disabled ? { scale: 0.98 } : {}}
    >
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-5 h-5 text-white" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Ring (optional, for longer operations) */}
      {isLoading && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-white/20"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-white"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              strokeDasharray="283"
              strokeDashoffset="0"
            />
          </svg>
        </motion.div>
      )}

      {/* Content */}
      <motion.span
        className={cn(
          'relative z-10 flex items-center gap-2',
          isLoading && 'opacity-70'
        )}
        animate={isLoading ? { opacity: 0.7 } : { opacity: 1 }}
      >
        {children}
      </motion.span>
    </motion.button>
  );
});

LoadingButton.displayName = 'LoadingButton';


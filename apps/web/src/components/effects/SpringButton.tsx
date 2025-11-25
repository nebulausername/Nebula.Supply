// 🎯 SpringButton - Reusable button with app-like spring animations
import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { springConfigs } from "../../utils/springConfigs";

interface SpringButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  haptic?: 'light' | 'medium' | 'heavy' | 'success';
}

export const SpringButton = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className,
  type = 'button',
  haptic = 'light'
}: SpringButtonProps) => {
  const handleClick = () => {
    if (disabled || loading) return;
    
    // Trigger haptic feedback
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
        success: [10, 5, 10]
      };
      navigator.vibrate(patterns[haptic]);
    }
    
    onClick?.();
  };

  const variants = {
    primary: "bg-gradient-to-r from-accent to-emerald-400 text-black font-semibold shadow-lg shadow-accent/25",
    secondary: "bg-white/10 text-white border border-white/20 hover:bg-white/20",
    ghost: "text-white hover:bg-white/10",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      className={cn(
        "relative overflow-hidden rounded-xl font-medium transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-black",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "app-button", // CSS class for ripple effect
        variants[variant],
        sizes[size],
        className
      )}
      whileHover={!disabled && !loading ? { 
        scale: 1.02,
        transition: springConfigs.gentle
      } : {}}
      whileTap={!disabled && !loading ? { 
        scale: 0.95,
        transition: springConfigs.quick
      } : {}}
      animate={loading ? {
        scale: [1, 1.02, 1],
        transition: {
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut"
        }
      } : {}}
    >
      {/* Loading Spinner */}
      {loading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </motion.div>
      )}
      
      {/* Button Content */}
      <motion.div
        className={cn(
          "flex items-center justify-center gap-2",
          loading && "opacity-0"
        )}
        animate={{ opacity: loading ? 0 : 1 }}
      >
        {children}
      </motion.div>
      
      {/* Ripple Effect */}
      <motion.div
        className="absolute inset-0 bg-white/20 rounded-full"
        initial={{ scale: 0, opacity: 0 }}
        whileTap={{ 
          scale: 4, 
          opacity: [0, 0.3, 0],
          transition: { duration: 0.6 }
        }}
      />
    </motion.button>
  );
};

// Specialized button variants
export const FloatingActionButton = ({ 
  children, 
  onClick, 
  className 
}: { 
  children: ReactNode; 
  onClick?: () => void; 
  className?: string; 
}) => (
  <motion.button
    onClick={onClick}
    className={cn(
      "fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full",
      "bg-gradient-to-r from-accent to-emerald-400 text-black",
      "shadow-2xl shadow-accent/50 flex items-center justify-center",
      "fab", // CSS class for enhanced animations
      className
    )}
    whileHover={{ 
      scale: 1.1,
      rotate: 5,
      transition: springConfigs.bouncy
    }}
    whileTap={{ 
      scale: 0.9,
      transition: springConfigs.quick
    }}
    animate={{
      y: [0, -4, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }}
  >
    {children}
  </motion.button>
);

export const IconButton = ({ 
  children, 
  onClick, 
  variant = 'ghost',
  size = 'md',
  className 
}: { 
  children: ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string; 
}) => {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10", 
    lg: "w-12 h-12"
  };

  return (
    <SpringButton
      onClick={onClick}
      variant={variant}
      size={size}
      className={cn(
        "p-0 rounded-full",
        sizes[size],
        className
      )}
    >
      {children}
    </SpringButton>
  );
};





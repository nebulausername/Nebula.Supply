import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, AlertTriangle, X, Sparkles } from "lucide-react";
import { cn } from "../utils/cn";
import { springConfigs } from "../utils/springConfigs";
import { useEnhancedTouch } from "../hooks/useEnhancedTouch";

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast = ({ id, type, title, message, duration = 3000, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const { triggerHaptic } = useEnhancedTouch();

  useEffect(() => {
    // Show toast with haptic feedback
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      triggerHaptic('light');
    }, 100);
    
    // Auto-hide toast
    const hideTimer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onClose(id), 300);
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [id, duration, onClose, triggerHaptic]);

  const handleClose = () => {
    triggerHaptic('light');
    setIsLeaving(true);
    setTimeout(() => onClose(id), 300);
  };

  const getIcon = () => {
    const iconProps = "h-5 w-5";
    
    switch (type) {
      case 'success':
        return (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={springConfigs.bouncy}
          >
            <CheckCircle className={`${iconProps} text-green-400`} />
          </motion.div>
        );
      case 'error':
        return (
          <motion.div
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={springConfigs.bouncy}
          >
            <XCircle className={`${iconProps} text-red-400`} />
          </motion.div>
        );
      case 'warning':
        return (
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={springConfigs.bouncy}
          >
            <AlertTriangle className={`${iconProps} text-yellow-400`} />
          </motion.div>
        );
      case 'info':
      default:
        return (
          <motion.div
            initial={{ scale: 0, rotate: 90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={springConfigs.bouncy}
          >
            <Info className={`${iconProps} text-blue-400`} />
          </motion.div>
        );
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/40 text-green-400 shadow-lg shadow-green-500/25';
      case 'error':
        return 'bg-gradient-to-r from-red-500/20 to-rose-500/20 border-red-400/40 text-red-400 shadow-lg shadow-red-500/25';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-400/40 text-yellow-400 shadow-lg shadow-yellow-500/25';
      case 'info':
      default:
        return 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-400/40 text-blue-400 shadow-lg shadow-blue-500/25';
    }
  };

  return (
    <motion.div
      className={cn(
        "fixed top-4 right-4 z-50 max-w-sm w-full p-4 rounded-xl border backdrop-blur-sm",
        "glass", // Glassmorphism effect
        getColors()
      )}
      initial={{ 
        x: 400, 
        opacity: 0, 
        scale: 0.8,
        rotateY: 15
      }}
      animate={{ 
        x: 0, 
        opacity: 1, 
        scale: 1,
        rotateY: 0
      }}
      exit={{ 
        x: 400, 
        opacity: 0, 
        scale: 0.8,
        rotateY: -15
      }}
      transition={springConfigs.smooth}
      whileHover={{ 
        scale: 1.02,
        y: -2,
        transition: springConfigs.gentle
      }}
      layout
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <motion.h4 
            className="font-semibold text-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, ...springConfigs.gentle }}
          >
            {title}
          </motion.h4>
          {message && (
            <motion.p 
              className="text-sm text-slate-300 mt-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, ...springConfigs.gentle }}
            >
              {message}
            </motion.p>
          )}
        </div>
        <motion.button
          onClick={handleClose}
          className="p-1 rounded-full hover:bg-white/10 transition-colors"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          transition={springConfigs.quick}
        >
          <X className="h-4 w-4" />
        </motion.button>
      </div>

      {/* Success Sparkles */}
      {type === 'success' && (
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${20 + i * 15}%`,
                top: `${20 + (i % 2) * 60}%`
              }}
              initial={{ 
                scale: 0, 
                rotate: 0,
                opacity: 0
              }}
              animate={{ 
                scale: [0, 1, 0],
                rotate: [0, 180, 360],
                opacity: [0, 1, 0],
                y: [0, -20, -40]
              }}
              transition={{
                duration: 2,
                delay: i * 0.1,
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              <Sparkles className="w-3 h-3 text-green-400" />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Progress Bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 bg-white/20 rounded-b-xl overflow-hidden"
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: duration / 1000, ease: "linear" }}
      />
    </motion.div>
  );
};

// Toast Manager
export interface ToastManagerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
}

export const ToastManager = ({ toasts, onClose }: ToastManagerProps) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast, index) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            transition={{
              ...springConfigs.smooth,
              delay: index * 0.1
            }}
            style={{
              zIndex: 1000 - index
            }}
          >
            <Toast {...toast} onClose={onClose} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};


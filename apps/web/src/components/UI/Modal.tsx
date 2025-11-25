// 🎯 Universal Modal Component with App-like Animations
import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";
import { springConfigs } from "../../utils/springConfigs";
import { useEnhancedTouch } from "../../hooks/useEnhancedTouch";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'modal' | 'bottom-sheet' | 'drawer';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  className?: string;
  zIndex?: number;
}

export const Modal = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  variant = 'modal',
  showCloseButton = true,
  closeOnBackdrop = true,
  className,
  zIndex = 1000
}: ModalProps) => {
  const { triggerHaptic } = useEnhancedTouch();
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      triggerHaptic('light');
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        triggerHaptic('light');
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose, triggerHaptic]);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full'
  };

  const getVariants = () => {
    switch (variant) {
      case 'bottom-sheet':
        return {
          initial: { 
            opacity: 0, 
            y: '100%',
            scale: 0.95
          },
          animate: { 
            opacity: 1, 
            y: 0,
            scale: 1
          },
          exit: { 
            opacity: 0, 
            y: '100%',
            scale: 0.95
          }
        };
      
      case 'drawer':
        return {
          initial: { 
            opacity: 0, 
            x: '-100%',
            scale: 0.95
          },
          animate: { 
            opacity: 1, 
            x: 0,
            scale: 1
          },
          exit: { 
            opacity: 0, 
            x: '-100%',
            scale: 0.95
          }
        };
      
      default: // modal
        return {
          initial: { 
            opacity: 0, 
            scale: 0.8,
            y: 20
          },
          animate: { 
            opacity: 1, 
            scale: 1,
            y: 0
          },
          exit: { 
            opacity: 0, 
            scale: 0.8,
            y: 20
          }
        };
    }
  };

  const backdropVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ zIndex }}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={backdropVariants}
          transition={springConfigs.gentle}
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={springConfigs.gentle}
          />

          {/* Modal Content */}
          <motion.div
            ref={modalRef}
            className={cn(
              "relative w-full bg-gradient-to-br from-slate-900 to-slate-800",
              "rounded-2xl shadow-2xl border border-white/10",
              "glass", // Glassmorphism effect
              sizeClasses[size],
              variant === 'bottom-sheet' && "rounded-t-3xl rounded-b-none",
              variant === 'drawer' && "rounded-l-none rounded-r-2xl",
              className
            )}
            variants={getVariants()}
            transition={springConfigs.smooth}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                {title && (
                  <h2 id="modal-title" className="text-xl font-semibold text-white">
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <motion.button
                    onClick={() => {
                      triggerHaptic('light');
                      onClose();
                    }}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Schließen"
                  >
                    <X className="w-5 h-5 text-white" />
                  </motion.button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Bottom Sheet specifically for mobile
export const BottomSheet = ({
  isOpen,
  onClose,
  children,
  title,
  className
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant="bottom-sheet"
      size="full"
      className={cn("max-h-[85vh]", className)}
    >
      {children}
    </Modal>
  );
};

// Drawer for side navigation
export const Drawer = ({
  isOpen,
  onClose,
  children,
  title,
  className
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant="drawer"
      size="lg"
      className={cn("h-full", className)}
    >
      {children}
    </Modal>
  );
};





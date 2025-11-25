// 🎯 Swipeable Bottom Sheet with Gesture Support
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";
import { springConfigs } from "../../utils/springConfigs";
import { useEnhancedTouch } from "../../hooks/useEnhancedTouch";

interface SwipeableBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
  snapPoints?: number[]; // Percentage of screen height
  initialSnapPoint?: number; // Index of initial snap point
}

export const SwipeableBottomSheet = ({
  isOpen,
  onClose,
  children,
  title,
  className,
  snapPoints = [25, 50, 85], // 25%, 50%, 85% of screen height
  initialSnapPoint = 1 // Start at 50%
}: SwipeableBottomSheetProps) => {
  const { triggerHaptic } = useEnhancedTouch();
  const [currentSnapPoint, setCurrentSnapPoint] = useState(initialSnapPoint);
  const [isDragging, setIsDragging] = useState(false);
  
  const y = useMotionValue(0);
  const height = useMotionValue(snapPoints[initialSnapPoint]);
  
  // Transform y position to height percentage
  const heightPercentage = useTransform(
    y,
    [-100, 0, 100],
    [snapPoints[snapPoints.length - 1], snapPoints[currentSnapPoint], snapPoints[0]]
  );

  // Handle drag start
  const handleDragStart = () => {
    setIsDragging(true);
    triggerHaptic('light');
  };

  // Handle drag end
  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false);
    
    const velocity = info.velocity.y;
    const currentY = y.get();
    const currentHeight = height.get();
    
    // Determine snap point based on velocity and position
    let newSnapPoint = currentSnapPoint;
    
    if (velocity > 500) {
      // Fast swipe down - close modal
      onClose();
      return;
    } else if (velocity < -500) {
      // Fast swipe up - go to next snap point
      newSnapPoint = Math.min(currentSnapPoint + 1, snapPoints.length - 1);
    } else if (currentY > 50) {
      // Drag down - go to previous snap point or close
      if (currentSnapPoint > 0) {
        newSnapPoint = currentSnapPoint - 1;
      } else {
        onClose();
        return;
      }
    } else if (currentY < -50) {
      // Drag up - go to next snap point
      newSnapPoint = Math.min(currentSnapPoint + 1, snapPoints.length - 1);
    }
    
    // Snap to new position
    setCurrentSnapPoint(newSnapPoint);
    y.set(0);
    height.set(snapPoints[newSnapPoint]);
    
    // Haptic feedback for snap
    if (newSnapPoint !== currentSnapPoint) {
      triggerHaptic('medium');
    }
  };

  // Reset position when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentSnapPoint(initialSnapPoint);
      y.set(0);
      height.set(snapPoints[initialSnapPoint]);
    }
  }, [isOpen, initialSnapPoint, snapPoints, y, height]);

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={springConfigs.gentle}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Bottom Sheet */}
      <motion.div
        className={cn(
          "relative w-full bg-gradient-to-b from-slate-900 to-slate-800",
          "rounded-t-3xl shadow-2xl border-t border-white/10",
          "glass", // Glassmorphism effect
          className
        )}
        style={{
          height: heightPercentage,
          y: y
        }}
        drag="y"
        dragConstraints={{ top: -100, bottom: 100 }}
        dragElastic={0.2}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={springConfigs.smooth}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-white/30 rounded-full" />
        </div>

        {/* Header */}
        {(title || true) && (
          <div className="flex items-center justify-between px-6 pb-4">
            {title && (
              <h2 className="text-xl font-semibold text-white">
                {title}
              </h2>
            )}
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
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {children}
        </div>

        {/* Snap Point Indicators */}
        <div className="flex justify-center gap-2 pb-4">
          {snapPoints.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index === currentSnapPoint 
                  ? "bg-accent" 
                  : "bg-white/30"
              )}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Hook for bottom sheet state
export const useBottomSheet = (initialOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [snapPoint, setSnapPoint] = useState(1);

  const open = (snapPointIndex = 1) => {
    setSnapPoint(snapPointIndex);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  const toggle = (snapPointIndex = 1) => {
    if (isOpen) {
      close();
    } else {
      open(snapPointIndex);
    }
  };

  return {
    isOpen,
    snapPoint,
    open,
    close,
    toggle,
    setSnapPoint
  };
};





import { memo, useState, useRef, useCallback } from 'react';
import { motion, PanInfo, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  leftAction?: {
    icon: React.ReactNode;
    label: string;
    color: string;
    onClick: () => void;
  };
  rightAction?: {
    icon: React.ReactNode;
    label: string;
    color: string;
    onClick: () => void;
  };
  threshold?: number;
  disabled?: boolean;
  className?: string;
}

export const SwipeableCard = memo(({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  leftAction,
  rightAction,
  threshold = 100,
  disabled = false,
  className = ''
}: SwipeableCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) return;

    const swipeDistance = info.offset.x;
    const swipeVelocity = info.velocity.x;

    // Check if swipe distance or velocity exceeds threshold
    if (Math.abs(swipeDistance) > threshold || Math.abs(swipeVelocity) > 500) {
      if (swipeDistance > 0 && onSwipeRight) {
        onSwipeRight();
        if (rightAction) {
          rightAction.onClick();
        }
      } else if (swipeDistance < 0 && onSwipeLeft) {
        onSwipeLeft();
        if (leftAction) {
          leftAction.onClick();
        }
      }
    }

    // Reset position
    x.set(0);
    setIsDragging(false);
  }, [disabled, threshold, onSwipeLeft, onSwipeRight, leftAction, rightAction, x]);

  const handleDragStart = useCallback(() => {
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  // Calculate action visibility based on drag position
  const leftActionOpacity = useTransform(springX, [0, threshold], [0, 1]);
  const rightActionOpacity = useTransform(springX, [0, -threshold], [0, 1]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Left Action */}
      {leftAction && (
        <motion.div
          className="absolute left-0 top-0 bottom-0 flex items-center justify-start px-4 z-0"
          style={{ opacity: leftActionOpacity }}
        >
          <motion.div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${leftAction.color}`}
            style={{ scale: leftActionOpacity }}
          >
            {leftAction.icon}
            <span className="text-sm font-medium text-white">{leftAction.label}</span>
          </motion.div>
        </motion.div>
      )}

      {/* Right Action */}
      {rightAction && (
        <motion.div
          className="absolute right-0 top-0 bottom-0 flex items-center justify-end px-4 z-0"
          style={{ opacity: rightActionOpacity }}
        >
          <motion.div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${rightAction.color}`}
            style={{ scale: rightActionOpacity }}
          >
            <span className="text-sm font-medium text-white">{rightAction.label}</span>
            {rightAction.icon}
          </motion.div>
        </motion.div>
      )}

      {/* Card */}
      <motion.div
        ref={cardRef}
        drag={disabled ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x: springX }}
        className="relative z-10"
        whileTap={disabled ? {} : { scale: 0.98 }}
      >
        {children}
      </motion.div>
    </div>
  );
});

SwipeableCard.displayName = 'SwipeableCard';


import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useEnhancedTouch } from '../../hooks/useEnhancedTouch';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: number[]; // Heights in percentage: [50, 100]
  defaultSnapPoint?: number;
  showDragHandle?: boolean;
  closeOnBackdrop?: boolean;
  className?: string;
}

export const BottomSheet = ({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = [50, 85],
  defaultSnapPoint = 0,
  showDragHandle = true,
  closeOnBackdrop = true,
  className
}: BottomSheetProps) => {
  const [currentSnapIndex, setCurrentSnapIndex] = useState(defaultSnapPoint);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const { triggerHaptic } = useEnhancedTouch();

  const currentHeight = snapPoints[currentSnapIndex];

  // 🎯 Handle drag start
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
    setDragStartY(clientY);
    triggerHaptic('light');
  };

  // 🎯 Handle dragging
  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const offset = clientY - dragStartY;

    // Only allow dragging down
    if (offset > 0) {
      setDragOffset(offset);
    }
  };

  // 🎯 Handle drag end
  const handleDragEnd = () => {
    if (!isDragging) return;

    setIsDragging(false);

    const threshold = 100;

    if (dragOffset > threshold) {
      // Close if dragged down enough
      if (currentSnapIndex === 0) {
        triggerHaptic('medium');
        onClose();
      } else {
        // Snap to lower point
        triggerHaptic('light');
        setCurrentSnapIndex(prev => Math.max(0, prev - 1));
      }
    } else if (dragOffset < -threshold && currentSnapIndex < snapPoints.length - 1) {
      // Snap to higher point if dragged up
      triggerHaptic('light');
      setCurrentSnapIndex(prev => Math.min(snapPoints.length - 1, prev + 1));
    }

    setDragOffset(0);
    setDragStartY(0);
  };

  // 🎯 Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 🎯 Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm",
          "transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed left-0 right-0 z-50",
          "bg-gradient-to-b from-[#111827] to-[#0A0A0A]",
          "rounded-t-3xl shadow-2xl",
          "border-t border-white/10",
          "overflow-hidden",
          "transition-all duration-300 ease-out",
          isDragging && "transition-none",
          className
        )}
        style={{
          bottom: 0,
          height: `${currentHeight}vh`,
          transform: isDragging ? `translateY(${dragOffset}px)` : 'translateY(0)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
      >
        {/* Glow Effect */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#0BF7BC]/50 to-transparent" />

        {/* Drag Handle */}
        {showDragHandle && (
          <div
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
            onTouchStart={handleDragStart}
            onMouseDown={handleDragStart}
          >
            <div className={cn(
              "w-12 h-1.5 rounded-full transition-colors",
              isDragging ? "bg-[#0BF7BC]" : "bg-white/30"
            )} />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <button
              onClick={onClose}
              className={cn(
                "p-2 rounded-full",
                "bg-white/10 hover:bg-white/20",
                "transition-colors duration-200",
                "active:scale-95"
              )}
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto h-full px-6 py-4">
          {children}
        </div>

        {/* Snap Point Indicators */}
        {snapPoints.length > 1 && (
          <div className="absolute top-20 right-4 flex flex-col gap-2">
            {snapPoints.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentSnapIndex(index);
                  triggerHaptic('light');
                }}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  currentSnapIndex === index
                    ? "bg-[#0BF7BC] scale-125"
                    : "bg-white/30 scale-100"
                )}
                aria-label={`Snap to ${snapPoints[index]}%`}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

// 🎯 Preset Bottom Sheets
export const QuickActionSheet = ({
  isOpen,
  onClose,
  actions
}: {
  isOpen: boolean;
  onClose: () => void;
  actions: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'danger' | 'success';
  }>;
}) => {
  const { triggerHaptic } = useEnhancedTouch();

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[30]}
      showDragHandle
    >
      <div className="space-y-2 pb-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              triggerHaptic('medium');
              action.onClick();
              onClose();
            }}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-4 rounded-xl",
              "transition-all duration-200",
              "active:scale-98",
              action.variant === 'danger' && "bg-red-500/10 hover:bg-red-500/20 text-red-400",
              action.variant === 'success' && "bg-green-500/10 hover:bg-green-500/20 text-green-400",
              !action.variant && "bg-white/5 hover:bg-white/10 text-white"
            )}
          >
            {action.icon && (
              <div className="flex-shrink-0">
                {action.icon}
              </div>
            )}
            <span className="font-medium text-left">{action.label}</span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
};



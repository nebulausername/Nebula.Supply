import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useMobile } from '../../hooks/useMobile';

interface MobileTicketSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: number[];
  defaultSnapPoint?: number;
  showDragHandle?: boolean;
  className?: string;
}

export function MobileTicketSheet({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = [50, 85],
  defaultSnapPoint = 0,
  showDragHandle = true,
  className
}: MobileTicketSheetProps) {
  const [currentSnapIndex, setCurrentSnapIndex] = useState(defaultSnapPoint);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useMobile();

  const currentHeight = snapPoints[currentSnapIndex];

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
    setDragStartY(clientY);
  };

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const offset = clientY - dragStartY;
    if (offset > 0) {
      setDragOffset(offset);
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const threshold = 100;

    if (dragOffset > threshold) {
      if (currentSnapIndex === 0) {
        onClose();
      } else {
        setCurrentSnapIndex(prev => Math.max(0, prev - 1));
      }
    } else if (dragOffset < -threshold && currentSnapIndex < snapPoints.length - 1) {
      setCurrentSnapIndex(prev => Math.min(snapPoints.length - 1, prev + 1));
    }

    setDragOffset(0);
    setDragStartY(0);
  };

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

  if (!isMobile) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed left-0 right-0 z-50',
              'bg-surface border-t border-white/10',
              'rounded-t-3xl shadow-2xl',
              'overflow-hidden',
              isDragging && 'transition-none',
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
            {showDragHandle && (
              <div
                className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
                onTouchStart={handleDragStart}
                onMouseDown={handleDragStart}
              >
                <div className={cn(
                  'w-12 h-1.5 rounded-full transition-colors',
                  isDragging ? 'bg-accent' : 'bg-white/30'
                )} />
              </div>
            )}

            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h2 className="text-xl font-bold text-text">{title}</h2>
                <button
                  onClick={onClose}
                  className={cn(
                    'p-2 rounded-full',
                    'bg-white/10 hover:bg-white/20',
                    'transition-colors duration-200',
                    'active:scale-95'
                  )}
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-text" />
                </button>
              </div>
            )}

            <div className="overflow-y-auto h-full" style={{ maxHeight: `${currentHeight}vh` }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


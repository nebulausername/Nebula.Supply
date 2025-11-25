import { memo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ToastNotification, Toast } from './ToastNotification';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
};

export const ToastContainer = memo(({ toasts, onRemove, position = 'top-right' }: ToastContainerProps) => {
  return (
    <div className={`fixed z-50 ${positionClasses[position]} flex flex-col gap-2 pointer-events-none`}>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast, index) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastNotification toast={toast} onRemove={onRemove} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
});

ToastContainer.displayName = 'ToastContainer';


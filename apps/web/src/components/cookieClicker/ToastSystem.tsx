import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

// 🎯 TOAST CONTEXT & HOOK
let toastListeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

const notifyListeners = () => {
  toastListeners.forEach(listener => listener([...toasts]));
};

export const showToast = (message: string, type: Toast['type'] = 'info', duration = 3000) => {
  const id = Math.random().toString(36).substring(2, 11);
  const toast: Toast = { id, message, type, duration };
  
  toasts.push(toast);
  notifyListeners();
  
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id);
    notifyListeners();
  }, duration);
};

// 🎯 TOAST COMPONENT
const Toast = memo(({ toast, onClose }: { toast: Toast; onClose: () => void }) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
    warning: AlertTriangle
  };
  
  const colors = {
    success: 'bg-green-500/20 border-green-500/30 text-green-400',
    error: 'bg-red-500/20 border-red-500/30 text-red-400',
    info: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
    warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
  };
  
  const Icon = icons[toast.type];
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 400, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 400, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-lg min-w-[300px] max-w-md",
        colors[toast.type]
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Toast schließen"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
});
Toast.displayName = 'Toast';

// 🎯 TOAST CONTAINER
export const ToastContainer = memo(() => {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);
  
  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setCurrentToasts(newToasts);
    };
    
    toastListeners.push(listener);
    setCurrentToasts([...toasts]);
    
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }, []);
  
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {currentToasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              toast={toast}
              onClose={() => {
                toasts = toasts.filter(t => t.id !== toast.id);
                notifyListeners();
              }}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
});
ToastContainer.displayName = 'ToastContainer';

// Export convenience functions
export const toast = {
  success: (message: string) => showToast(message, 'success'),
  error: (message: string) => showToast(message, 'error'),
  info: (message: string) => showToast(message, 'info'),
  warning: (message: string) => showToast(message, 'warning')
};


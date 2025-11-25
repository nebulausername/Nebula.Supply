import { memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastNotificationProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertCircle
};

const toastColors = {
  success: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
  error: 'from-red-500/20 to-orange-500/20 border-red-500/30',
  info: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
  warning: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
};

const toastIconColors = {
  success: 'text-green-400',
  error: 'text-red-400',
  info: 'text-blue-400',
  warning: 'text-yellow-400'
};

export const ToastNotification = memo(({ toast, onRemove }: ToastNotificationProps) => {
  const Icon = toastIcons[toast.type];
  const duration = toast.duration || 5000;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, toast.id, onRemove]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${toastColors[toast.type]} backdrop-blur-xl p-4 shadow-2xl min-w-[300px] max-w-[400px]`}
    >
      {/* Progress bar */}
      {duration > 0 && (
        <motion.div
          className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${
            toast.type === 'success' ? 'from-green-400 to-emerald-400' :
            toast.type === 'error' ? 'from-red-400 to-orange-400' :
            toast.type === 'info' ? 'from-blue-400 to-cyan-400' :
            'from-yellow-400 to-orange-400'
          }`}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      )}

      <div className="flex items-start gap-3">
        <motion.div
          className={`flex-shrink-0 ${toastIconColors[toast.type]}`}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5 }}
        >
          <Icon className="h-5 w-5" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-text mb-1">{toast.title}</h4>
          {toast.message && (
            <p className="text-xs text-muted leading-relaxed">{toast.message}</p>
          )}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
          aria-label="Schließen"
        >
          <X className="h-4 w-4 text-muted" />
        </button>
      </div>
    </motion.div>
  );
});

ToastNotification.displayName = 'ToastNotification';


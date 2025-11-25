import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

interface NotificationToastProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

export const NotificationToast = ({ notifications, onRemove }: NotificationToastProps) => {
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getColors = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          text: 'text-emerald-200'
        };
      case 'error':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          text: 'text-red-200'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/30',
          text: 'text-yellow-200'
        };
      case 'info':
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          text: 'text-blue-200'
        };
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => {
          const colors = getColors(notification.type);
          
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`max-w-sm rounded-2xl border ${colors.border} ${colors.bg} p-4 shadow-lg backdrop-blur-lg`}
            >
              <div className="flex items-start gap-3">
                {getIcon(notification.type)}
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-text text-sm">
                    {notification.title}
                  </h4>
                  <p className={`text-xs ${colors.text} mt-1`}>
                    {notification.message}
                  </p>
                </div>
                
                <button
                  onClick={() => onRemove(notification.id)}
                  className="flex-shrink-0 text-muted hover:text-text transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// Hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after duration
    const duration = notification.duration || 5000;
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showSuccess = (title: string, message: string, duration?: number) => {
    addNotification({ type: 'success', title, message, duration });
  };

  const showError = (title: string, message: string, duration?: number) => {
    addNotification({ type: 'error', title, message, duration });
  };

  const showInfo = (title: string, message: string, duration?: number) => {
    addNotification({ type: 'info', title, message, duration });
  };

  const showWarning = (title: string, message: string, duration?: number) => {
    addNotification({ type: 'warning', title, message, duration });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning
  };
};

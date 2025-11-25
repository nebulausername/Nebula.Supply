import { memo, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle, AlertCircle, Info, XCircle, Settings } from 'lucide-react';
import { Toast, ToastType } from './ToastNotification';

interface Notification extends Toast {
  read: boolean;
  category?: 'system' | 'user' | 'drop' | 'invite' | 'achievement';
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const categoryIcons = {
  system: Info,
  user: CheckCircle,
  drop: AlertCircle,
  invite: CheckCircle,
  achievement: CheckCircle
};

export const NotificationCenter = memo(({
  notifications,
  onMarkAsRead,
  onRemove,
  onClearAll,
  isOpen,
  onClose
}: NotificationCenterProps) => {
  const [filter, setFilter] = useState<ToastType | 'all'>('all');

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter(n => n.type === filter);
  }, [notifications, filter]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const handleNotificationClick = useCallback((notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  }, [onMarkAsRead]);

  return (
    <>
      {/* Notification Bell Button */}
      <motion.button
        onClick={() => onClose()}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Benachrichtigungen"
      >
        <Bell className="h-5 w-5 text-text" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center"
          >
            <span className="text-xs font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </motion.div>
        )}
      </motion.button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-black/90 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-accent" />
                  <h2 className="text-lg font-bold text-text">Benachrichtigungen</h2>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-bold">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <button
                      onClick={onClearAll}
                      className="text-xs text-muted hover:text-text transition-colors"
                    >
                      Alle löschen
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    aria-label="Schließen"
                  >
                    <X className="h-5 w-5 text-muted" />
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-2 p-4 border-b border-white/10 overflow-x-auto">
                {(['all', 'success', 'error', 'info', 'warning'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      filter === type
                        ? 'bg-accent/20 text-accent'
                        : 'bg-white/5 text-muted hover:text-text'
                    }`}
                  >
                    {type === 'all' ? 'Alle' : type}
                  </button>
                ))}
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <Bell className="h-12 w-12 text-muted mb-4 opacity-50" />
                    <p className="text-muted">Keine Benachrichtigungen</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    <AnimatePresence>
                      {filteredNotifications.map((notification) => {
                        const CategoryIcon = notification.category
                          ? categoryIcons[notification.category]
                          : Info;

                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-4 cursor-pointer transition-colors ${
                              notification.read
                                ? 'bg-transparent hover:bg-white/5'
                                : 'bg-accent/5 hover:bg-accent/10'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <CategoryIcon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                                notification.type === 'success' ? 'text-green-400' :
                                notification.type === 'error' ? 'text-red-400' :
                                notification.type === 'info' ? 'text-blue-400' :
                                'text-yellow-400'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className={`text-sm font-semibold ${
                                    notification.read ? 'text-muted' : 'text-text'
                                  }`}>
                                    {notification.title}
                                  </h4>
                                  {!notification.read && (
                                    <div className="h-2 w-2 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                                  )}
                                </div>
                                {notification.message && (
                                  <p className="text-xs text-muted mt-1 leading-relaxed">
                                    {notification.message}
                                  </p>
                                )}
                                {notification.action && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      notification.action?.onClick();
                                    }}
                                    className="mt-2 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
                                  >
                                    {notification.action.label}
                                  </button>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemove(notification.id);
                                }}
                                className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
                                aria-label="Entfernen"
                              >
                                <X className="h-4 w-4 text-muted" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});

NotificationCenter.displayName = 'NotificationCenter';


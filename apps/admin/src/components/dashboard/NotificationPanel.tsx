import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Trash2 } from 'lucide-react';
import { useNotificationStore, Notification } from '../../lib/store/notifications';
import { Button } from '../ui/Button';

export function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotificationStore();

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === 'cash_verification') {
      // Navigate to bot dashboard
      window.location.href = '/dashboard?view=bot';
    }

    setIsOpen(false);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'cash_verification':
        return '🚨';
      case 'order':
        return '📦';
      case 'support':
        return '💬';
      case 'system':
        return '⚙️';
      default:
        return '📢';
    }
  };

  const recentNotifications = notifications.slice(0, 10);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
      >
        <Bell className="h-5 w-5 text-muted hover:text-white transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div>
              <h3 className="font-semibold text-white">Benachrichtigungen</h3>
              <p className="text-xs text-muted">
                {unreadCount > 0 ? `${unreadCount} ungelesen` : 'Alles gelesen'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  title="Alle als gelesen markieren"
                >
                  <Check className="h-4 w-4 text-muted hover:text-white" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="h-4 w-4 text-muted hover:text-white" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[500px] overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-muted/50 mx-auto mb-3" />
                <p className="text-muted text-sm">Keine Benachrichtigungen</p>
              </div>
            ) : (
              recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    p-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5
                    ${!notification.read ? 'bg-accent/5' : ''}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={`text-sm font-medium ${!notification.read ? 'text-white' : 'text-muted'}`}>
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-muted line-clamp-2 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted/70">
                          {new Date(notification.createdAt).toLocaleString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          className="p-1 rounded hover:bg-white/10 transition-colors"
                        >
                          <Trash2 className="h-3 w-3 text-muted hover:text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 10 && (
            <div className="p-3 border-t border-white/10">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  // In future, navigate to dedicated notifications page
                  setIsOpen(false);
                }}
              >
                Alle anzeigen ({notifications.length})
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}






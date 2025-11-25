import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, CheckCheck, ExternalLink, User, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useMobile } from '../../hooks/useMobile';
import { cn } from '../../utils/cn';

export interface TicketNotification {
  id: string;
  ticketId: string;
  type: 'ticket_created' | 'ticket_replied' | 'ticket_status_changed' | 'ticket_assigned';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  ticket?: {
    id: string;
    subject: string;
    priority: string;
    status: string;
    category?: string;
    telegramUserId?: string;
  };
}

interface TicketNotificationCenterProps {
  notifications: TicketNotification[];
  unreadCount: number;
  onNotificationClick: (notification: TicketNotification) => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export const TicketNotificationCenter = memo(function TicketNotificationCenter({
  notifications,
  unreadCount,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
}: TicketNotificationCenterProps) {
  const { isMobile } = useMobile();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const getNotificationIcon = (type: TicketNotification['type']) => {
    switch (type) {
      case 'ticket_created':
        return <Bell className="h-4 w-4 text-green-400" />;
      case 'ticket_replied':
        return <User className="h-4 w-4 text-blue-400" />;
      case 'ticket_status_changed':
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      case 'ticket_assigned':
        return <User className="h-4 w-4 text-purple-400" />;
      default:
        return <Bell className="h-4 w-4 text-muted" />;
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative h-8 w-8 p-0',
          isMobile && 'h-9 w-9'
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-4 w-4" />
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
      </Button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'absolute right-0 mt-2 z-50',
                isMobile ? 'w-[90vw] max-w-sm' : 'w-96'
              )}
            >
              <Card className="p-0 shadow-2xl border border-white/20 max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-text">Notifications</h3>
                    {unreadCount > 0 && (
                      <Badge variant="default" className="bg-red-500 text-white text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAllAsRead();
                        }}
                        className="h-6 px-2 text-xs"
                        aria-label="Mark all as read"
                      >
                        <CheckCheck className="h-3 w-3 mr-1" />
                        Mark all read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="h-6 w-6 p-0"
                      aria-label="Close notifications"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="overflow-y-auto max-h-[60vh]">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                      <Bell className="h-12 w-12 text-muted mb-4 opacity-50" />
                      <p className="text-sm text-muted">No notifications</p>
                      <p className="text-xs text-muted mt-1">You're all caught up!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {notifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={cn(
                            'p-4 cursor-pointer transition-colors hover:bg-surface/50',
                            !notification.read && 'bg-primary/5'
                          )}
                          onClick={() => {
                            onNotificationClick(notification);
                            if (!notification.read) {
                              onMarkAsRead(notification.id);
                            }
                            setIsOpen(false);
                          }}
                        >
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="text-sm font-semibold text-text line-clamp-1">
                                  {notification.title}
                                </h4>
                                {!notification.read && (
                                  <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                                )}
                              </div>
                              <p className="text-xs text-muted line-clamp-2 mb-2">
                                {notification.message}
                              </p>
                              
                              {/* Ticket Info */}
                              {notification.ticket && (
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs">
                                    {notification.ticket.id}
                                  </Badge>
                                  {notification.ticket.priority && (
                                    <span className={cn(
                                      'text-xs capitalize',
                                      notification.ticket.priority === 'critical' && 'text-red-400',
                                      notification.ticket.priority === 'high' && 'text-orange-400',
                                      notification.ticket.priority === 'medium' && 'text-yellow-400',
                                      notification.ticket.priority === 'low' && 'text-gray-400'
                                    )}>
                                      {notification.ticket.priority}
                                    </span>
                                  )}
                                  {notification.ticket.telegramUserId && (
                                    <span className="text-xs text-muted flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      Telegram
                                    </span>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted">
                                  {formatTime(notification.timestamp)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onNotificationClick(notification);
                                    setIsOpen(false);
                                  }}
                                  className="h-5 px-2 text-xs"
                                >
                                  Open
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-white/10">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClearAll();
                      }}
                      className="w-full text-xs"
                    >
                      Clear all notifications
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
});


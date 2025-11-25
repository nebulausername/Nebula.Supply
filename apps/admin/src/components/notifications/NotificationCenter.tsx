import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Bell,
  BellOff,
  X,
  Check,
  Package,
  ShoppingCart,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Mail,
  Settings,
  Filter
} from 'lucide-react';
import { springConfigs } from '../../utils/springConfigs';

export interface Notification {
  id: string;
  type: 'order' | 'stock' | 'payment' | 'system' | 'alert';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  metadata?: Record<string, any>;
}

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'order',
    title: 'New Order Received',
    message: 'Order #ORD-12345 for €129.99',
    timestamp: new Date().toISOString(),
    read: false,
    priority: 'high',
  },
  {
    id: '2',
    type: 'stock',
    title: 'Low Stock Alert',
    message: 'Nike Air Max 95 has only 3 units left',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    read: false,
    priority: 'urgent',
  },
  {
    id: '3',
    type: 'payment',
    title: 'Payment Confirmed',
    message: 'Order #ORD-12340 payment received',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: true,
    priority: 'medium',
  },
];

const typeIcons = {
  order: ShoppingCart,
  stock: Package,
  payment: DollarSign,
  system: Settings,
  alert: AlertTriangle,
};

const typeColors = {
  order: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  stock: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  payment: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  system: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  alert: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
};

const priorityBadges = {
  low: { label: 'Low', className: 'text-gray-400 border-gray-400' },
  medium: { label: 'Medium', className: 'text-blue-400 border-blue-400' },
  high: { label: 'High', className: 'text-orange-400 border-orange-400' },
  urgent: { label: 'Urgent', className: 'text-red-400 border-red-400' },
};

const formatTimeAgo = (timestamp: string) => {
  const now = Date.now();
  const time = new Date(timestamp).getTime();
  const diff = now - time;

  const minutes = Math.floor(diff / 1000 / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

export function NotificationCenter({ open, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.read) return false;
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleRemoveNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Notification Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ ...springConfigs.smooth }}
            className="fixed right-0 top-0 h-full w-full sm:w-[450px] bg-gray-900 border-l border-white/10 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Bell className="w-6 h-6 text-blue-400" />
                  <h2 className="text-xl font-bold text-white">Notifications</h2>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="text-white">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  className={filter === 'all' ? 'bg-blue-500/20 text-blue-400' : ''}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                  className={filter === 'unread' ? 'bg-blue-500/20 text-blue-400' : ''}
                >
                  Unread ({unreadCount})
                </Button>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="ml-auto"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>
            </div>

            {/* Type Filters */}
            <div className="px-6 py-3 border-b border-white/10 flex gap-2 overflow-x-auto">
              {['all', 'order', 'stock', 'payment', 'alert'].map((type) => (
                <Button
                  key={type}
                  variant="ghost"
                  size="sm"
                  onClick={() => setTypeFilter(type)}
                  className={typeFilter === type ? 'bg-blue-500/10 text-blue-400' : ''}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredNotifications.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12"
                  >
                    <BellOff className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No notifications</p>
                  </motion.div>
                ) : (
                  filteredNotifications.map((notification, index) => {
                    const Icon = typeIcons[notification.type];
                    const colors = typeColors[notification.type];
                    const priority = priorityBadges[notification.priority];

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0 }}
                        transition={{ delay: index * 0.05 }}
                        layout
                      >
                        <Card
                          className={`p-4 ${colors.border} ${
                            !notification.read ? `${colors.bg} border-l-4` : 'bg-gray-800/30'
                          } hover:bg-gray-800/50 transition-all cursor-pointer`}
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <div className="flex gap-3">
                            {/* Icon */}
                            <div className={`p-2 rounded-lg ${colors.bg}`}>
                              <Icon className={`w-5 h-5 ${colors.text}`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <h4 className={`font-semibold ${!notification.read ? 'text-white' : 'text-gray-400'}`}>
                                  {notification.title}
                                </h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveNotification(notification.id);
                                  }}
                                  className="h-6 w-6 p-0 hover:bg-white/10"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>

                              <p className="text-sm text-muted-foreground mb-2">
                                {notification.message}
                              </p>

                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  {formatTimeAgo(notification.timestamp)}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={priority.className}
                                >
                                  {priority.label}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Unread Indicator */}
                          {!notification.read && (
                            <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400 rounded-full" />
                          )}
                        </Card>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // Open settings or notification preferences
                }}
              >
                <Settings className="w-4 h-4 mr-2" />
                Notification Settings
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


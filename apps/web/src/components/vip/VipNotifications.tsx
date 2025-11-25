import { useState, useEffect } from "react";
import { useVipNotifications } from "../../hooks/useVipNotifications";
import { VipBadge } from "./VipBadge";
import { useRankInfo } from "../../hooks/useRankInfo";
import { useAuthStore } from "../../store/auth";

interface VipNotificationsProps {
  className?: string;
}

export const VipNotifications = ({ className = "" }: VipNotificationsProps) => {
  const {
    notifications,
    showNotifications,
    setShowNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications
  } = useVipNotifications();

  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuthStore();

  // Get telegram ID from user or URL params
  const getTelegramId = (): number | undefined => {
    if (user?.id) {
      const parsed = parseInt(user.id.replace('user-', ''));
      if (!isNaN(parsed)) return parsed;
    }
    const params = new URLSearchParams(window.location.search);
    const tgId = params.get('telegram_id');
    if (tgId) {
      const parsed = parseInt(tgId);
      if (!isNaN(parsed)) return parsed;
    }
    return undefined;
  };

  // Use React Query hook for rank data (shared cache with VipGuard)
  const { rankInfo } = useRankInfo(getTelegramId(), {
    enabled: !!user || !!getTelegramId(),
  });

  const isVip = rankInfo?.isVip ?? false;

  // Show notifications if there are unread ones
  useEffect(() => {
    if (unreadCount > 0) {
      setIsVisible(true);
    }
  }, [unreadCount]);

  if (!isVisible) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'tier_upgrade': return '🌟';
      case 'benefit_available': return '🎁';
      case 'challenge_completed': return '🏆';
      case 'new_drop': return '🛒';
      case 'community_mention': return '💬';
      default: return '📢';
    }
  };

  const getNotificationColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-400 bg-red-900/20';
      case 'medium': return 'border-l-yellow-400 bg-yellow-900/20';
      case 'low': return 'border-l-blue-400 bg-blue-900/20';
      default: return 'border-l-purple-400 bg-purple-900/20';
    }
  };

  return (
    <>
      {/* Notification Bell Button */}
      <div className={`fixed top-3 right-3 sm:top-4 sm:right-4 z-50 safe-area-top safe-area-right ${className}`}>
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className={`
            relative p-3 rounded-full transition-all duration-300 shadow-lg min-w-[44px] min-h-[44px] touch-target flex items-center justify-center
            ${unreadCount > 0
              ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 active:from-red-800 active:to-pink-800 animate-pulse'
              : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 active:from-purple-800 active:to-blue-800'
            }
          `}
        >
          <span className="text-lg sm:text-xl">🔔</span>

          {/* Unread Badge */}
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs rounded-full min-w-[18px] sm:min-w-[20px] h-4 sm:h-5 flex items-center justify-center font-bold animate-bounce px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </button>
      </div>

      {/* Notification Panel */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setShowNotifications(false)}>
          <div
            className="fixed top-0 right-0 w-full sm:max-w-md h-full bg-gradient-to-b from-gray-900 to-black border-l border-purple-400/30 shadow-2xl overflow-hidden safe-area-top safe-area-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-purple-400/20 safe-area-top">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <span className="truncate">VIP Notifications</span>
                    {isVip && <VipBadge size="sm" animated={false} />}
                  </h3>
                  <p className="text-purple-300 text-xs sm:text-sm">
                    {unreadCount} ungelesen • {notifications.length} insgesamt
                  </p>
                </div>
              </div>

              <div className="flex space-x-2 flex-shrink-0">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-3 py-2 sm:py-1 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs sm:text-sm rounded-lg transition-colors min-h-[44px] touch-target"
                  >
                    <span className="hidden sm:inline">Alle lesen</span>
                    <span className="sm:hidden">✓</span>
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-2 text-purple-300 hover:text-white active:text-purple-200 transition-colors min-w-[44px] min-h-[44px] touch-target flex items-center justify-center"
                >
                  <span className="text-lg sm:text-xl">✕</span>
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3 max-h-[calc(100vh-140px)] sm:max-h-[calc(100vh-120px)]">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl sm:text-4xl mb-4">🎉</div>
                  <p className="text-purple-300 text-sm sm:text-base">Keine Notifications</p>
                  <p className="text-gray-400 text-xs sm:text-sm">Du bist auf dem neuesten Stand!</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`
                      relative p-3 sm:p-4 rounded-xl border-l-4 transition-all duration-300 cursor-pointer touch-target
                      ${notification.read
                        ? 'bg-gray-800/50 border-l-gray-400 opacity-75'
                        : `border-l-4 ${getNotificationColor(notification.priority)} active:scale-[0.98]`
                      }
                    `}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                      if (notification.actionUrl) {
                        window.location.href = notification.actionUrl;
                      }
                    }}
                  >
                    {/* Notification Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                        <span className="text-xl sm:text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h4 className={`font-semibold text-sm sm:text-base ${notification.read ? 'text-gray-300' : 'text-white'} truncate`}>
                            {notification.title}
                          </h4>
                          <p className="text-[10px] sm:text-xs text-gray-400">
                            {new Date(notification.timestamp).toLocaleString('de-DE')}
                          </p>
                        </div>
                      </div>

                      {!notification.read && (
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse flex-shrink-0"></div>
                      )}
                    </div>

                    {/* Message */}
                    <p className={`text-xs sm:text-sm mb-2 sm:mb-3 ${notification.read ? 'text-gray-400' : 'text-purple-200'} line-clamp-2`}>
                      {notification.message}
                    </p>

                    {/* Action Button */}
                    {notification.actionLabel && (
                      <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 active:from-purple-800 active:to-pink-800 text-white font-semibold py-2.5 sm:py-2 px-4 rounded-lg transition-all duration-300 active:scale-95 min-h-[44px] touch-target text-xs sm:text-sm">
                        {notification.actionLabel}
                      </button>
                    )}

                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      className="absolute top-2 right-2 p-2 text-gray-500 hover:text-red-400 active:text-red-500 transition-colors min-w-[32px] min-h-[32px] touch-target flex items-center justify-center"
                    >
                      <span className="text-sm">✕</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer Actions */}
            {notifications.length > 0 && (
              <div className="p-3 sm:p-4 border-t border-purple-400/20 safe-area-bottom">
                <button
                  onClick={clearAllNotifications}
                  className="w-full py-3 sm:py-2 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg transition-colors min-h-[44px] touch-target text-sm sm:text-base"
                >
                  Alle löschen
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};





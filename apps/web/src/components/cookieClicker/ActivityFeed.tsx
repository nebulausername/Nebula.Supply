import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, TrendingUp, Star, Flame } from 'lucide-react';
import { formatNumber } from '../../utils/cookieFormatters';
import { cn } from '../../utils/cn';

interface ActivityNotification {
  id: string;
  message: string;
  icon: typeof Trophy;
  color: string;
  bgColor: string;
  timestamp: number;
}

interface ActivityFeedProps {
  players: Array<{
    nickname: string | null;
    totalCookies: number;
    cookiesPerSecond: number;
    rank: number;
  }>;
  maxNotifications?: number;
}

// Fake activity templates
const ACTIVITY_TEMPLATES = [
  {
    template: (nickname: string) => `${nickname} just achieved ${formatNumber(Math.floor(Math.random() * 1000000) + 500000)} cookies!`,
    icon: Trophy,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20'
  },
  {
    template: (nickname: string) => `${nickname} is on fire with a ${Math.floor(Math.random() * 50) + 25}x combo!`,
    icon: Flame,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20'
  },
  {
    template: (nickname: string) => `${nickname} climbed to #${Math.floor(Math.random() * 10) + 1}!`,
    icon: TrendingUp,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20'
  },
  {
    template: (nickname: string) => `${nickname} reached ${formatNumber(Math.floor(Math.random() * 500) + 100)} cookies per second!`,
    icon: Zap,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20'
  },
  {
    template: (nickname: string) => `${nickname} unlocked a new achievement!`,
    icon: Star,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20'
  }
];

export const ActivityFeed = ({ players, maxNotifications = 3 }: ActivityFeedProps) => {
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);

  // Generate a random activity notification
  const generateActivity = useCallback(() => {
    if (players.length === 0) return;

    // Pick a random player
    const randomPlayer = players[Math.floor(Math.random() * players.length)];
    const nickname = randomPlayer?.nickname || 'Anonymous';

    // Pick a random template
    const template = ACTIVITY_TEMPLATES[Math.floor(Math.random() * ACTIVITY_TEMPLATES.length)];

    const notification: ActivityNotification = {
      id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      message: template.template(nickname),
      icon: template.icon,
      color: template.color,
      bgColor: template.bgColor,
      timestamp: Date.now()
    };

    setNotifications((prev) => {
      const updated = [notification, ...prev].slice(0, maxNotifications);
      return updated;
    });
  }, [players, maxNotifications]);

  // Auto-generate activities
  useEffect(() => {
    if (players.length === 0) return;

    // Initial delay
    const initialTimeout = setTimeout(() => {
      generateActivity();
    }, 5000 + Math.random() * 5000);

    // Generate activities periodically
    const interval = setInterval(() => {
      generateActivity();
    }, 10000 + Math.random() * 20000); // Every 10-30 seconds

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [players, generateActivity]);

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications((prev) => {
        const now = Date.now();
        return prev.filter((n) => now - n.timestamp < 5000);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => {
          const Icon = notification.icon;
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "pointer-events-auto min-w-[280px] max-w-[320px] rounded-xl border backdrop-blur-xl shadow-lg p-3",
                notification.bgColor,
                "border-white/10"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-lg", notification.bgColor)}>
                  <Icon className={cn("w-4 h-4", notification.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white leading-tight">
                    {notification.message}
                  </p>
                </div>
              </div>
              
              {/* Progress bar for auto-dismiss */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 rounded-b-xl overflow-hidden"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 5, ease: "linear" }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};


























































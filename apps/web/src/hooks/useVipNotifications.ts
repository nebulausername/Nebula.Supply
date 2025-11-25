import { useEffect, useState } from "react";
import { useVipStore } from "../store/vip";

export interface VipNotification {
  id: string;
  type: 'tier_upgrade' | 'benefit_available' | 'challenge_completed' | 'new_drop' | 'community_mention';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  actionLabel?: string;
}

export const useVipNotifications = () => {
  const { currentTier, vipScore, benefits, analytics, community } = useVipStore();
  const [notifications, setNotifications] = useState<VipNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Generate notifications based on VIP state changes
  useEffect(() => {
    const newNotifications: VipNotification[] = [];

    // Check for new benefits
    const availableBenefits = benefits.filter(b => b.available > 0 && !b.used);
    if (availableBenefits.length > 0) {
      newNotifications.push({
        id: `benefit-${Date.now()}`,
        type: 'benefit_available',
        title: 'Neue VIP-Benefits verfügbar!',
        message: `${availableBenefits.length} neue Vorteile warten auf dich.`,
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'medium',
        actionUrl: '/vip?section=benefits',
        actionLabel: 'Benefits anschauen'
      });
    }

    // Check for tier progression
    const nextTier = currentTier === 'Comet' ? 'Nova' : currentTier === 'Nova' ? 'Supernova' : currentTier === 'Supernova' ? 'Galaxy' : null;
    if (nextTier && vipScore >= 2500) {
      newNotifications.push({
        id: `tier-${Date.now()}`,
        type: 'tier_upgrade',
        title: 'Tier-Aufstieg möglich!',
        message: `Du bist bereit für ${nextTier}! Schließe die letzten Anforderungen ab.`,
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'high',
        actionUrl: '/vip?section=tiers',
        actionLabel: 'Tier-Details'
      });
    }

    // Check for new community challenges
    if (community.activeChallenges.length > 0) {
      newNotifications.push({
        id: `challenge-${Date.now()}`,
        type: 'challenge_completed',
        title: 'Neue VIP-Challenge verfügbar',
        message: `${community.activeChallenges[0].title} - nimm teil und verdiene Belohnungen!`,
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'medium',
        actionUrl: '/vip?section=community',
        actionLabel: 'Challenge starten'
      });
    }

    // Check for VIP drops
    newNotifications.push({
      id: `drop-${Date.now()}`,
      type: 'new_drop',
      title: 'Exklusive VIP-Drops verfügbar',
      message: 'Neue Premium-Produkte warten in deiner VIP-Lounge.',
      timestamp: new Date().toISOString(),
      read: false,
      priority: 'medium',
      actionUrl: '/vip?section=drops',
      actionLabel: 'Drops entdecken'
    });

    // Add notifications to state
    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev.slice(0, 19)]); // Keep only last 20
    }
  }, [currentTier, vipScore, benefits, analytics, community]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    showNotifications,
    setShowNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications
  };
};





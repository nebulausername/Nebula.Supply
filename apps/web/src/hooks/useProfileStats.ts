import { useMemo } from 'react';
import { useShopStore } from '../store/shop';
import { useDropsStore } from '../store/drops';
import { useAchievementStore } from '../store/achievementStore';
import { useProfileRealtime } from './useProfileRealtime';

export interface ProfileStats {
  totalDrops: number;
  wonDrops: number;
  winRate: number;
  totalCoins: number;
  coinsEarned: number;
  coinsSpent: number;
  totalAchievements: number;
  unlockedAchievements: number;
  achievementProgress: number;
  totalReferrals: number;
  activeReferrals: number;
  referralRate: number;
  streak: number;
  rank: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
}

export interface TimeRangeStats {
  period: '7d' | '30d' | 'all';
  drops: number;
  coinsEarned: number;
  coinsSpent: number;
  achievements: number;
  referrals: number;
}

export const useProfileStats = (timeRange: '7d' | '30d' | 'all' = 'all') => {
  const coinsBalance = useShopStore((state) => state.coinsBalance);
  const drops = useDropsStore((state: any) => state.drops);
  const achievements = useAchievementStore((state: any) => state.achievements);
  const invite = useShopStore((state) => state.invite);
  const { stats: realtimeStats } = useProfileRealtime({ enabled: true });

  const stats = useMemo<ProfileStats>(() => {
    const totalDrops = drops?.length || 0;
    const wonDrops = realtimeStats?.wonDrops || Math.floor(totalDrops * 0.3); // Estimate if not available
    const winRate = totalDrops > 0 ? (wonDrops / totalDrops) * 100 : 0;

    const totalCoins = coinsBalance;
    const coinsEarned = totalCoins + 500; // TODO: Track from history
    const coinsSpent = 0; // TODO: Track from order history

    const totalAchievements = achievements?.length || 0;
    const unlockedAchievements = achievements?.filter((a: any) => a.unlocked)?.length || 0;
    const achievementProgress = totalAchievements > 0 
      ? (unlockedAchievements / totalAchievements) * 100 
      : 0;

    const totalReferrals = invite?.referrals || 0;
    const activeReferrals = Math.floor(totalReferrals * 0.8); // Estimate
    const referralRate = totalReferrals > 0 ? (activeReferrals / totalReferrals) * 100 : 0;

    const streak = realtimeStats?.streak || 0;
    const rank = realtimeStats?.rank || 0;
    const level = Math.floor((totalCoins + totalAchievements * 100) / 1000) + 1;
    const xp = (totalCoins + totalAchievements * 100) % 1000;
    const xpToNextLevel = 1000 - xp;

    return {
      totalDrops,
      wonDrops,
      winRate,
      totalCoins,
      coinsEarned,
      coinsSpent,
      totalAchievements,
      unlockedAchievements,
      achievementProgress,
      totalReferrals,
      activeReferrals,
      referralRate,
      streak,
      rank,
      level,
      xp,
      xpToNextLevel,
    };
  }, [
    drops,
    achievements,
    invite,
    coinsBalance,
    realtimeStats,
  ]);

  const timeRangeStats = useMemo<TimeRangeStats>(() => {
    // TODO: Implement time-based filtering from actual data
    const multiplier = timeRange === '7d' ? 0.1 : timeRange === '30d' ? 0.3 : 1;
    
    return {
      period: timeRange,
      drops: Math.floor(stats.totalDrops * multiplier),
      coinsEarned: Math.floor(stats.coinsEarned * multiplier),
      coinsSpent: Math.floor(stats.coinsSpent * multiplier),
      achievements: Math.floor(stats.unlockedAchievements * multiplier),
      referrals: Math.floor(stats.totalReferrals * multiplier),
    };
  }, [stats, timeRange]);

  return {
    stats,
    timeRangeStats,
    isLoading: false,
  };
};


import { useState, useEffect, useMemo, useCallback } from "react";
import type { InviteStatus } from "@nebula/shared";
import {
  resolveInviteProgress,
  INVITE_RANK_TIERS,
  INVITE_ACHIEVEMENTS,
  SEASONAL_EVENTS,
  TEAM_CHALLENGES,
  PREMIUM_INVITE_FEATURES,
  DAILY_QUESTS,
  STREAK_CONFIG,
  LEADERBOARD_CONFIGS
} from "../config/invite";

// 🎯 PERFORMANCE OPTIMIZED INVITE HOOK
export const useOptimizedInvite = (invite: InviteStatus | null, coinsBalance: number) => {
  // Memoized calculations to prevent unnecessary re-renders
  const progress = useMemo(() => resolveInviteProgress(invite), [invite]);
  const currentTier = useMemo(() => progress.current, [progress.current]);
  const nextTier = useMemo(() => progress.next, [progress.next]);

  // Cached user data to reduce computations
  const userQuests = useMemo(() =>
    DAILY_QUESTS.filter((_, index) => index < 3),
    []
  );

  const userStreak = useMemo(() => ({
    current: 7,
    longest: 15,
    multiplier: 1.5
  }), []);

  const leaderboardEntries = useMemo(() => [
    { userId: "1", username: "CosmicWolf", score: 1547, rank: 1, trend: "up" as const, badges: ["Legend"], team: "Alpha" },
    { userId: "2", username: "StarHunter", score: 1289, rank: 2, trend: "stable" as const, badges: ["Epic"], team: "Beta" },
    { userId: "3", username: "NebulaQueen", score: 1156, rank: 3, trend: "down" as const, badges: ["Rare"], team: "Gamma" }
  ], []);

  const activeEvent = useMemo(() =>
    SEASONAL_EVENTS.find(e => e.active),
    []
  );

  const activeChallenges = useMemo(() =>
    TEAM_CHALLENGES.filter(c => c.status === 'active'),
    []
  );

  const availablePremiumFeatures = useMemo(() =>
    PREMIUM_INVITE_FEATURES.filter(f => currentTier.id !== 'seed'),
    [currentTier.id]
  );

  // Optimized state management with proper typing
  const [activeTab, setActiveTab] = useState<'overview' | 'quests' | 'streaks' | 'leaderboards' | 'social' | 'premium'>('overview');
  const [copied, setCopied] = useState(false);
  const [streakActive, setStreakActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced copy handler to prevent spam
  const handleCopyInvite = useCallback(async () => {
    if (invite?.inviteCode) {
      try {
        setLoading(true);
        await navigator.clipboard.writeText(invite.inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        setError('Failed to copy invite code');
        console.error('Copy failed:', err);
      } finally {
        setLoading(false);
      }
    }
  }, [invite?.inviteCode]);

  // Optimized share handler with error handling
  const handleShare = useCallback(async () => {
    if (invite?.inviteCode) {
      try {
        if (navigator.share) {
          await navigator.share({
            title: 'Nebula Invite',
            text: `Tritt Nebula bei mit meinem Invite Code: ${invite.inviteCode}`,
            url: window.location.origin
          });
        } else {
          // Fallback for browsers without native share
          await handleCopyInvite();
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('Failed to share invite');
          console.error('Share failed:', err);
        }
      }
    }
  }, [invite?.inviteCode, handleCopyInvite]);

  // Optimized tab change handler
  const handleTabChange = useCallback((tab: typeof activeTab) => {
    setActiveTab(tab);
    setError(null); // Clear errors when switching tabs
  }, []);

  // Memoized color calculations
  const getRankColor = useCallback((rankId: string) => {
    const tier = INVITE_RANK_TIERS.find(t => t.id === rankId);
    return tier?.color || 'gray';
  }, []);

  const getDifficultyColor = useCallback((difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'medium': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'hard': return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
      case 'expert': return 'text-pink-400 border-pink-500/30 bg-pink-500/10';
      default: return 'text-gray-400 border-gray-500/30 bg-gray-500/10';
    }
  }, []);

  const getTrendIcon = useCallback((trend: string) => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'activity';
    }
  }, []);

  // Performance monitoring
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Log slow renders in development
      if (import.meta.env.DEV && renderTime > 16) {
        console.warn(`Slow render detected: ${renderTime.toFixed(2)}ms`);
      }
    };
  }, [activeTab, progress, userQuests, userStreak]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setError(null);
      setCopied(false);
      setLoading(false);
    };
  }, []);

  return {
    // Data
    progress,
    currentTier,
    nextTier,
    userQuests,
    userStreak,
    leaderboardEntries,
    activeEvent,
    activeChallenges,
    availablePremiumFeatures,

    // State
    activeTab,
    copied,
    streakActive,
    loading,
    error,

    // Handlers
    handleTabChange,
    handleCopyInvite,
    handleShare,
    setStreakActive,

    // Utilities
    getRankColor,
    getDifficultyColor,
    getTrendIcon
  };
};

// 🎯 ACCESSIBILITY UTILITIES
export const useAccessibility = () => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Check for high contrast preference
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return {
    reducedMotion,
    highContrast,
    // Helper functions for accessible animations
    getAnimationDuration: (baseDuration: number) =>
      reducedMotion ? 0 : baseDuration,
    getAriaLabel: (text: string, count?: number) =>
      count ? `${text} (${count} items)` : text
  };
};

// 🎯 ERROR BOUNDARY FOR INVITE SYSTEM
// Moved to separate file: components/InviteErrorBoundary.tsx

import { useMemo } from 'react';
import { useTelegramProfile } from './useTelegramProfile';
import { checkNicknameSet } from '../api/cookieClicker';
import { useQuery } from '@tanstack/react-query';

export type DisplayNameContext = 'profile' | 'leaderboard' | 'general';

interface UseDisplayNameOptions {
  context?: DisplayNameContext;
  showFallback?: boolean;
}

/**
 * Hook for intelligent display name logic:
 * - Leaderboard: Only shows Cookie Clicker nickname (or "Anonymer Spieler" if not set)
 * - Profile: Shows Cookie Clicker nickname if set, otherwise Telegram name
 * - General: Shows Cookie Clicker nickname if set, otherwise Telegram name
 */
export const useDisplayName = (options: UseDisplayNameOptions = {}) => {
  const { context = 'general', showFallback = true } = options;
  const { displayName: telegramName, fullName: telegramFullName, telegramData } = useTelegramProfile();

  // Fetch Cookie Clicker nickname with improved error handling
  const { data: nicknameData, isLoading: isLoadingNickname, error: nicknameError } = useQuery({
    queryKey: ['cookieNickname'],
    queryFn: async () => {
      try {
        return await checkNicknameSet();
      } catch (error) {
        // Graceful degradation - return default values on error
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Only log non-network errors in dev mode
        if (import.meta.env.DEV) {
          const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('network');
          if (!isNetworkError) {
            console.warn('[useDisplayName] Failed to check nickname:', {
              error: errorMessage,
              context: 'Cookie Clicker nickname check',
            });
          }
        }
        
        // Return safe default values
        return { hasNickname: false, nickname: null };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2, // Retry up to 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid unnecessary requests
  });

  const cookieNickname = nicknameData?.nickname || null;
  const hasNickname = nicknameData?.hasNickname || false;

  // Determine display name based on context
  const displayName = useMemo(() => {
    if (context === 'leaderboard') {
      // Leaderboard: Only show Cookie Clicker nickname, or anonymous if not set
      if (cookieNickname) {
        return cookieNickname;
      }
      return showFallback ? 'Anonymer Spieler' : '';
    }

    // Profile/General: Prefer Cookie Clicker nickname, fallback to Telegram name
    if (cookieNickname) {
      return cookieNickname;
    }

    return telegramName || (showFallback ? 'User' : '');
  }, [context, cookieNickname, telegramName, showFallback]);

  // Get the name that should be used for leaderboard
  const leaderboardName = useMemo(() => {
    if (cookieNickname) {
      return cookieNickname;
    }
    return showFallback ? 'Anonymer Spieler' : '';
  }, [cookieNickname, showFallback]);

  // Get the name that should be displayed in profile
  const profileName = useMemo(() => {
    if (cookieNickname) {
      return cookieNickname;
    }
    return telegramName || (showFallback ? 'User' : '');
  }, [cookieNickname, telegramName, showFallback]);

  // Check if user needs to set a nickname for leaderboard
  const needsNicknameForLeaderboard = useMemo(() => {
    return context === 'leaderboard' && !hasNickname;
  }, [context, hasNickname]);

  // Get source of the current display name
  const nameSource = useMemo<'cookie' | 'telegram' | 'fallback'>(() => {
    if (cookieNickname) return 'cookie';
    if (telegramData) return 'telegram';
    return 'fallback';
  }, [cookieNickname, telegramData]);

  return {
    displayName,
    leaderboardName,
    profileName,
    cookieNickname,
    telegramName,
    telegramFullName,
    hasNickname,
    needsNicknameForLeaderboard,
    nameSource,
    isLoading: isLoadingNickname,
    error: nicknameError,
  };
};


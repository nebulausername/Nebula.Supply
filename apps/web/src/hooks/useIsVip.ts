import { useMemo } from 'react';
import { useAuthStore } from '../store/auth';

/**
 * Hook to check if current user has VIP status
 * @returns {Object} { isVip: boolean, userRank: string | null }
 */
export const useIsVip = () => {
  const user = useAuthStore((state) => state.user);
  
  const isVip = useMemo(() => {
    if (!user) return false;
    // VIP status is determined by rank === 'VIP'
    return user.rank === 'VIP';
  }, [user?.rank]);

  return {
    isVip,
    userRank: user?.rank || null,
    user: user
  };
};

